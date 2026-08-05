const crypto = require("crypto");
const admin = require("./firebaseAdmin");

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function getRateLimitSecret() {
  return String(
    process.env.SECURITY_RATE_LIMIT_SECRET ||
    process.env.SECURITY_CODE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_CLIENT_EMAIL ||
    "auc-atlas-rate-limit-secret"
  );
}

function getRequestHeader(req, name) {
  const headers =
    req && req.headers ? req.headers : {};
  const value =
    headers[name] ||
    headers[String(name || "").toLowerCase()];

  return Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
}

function getRequestIp(req) {
  const forwardedFor = getRequestHeader(
    req,
    "x-forwarded-for"
  )
    .split(",")[0]
    .trim();
  const realIp = getRequestHeader(
    req,
    "x-real-ip"
  ).trim();
  const socketIp =
    req &&
    req.socket &&
    req.socket.remoteAddress
      ? req.socket.remoteAddress
      : "";

  return cleanString(
    forwardedFor ||
      realIp ||
      socketIp ||
      "unknown",
    100
  ).toLowerCase();
}

function timestampToMillis(value) {
  if (!value) return 0;

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (
    typeof value._seconds === "number"
  ) {
    return value._seconds * 1000;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? 0
    : parsedDate.getTime();
}

function getRateLimitDocumentId(
  scope,
  identifier
) {
  return crypto
    .createHmac(
      "sha256",
      getRateLimitSecret()
    )
    .update(
      cleanString(scope, 80).toLowerCase() +
      ":" +
      cleanString(
        identifier,
        500
      ).toLowerCase()
    )
    .digest("hex");
}

function createRateLimitError(
  message,
  retryAfterSeconds
) {
  const error = new Error(
    message ||
    "Too many attempts. Please try again later."
  );

  error.statusCode = 429;
  error.retryAfterSeconds = Math.max(
    1,
    Math.ceil(
      Number(retryAfterSeconds) || 1
    )
  );

  return error;
}

async function consumeSecurityRateLimit(
  options
) {
  const settings = options || {};
  const scope = cleanString(
    settings.scope,
    80
  ).toLowerCase();
  const identifier = cleanString(
    settings.identifier,
    500
  ).toLowerCase();
  const maxAttempts = Math.max(
    1,
    Math.floor(
      Number(settings.maxAttempts) || 1
    )
  );
  const windowMs = Math.max(
    1000,
    Math.floor(
      Number(settings.windowMs) || 1000
    )
  );

  if (!scope || !identifier) {
    const error = new Error(
      "Could not verify this security attempt."
    );

    error.statusCode = 400;
    throw error;
  }

  const db = admin.firestore();
  const rateLimitRef = db
    .collection("securityRateLimits")
    .doc(
      getRateLimitDocumentId(
        scope,
        identifier
      )
    );
  const nowMs = Date.now();

  await db.runTransaction(
    async function (transaction) {
      const rateLimitDoc =
        await transaction.get(
          rateLimitRef
        );
      const data = rateLimitDoc.exists
        ? rateLimitDoc.data() || {}
        : {};
      const windowStartedAtMs =
        timestampToMillis(
          data.windowStartedAt
        );
      const windowEndsAtMs =
        windowStartedAtMs + windowMs;
      const hasActiveWindow =
        windowStartedAtMs > 0 &&
        nowMs < windowEndsAtMs;
      const attemptCount =
        hasActiveWindow
          ? Math.max(
              0,
              Number(data.count || 0)
            )
          : 0;

      if (
        hasActiveWindow &&
        attemptCount >= maxAttempts
      ) {
        throw createRateLimitError(
          settings.message,
          Math.ceil(
            (
              windowEndsAtMs -
              nowMs
            ) / 1000
          )
        );
      }

      const activeWindowStartedAtMs =
        hasActiveWindow
          ? windowStartedAtMs
          : nowMs;

      transaction.set(
        rateLimitRef,
        {
          scope,
          count: attemptCount + 1,
          windowStartedAt:
            admin.firestore.Timestamp
              .fromDate(
                new Date(
                  activeWindowStartedAtMs
                )
              ),
          lastAttemptAt:
            admin.firestore.FieldValue
              .serverTimestamp(),
          expiresAt:
            admin.firestore.Timestamp
              .fromDate(
                new Date(
                  activeWindowStartedAtMs +
                    windowMs
                )
              )
        }
      );
    }
  );
}

async function clearSecurityRateLimit(
  scope,
  identifier
) {
  const safeScope = cleanString(
    scope,
    80
  ).toLowerCase();
  const safeIdentifier = cleanString(
    identifier,
    500
  ).toLowerCase();

  if (!safeScope || !safeIdentifier) {
    return;
  }

  await admin.firestore()
    .collection("securityRateLimits")
    .doc(
      getRateLimitDocumentId(
        safeScope,
        safeIdentifier
      )
    )
    .delete()
    .catch(function () {});
}

module.exports = {
  getRequestIp,
  consumeSecurityRateLimit,
  clearSecurityRateLimit
};
