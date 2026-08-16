const {
  getRequestIp,
  consumeSecurityRateLimit
} = require("../server/_lib/securityRateLimits");

const SUPPORTED_LANGUAGES = new Set([
  "ar",
  "fr",
  "de",
  "es"
]);
const MAX_TEXT_ITEMS = 100;
const MAX_TEXT_LENGTH = 2000;
const MAX_TOTAL_CHARACTERS = 20000;
const TRANSLATION_RATE_LIMIT_WINDOW_MS =
  60 * 60 * 1000;
const MAX_TRANSLATION_REQUESTS_PER_WINDOW = 60;

function getRequestBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (error) {
      return {};
    }
  }

  return req.body || {};
}

function cleanLanguage(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

module.exports = async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0"
  );

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = getRequestBody(req);
    const language = cleanLanguage(
      body.language
    );
    const rawTexts = Array.isArray(
      body.texts
    )
      ? body.texts
      : [];
    const texts = rawTexts.map(function (value) {
      return String(value || "").trim();
    });
    const totalCharacters = texts.reduce(
      function (total, text) {
        return total + text.length;
      },
      0
    );

    if (
      !SUPPORTED_LANGUAGES.has(language) ||
      texts.length === 0 ||
      texts.length > MAX_TEXT_ITEMS ||
      texts.some(function (text) {
        return (
          !text ||
          text.length > MAX_TEXT_LENGTH
        );
      }) ||
      totalCharacters > MAX_TOTAL_CHARACTERS
    ) {
      return res.status(400).json({
        error: "Invalid translation request."
      });
    }

    const apiKey = String(
      process.env.GOOGLE_TRANSLATE_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      return res.status(503).json({
        error: "Translation is not configured."
      });
    }

    await consumeSecurityRateLimit({
      scope: "page-translation-ip",
      identifier: getRequestIp(req),
      maxAttempts:
        MAX_TRANSLATION_REQUESTS_PER_WINDOW,
      windowMs:
        TRANSLATION_RATE_LIMIT_WINDOW_MS,
      message:
        "Too many translation requests. Please try again later."
    });

    const response = await fetch(
      "https://translation.googleapis.com/language/translate/v2?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: texts,
          source: "en",
          target: language,
          format: "text"
        })
      }
    );
    const data = await response
      .json()
      .catch(function () {
        return {};
      });

    if (
      !response.ok ||
      !data.data ||
      !Array.isArray(
        data.data.translations
      ) ||
      data.data.translations.length !==
        texts.length
    ) {
      const error = new Error(
        "Translation service is unavailable."
      );

      error.statusCode = 502;
      throw error;
    }

    return res.status(200).json({
      translations:
        data.data.translations.map(
          function (translation) {
            return String(
              translation &&
              translation.translatedText ||
              ""
            );
          }
        )
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
          "Could not translate this page."
      });
  }
};
