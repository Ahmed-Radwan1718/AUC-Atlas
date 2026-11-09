const admin = require("../_lib/firebaseAdmin");

const {
  createSiteSessionForUid,
  createLoginChallenge,
  ensureAllowedAucEmail,
  getOptionalSiteSessionUser,
  getSiteSessionUser
} = require("../_lib/securityHelpers");

const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const GOOGLE_LOGIN_RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;
const GOOGLE_LOGIN_MAX_IP_ATTEMPTS = 100;

function cleanString(value, maxLength) {
  const cleanedValue = String(value || "").trim();

  return maxLength
    ? cleanedValue.slice(0, maxLength)
    : cleanedValue;
}

function cleanEmail(value) {
  return cleanString(value, 160).toLowerCase();
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getGoogleProvider(userRecord) {
  return (userRecord.providerData || []).find(function (provider) {
    return provider && provider.providerId === "google.com";
  }) || null;
}

function getGoogleConnection(userData) {
  const connection =
    userData &&
    userData.googleConnection &&
    typeof userData.googleConnection === "object"
      ? userData.googleConnection
      : {};

  return {
    providerUid: cleanString(connection.providerUid, 200),
    email: cleanEmail(connection.email)
  };
}

function isConfirmedGoogleConnection(userRecord, userData) {
  const googleProvider = getGoogleProvider(userRecord);
  const connection = getGoogleConnection(userData);

  return Boolean(
    googleProvider &&
    connection.providerUid &&
    connection.providerUid === cleanString(googleProvider.uid, 200)
  );
}

function getAccountEmail(decodedUser, userRecord, userData) {
  const accountEmail = cleanEmail(
    (userData && userData.email) ||
    (decodedUser && decodedUser.email) ||
    (userRecord && userRecord.email)
  );

  ensureAllowedAucEmail(
    accountEmail,
    "continue with Google"
  );

  return accountEmail;
}

function getFirebaseClientConfig() {
  const projectId =
    cleanString(process.env.FIREBASE_PROJECT_ID);

  const apiKey =
    cleanString(process.env.FIREBASE_WEB_API_KEY);

  const authDomain =
    cleanString(process.env.FIREBASE_AUTH_DOMAIN) ||
    (projectId
      ? projectId + ".firebaseapp.com"
      : "");

  if (!projectId || !apiKey || !authDomain) {
    throw createHttpError(
      "Firebase client configuration is not complete.",
      500
    );
  }

  const firebase = {
    apiKey,
    authDomain,
    projectId
  };

  const optionalValues = {
    appId:
      cleanString(process.env.FIREBASE_APP_ID),
    storageBucket:
      cleanString(process.env.FIREBASE_STORAGE_BUCKET),
    messagingSenderId:
      cleanString(process.env.FIREBASE_MESSAGING_SENDER_ID),
    measurementId:
      cleanString(process.env.FIREBASE_MEASUREMENT_ID)
  };

  Object.keys(optionalValues).forEach(function (key) {
    if (optionalValues[key]) {
      firebase[key] = optionalValues[key];
    }
  });

  return firebase;
}

async function getOptionalAccountContext(req) {
  let decodedUser = null;

  try {
    decodedUser =
      await getOptionalSiteSessionUser(req, {
        checkRevoked: true
      });
  } catch (error) {
    if (
      error.statusCode === 401 ||
      error.statusCode === 403
    ) {
      return null;
    }

    throw error;
  }

  if (!decodedUser || !decodedUser.uid) {
    return null;
  }

  const userRef = admin.firestore()
    .collection("users")
    .doc(decodedUser.uid);

  const results = await Promise.all([
    admin.auth().getUser(decodedUser.uid),
    userRef.get()
  ]);

  const userRecord = results[0];
  const userDoc = results[1];

  if (!userDoc.exists) {
    return null;
  }

  return {
    decodedUser,
    userRecord,
    userRef,
    userData: userDoc.data() || {}
  };
}

async function handleGet(req, res) {
  const context =
    await getOptionalAccountContext(req);

  let customToken = "";
  let connected = false;
  let googleEmail = "";

  if (context) {
    customToken =
      await admin.auth().createCustomToken(
        context.decodedUser.uid
      );

    connected =
      isConfirmedGoogleConnection(
        context.userRecord,
        context.userData
      );

    if (connected) {
      const googleProvider =
        getGoogleProvider(
          context.userRecord
        );

      googleEmail = cleanEmail(
        googleProvider &&
        googleProvider.email
      );
    }
  }

  res.setHeader(
    "Cache-Control",
    "private, no-store"
  );

  return res.status(200).json({
    success: true,
    firebase:
      getFirebaseClientConfig(),
    customToken,
    connected,
    googleEmail
  });
}

async function handleConnect(req, res) {
  const sessionUser =
    await getSiteSessionUser(req, {
      checkRevoked: true
    });

  const idToken =
    cleanString(
      (req.body || {}).idToken,
      10000
    );

  if (!idToken) {
    throw createHttpError(
      "Could not verify the Google connection.",
      400
    );
  }

  const linkedToken =
    await admin.auth().verifyIdToken(
      idToken,
      true
    );

  if (
    !linkedToken ||
    linkedToken.uid !== sessionUser.uid
  ) {
    throw createHttpError(
      "The Google account connection did not match your signed-in AUC Atlas account.",
      403
    );
  }

  const userRef = admin.firestore()
    .collection("users")
    .doc(sessionUser.uid);

  const results = await Promise.all([
    admin.auth().getUser(sessionUser.uid),
    userRef.get()
  ]);

  const userRecord = results[0];
  const userDoc = results[1];

  if (!userDoc.exists) {
    throw createHttpError(
      "Only an existing AUC Atlas account can connect Google.",
      403
    );
  }

  const userData =
    userDoc.data() || {};

  const googleProvider =
    getGoogleProvider(userRecord);

  if (!googleProvider) {
    throw createHttpError(
      "Please finish connecting your Google account first.",
      400
    );
  }

  const accountEmail =
    getAccountEmail(
      sessionUser,
      userRecord,
      userData
    );

  await admin.auth().updateUser(
    sessionUser.uid,
    {
      email: accountEmail,
      emailVerified: true
    }
  );

  await userRef.set({
    googleConnection: {
      providerUid:
        cleanString(
          googleProvider.uid,
          200
        ),
      email:
        cleanEmail(
          googleProvider.email
        ),
      connectedAt:
        admin.firestore.FieldValue
          .serverTimestamp()
    },
    updatedAt:
      admin.firestore.FieldValue
        .serverTimestamp()
  }, {
    merge: true
  });

  return res.status(200).json({
    success: true,
    connected: true,
    googleEmail:
      cleanEmail(
        googleProvider.email
      )
  });
}

async function handleLogin(req, res) {
  await consumeSecurityRateLimit({
    scope: "google-login-ip",
    identifier: getRequestIp(req),
    maxAttempts:
      GOOGLE_LOGIN_MAX_IP_ATTEMPTS,
    windowMs:
      GOOGLE_LOGIN_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many Google login attempts from this connection. Please try again later."
  });

  const idToken =
    cleanString(
      (req.body || {}).idToken,
      10000
    );

  if (!idToken) {
    throw createHttpError(
      "Could not verify your Google account.",
      400
    );
  }

  const decodedToken =
    await admin.auth().verifyIdToken(
      idToken,
      true
    );

  const signInProvider =
    cleanString(
      decodedToken &&
      decodedToken.firebase &&
      decodedToken.firebase.sign_in_provider,
      80
    );

  if (
    !decodedToken ||
    !decodedToken.uid ||
    signInProvider !== "google.com"
  ) {
    throw createHttpError(
      "Please sign in using Google.",
      401
    );
  }

  const userRef = admin.firestore()
    .collection("users")
    .doc(decodedToken.uid);

  const userDoc =
    await userRef.get();

  if (!userDoc.exists) {
    await admin.auth()
      .deleteUser(decodedToken.uid)
      .catch(function () {});

    throw createHttpError(
      "This Google account is not connected to an existing AUC Atlas account. Log in with your AUC email first, then connect Google from My Account.",
      403
    );
  }

  const userData =
    userDoc.data() || {};

  const userRecord =
    await admin.auth().getUser(
      decodedToken.uid
    );

  const googleProvider =
    getGoogleProvider(userRecord);

  if (
    !googleProvider ||
    !isConfirmedGoogleConnection(
      userRecord,
      userData
    )
  ) {
    throw createHttpError(
      "This Google account is not connected to an existing AUC Atlas account. Log in with your AUC email first, then connect Google from My Account.",
      403
    );
  }

  const accountEmail =
    getAccountEmail(
      decodedToken,
      userRecord,
      userData
    );

  const updatedUserRecord =
    await admin.auth().updateUser(
      decodedToken.uid,
      {
        email: accountEmail,
        emailVerified: true
      }
    );

  const twoFactor =
    userData.twoFactor &&
    typeof userData.twoFactor === "object"
      ? userData.twoFactor
      : {};

  const appEnabled =
    Boolean(twoFactor.appEnabled);

  const emailEnabled =
    Boolean(twoFactor.emailEnabled);

  if (appEnabled || emailEnabled) {
    await createLoginChallenge(
      decodedToken.uid,
      res,
      {
        email: accountEmail,
        authMethod: "google",
        twoFactor: {
          appEnabled,
          emailEnabled
        }
      }
    );

    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      method:
        appEnabled
          ? "app"
          : "email",
      emailRecoveryAvailable:
        emailEnabled
    });
  }

  await createSiteSessionForUid(
    decodedToken.uid,
    res,
    req
  );

  return res.status(200).json({
    success: true,
    requiresTwoFactor: false,
    user: {
      uid: decodedToken.uid,
      email: accountEmail,
      emailVerified: true,
      displayName:
        userData.fullName ||
        updatedUserRecord.displayName ||
        "",
      fullName:
        userData.fullName ||
        updatedUserRecord.displayName ||
        "",
      photoURL:
        userData.photoURL ||
        updatedUserRecord.photoURL ||
        ""
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return await handleGet(req, res);
    }

    if (req.method === "POST") {
      const action =
        cleanString(
          (req.body || {}).action,
          30
        ).toLowerCase();

      if (action === "connect") {
        return await handleConnect(
          req,
          res
        );
      }

      if (action === "login") {
        return await handleLogin(
          req,
          res
        );
      }

      return res.status(400).json({
        error:
          "Invalid Google authentication action."
      });
    }

    return res.status(405).json({
      error: "Method not allowed"
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(
          error.retryAfterSeconds
        )
      );
    }

    const authenticationError =
      String(error.code || "")
        .startsWith("auth/");

    return res.status(
      error.statusCode ||
      (authenticationError ? 401 : 500)
    ).json({
      error:
        error.message ||
        "Could not process Google authentication."
    });
  }
};
