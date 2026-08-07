const admin = require("../_lib/firebaseAdmin");

const {
  createSiteSessionForUid,
  createSiteSessionFromIdToken,
  signInWithCustomToken,
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const SIGNUP_RATE_LIMIT_WINDOW_MS =
  30 * 60 * 1000;
const SIGNUP_MAX_EMAIL_ATTEMPTS = 5;
const SIGNUP_MAX_IP_ATTEMPTS = 20;
const PROVIDER_REQUEST_WINDOW_MS =
  15 * 60 * 1000;
const PROVIDER_MAX_IP_ATTEMPTS = 100;

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanEmail(value) {
  return cleanString(value, 160).toLowerCase();
}

function cleanPassword(value) {
  return String(value || "");
}

function cleanPhone(value) {
  return cleanString(value, 30);
}

function cleanAucId(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 9);
}

function hasValidPhoneFormat(value) {
  const phone = cleanPhone(value);
  const phoneDigits = phone.replace(/\D/g, "");

  return Boolean(
    phone &&
    /^\+?[0-9][0-9\s().-]{7,28}$/.test(phone) &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 15 &&
    !/^(\d)\1+$/.test(phoneDigits)
  );
}

function hasValidAucIdFormat(value) {
  return /^900\d{6}$/.test(cleanAucId(value));
}

function getPhoneLookupKey(value) {
  const phone = cleanPhone(value);

  return hasValidPhoneFormat(phone) ? phone.replace(/\D/g, "") : "";
}

function getAucIdLookupKey(value) {
  const aucId = cleanAucId(value);

  return hasValidAucIdFormat(aucId) ? aucId : "";
}

function createInvalidPhoneError() {
  const error = new Error("Please enter a valid phone number.");
  error.statusCode = 400;
  return error;
}

function createPhoneInUseError() {
  const error = new Error("This phone number is already used by another account.");
  error.statusCode = 409;
  return error;
}

function createInvalidAucIdError() {
  const error = new Error("AUC ID number must start with 900 and be 9 digits total.");
  error.statusCode = 400;
  return error;
}

function createAucIdInUseError() {
  const error = new Error("This AUC ID number is already used by another account.");
  error.statusCode = 409;
  return error;
}

async function ensurePhoneCanCreateAccount(phone) {
  const phoneLookupKey = getPhoneLookupKey(phone);

  if (!phoneLookupKey) {
    throw createInvalidPhoneError();
  }

  const db = admin.firestore();
  const phoneReservationRef = db.collection("accountPhoneNumbers").doc(phoneLookupKey);
  const phoneReservationDoc = await phoneReservationRef.get();

  if (phoneReservationDoc.exists) {
    throw createPhoneInUseError();
  }

  const [exactPhoneSnapshot, normalizedPhoneSnapshot] = await Promise.all([
    db.collection("users").where("phone", "==", phone).limit(1).get(),
    db.collection("users").where("phoneLookupKey", "==", phoneLookupKey).limit(1).get()
  ]);

  if (!exactPhoneSnapshot.empty || !normalizedPhoneSnapshot.empty) {
    throw createPhoneInUseError();
  }

  return phoneLookupKey;
}

async function ensureAucIdCanCreateAccount(aucId) {
  const aucIdLookupKey = getAucIdLookupKey(aucId);

  if (!aucIdLookupKey) {
    throw createInvalidAucIdError();
  }

  const db = admin.firestore();
  const aucIdReservationRef = db.collection("accountAucIds").doc(aucIdLookupKey);
  const aucIdReservationDoc = await aucIdReservationRef.get();

  if (aucIdReservationDoc.exists) {
    throw createAucIdInUseError();
  }

  const [exactAucIdSnapshot, normalizedAucIdSnapshot] = await Promise.all([
    db.collection("users").where("aucId", "==", aucIdLookupKey).limit(1).get(),
    db.collection("users").where("aucIdLookupKey", "==", aucIdLookupKey).limit(1).get()
  ]);

  if (!exactAucIdSnapshot.empty || !normalizedAucIdSnapshot.empty) {
    throw createAucIdInUseError();
  }

  return aucIdLookupKey;
}

async function reserveAccountPhone(phone, uid) {
  const phoneLookupKey = await ensurePhoneCanCreateAccount(phone);
  const phoneRef = admin.firestore().collection("accountPhoneNumbers").doc(phoneLookupKey);

  try {
    await phoneRef.create({
      uid,
      phone,
      phoneLookupKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    if (String(error.code) === "6" || error.code === "already-exists" || /already exists/i.test(error.message || "")) {
      throw createPhoneInUseError();
    }

    throw error;
  }

  return { phoneLookupKey, phoneRef };
}

async function reserveAccountAucId(aucId, uid) {
  const aucIdLookupKey = await ensureAucIdCanCreateAccount(aucId);
  const aucIdRef = admin.firestore().collection("accountAucIds").doc(aucIdLookupKey);

  try {
    await aucIdRef.create({
      uid,
      aucId: aucIdLookupKey,
      aucIdLookupKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    if (String(error.code) === "6" || error.code === "already-exists" || /already exists/i.test(error.message || "")) {
      throw createAucIdInUseError();
    }

    throw error;
  }

  return { aucIdLookupKey, aucIdRef };
}

async function consumeSignupRateLimits(
  req,
  email
) {
  await consumeSecurityRateLimit({
    scope: "signup-ip",
    identifier: getRequestIp(req),
    maxAttempts:
      SIGNUP_MAX_IP_ATTEMPTS,
    windowMs:
      SIGNUP_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many signup attempts from this connection. Please try again later."
  });

  await consumeSecurityRateLimit({
    scope: "signup-email",
    identifier: email,
    maxAttempts:
      SIGNUP_MAX_EMAIL_ATTEMPTS,
    windowMs:
      SIGNUP_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many signup attempts for this email. Please try again later."
  });
}

async function consumeProviderRequestRateLimit(
  req
) {
  await consumeSecurityRateLimit({
    scope: "provider-auth-ip",
    identifier: getRequestIp(req),
    maxAttempts:
      PROVIDER_MAX_IP_ATTEMPTS,
    windowMs:
      PROVIDER_REQUEST_WINDOW_MS,
    message:
      "Too many provider sign-in attempts from this connection. Please try again later."
  });
}

async function ensureEmailCanCreateAccount(email) {
  try {
    await admin.auth().getUserByEmail(email);

    const error = new Error("This email is already used by another account.");
    error.statusCode = 409;
    throw error;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return;
    }

    throw error;
  }
}

function getFirebaseWebApiKey() {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();

  if (!apiKey) {
    const error = new Error("Firebase signup email verification is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

async function sendFirebaseSignupVerificationEmail(uid) {
  const apiKey = getFirebaseWebApiKey();
  const customToken = await admin.auth().createCustomToken(uid);
  const signInData = await signInWithCustomToken(customToken);
  const idToken = signInData && signInData.idToken ? signInData.idToken : "";

  if (!idToken) {
    const error = new Error("Could not create email verification session.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestType: "VERIFY_EMAIL",
        idToken
      })
    }
  );

  const data = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    const error = new Error("Could not send signup verification email.");
    error.statusCode = response.status || 500;
    error.firebaseErrorCode = data && data.error && data.error.message ? data.error.message : "";
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const provider = cleanString((req.body || {}).provider, 30);
    const idToken = cleanString((req.body || {}).idToken, 4000);

    const providerConfigs = {
      google: {
        name: "Google",
        firebaseProviderId: "google.com",
        authProvider: "google"
      },
      github: {
        name: "GitHub",
        firebaseProviderId: "github.com",
        authProvider: "github"
      },
      facebook: {
        name: "Facebook",
        firebaseProviderId: "facebook.com",
        authProvider: "facebook"
      }
    };
    const providerConfig =
      providerConfigs[provider];

    if (providerConfig) {
      await consumeProviderRequestRateLimit(
        req
      );

      if (!idToken) {
        return res.status(400).json({ error: providerConfig.name + " sign-in could not be verified." });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const signInProvider =
        decodedToken.firebase && decodedToken.firebase.sign_in_provider
          ? decodedToken.firebase.sign_in_provider
          : "";

      if (signInProvider !== providerConfig.firebaseProviderId) {
        return res.status(400).json({ error: "Please sign in with " + providerConfig.name + "." });
      }

      const userRecord = await admin.auth().getUser(decodedToken.uid);
      const email = cleanEmail(userRecord.email || decodedToken.email);
      const fullName = cleanString(
        userRecord.displayName || decodedToken.name || email.split("@")[0] || providerConfig.name + " User",
        80
      );
      const photoURL = cleanString(userRecord.photoURL || decodedToken.picture, 600);

      if (!email) {
        return res.status(400).json({ error: providerConfig.name + " account email is required." });
      }

      ensureAllowedAucEmail(email, "create an account");

      const userRef = admin.firestore()
        .collection("users")
        .doc(decodedToken.uid);
      const userDoc = await userRef.get();
      const existingUser = userDoc.exists
        ? userDoc.data() || {}
        : {};
      const emailVerified = Boolean(
        userRecord.emailVerified ||
        decodedToken.email_verified
      );

      if (!userDoc.exists) {
        await consumeSignupRateLimits(
          req,
          email
        );
      }

      await userRef.set({
        fullName: existingUser.fullName || fullName,
        phone: existingUser.phone || "",
        email,
        photoURL: existingUser.photoURL || photoURL,
        authProvider: existingUser.authProvider || providerConfig.authProvider,
        emailVerified,
        createdAt: existingUser.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await createSiteSessionFromIdToken(idToken, res);

      return res.status(200).json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email,
          displayName: existingUser.fullName || fullName,
          emailVerified,
          photoURL: existingUser.photoURL || photoURL
        }
      });
    }

    const fullName = cleanString((req.body || {}).fullName, 80);
    const aucId = cleanAucId((req.body || {}).aucId);
    const phone = cleanPhone((req.body || {}).phone);
    const email = cleanEmail((req.body || {}).email);
    const password = cleanPassword((req.body || {}).password);
    const confirmPassword = cleanPassword((req.body || {}).confirmPassword);
    const consentAccepted = (req.body || {}).consentAccepted === true;

    if (!fullName || !aucId || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }

    if (!consentAccepted) {
      return res.status(400).json({
        error: "You must agree to the Terms of Service and confirm that you have read the Privacy Policy before creating an account."
      });
    }

    ensureAllowedAucEmail(email, "create an account");

    if (!hasValidAucIdFormat(aucId)) {
      throw createInvalidAucIdError();
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    if (
      password.length < 10 ||
      password.length > 48 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      return res.status(400).json({ error: "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters." });
    }

    await consumeSignupRateLimits(
      req,
      email
    );
    await ensureAucIdCanCreateAccount(aucId);
    await ensurePhoneCanCreateAccount(phone);
    await ensureEmailCanCreateAccount(email);

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false
    });

    let phoneReservation = null;
    let aucIdReservation = null;
    const userRef = admin.firestore().collection("users").doc(userRecord.uid);

    try {
      phoneReservation = await reserveAccountPhone(phone, userRecord.uid);
      aucIdReservation = await reserveAccountAucId(aucId, userRecord.uid);

      await userRef.set({
        fullName,
        aucId,
        aucIdLookupKey: aucIdReservation.aucIdLookupKey,
        phone,
        phoneLookupKey: phoneReservation.phoneLookupKey,
        email,
        authProvider: "password",
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await sendFirebaseSignupVerificationEmail(userRecord.uid);
    } catch (error) {
      if (phoneReservation && phoneReservation.phoneRef) {
        await phoneReservation.phoneRef.delete().catch(function () {});
      }

      if (aucIdReservation && aucIdReservation.aucIdRef) {
        await aucIdReservation.aucIdRef.delete().catch(function () {});
      }

      await userRef.delete().catch(function () {});
      await admin.auth().deleteUser(userRecord.uid).catch(function () {});
      throw error;
    }

    await createSiteSessionForUid(userRecord.uid, res);

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message: "Account created. Check your inbox for the verification link.",
      user: {
        uid: userRecord.uid,
        email,
        aucId,
        displayName: fullName,
        emailVerified: false
      }
    });
  } catch (error) {
    if (
      error.code ===
      "auth/email-already-exists"
    ) {
      return res.status(409).json({
        error:
          "This email is already used by another account."
      });
    }

    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not create account."
    });
  }
};
