(function () {
  const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.type = "image/svg+xml";
  faviconLink.href = "favicon.svg";
  document.head.appendChild(faviconLink);

  const isAdminPage = /\/admin(?:\.html)?\/?$/.test(window.location.pathname);
  const weeklyVisitCacheKey =
    "aucAtlasWeeklyVisitCache";
  const weeklyVisitCacheDurationMs =
    30 * 60 * 1000;

  function clearLegacyUniqueVisitorId() {
    try {
      window.localStorage.removeItem(
        "aucAtlasVisitorId"
      );
    } catch (error) {
      // Local storage is unavailable.
    }

    try {
      window.sessionStorage.removeItem(
        "aucAtlasVisitorId"
      );
    } catch (error) {
      // Session storage is unavailable.
    }
  }

  function getCachedWeeklyVisitCount() {
    try {
      const cached = JSON.parse(
        window.sessionStorage.getItem(
          weeklyVisitCacheKey
        ) || "null"
      );
      const savedAt = Number(
        cached && cached.savedAt
      );
      const weeklyVisits = Number(
        cached && cached.weeklyVisits
      );

      if (
        !cached ||
        !Number.isFinite(savedAt) ||
        Date.now() - savedAt >
          weeklyVisitCacheDurationMs ||
        !Number.isFinite(weeklyVisits)
      ) {
        return null;
      }

      return Math.max(0, weeklyVisits);
    } catch (error) {
      return null;
    }
  }

  function cacheWeeklyVisitCount(
    weeklyVisits
  ) {
    try {
      window.sessionStorage.setItem(
        weeklyVisitCacheKey,
        JSON.stringify({
          savedAt: Date.now(),
          weeklyVisits
        })
      );
    } catch (error) {
      // Session storage is unavailable.
    }
  }

  function trackWeeklyVisit() {
    if (
      isAdminPage ||
      typeof window.fetch !== "function"
    ) {
      return Promise.resolve(null);
    }

    const cachedWeeklyVisits =
      getCachedWeeklyVisitCount();

    if (cachedWeeklyVisits !== null) {
      window.aucAtlasWeeklyVisits =
        cachedWeeklyVisits;

      return Promise.resolve(
        cachedWeeklyVisits
      );
    }

    return fetch("/api/weekly-visitors", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "Could not update weekly visits."
          );
        }

        return response.json();
      })
      .then(function (data) {
        const weeklyVisits = Math.max(
          0,
          Number(data.weeklyVisits) || 0
        );

        window.aucAtlasWeeklyVisits =
          weeklyVisits;
        cacheWeeklyVisitCount(
          weeklyVisits
        );

        return weeklyVisits;
      })
      .catch(function () {
        return null;
      });
  }

  clearLegacyUniqueVisitorId();

  window.aucAtlasWeeklyVisitsPromise =
    trackWeeklyVisit();

  if (!isAdminPage && !document.querySelector('script[src="site-footer.js"]')) {
    const footerScript = document.createElement("script");
    footerScript.src = "site-footer.js";
    footerScript.defer = true;
    document.head.appendChild(footerScript);
  }

  const headerRoot = document.getElementById("site-header-root");

  if (!headerRoot) {
    return;
  }

  function setupLanguageSwitcher() {
    if (document.getElementById("tcs-language-switcher")) {
      return;
    }

    const languageStyles = document.createElement("style");
    languageStyles.id = "tcs-language-switcher-styles";
    languageStyles.textContent = `
      .tcs-language-switcher {
        position: fixed;
        top: 30px;
        right: 34px;
        z-index: 2400;
        font-family: Arial, sans-serif;
      }

      .tcs-language-toggle {
        width: 48px;
        height: 48px;
        padding: 0;
        border: 1px solid rgba(23, 23, 23, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.86);
        color: #171717;
        box-shadow: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(16px);
        transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
      }

      .tcs-language-toggle:hover {
        transform: translateY(-1px);
        border-color: rgba(192, 154, 92, 0.3);
        background: rgba(255, 255, 255, 0.98);
      }

      .tcs-language-toggle img {
        width: 26px;
        height: 26px;
        display: block;
        object-fit: contain;
        filter: none;
      }

      .tcs-language-panel {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        min-width: 142px;
        padding: 8px;
        border: 1px solid rgba(23, 23, 23, 0.1);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 18px 38px rgba(42, 32, 20, 0.14);
        backdrop-filter: blur(16px);
        display: grid;
        gap: 6px;
      }

      .tcs-language-panel[hidden] {
        display: none;
      }

      .tcs-language-option {
        width: 100%;
        min-height: 38px;
        padding: 0 12px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: rgba(23, 23, 23, 0.7);
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .tcs-language-flag {
        width: 28px;
        height: 20px;
        flex: 0 0 28px;
        border-radius: 3px;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      }

      .tcs-language-flag img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        transform: none;
      }

      .tcs-language-option:hover {
        background: rgba(192, 154, 92, 0.12);
        color: #171717;
      }

      #google_translate_element {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
      }

      .goog-te-banner-frame,
      .goog-te-banner-frame.skiptranslate,
      iframe.goog-te-banner-frame,
      body > .skiptranslate:not(.tcs-language-switcher),
      .goog-te-gadget {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        border: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      html {
        margin-top: 0 !important;
      }

      body {
        top: 0 !important;
        margin-top: 0 !important;
      }

      @media (max-width: 1168px) {
        .tcs-language-switcher {
          top: 94px;
          right: 24px;
        }
      }

      @media (max-width: 900px) {
        .tcs-language-switcher {
          display: none;
        }
      }
    `;

    document.head.appendChild(languageStyles);

    const languageSwitcher = document.createElement("div");
    languageSwitcher.id = "tcs-language-switcher";
    languageSwitcher.className = "tcs-language-switcher skiptranslate notranslate";
    languageSwitcher.setAttribute("translate", "no");
    languageSwitcher.innerHTML = `
      <button class="tcs-language-toggle" id="tcs-language-toggle" type="button" aria-label="Change language" aria-expanded="false">
        <img src="language-icon.png" alt="">
      </button>

      <div class="tcs-language-panel" id="tcs-language-panel" hidden>
        <button class="tcs-language-option" type="button" data-tcs-language="en"><span class="tcs-language-flag" aria-hidden="true"><img src="united-states.png" alt=""></span><span>English</span></button>
        <button class="tcs-language-option" type="button" data-tcs-language="ar"><span class="tcs-language-flag" aria-hidden="true"><img src="egypt.png" alt=""></span><span>Arabic</span></button>
        <button class="tcs-language-option" type="button" data-tcs-language="fr"><span class="tcs-language-flag" aria-hidden="true"><img src="france.png" alt=""></span><span>French</span></button>
        <button class="tcs-language-option" type="button" data-tcs-language="de"><span class="tcs-language-flag" aria-hidden="true"><img src="germany.png" alt=""></span><span>German</span></button>
        <button class="tcs-language-option" type="button" data-tcs-language="es"><span class="tcs-language-flag" aria-hidden="true"><img src="spain.png" alt=""></span><span>Spanish</span></button>
      </div>

      <div id="google_translate_element" aria-hidden="true"></div>
    `;

    document.body.appendChild(languageSwitcher);

    const languageToggle = document.getElementById("tcs-language-toggle");
    const languagePanel = document.getElementById("tcs-language-panel");

    function closeLanguagePanel() {
      languagePanel.hidden = true;
      languageToggle.setAttribute("aria-expanded", "false");
    }

    function openLanguagePanel() {
      languagePanel.hidden = false;
      languageToggle.setAttribute("aria-expanded", "true");
    }

    const languageStorageKey =
      "aucAtlasLanguage";
    const supportedLanguageCodes = [
      "en",
      "ar",
      "fr",
      "de",
      "es"
    ];
    const translationBatchMaxTexts = 80;
    const translationBatchMaxCharacters =
      16000;
    let translationInProgress = false;
    let translationQueued = false;

    function getSavedLanguage() {
      try {
        const savedLanguage =
          window.localStorage.getItem(
            languageStorageKey
          );

        return supportedLanguageCodes.indexOf(
          savedLanguage
        ) === -1
          ? "en"
          : savedLanguage;
      } catch (error) {
        return "en";
      }
    }

    function saveLanguage(languageCode) {
      try {
        if (languageCode === "en") {
          window.localStorage.removeItem(
            languageStorageKey
          );
        } else {
          window.localStorage.setItem(
            languageStorageKey,
            languageCode
          );
        }
      } catch (error) {
        // Local storage is unavailable.
      }
    }

    function shouldTranslateTextNode(node) {
      if (
        !node ||
        node.nodeType !== Node.TEXT_NODE ||
        !node.parentElement
      ) {
        return false;
      }

      if (
        node.parentElement.closest(
          "script, style, noscript, code, pre, textarea, select, option, [translate=\"no\"], .notranslate"
        )
      ) {
        return false;
      }

      const text = String(
        node.nodeValue ||
        ""
      ).trim();
      const translationState =
        node.aucAtlasTranslationState;

      return (
        text.length > 0 &&
        text.length <= 2000 &&
        /[A-Za-z]/.test(text) &&
        !(
          translationState &&
          translationState.language ===
            getSavedLanguage() &&
          translationState.value === text
        )
      );
    }

    function collectTranslationEntries() {
      const entries = new Map();
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );
      let node = walker.nextNode();

      while (node) {
        if (shouldTranslateTextNode(node)) {
          const text = String(
            node.nodeValue ||
            ""
          ).trim();

          if (!entries.has(text)) {
            entries.set(text, []);
          }

          entries.get(text).push(node);
        }

        node = walker.nextNode();
      }

      return entries;
    }

    function createTranslationBatches(texts) {
      const batches = [];
      let currentBatch = [];
      let currentCharacters = 0;

      texts.forEach(function (text) {
        if (
          currentBatch.length &&
          (
            currentBatch.length >=
              translationBatchMaxTexts ||
            currentCharacters + text.length >
              translationBatchMaxCharacters
          )
        ) {
          batches.push(currentBatch);
          currentBatch = [];
          currentCharacters = 0;
        }

        currentBatch.push(text);
        currentCharacters += text.length;
      });

      if (currentBatch.length) {
        batches.push(currentBatch);
      }

      return batches;
    }

    function decodeTranslatedText(value) {
      const decoder =
        document.createElement("textarea");

      decoder.innerHTML = String(value || "");
      return decoder.value;
    }

    function replaceTextNodeValue(
      node,
      translatedText,
      languageCode
    ) {
      const currentValue = String(
        node.nodeValue ||
        ""
      );
      const cleanValue = currentValue.trim();
      const cleanStart = currentValue.indexOf(
        cleanValue
      );
      const nextValue =
        currentValue.slice(0, cleanStart) +
        translatedText +
        currentValue.slice(
          cleanStart + cleanValue.length
        );

      node.nodeValue = nextValue;
      node.aucAtlasTranslationState = {
        language: languageCode,
        value: translatedText
      };
    }

    function requestTranslationBatch(
      languageCode,
      texts
    ) {
      return fetch("/api/translate", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language: languageCode,
          texts
        })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(
              "Could not translate this page."
            );
          }

          return response.json();
        })
        .then(function (data) {
          if (
            !Array.isArray(data.translations) ||
            data.translations.length !==
              texts.length
          ) {
            throw new Error(
              "The translation response was invalid."
            );
          }

          return data.translations;
        });
    }

    function translateDocument(languageCode) {
      if (languageCode === "en") {
        return;
      }

      if (translationInProgress) {
        translationQueued = true;
        return;
      }

      const entries =
        collectTranslationEntries();
      const texts = Array.from(
        entries.keys()
      );

      if (!texts.length) {
        return;
      }

      translationInProgress = true;
      languageToggle.setAttribute(
        "aria-busy",
        "true"
      );

      Promise.all(
        createTranslationBatches(texts).map(
          function (batch) {
            return requestTranslationBatch(
              languageCode,
              batch
            ).then(function (translations) {
              translations.forEach(
                function (
                  translatedText,
                  index
                ) {
                  const originalText =
                    batch[index];
                  const cleanTranslatedText =
                    decodeTranslatedText(
                      translatedText
                    );

                  if (!cleanTranslatedText) {
                    return;
                  }

                  (
                    entries.get(originalText) ||
                    []
                  ).forEach(function (node) {
                    replaceTextNodeValue(
                      node,
                      cleanTranslatedText,
                      languageCode
                    );
                  });
                }
              );
            });
          }
        )
      )
        .catch(function () {})
        .finally(function () {
          translationInProgress = false;
          languageToggle.removeAttribute(
            "aria-busy"
          );

          if (translationQueued) {
            translationQueued = false;
            translateDocument(languageCode);
          }
        });
    }

    function applySavedLanguage() {
      const savedLanguage =
        getSavedLanguage();

      if (savedLanguage === "en") {
        return;
      }

      document.documentElement.lang =
        savedLanguage;
      document.documentElement.dir =
        savedLanguage === "ar"
          ? "rtl"
          : "ltr";

      function startTranslation() {
        translateDocument(savedLanguage);

        window.setTimeout(function () {
          translateDocument(savedLanguage);
        }, 1200);

        window.setTimeout(function () {
          translateDocument(savedLanguage);
        }, 3500);
      }

      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          startTranslation,
          { once: true }
        );
      } else {
        startTranslation();
      }
    }

    function applyLanguage(languageCode) {
      if (
        supportedLanguageCodes.indexOf(
          languageCode
        ) === -1
      ) {
        return;
      }

      saveLanguage(languageCode);
      window.location.reload();
    }

    languageToggle.addEventListener("click", function (event) {
      event.stopPropagation();

      if (languagePanel.hidden) {
        openLanguagePanel();
      } else {
        closeLanguagePanel();
      }
    });

    document.querySelectorAll(".tcs-language-option").forEach(function (button) {
      button.addEventListener("click", function () {
        closeLanguagePanel();
        applyLanguage(button.dataset.tcsLanguage);
      });
    });

    document.addEventListener("click", function (event) {
      const mobileLanguageButton = event.target.closest ? event.target.closest("#tcs-mobile-language-button") : null;
      const mobileLanguageOption = event.target.closest ? event.target.closest("[data-tcs-mobile-language]") : null;

      if (mobileLanguageButton) {
        event.preventDefault();
        closeLanguagePanel();
        showLanguageNavPanel();
        return;
      }

      if (mobileLanguageOption) {
        event.preventDefault();
        closeLanguagePanel();
        closeNavMenu();
        applyLanguage(mobileLanguageOption.dataset.tcsMobileLanguage);
        return;
      }

      if (!languageSwitcher.contains(event.target)) {
        closeLanguagePanel();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeLanguagePanel();
      }
    });

    applySavedLanguage();
  }

  setupLanguageSwitcher();

  const headerStyles = document.createElement("style");
  headerStyles.textContent = `
    :where(
      button,
      [role="button"],
      input[type="button"],
      input[type="submit"],
      input[type="reset"]
    ) {
      -webkit-tap-highlight-color: transparent;
      transition:
        color 0.2s ease,
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        opacity 0.2s ease,
        transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }

    :where(
      button,
      [role="button"],
      input[type="button"],
      input[type="submit"],
      input[type="reset"]
    ):not([class*="backdrop"]):not(:disabled):not([aria-disabled="true"]):active {
      transform: translateY(1px) scale(0.98);
    }

    @media (prefers-reduced-motion: reduce) {
      :where(
        button,
        [role="button"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"]
      ) {
        transition-duration: 0.01ms !important;
      }
    }

    .site-header {
      position: fixed;
      top: 22px;
      left: 50%;
      z-index: 90;
      width: min(1120px, calc(100% - 48px));
      min-height: 62px;
      padding: 0 14px 0 24px;
      border-radius: 999px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.12);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      transform: translateX(-50%);
      display: grid;
      grid-template-columns: minmax(160px, 1fr) auto minmax(160px, 1fr);
      align-items: center;
      gap: 24px;
    }

    .site-header-logo,
    .site-header-logo:visited {
      position: relative;
      justify-self: start;
      min-width: 88px;
      min-height: 34px;
      padding: 6px 0;
      box-sizing: border-box;
      color: #171717;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-decoration: none;
      white-space: nowrap;
      display: inline-flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
      overflow: hidden;
      isolation: isolate;
    }

    .site-header-logo::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 32px;
      height: 32px;
      background: url("logo.svg") center / contain no-repeat;
      opacity: 0;
      filter: drop-shadow(0 10px 18px rgba(42, 32, 20, 0.18));
      transform: translate(-50%, -50%) scale(0.18) rotate(-28deg);
      transition: opacity 0.28s ease, transform 0.42s cubic-bezier(0.2, 0.9, 0.2, 1.2);
    }

    .site-header-logo-auc,
    .site-header-logo-atlas {
      display: inline-flex;
      align-items: center;
      line-height: 1;
      transform-origin: center;
      transition: opacity 0.24s ease, filter 0.24s ease, transform 0.36s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .site-header-logo-auc {
      color: rgba(192, 154, 92, 0.84);
      font-size: 14px;
    }

    .site-header-logo-atlas {
      color: #171717;
      font-size: 22px;
    }

    .site-header-logo:hover .site-header-logo-auc,
    .site-header-logo:focus-visible .site-header-logo-auc {
      opacity: 0;
      filter: blur(6px);
      transform: translateX(22px) scale(0.15) rotate(24deg);
    }

    .site-header-logo:hover .site-header-logo-atlas,
    .site-header-logo:focus-visible .site-header-logo-atlas {
      opacity: 0;
      filter: blur(6px);
      transform: translateX(-20px) scale(0.15) rotate(-20deg);
    }

    .site-header-logo:hover::after,
    .site-header-logo:focus-visible::after {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }

    .site-header-nav {
      grid-column: 2;
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 34px;
    }

    .site-header-nav > a,
    .site-header-nav > a:visited {
      color: rgba(23, 23, 23, 0.62);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s ease, opacity 0.2s ease;
    }

    .site-header-nav > a:hover {
      color: #171717;
    }

    .site-header-actions {
      grid-column: 3;
      justify-self: end;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .site-notification-button,
    .site-notification-button:visited {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 999px;
      color: #171717;
      text-decoration: none;
      display: grid;
      place-items: center;
      transition:
        background 0.2s ease,
        opacity 0.2s ease,
        transform 0.2s ease;
    }

    .site-notification-button:hover {
      background: rgba(192, 154, 92, 0.12);
      transform: translateY(-1px);
    }

    .site-notification-button:focus-visible {
      outline: 3px solid rgba(192, 154, 92, 0.32);
      outline-offset: 2px;
    }

    .site-notification-button img {
      width: 22px;
      height: 22px;
      object-fit: contain;
      display: block;
    }

    .site-notification-badge {
      position: absolute;
      top: -2px;
      right: -3px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border: 2px solid #ffffff;
      border-radius: 999px;
      background: #ad2525;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      line-height: 14px;
      text-align: center;
    }

    .floating-account-widget {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .floating-account-button {
      width: 42px;
      height: 42px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .floating-account-button img {
      width: 24px;
      height: 24px;
      display: block;
      object-fit: contain;
    }

    .floating-account-button img.has-profile-photo {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      object-fit: cover;
      background: rgba(192, 154, 92, 0.14);
    }

    .floating-account-button:hover {
      opacity: 0.72;
      transform: translateY(-1px);
    }

    .floating-account-menu {
      position: absolute;
      top: 52px;
      right: 0;
      min-width: 238px;
      padding: 8px;
      border-radius: 18px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.16);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      display: grid;
      gap: 4px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px) scale(0.98);
      transform-origin: top right;
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
    }

    .floating-account-menu.is-open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .floating-account-menu[hidden],
    .floating-account-menu-link[hidden] {
      display: none;
    }

    .floating-account-menu-link,
    .floating-account-menu-link:visited {
      width: 100%;
      min-height: 38px;
      padding: 0 13px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.68);
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-align: left;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
    }

    .floating-account-menu-link:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .floating-account-menu-link img,
    .floating-account-menu-icon {
      width: 16px;
      height: 16px;
      display: block;
      object-fit: contain;
      opacity: 0.68;
      transition: opacity 0.2s ease;
    }

    .floating-account-menu-icon {
      flex: 0 0 16px;
      color: inherit;
      background: currentColor;
    }

    .floating-account-menu-link:hover img,
    .floating-account-menu-link:hover .floating-account-menu-icon {
      opacity: 1;
    }

    .floating-degree-icon {
      position: relative;
      background: transparent;
    }

    .floating-degree-icon::before {
      content: "";
      position: absolute;
      inset: 2px;
      border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      border-radius: 0 0 0 3px;
    }

    .floating-degree-icon::after {
      content: "";
      position: absolute;
      left: 5px;
      bottom: 4px;
      width: 3px;
      height: 8px;
      border-radius: 999px;
      background: currentColor;
      box-shadow: 5px -3px 0 currentColor, 10px -7px 0 currentColor;
    }

    .floating-reviews-icon {
      -webkit-mask: url("support-icon.png") center / contain no-repeat;
      mask: url("support-icon.png") center / contain no-repeat;
    }

    .floating-account-logout {
      color: #c73636;
    }

    .floating-logout-icon {
      width: 16px;
      height: 16px;
      display: block;
      background: currentColor;
      opacity: 0.95;
      transition: opacity 0.2s ease;
      -webkit-mask: url("logout-icon.png") center / contain no-repeat;
      mask: url("logout-icon.png") center / contain no-repeat;
    }

    .floating-account-logout:hover {
      color: #a91515;
    }

    .floating-account-logout:hover .floating-logout-icon {
      opacity: 1;
    }

    .hamburger-toggle {
      display: none;
      border: 0;
      background: transparent;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      gap: 5px;
      flex-direction: column;
    }

    .hamburger-toggle span {
      width: 18px;
      height: 2px;
      border-radius: 999px;
      background: #171717;
      display: block;
    }

    .nav-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      padding: 82px 14px 14px;
      background: rgba(23, 23, 23, 0.18);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }

    body.nav-menu-open .nav-menu-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .nav-menu-panel {
      padding: 18px;
      border-radius: 24px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.16);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      display: none;
    }

    .nav-menu-panel.active {
      display: block;
    }

    .nav-menu-links {
      display: grid;
      gap: 8px;
    }

    .nav-menu-link,
    .nav-menu-link:visited,
    .nav-menu-button {
      width: 100%;
      min-height: 48px;
      padding: 0 14px;
      border: 0;
      border-radius: 16px;
      background: transparent;
      color: rgba(23, 23, 23, 0.68);
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-align: left;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .nav-menu-link:hover,
    .nav-menu-button:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    @media (max-width: 900px) {
      body.nav-menu-open {
        overflow: hidden;
      }

      .site-header {
        top: 14px;
        left: 14px;
        right: 14px;
        z-index: 1002;
        width: auto;
        height: 54px;
        min-height: 54px;
        padding: 0 10px;
        transform: none;
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr) 92px;
        align-items: center;
        gap: 0;
      }

      .site-header-nav {
        display: none;
      }

      .site-header-logo,
      .site-header-logo:visited {
        grid-column: 2;
        justify-self: center;
        min-width: 88px;
        display: inline-flex;
        overflow: hidden;
        text-align: center;
      }

      .site-header-actions {
        grid-column: 3;
        justify-self: end;
        gap: 2px;
        display: flex;
      }

      .site-header-gpa {
        display: none;
      }

      .site-header-user,
      .site-header-user:visited,
      .floating-account-button {
        width: 44px;
        height: 44px;
      }

      .floating-account-menu {
        right: -4px;
        max-width: calc(100vw - 28px);
        max-height: calc(100dvh - 90px);
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .floating-account-menu-link {
        min-height: 44px;
      }

      .hamburger-toggle {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        justify-self: start;
        width: 44px;
        height: 44px;
      }

      .nav-menu-overlay {
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .nav-menu-panel {
        max-height: calc(100dvh - 96px);
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .auth-section {
        min-height: calc(100dvh - 88px);
      }

      .auth-password-input-wrap input {
        padding-right: 62px;
      }

      .auth-password-visibility-toggle {
        right: 4px;
        width: 44px;
        height: 44px;
      }

      .auth-two-factor-panel {
        padding: 12px;
        overflow-y: auto;
        align-items: flex-start;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .auth-two-factor-card {
        max-height: calc(100dvh - 24px);
        overflow-y: auto;
        overscroll-behavior: contain;
      }
    }
  `;

  document.head.appendChild(headerStyles);

  headerRoot.outerHTML = `
<header class="site-header">
  <a href="index.html" class="site-header-logo"><span class="site-header-logo-auc">AUC</span><span class="site-header-logo-atlas">Atlas</span></a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="professors.html">Professors</a>
    <a href="courses.html">Courses</a>
    <a href="gpa-calculator.html">GPA Calculator</a>
  </nav>

  <div class="site-header-actions">
    <a class="site-notification-button" id="site-notification-button" href="notifications.html" aria-label="Notifications">
      <img src="bell.png" alt="">
      <span class="site-notification-badge" id="site-notification-badge" hidden>0</span>
    </a>

    <div class="floating-account-widget" id="floating-account-widget">
      <button class="floating-account-button" id="floating-account-button" type="button" aria-label="Open account menu" aria-expanded="false">
        <img src="user.png" alt="Account" id="floating-account-photo">
      </button>

      <div class="floating-account-menu" id="floating-account-menu" hidden>
        <a href="login.html" class="floating-account-menu-link" id="floating-login-link">
          <img src="user.png" alt="">
          <span>Login</span>
        </a>

        <a href="accounts.html" class="floating-account-menu-link" id="floating-account-link" hidden>
          <img src="user.png" alt="">
          <span>Account</span>
        </a>

        <a href="degree-progression.html" class="floating-account-menu-link" id="floating-degree-link" hidden>
          <span class="floating-account-menu-icon floating-degree-icon" aria-hidden="true"></span>
          <span>Degree Progression</span>
        </a>

        <a href="accounts.html#reviews" class="floating-account-menu-link" id="floating-reviews-link" hidden>
          <span class="floating-account-menu-icon floating-reviews-icon" aria-hidden="true"></span>
          <span>Activity History</span>
        </a>

        <button class="floating-account-menu-link floating-account-logout" id="floating-logout-button" type="button" hidden>
          <span class="floating-logout-icon" aria-hidden="true"></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>

  <button class="hamburger-toggle" type="button" aria-label="Open menu" aria-expanded="false">
    <span></span>
    <span></span>
    <span></span>
  </button>
</header>

<div class="nav-menu-overlay" aria-hidden="true">
  <div class="nav-menu-panel nav-menu-main active">
    <div class="nav-menu-links">
      <a href="professors.html" class="nav-menu-link">Professors</a>
      <a href="courses.html" class="nav-menu-link">Courses</a>
      <a href="gpa-calculator.html" class="nav-menu-link">GPA Calculator</a>
      <button class="nav-menu-button" id="tcs-mobile-language-button" type="button">Language</button>
    </div>
  </div>

  <div class="nav-menu-panel nav-menu-language">
    <div class="nav-menu-links">
      <button class="nav-menu-button" type="button" data-tcs-mobile-language="en"><span class="tcs-language-flag" aria-hidden="true"><img src="united-states.png" alt=""></span><span>English</span></button>
      <button class="nav-menu-button" type="button" data-tcs-mobile-language="ar"><span class="tcs-language-flag" aria-hidden="true"><img src="egypt.png" alt=""></span><span>Arabic</span></button>
      <button class="nav-menu-button" type="button" data-tcs-mobile-language="fr"><span class="tcs-language-flag" aria-hidden="true"><img src="france.png" alt=""></span><span>French</span></button>
      <button class="nav-menu-button" type="button" data-tcs-mobile-language="de"><span class="tcs-language-flag" aria-hidden="true"><img src="germany.png" alt=""></span><span>German</span></button>
      <button class="nav-menu-button" type="button" data-tcs-mobile-language="es"><span class="tcs-language-flag" aria-hidden="true"><img src="spain.png" alt=""></span><span>Spanish</span></button>
    </div>
  </div>
</div>
`;

  const menuButton = document.querySelector(".hamburger-toggle");
  const menuOverlay = document.querySelector(".nav-menu-overlay");
  const menuLinks = document.querySelectorAll(".nav-menu-link");
  const notificationButton = document.getElementById("site-notification-button");
  const notificationBadge = document.getElementById("site-notification-badge");
  const accountButton = document.getElementById("floating-account-button");
  const accountPhoto = document.getElementById("floating-account-photo");
  const accountMenu = document.getElementById("floating-account-menu");
  const loginLink = document.getElementById("floating-login-link");
  const accountLink = document.getElementById("floating-account-link");
  const degreeLink = document.getElementById("floating-degree-link");
  const reviewsLink = document.getElementById("floating-reviews-link");
  const logoutButton = document.getElementById("floating-logout-button");

  function setActiveNavPanel(panelSelector) {
    document.querySelectorAll(".nav-menu-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.matches(panelSelector));
    });
  }

  function showMainNavPanel() {
    setActiveNavPanel(".nav-menu-main");
  }

  function showLanguageNavPanel() {
    setActiveNavPanel(".nav-menu-language");
  }

  function closeNavMenu() {
    document.body.classList.remove("nav-menu-open");

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }

    if (menuOverlay) {
      menuOverlay.setAttribute("aria-hidden", "true");
    }

    showMainNavPanel();
  }

  function closeAccountMenu() {
    if (!accountButton || !accountMenu) {
      return;
    }

    accountButton.setAttribute("aria-expanded", "false");
    accountMenu.classList.remove("is-open");

    window.setTimeout(function () {
      if (!accountMenu.classList.contains("is-open")) {
        accountMenu.hidden = true;
      }
    }, 180);
  }

  function openAccountMenu() {
    if (!accountButton || !accountMenu) {
      return;
    }

    accountMenu.hidden = false;
    accountButton.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(function () {
      accountMenu.classList.add("is-open");
    });
  }

  function clearLocalSignedInFlags() {
    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
      sessionStorage.removeItem("auc-atlas-signed-in");
      sessionStorage.removeItem("aucAtlasSignedIn");
    } catch (error) {}
  }

  function saveLocalSignedInFlags() {
    try {
      localStorage.setItem("auc-atlas-signed-in", "1");
      localStorage.setItem("aucAtlasSignedIn", "true");
    } catch (error) {}
  }

  function setAccountPhoto(photoURL) {
    const safePhotoURL = String(photoURL || "").trim();

    if (!accountPhoto) {
      return;
    }

    if (safePhotoURL) {
      accountPhoto.src = safePhotoURL;
      accountPhoto.alt = "Account profile photo";
      accountPhoto.classList.add("has-profile-photo");
      return;
    }

    accountPhoto.src = "user.png";
    accountPhoto.alt = "Account";
    accountPhoto.classList.remove("has-profile-photo");
  }

  function showLoggedOutAccountState() {
    window.aucAtlasCurrentUser = null;
    setAccountPhoto("");

    if (loginLink) {
      loginLink.hidden = false;
    }

    if (accountLink) {
      accountLink.hidden = true;
    }

    if (degreeLink) {
      degreeLink.hidden = true;
    }

    if (reviewsLink) {
      reviewsLink.hidden = true;
    }

    if (logoutButton) {
      logoutButton.hidden = true;
    }
  }

  function showLoggedInAccountState(user) {
    window.aucAtlasCurrentUser = user || window.aucAtlasCurrentUser || {};
    saveLocalSignedInFlags();
    setAccountPhoto((user || {}).photoURL || "");

    if (loginLink) {
      loginLink.hidden = true;
    }

    if (accountLink) {
      accountLink.hidden = false;
    }

    if (degreeLink) {
      degreeLink.hidden = false;
    }

    if (reviewsLink) {
      reviewsLink.hidden = false;
    }

    if (logoutButton) {
      logoutButton.hidden = false;
    }
  }

  async function loadAccountState() {
    try {
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (response.ok && data.signedIn && data.user) {
        showLoggedInAccountState(data.user);
        return data.user;
      }
    } catch (error) {}

    clearLocalSignedInFlags();
    showLoggedOutAccountState();
    return null;
  }

  const notificationReadStorageKey =
    "auc-atlas-read-notifications";
  const notificationSummaryStorageKey =
    "auc-atlas-notification-summary";
  const notificationSummaryCacheDurationMs =
    30 * 60 * 1000;
  const isNotificationsPage =
    /\/notifications(?:\.html)?\/?$/.test(
      window.location.pathname
    );

  function getLocalReadNotificationIds() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          notificationReadStorageKey
        ) || "[]"
      );

      return new Set(
        Array.isArray(saved)
          ? saved.filter(function (id) {
              return (
                typeof id === "string" &&
                id.length <= 180
              );
            })
          : []
      );
    } catch (error) {
      return new Set();
    }
  }

  function getCachedNotificationSummary() {
    try {
      const cached = JSON.parse(
        sessionStorage.getItem(
          notificationSummaryStorageKey
        ) || "null"
      );

      if (
        !cached ||
        !cached.data ||
        typeof cached.data !== "object" ||
        Date.now() -
          Number(cached.savedAt || 0) >
          notificationSummaryCacheDurationMs
      ) {
        return null;
      }

      return cached.data;
    } catch (error) {
      return null;
    }
  }

  function cacheNotificationSummary(data) {
    try {
      sessionStorage.setItem(
        notificationSummaryStorageKey,
        JSON.stringify({
          savedAt: Date.now(),
          data
        })
      );
    } catch (error) {
      // Session storage is unavailable.
    }
  }

  function clearNotificationSummaryCache() {
    try {
      sessionStorage.removeItem(
        notificationSummaryStorageKey
      );
    } catch (error) {
      // Session storage is unavailable.
    }
  }

  function setNotificationBadge(count) {
    if (
      !notificationButton ||
      !notificationBadge
    ) {
      return;
    }

    const safeCount = Math.max(
      0,
      Math.floor(Number(count) || 0)
    );

    notificationBadge.textContent =
      safeCount > 99
        ? "99+"
        : String(safeCount);
    notificationBadge.hidden =
      safeCount === 0;
    notificationButton.setAttribute(
      "aria-label",
      safeCount
        ? "Notifications, " +
          safeCount +
          " unread"
        : "Notifications"
    );
  }

  async function loadNotificationState(
    options
  ) {
    const settings = options || {};

    try {
      let data = settings.force
        ? null
        : getCachedNotificationSummary();

      if (!data) {
        const response = await fetch(
          "/api/notifications?summary=1",
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Could not load notifications."
          );
        }

        cacheNotificationSummary(data);
      }

      const notificationIds =
        Array.isArray(
          data.notificationIds
        )
          ? data.notificationIds.filter(
              function (id) {
                return (
                  typeof id === "string" &&
                  id.length <= 180
                );
              }
            )
          : [];
      const localReadNotificationIds =
        getLocalReadNotificationIds();
      const unreadCount = data.signedIn
        ? Math.max(
            0,
            Number(data.unreadCount) || 0
          )
        : notificationIds.filter(
            function (id) {
              return !localReadNotificationIds.has(
                id
              );
            }
          ).length;

      setNotificationBadge(
        unreadCount
      );
    } catch (error) {
      setNotificationBadge(0);
    }
  }

  if (!isNotificationsPage) {
    loadNotificationState();
  }

  window.addEventListener(
    "aucAtlasNotificationsUpdated",
    function () {
      clearNotificationSummaryCache();

      if (!isNotificationsPage) {
        loadNotificationState({
          force: true
        });
      }
    }
  );

  window.addEventListener(
    "storage",
    function (event) {
      if (
        event.key ===
        notificationReadStorageKey
      ) {
        clearNotificationSummaryCache();

        if (!isNotificationsPage) {
          loadNotificationState({
            force: true
          });
        }
      }
    }
  );

  if (menuButton && menuOverlay) {
    menuButton.addEventListener("click", function () {
      const menuIsOpen = document.body.classList.toggle("nav-menu-open");
      menuButton.setAttribute("aria-expanded", String(menuIsOpen));
      menuOverlay.setAttribute("aria-hidden", String(!menuIsOpen));
      showMainNavPanel();
      closeAccountMenu();
    });

    menuOverlay.addEventListener("click", function (event) {
      if (event.target === menuOverlay) {
        closeNavMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeNavMenu);
    });
  }

  if (accountButton && accountMenu) {
    loadAccountState();

    accountButton.addEventListener("click", function (event) {
      event.stopPropagation();
      loadAccountState();

      if (accountMenu.hidden || !accountMenu.classList.contains("is-open")) {
        openAccountMenu();
      } else {
        closeAccountMenu();
      }
    });

    if (loginLink) {
      loginLink.addEventListener("click", closeAccountMenu);
    }

    if (accountLink) {
      accountLink.addEventListener("click", closeAccountMenu);
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        logoutButton.disabled = true;

        await fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }).catch(function () {});

        clearLocalSignedInFlags();
        showLoggedOutAccountState();
        closeAccountMenu();
        logoutButton.disabled = false;
        window.location.href = "index.html";
      });
    }

    document.addEventListener("click", function (event) {
      if (!accountMenu.contains(event.target) && event.target !== accountButton) {
        closeAccountMenu();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNavMenu();
      closeAccountMenu();
    }
  });
})();
