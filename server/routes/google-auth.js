const admin = require("../_lib/firebaseAdmin");
const {
  signInWithCustomToken,
  createSiteSessionFromIdToken,
  createLoginChallenge,
  getSiteSessionUser,
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const GOOGLE_AUTH_WINDOW_MS = 15 * 60 * 1000;
const GOOGLE_LOGIN_MAX_ATTEMPTS = 100;
const GOOGLE_LINK_MAX_ATTEMPTS = 10;

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return {};
}

function createGoogleAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getGoogleClientId() {
  const clientId = cleanString(process.env.GOOGLE_CLIENT_ID, 300);

  if (!/^[A-Za-z0-9.-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    throw createGoogleAuthError("Google sign-in is not configured.", 500);
  }

  return clientId;
}

function getFirebaseWebApiKey() {
  const apiKey = cleanString(process.env.FIREBASE_WEB_API_KEY, 500);

  if (!apiKey) {
    throw createGoogleAuthError("Firebase login is not configured.", 500);
  }

  return apiKey;
}

function decodeGoogleCredential(credential) {
  const token = cleanString(credential, 6000);
  const parts = token.split(".");
  let payload;

  if (parts.length !== 3) {
    throw createGoogleAuthError("Google could not verify this account.", 401);
  }

  try {
    payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );
  } catch (error) {
    throw createGoogleAuthError("Google could not verify this account.", 401);
  }

  const email = cleanString(
    payload.email,
    320
  ).toLowerCase();
  const emailVerified =
    payload.email_verified === true ||
    payload.email_verified === "true";

  if (
    payload.aud !== getGoogleClientId() ||
    !emailVerified ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw createGoogleAuthError(
      "Choose a verified Google account.",
      403
    );
  }

  return { token, email };
}

function getIdentityErrorCode(data) {
  const source = data || {};
  const message =
    source.errorMessage ||
    (source.error && source.error.message) ||
    "";

  return cleanString(message, 300).split(" : ")[0];
}

function getIdentityError(errorCode, isLinking) {
  if (
    isLinking &&
    (
      errorCode === "EMAIL_EXISTS" ||
      errorCode === "FEDERATED_USER_ID_ALREADY_LINKED"
    )
  ) {
    return createGoogleAuthError(
      "This Google account is already connected to another Atlas account.",
      409
    );
  }

  if (
    errorCode === "USER_NOT_FOUND" ||
    errorCode === "EMAIL_EXISTS" ||
    errorCode === "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL"
  ) {
    return createGoogleAuthError(
      "This Google account is not connected to Atlas yet. Log in normally and connect it from My Account.",
      403
    );
  }

  if (errorCode === "OPERATION_NOT_ALLOWED") {
    return createGoogleAuthError(
      "Google sign-in is not enabled in Firebase.",
      503
    );
  }

  return createGoogleAuthError(
    "Google could not verify this account.",
    401
  );
}

async function exchangeGoogleCredential(
  credential,
  currentFirebaseIdToken
) {
  const googleCredential = decodeGoogleCredential(credential);
  const requestData = {
    requestUri: "http://localhost",
    postBody: new URLSearchParams({
      id_token: googleCredential.token,
      providerId: "google.com"
    }).toString(),
    returnSecureToken: true,
    returnIdpCredential: true
  };

  if (currentFirebaseIdToken) {
    requestData.idToken = currentFirebaseIdToken;
  } else {
    requestData.autoCreate = false;
  }

  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=" +
      encodeURIComponent(getFirebaseWebApiKey()),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    }
  );
  const data = await response.json().catch(function () {
    return {};
  });
  const errorCode = getIdentityErrorCode(data);

  if (!response.ok || errorCode) {
    throw getIdentityError(
      errorCode,
      Boolean(currentFirebaseIdToken)
    );
  }

  return {
    data,
    email: googleCredential.email
  };
}

function getGoogleProvider(userRecord) {
  if (
    !userRecord ||
    !Array.isArray(userRecord.providerData)
  ) {
    return null;
  }

  return userRecord.providerData.find(
    function (provider) {
      return (
        provider &&
        provider.providerId === "google.com"
      );
    }
  ) || null;
}

function hasGoogleProvider(userRecord) {
  return Boolean(
    getGoogleProvider(userRecord)
  );
}

function getGoogleProviderEmail(userRecord) {
  const provider =
    getGoogleProvider(userRecord);

  return cleanString(
    provider && provider.email,
    320
  ).toLowerCase();
}

function getTwoFactorState(userData) {
  const source =
    userData &&
    userData.twoFactor &&
    typeof userData.twoFactor === "object"
      ? userData.twoFactor
      : {};

  return {
    appEnabled: Boolean(source.appEnabled),
    emailEnabled: Boolean(source.emailEnabled)
  };
}

async function saveGoogleLinked(
  uid,
  googleEmail
) {
  await admin.firestore().collection("users").doc(uid).set(
    {
      googleLinked: true,
      googleLinkedEmail:
        cleanString(
          googleEmail,
          320
        ).toLowerCase(),
      googleLinkedAt:
        admin.firestore.FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );
}

async function handleGoogleLink(req, res, credential) {
  const decodedUser = await getSiteSessionUser(req, {
    checkRevoked: true
  });

  await consumeSecurityRateLimit({
    scope: "google-link-user",
    identifier: decodedUser.uid,
    maxAttempts: GOOGLE_LINK_MAX_ATTEMPTS,
    windowMs: GOOGLE_AUTH_WINDOW_MS,
    message:
      "Too many Google linking attempts. Please try again later."
  });

  const userRecord = await admin.auth().getUser(decodedUser.uid);
  const atlasEmail = ensureAllowedAucEmail(
    userRecord.email || decodedUser.email,
    "connect Google"
  );
  const googleCredential =
    decodeGoogleCredential(credential);

  if (hasGoogleProvider(userRecord)) {
    const existingGoogleEmail =
      getGoogleProviderEmail(userRecord);

    if (
      !existingGoogleEmail ||
      existingGoogleEmail !==
        googleCredential.email
    ) {
      throw createGoogleAuthError(
        "A different Google account is already connected to this Atlas account.",
        409
      );
    }

    await saveGoogleLinked(
      decodedUser.uid,
      existingGoogleEmail
    );

    return res.status(200).json({
      success: true,
      linked: true,
      email: existingGoogleEmail
    });
  }

  const customToken = await admin.auth().createCustomToken(
    decodedUser.uid
  );
  const currentSignIn = await signInWithCustomToken(customToken);

  if (!currentSignIn.idToken) {
    throw createGoogleAuthError(
      "Could not verify your Atlas account.",
      500
    );
  }

  const linkedResult = await exchangeGoogleCredential(
    credential,
    currentSignIn.idToken
  );

  if (linkedResult.data.localId !== decodedUser.uid) {
    throw createGoogleAuthError(
      "Google could not be connected to this Atlas account.",
      409
    );
  }

  await admin.auth().updateUser(
    decodedUser.uid,
    {
      email: atlasEmail,
      emailVerified: true
    }
  );

  const linkedUserRecord = await admin.auth().getUser(
    decodedUser.uid
  );
  const linkedGoogleEmail =
    getGoogleProviderEmail(
      linkedUserRecord
    );

  if (
    !hasGoogleProvider(linkedUserRecord) ||
    linkedGoogleEmail !==
      googleCredential.email
  ) {
    throw createGoogleAuthError(
      "Google could not be connected to this Atlas account.",
      409
    );
  }

  await saveGoogleLinked(
    decodedUser.uid,
    linkedGoogleEmail
  );

  return res.status(200).json({
    success: true,
    linked: true,
    email: linkedGoogleEmail
  });
}

  const customToken = await admin.auth().createCustomToken(
    decodedUser.uid
  );
  const currentSignIn = await signInWithCustomToken(customToken);

  if (!currentSignIn.idToken) {
    throw createGoogleAuthError(
      "Could not verify your Atlas account.",
      500
    );
  }

  const linkedResult = await exchangeGoogleCredential(
    credential,
    currentSignIn.idToken
  );

  if (linkedResult.data.localId !== decodedUser.uid) {
    throw createGoogleAuthError(
      "Google could not be connected to this Atlas account.",
      409
    );
  }

  const linkedUserRecord = await admin.auth().getUser(
    decodedUser.uid
  );

  if (!hasGoogleProvider(linkedUserRecord)) {
    throw createGoogleAuthError(
      "Google could not be connected to this Atlas account.",
      409
    );
  }

  await saveGoogleLinked(decodedUser.uid);

  return res.status(200).json({
    success: true,
    linked: true,
    email: atlasEmail
  });
}

async function handleGoogleLogin(req, res, credential) {
  await consumeSecurityRateLimit({
    scope: "google-login-ip",
    identifier: getRequestIp(req),
    maxAttempts: GOOGLE_LOGIN_MAX_ATTEMPTS,
    windowMs: GOOGLE_AUTH_WINDOW_MS,
    message:
      "Too many Google login attempts from this connection. Please try again later."
  });

  const loginResult = await exchangeGoogleCredential(
    credential,
    ""
  );
  const uid = cleanString(loginResult.data.localId, 180);

  if (loginResult.data.isNewUser === true && uid) {
    await admin.auth().deleteUser(uid).catch(function () {});

    throw createGoogleAuthError(
      "This Google account is not connected to Atlas yet. Log in normally and connect it from My Account.",
      403
    );
  }

  if (!uid || !loginResult.data.idToken) {
    throw createGoogleAuthError(
      "This Google account is not connected to Atlas yet. Log in normally and connect it from My Account.",
      403
    );
  }

  const userRecord = await admin.auth().getUser(uid);
  const googleEmail =
    getGoogleProviderEmail(userRecord);

  if (
    !hasGoogleProvider(userRecord) ||
    !googleEmail ||
    googleEmail !== loginResult.email
  ) {
    throw createGoogleAuthError(
      "This Google account is not connected to Atlas yet. Log in normally and connect it from My Account.",
      403
    );
  }

  const userDoc = await admin.firestore()
    .collection("users")
    .doc(uid)
    .get();

  if (!userDoc.exists) {
    throw createGoogleAuthError(
      "This Google account is not connected to an existing Atlas account.",
      403
    );
  }

  const userData = userDoc.data() || {};
  const email = ensureAllowedAucEmail(
    userData.email || userRecord.email,
    "log in with Google"
  );
  const twoFactor = getTwoFactorState(userData);
  const fullName =
    userData.fullName ||
    userRecord.displayName ||
    "";
  const photoURL =
    userData.photoURL ||
    userRecord.photoURL ||
    "";

  await admin.auth().updateUser(uid, {
    email,
    emailVerified: true
  });

  if (twoFactor.appEnabled || twoFactor.emailEnabled) {
    await createLoginChallenge(uid, res, {
      email,
      authMethod: "google",
      twoFactor
    });

    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      method: twoFactor.appEnabled ? "app" : "email",
      emailRecoveryAvailable: twoFactor.emailEnabled
    });
  }

  const customToken =
    await admin.auth().createCustomToken(uid);
  const currentSignIn =
    await signInWithCustomToken(customToken);

  if (!currentSignIn.idToken) {
    throw createGoogleAuthError(
      "Could not start your Atlas session.",
      500
    );
  }

  await createSiteSessionFromIdToken(
    currentSignIn.idToken,
    res,
    req
  );

  return res.status(200).json({
    success: true,
    requiresTwoFactor: false,
    user: {
      uid,
      email,
      emailVerified: true,
      displayName: fullName,
      fullName,
      photoURL
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600, s-maxage=3600"
      );

      return res.status(200).json({
        success: true,
        clientId: getGoogleClientId()
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    const body = getRequestBody(req);
    const action = cleanString(body.action, 20).toLowerCase();
    const credential = cleanString(body.credential, 6000);

    if (!credential) {
      return res.status(400).json({
        error: "Choose a Google account."
      });
    }

    if (action === "link") {
      return await handleGoogleLink(req, res, credential);
    }

    if (action === "login") {
      return await handleGoogleLogin(req, res, credential);
    }

    return res.status(400).json({
      error: "Choose a valid Google authentication action."
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Google authentication failed."
      });
  }
};
