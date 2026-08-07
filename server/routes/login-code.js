const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const {
  ensureAllowedAucEmail,
  createLoginChallenge,
  createSiteSessionFromIdToken,
  createSiteSessionForUid,
  getLoginChallenge,
  consumeLoginChallenge,
  clearLoginChallenge
} = require("../_lib/securityHelpers");

const {
  getRequestIp,
  consumeSecurityRateLimit,
  clearSecurityRateLimit
} = require("../_lib/securityRateLimits");

const LOGIN_CODE_COLLECTION = "emailLoginCodes";
const LOGIN_CODE_EXPIRES_MS = 10 * 60 * 1000;
const LOGIN_CODE_MAX_VERIFY_ATTEMPTS = 6;

const REQUEST_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_MAX_EMAIL_ATTEMPTS = 5;
const REQUEST_MAX_IP_ATTEMPTS = 30;

const VERIFY_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_MAX_EMAIL_ATTEMPTS = 12;
const VERIFY_MAX_IP_ATTEMPTS = 100;

function cleanAction(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .slice(0, 20);
}

function cleanEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
}

function cleanChallengeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function cleanCode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getEmailCodeSecret() {
  const secret = String(
    process.env.SECURITY_CODE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_CLIENT_EMAIL ||
    ""
  ).trim();

  if (!secret) {
    throw createHttpError(
      "Email sign-in codes are not configured.",
      500
    );
  }

  return secret;
}

function createLoginCodeHash(
  challengeId,
  uid,
  code
) {
  return crypto
    .createHmac("sha256", getEmailCodeSecret())
    .update(
      "email-login-code:" +
      challengeId +
      ":" +
      uid +
      ":" +
      code
    )
    .digest("hex");
}

function loginCodeHashesMatch(
  storedHash,
  suppliedHash
) {
  const storedBuffer = Buffer.from(
    String(storedHash || ""),
    "hex"
  );

  const suppliedBuffer = Buffer.from(
    String(suppliedHash || ""),
    "hex"
  );

  return Boolean(
    storedBuffer.length === 32 &&
    suppliedBuffer.length === 32 &&
    crypto.timingSafeEqual(
      storedBuffer,
      suppliedBuffer
    )
  );
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (typeof value._seconds === "number") {
    return value._seconds * 1000;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? 0
    : parsedDate.getTime();
}

function getResendConfiguration() {
  const apiKey = String(
    process.env.RESEND_API_KEY || ""
  ).trim();

  const from = String(
    process.env.RESEND_FROM_EMAIL || ""
  ).trim();

  if (!apiKey || !from) {
    throw createHttpError(
      "Email sign-in codes are not configured.",
      500
    );
  }

  return {
    apiKey,
    from
  };
}

async function getUserByEmail(email) {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

async function sendLoginCodeEmail(
  email,
  code,
  challengeId
) {
  const resend = getResendConfiguration();

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        "Authorization":
          "Bearer " + resend.apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key":
          "auc-atlas-login-" + challengeId
      },
      body: JSON.stringify({
        from: resend.from,
        to: [email],
        subject:
          code + " is your AUC Atlas sign-in code",
        text:
          "Your AUC Atlas sign-in code is " +
          code +
          ". It expires in 10 minutes. " +
          "If you did not request this code, you can ignore this email.",
        html: `
          <div style="margin:0;padding:40px 20px;background:#f7f4ee;font-family:Arial,sans-serif;color:#171717;">
            <div style="max-width:520px;margin:0 auto;padding:34px;border:1px solid rgba(23,23,23,0.1);border-radius:26px;background:#ffffff;">
              <p style="margin:0 0 14px;color:#c09a5c;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
                AUC Atlas
              </p>

              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
                Your sign-in code
              </h1>

              <p style="margin:0 0 24px;color:#666666;font-size:15px;line-height:1.7;">
                Enter this code on the AUC Atlas login page:
              </p>

              <div style="margin:0 0 24px;padding:20px;border-radius:18px;background:#f7f4ee;color:#171717;font-size:34px;font-weight:700;letter-spacing:0.22em;text-align:center;">
                ${code}
              </div>

              <p style="margin:0;color:#777777;font-size:13px;line-height:1.7;">
                This code expires in 10 minutes. If you did not request it, you can safely ignore this email.
              </p>
            </div>
          </div>
        `
      })
    }
  );

  const data = await response.json().catch(
    function () {
      return {};
    }
  );

  if (!response.ok || !data.id) {
    throw createHttpError(
      "Could not send the sign-in code. Please try again.",
      502
    );
  }
}

async function consumeRequestRateLimits(
  req,
  email
) {
  await consumeSecurityRateLimit({
    scope: "email-login-code-request-ip",
    identifier: getRequestIp(req),
    maxAttempts: REQUEST_MAX_IP_ATTEMPTS,
    windowMs: REQUEST_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many sign-in code requests from this connection. Please try again later."
  });

  await consumeSecurityRateLimit({
    scope: "email-login-code-request-email",
    identifier: email,
    maxAttempts:
      REQUEST_MAX_EMAIL_ATTEMPTS,
    windowMs:
      REQUEST_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many sign-in codes were requested for this email. Please try again later."
  });
}

async function consumeVerifyRateLimits(
  req,
  email
) {
  await consumeSecurityRateLimit({
    scope: "email-login-code-verify-ip",
    identifier: getRequestIp(req),
    maxAttempts: VERIFY_MAX_IP_ATTEMPTS,
    windowMs: VERIFY_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many code verification attempts from this connection. Please try again later."
  });

  await consumeSecurityRateLimit({
    scope: "email-login-code-verify-email",
    identifier: email,
    maxAttempts:
      VERIFY_MAX_EMAIL_ATTEMPTS,
    windowMs:
      VERIFY_RATE_LIMIT_WINDOW_MS,
    message:
      "Too many code verification attempts for this email. Please request a new code later."
  });
}

function createGenericRequestResponse(
  challengeId
) {
  return {
    success: true,
    challengeId,
    expiresInSeconds:
      LOGIN_CODE_EXPIRES_MS / 1000,
    message:
      "If an account exists for this email, a sign-in code has been sent."
  };
}

async function requestLoginCode(
  req,
  res
) {
  const body = req.body || {};
  const recovery =
    body.recovery === true;

  let loginChallenge = null;
  let email = cleanEmail(
    body.email
  );
  let userRecord = null;

  if (recovery) {
    loginChallenge =
      await getLoginChallenge(req);

    if (
      !loginChallenge ||
      !loginChallenge.uid ||
      !loginChallenge.idToken ||
      !loginChallenge.twoFactor ||
      !loginChallenge.twoFactor.appEnabled
    ) {
      throw createHttpError(
        "Log in with your password again to receive a recovery code.",
        403
      );
    }

    userRecord =
      await admin.auth().getUser(
        loginChallenge.uid
      );

    if (userRecord.disabled) {
      throw createHttpError(
        "This account is disabled.",
        403
      );
    }

    email = ensureAllowedAucEmail(
      userRecord.email ||
      loginChallenge.email ||
      "",
      "receive a recovery code"
    );
  } else {
    if (!email) {
      return res.status(400).json({
        error:
          "Please enter your email address."
      });
    }

    ensureAllowedAucEmail(
      email,
      "receive a sign-in code"
    );

    userRecord =
      await getUserByEmail(email);
  }

  await consumeRequestRateLimits(
    req,
    email
  );

  const challengeId =
    crypto.randomBytes(32).toString("hex");

  if (
    !userRecord ||
    userRecord.disabled
  ) {
    return res.status(200).json(
      createGenericRequestResponse(
        challengeId
      )
    );
  }

  const code = String(
    crypto.randomInt(0, 1000000)
  ).padStart(6, "0");

  const challengeRef =
    admin.firestore()
      .collection(
        LOGIN_CODE_COLLECTION
      )
      .doc(userRecord.uid);

  await sendLoginCodeEmail(
    email,
    code,
    challengeId
  );

  await challengeRef.set({
    uid: userRecord.uid,
    challengeId,
    codeHash: createLoginCodeHash(
      challengeId,
      userRecord.uid,
      code
    ),
    purpose: recovery
      ? "authenticator-recovery"
      : "passwordless",
    loginChallengeId:
      recovery && loginChallenge
        ? loginChallenge.challengeId
        : "",
    attempts: 0,
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    expiresAt:
      admin.firestore.Timestamp.fromDate(
        new Date(
          Date.now() +
          LOGIN_CODE_EXPIRES_MS
        )
      )
  });

  const responseData =
    createGenericRequestResponse(
      challengeId
    );

  if (recovery) {
    responseData.email = email;
  }

  return res.status(200).json(
    responseData
  );
}

async function verifyLoginCode(
  req,
  res
) {
  const body = req.body || {};
  const recovery =
    body.recovery === true;

  let loginChallenge = null;
  let email = cleanEmail(
    body.email
  );

  const challengeId =
    cleanChallengeId(
      body.challengeId
    );

  const code = cleanCode(
    body.code
  );

  if (
    (!recovery && !email) ||
    !/^[a-f0-9]{64}$/.test(
      challengeId
    ) ||
    !/^\d{6}$/.test(code)
  ) {
    return res.status(400).json({
      error: recovery
        ? "Please enter the 6-digit recovery code."
        : "Please enter the 6-digit sign-in code."
    });
  }

  let userRecord = null;

  if (recovery) {
    loginChallenge =
      await getLoginChallenge(req);

    if (
      !loginChallenge ||
      !loginChallenge.uid ||
      !loginChallenge.idToken ||
      !loginChallenge.twoFactor ||
      !loginChallenge.twoFactor.appEnabled
    ) {
      throw createHttpError(
        "Log in with your password again to use email recovery.",
        403
      );
    }

    userRecord =
      await admin.auth().getUser(
        loginChallenge.uid
      );

    if (userRecord.disabled) {
      throw createHttpError(
        "This account is disabled.",
        403
      );
    }

    email = ensureAllowedAucEmail(
      userRecord.email ||
      loginChallenge.email ||
      "",
      "verify a recovery code"
    );
  } else {
    ensureAllowedAucEmail(
      email,
      "verify a sign-in code"
    );

    userRecord =
      await getUserByEmail(email);
  }

  await consumeVerifyRateLimits(
    req,
    email
  );

  if (
    !userRecord ||
    userRecord.disabled
  ) {
    return res.status(401).json({
      error:
        "The sign-in code is invalid or has expired."
    });
  }

  const challengeRef =
    admin.firestore()
      .collection(
        LOGIN_CODE_COLLECTION
      )
      .doc(userRecord.uid);

  const verificationResult =
    await admin.firestore()
      .runTransaction(
        async function (transaction) {
          const challengeDoc =
            await transaction.get(
              challengeRef
            );

          if (!challengeDoc.exists) {
            return {
              valid: false
            };
          }

          const challenge =
            challengeDoc.data() || {};

          const expiresAtMs =
            timestampToMillis(
              challenge.expiresAt
            );

          if (
            challenge.usedAt ||
            !expiresAtMs ||
            expiresAtMs <= Date.now()
          ) {
            transaction.delete(
              challengeRef
            );

            return {
              valid: false
            };
          }

          const challengePurpose =
            String(
              challenge.purpose ||
              "passwordless"
            );

          const expectedPurpose =
            recovery
              ? "authenticator-recovery"
              : "passwordless";

          if (
            challenge.challengeId !==
              challengeId ||
            challenge.uid !==
              userRecord.uid ||
            challengePurpose !==
              expectedPurpose ||
            (
              recovery &&
              (
                !loginChallenge ||
                challenge.loginChallengeId !==
                  loginChallenge.challengeId
              )
            )
          ) {
            return {
              valid: false
            };
          }

          const attempts = Math.max(
            0,
            Number(
              challenge.attempts || 0
            )
          );

          if (
            attempts >=
            LOGIN_CODE_MAX_VERIFY_ATTEMPTS
          ) {
            transaction.delete(
              challengeRef
            );

            return {
              valid: false
            };
          }

          const suppliedHash =
            createLoginCodeHash(
              challengeId,
              userRecord.uid,
              code
            );

          const valid =
            loginCodeHashesMatch(
              challenge.codeHash,
              suppliedHash
            );

          const nextAttempts =
            attempts + 1;

          if (!valid) {
            if (
              nextAttempts >=
              LOGIN_CODE_MAX_VERIFY_ATTEMPTS
            ) {
              transaction.delete(
                challengeRef
              );
            } else {
              transaction.update(
                challengeRef,
                {
                  attempts:
                    nextAttempts,
                  lastAttemptAt:
                    admin.firestore
                      .FieldValue
                      .serverTimestamp()
                }
              );
            }

            return {
              valid: false
            };
          }

          transaction.update(
            challengeRef,
            {
              attempts:
                nextAttempts,
              usedAt:
                admin.firestore
                  .FieldValue
                  .serverTimestamp()
            }
          );

          return {
            valid: true
          };
        }
      );

  if (!verificationResult.valid) {
    return res.status(401).json({
      error:
        "The sign-in code is invalid or has expired."
    });
  }

  const userDoc =
    await admin.firestore()
      .collection("users")
      .doc(userRecord.uid)
      .get();

  const userData =
    userDoc.exists
      ? userDoc.data() || {}
      : {};

  const twoFactor =
    userData.twoFactor &&
    typeof userData.twoFactor ===
      "object"
      ? userData.twoFactor
      : {};

  const emailAddress =
    userRecord.email ||
    userData.email ||
    email;

  const fullName =
    userData.fullName ||
    userRecord.displayName ||
    "";

  const photoURL =
    userData.photoURL ||
    userRecord.photoURL ||
    "";

  if (recovery) {
    await consumeLoginChallenge(
      loginChallenge
    );

    await createSiteSessionFromIdToken(
      loginChallenge.idToken,
      res,
      req
    );

    await clearLoginChallenge(
      req,
      res
    );

    await challengeRef
      .delete()
      .catch(function () {});

    await Promise.all([
      clearSecurityRateLimit(
        "email-login-code-request-email",
        email
      ),
      clearSecurityRateLimit(
        "email-login-code-verify-email",
        email
      )
    ]);

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: {
        uid: userRecord.uid,
        email: emailAddress,
        emailVerified: Boolean(
          userRecord.emailVerified
        ),
        displayName: fullName,
        fullName,
        photoURL
      }
    });
  }

  if (twoFactor.appEnabled) {
    await createLoginChallenge(
      userRecord.uid,
      res,
      {
        email: emailAddress,
        twoFactor: {
          appEnabled: true,
          emailEnabled: Boolean(
            twoFactor.emailEnabled
          )
        }
      }
    );

    await challengeRef
      .delete()
      .catch(function () {});

    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      method: "app"
    });
  }

  await createSiteSessionForUid(
    userRecord.uid,
    res,
    req
  );

  await challengeRef
    .delete()
    .catch(function () {});

  await Promise.all([
    clearSecurityRateLimit(
      "email-login-code-request-email",
      email
    ),
    clearSecurityRateLimit(
      "email-login-code-verify-email",
      email
    )
  ]);

  return res.status(200).json({
    success: true,
    requiresTwoFactor: false,
    user: {
      uid: userRecord.uid,
      email: emailAddress,
      emailVerified: Boolean(
        userRecord.emailVerified
      ),
      displayName: fullName,
      fullName,
      photoURL
    }
  });
}

module.exports = async function handler(
  req,
  res
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const action = cleanAction(
      (req.body || {}).action
    );

    if (action === "request") {
      return await requestLoginCode(
        req,
        res
      );
    }

    if (action === "verify") {
      return await verifyLoginCode(
        req,
        res
      );
    }

    return res.status(400).json({
      error:
        "Invalid sign-in code action."
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

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        error:
          error.message ||
          "Could not process the sign-in code."
      });
  }
};
