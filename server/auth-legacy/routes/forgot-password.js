const {
  ensureAllowedAucEmail
} = require("../_lib/securityHelpers");
const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../_lib/securityRateLimits");

const PASSWORD_RESET_RATE_LIMIT_WINDOW_MS =
  30 * 60 * 1000;
const PASSWORD_RESET_MAX_EMAIL_ATTEMPTS = 5;
const PASSWORD_RESET_MAX_IP_ATTEMPTS = 20;

function cleanEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
}

function getFirebaseWebApiKey() {
  const apiKey = String(
    process.env.FIREBASE_WEB_API_KEY || ""
  ).trim();

  if (!apiKey) {
    const error = new Error(
      "Firebase password reset is not configured."
    );

    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

function getFirebaseErrorCode(data) {
  return String(
    data &&
    data.error &&
    data.error.message
      ? data.error.message
      : ""
  )
    .split(" : ")[0]
    .trim();
}

async function sendFirebasePasswordResetEmail(
  email
) {
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" +
      encodeURIComponent(
        getFirebaseWebApiKey()
      ),
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        requestType:
          "PASSWORD_RESET",
        email
      })
    }
  );

  const data = await response
    .json()
    .catch(function () {
      return {};
    });

  if (response.ok) {
    return;
  }

  const firebaseErrorCode =
    getFirebaseErrorCode(data);

  if (
    firebaseErrorCode ===
      "EMAIL_NOT_FOUND" ||
    firebaseErrorCode ===
      "USER_NOT_FOUND"
  ) {
    return;
  }

  const isRateLimited = [
    "TOO_MANY_ATTEMPTS_TRY_LATER",
    "TOO_MANY_ATTEMPTS"
  ].includes(firebaseErrorCode);

  const error = new Error(
    isRateLimited
      ? "Too many password reset requests. Please try again later."
      : "Could not send the password reset email. Please try again."
  );

  error.statusCode =
    isRateLimited ? 429 : 500;

  throw error;
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

    const email = cleanEmail(
      (req.body || {}).email
    );

    if (!email) {
      return res.status(400).json({
        error:
          "Please enter your email address."
      });
    }

    ensureAllowedAucEmail(
      email,
      "reset your password"
    );

    await consumeSecurityRateLimit({
      scope: "password-reset-ip",
      identifier: getRequestIp(req),
      maxAttempts:
        PASSWORD_RESET_MAX_IP_ATTEMPTS,
      windowMs:
        PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
      message:
        "Too many password reset requests from this connection. Please try again later."
    });

    await consumeSecurityRateLimit({
      scope: "password-reset-email",
      identifier: email,
      maxAttempts:
        PASSWORD_RESET_MAX_EMAIL_ATTEMPTS,
      windowMs:
        PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
      message:
        "Too many password reset requests for this email. Please try again later."
    });

    await sendFirebasePasswordResetEmail(
      email
    );

    return res.status(200).json({
      success: true,
      message:
        "If an AUC Atlas account exists for this email, a password reset link has been sent."
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
          "Could not send the password reset email."
      });
  }
};
