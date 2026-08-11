(function () {
  "use strict";

  const FIREBASE_SDK_VERSION = "12.16.0";
  let firebaseGoogleAuthPromise = null;

  function getFirebaseModuleUrl(fileName) {
    return (
      "https://www.gstatic.com/firebasejs/" +
      FIREBASE_SDK_VERSION +
      "/" +
      fileName
    );
  }

  async function fetchFirebaseConfig() {
    const response = await fetch("/api/google-auth", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok || !data.firebaseConfig) {
      throw new Error(
        data.error || "Google authentication is unavailable."
      );
    }

    return data.firebaseConfig;
  }

  function getFirebaseGoogleAuth() {
    if (firebaseGoogleAuthPromise) {
      return firebaseGoogleAuthPromise;
    }

    firebaseGoogleAuthPromise = Promise.all([
      import(getFirebaseModuleUrl("firebase-app.js")),
      import(getFirebaseModuleUrl("firebase-auth.js")),
      fetchFirebaseConfig()
    ]).then(async function (results) {
      const appModule = results[0];
      const authModule = results[1];
      const firebaseConfig = results[2];
      const appName = "auc-atlas-google-auth";
      const existingApp = appModule.getApps().find(
        function (firebaseApp) {
          return firebaseApp.name === appName;
        }
      );
      const firebaseApp =
        existingApp ||
        appModule.initializeApp(firebaseConfig, appName);
      const auth = authModule.getAuth(firebaseApp);

      await authModule.setPersistence(
        auth,
        authModule.inMemoryPersistence
      );

      return {
        auth,
        authModule
      };
    }).catch(function (error) {
      firebaseGoogleAuthPromise = null;
      throw error;
    });

    return firebaseGoogleAuthPromise;
  }

  function getFriendlyGoogleError(error) {
    const code = String(
      error && error.code ? error.code : ""
    );

    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in was cancelled.";
    }

    if (code === "auth/popup-blocked") {
      return "Allow pop-ups to continue with Google.";
    }

    if (code === "auth/cancelled-popup-request") {
      return "Another Google sign-in window is already open.";
    }

    if (code === "auth/operation-not-allowed") {
      return "Google sign-in is not enabled in Firebase.";
    }

    if (code === "auth/unauthorized-domain") {
      return "This website domain is not authorized in Firebase Authentication.";
    }

    return error && error.message
      ? error.message
      : "Google authentication failed.";
  }

  async function getCredential() {
    const state = await getFirebaseGoogleAuth();
    const provider =
      new state.authModule.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      await state.authModule
        .signOut(state.auth)
        .catch(function () {});

      const result =
        await state.authModule.signInWithPopup(
          state.auth,
          provider
        );
      const googleCredential =
        state.authModule.GoogleAuthProvider
          .credentialFromResult(result);
      const additionalUserInfo =
        state.authModule.getAdditionalUserInfo(result);
      const idToken =
        googleCredential && googleCredential.idToken
          ? googleCredential.idToken
          : "";

      if (
        additionalUserInfo &&
        additionalUserInfo.isNewUser
      ) {
        await state.authModule.deleteUser(result.user);
      } else {
        await state.authModule.signOut(state.auth);
      }

      if (!idToken) {
        throw new Error(
          "Google could not verify this account."
        );
      }

      return idToken;
    } catch (error) {
      const pendingCredential =
        state.authModule.GoogleAuthProvider
          .credentialFromError(error);
      const pendingIdToken =
        pendingCredential && pendingCredential.idToken
          ? pendingCredential.idToken
          : "";

      await state.authModule
        .signOut(state.auth)
        .catch(function () {});

      if (pendingIdToken) {
        return pendingIdToken;
      }

      throw new Error(getFriendlyGoogleError(error));
    }
  }

  window.aucAtlasFirebaseGoogle = {
    getCredential
  };
})();
