const admin = require("../_lib/firebaseAdmin");

const {
  createSiteSessionForUid,
  createSiteSessionFromIdToken,
  signInWithCustomToken
} = require("../_lib/securityHelpers");

const WINDOW_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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

function getPhoneLookupKey(value) {
  const phone = cleanPhone(value);

  return hasValidPhoneFormat(phone) ? phone.replace(/\D/g, "") : "";
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

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function createCompatibleSiteSession(req, res, uid) {
  if (createSiteSessionForUid.length >= 3) {
    return await createSiteSessionForUid(req, res, uid);
  }

  return await createSiteSessionForUid(uid, res);
}

async function createCompatibleIdTokenSession(req, res, idToken) {
  if (createSiteSessionFromIdToken.length >= 3) {
    return await createSiteSessionFromIdToken(req, res, idToken);
  }

  return await createSiteSessionFromIdToken(idToken, res);
}

async function checkSignupRateLimit(email) {
  const safeId = email.replace(/[^\w.-]/g, "_");
  const ref = admin.firestore().collection("signupAttempts").doc(safeId);
  const doc = await ref.get();
  const data = doc.exists ? doc.data() || {} : {};
  const windowStartedAtMs = timestampToMillis(data.windowStartedAt);
  const oldWindow = !windowStartedAtMs || Date.now() - windowStartedAtMs >= WINDOW_MS;

  if (!oldWindow && Number(data.count || 0) >= MAX_ATTEMPTS) {
    const error = new Error("Too many signup attempts. Please try again later.");
    error.statusCode = 429;
    throw error;
  }

  await ref.set({
    count: oldWindow ? 1 : Number(data.count || 0) + 1,
    windowStartedAt: oldWindow ? admin.firestore.FieldValue.serverTimestamp() : data.windowStartedAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
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
    const providerConfig = providerConfigs[provider];

    if (providerConfig) {
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

      const userRef = admin.firestore().collection("users").doc(decodedToken.uid);
      const userDoc = await userRef.get();
      const existingUser = userDoc.exists ? userDoc.data() || {} : {};

      const emailVerified = Boolean(userRecord.emailVerified || decodedToken.email_verified);

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

      await createCompatibleIdTokenSession(req, res, idToken);

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
    const phone = cleanPhone((req.body || {}).phone);
    const email = cleanEmail((req.body || {}).email);
    const password = cleanPassword((req.body || {}).password);
    const confirmPassword = cleanPassword((req.body || {}).confirmPassword);

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Please complete all required fields." });
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

    await checkSignupRateLimit(email);
    await ensurePhoneCanCreateAccount(phone);
    await ensureEmailCanCreateAccount(email);

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false
    });

    let phoneReservation = null;
    const userRef = admin.firestore().collection("users").doc(userRecord.uid);

    try {
      phoneReservation = await reserveAccountPhone(phone, userRecord.uid);

      await userRef.set({
        fullName,
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

      await userRef.delete().catch(function () {});
      await admin.auth().deleteUser(userRecord.uid).catch(function () {});
      throw error;
    }

    await createCompatibleSiteSession(req, res, userRecord.uid);

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message: "Account created. Check your inbox for the verification link.",
      user: {
        uid: userRecord.uid,
        email,
        displayName: fullName,
        emailVerified: false
      }
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "This email is already used by another account." });
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "Could not create account."
    });
  }
};
