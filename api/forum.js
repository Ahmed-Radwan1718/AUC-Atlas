const {
  ensureAdminUser
} = require("../server/_lib/adminHelpers");

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function renderAccessPage(statusCode) {
  const heading = statusCode === 401
    ? "Sign in required"
    : "Administrator access required";
  const message = statusCode === 401
    ? "Sign in with an administrator account to open the forum demo."
    : "This forum preview is currently available only to AUC Atlas administrators.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forum Access | AUC Atlas</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      padding: 28px;
      background:
        linear-gradient(
          180deg,
          rgba(192, 154, 92, 0.16),
          rgba(247, 244, 238, 0) 380px
        ),
        #f7f4ee;
      color: #171717;
      font-family: Arial, sans-serif;
      display: grid;
      place-items: center;
    }

    .access-card {
      width: min(620px, 100%);
      padding: 38px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 28px 80px rgba(42, 32, 20, 0.12);
      text-align: center;
    }

    .access-kicker {
      margin: 0 0 14px;
      color: rgba(192, 154, 92, 0.94);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 14px;
      font-size: clamp(32px, 6vw, 52px);
      line-height: 1.04;
      text-transform: uppercase;
    }

    p {
      margin: 0;
      color: rgba(23, 23, 23, 0.64);
      font-size: 15px;
      line-height: 1.7;
    }

    a {
      min-height: 48px;
      margin-top: 24px;
      padding: 0 22px;
      border-radius: 999px;
      background: #171717;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-decoration: none;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <main class="access-card">
    <p class="access-kicker">Restricted preview</p>
    <h1>${heading}</h1>
    <p>${message}</p>
    <a href="/admin.html">Open Admin Dashboard</a>
  </main>
</body>
</html>`;
}

function renderForumPage(actor) {
  const forumAdmin = safeJson({
    uid: actor.uid,
    displayName:
      actor.displayName || "AUC Atlas Admin"
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>Community Forum Demo | AUC Atlas</title>
  <link
    rel="icon"
    type="image/svg+xml"
    href="/favicon.svg"
  >

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f7f4ee;
      color: #171717;
    }

    body.modal-open {
      overflow: hidden;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    [hidden] {
      display: none !important;
    }

    .forum-page {
      min-height: 100vh;
      padding: 132px 0 92px;
      background:
        linear-gradient(
          180deg,
          rgba(192, 154, 92, 0.14),
          rgba(247, 244, 238, 0) 380px
        ),
        #f7f4ee;
    }

    .forum-inner {
      width: min(1360px, calc(100% - 32px));
      margin: 0 auto;
    }

    .forum-hero {
      margin: 0 auto 28px;
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        minmax(310px, 440px);
      gap: 34px;
      align-items: end;
    }

    .forum-kicker,
    .panel-kicker {
      margin-bottom: 12px;
      color: rgba(192, 154, 92, 0.94);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      line-height: 1.4;
      text-transform: uppercase;
    }

    .forum-hero h1 {
      max-width: 760px;
      color: #171717;
      font-size: clamp(36px, 5vw, 66px);
      font-weight: 600;
      line-height: 1.03;
      text-transform: uppercase;
    }

    .forum-hero-side {
      display: grid;
      justify-items: end;
      gap: 18px;
    }

    .forum-hero-copy {
      color: rgba(23, 23, 23, 0.66);
      font-size: 16px;
      line-height: 1.65;
      text-align: right;
    }

    .primary-button,
    .secondary-button,
    .text-button {
      min-height: 48px;
      padding: 0 20px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition:
        transform 0.18s ease,
        background 0.18s ease,
        border-color 0.18s ease;
    }

    .primary-button {
      border: 1px solid
        rgba(192, 154, 92, 0.9);
      background: rgba(192, 154, 92, 0.9);
      color: #fff;
    }

    .primary-button:hover,
    .primary-button:focus-visible {
      border-color: #171717;
      background: #171717;
      transform: translateY(-1px);
    }

    .secondary-button,
    .text-button {
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.74);
      color: rgba(23, 23, 23, 0.68);
    }

    .secondary-button:hover,
    .text-button:hover {
      border-color: rgba(192, 154, 92, 0.34);
      color: #171717;
    }

    .forum-demo-notice {
      min-height: 62px;
      margin-bottom: 20px;
      padding: 10px 12px 10px 22px;
      border: 1px solid
        rgba(192, 154, 92, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .forum-demo-notice p {
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      line-height: 1.5;
    }

    .forum-demo-notice strong {
      color: #171717;
    }

    .admin-preview-badge,
    .post-badge,
    .post-stat,
    .detail-author-badge {
      padding: 7px 10px;
      border: 1px solid
        rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.82);
      color: rgba(23, 23, 23, 0.62);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .admin-preview-badge,
    .post-badge.is-gold,
    .detail-author-badge {
      border-color: rgba(192, 154, 92, 0.28);
      background: rgba(192, 154, 92, 0.13);
      color: rgba(126, 86, 26, 0.96);
    }

    .forum-layout {
      display: grid;
      grid-template-columns:
        236px
        minmax(0, 1fr)
        270px;
      gap: 20px;
      align-items: start;
    }

    .forum-panel,
    .forum-toolbar,
    .post-card,
    .forum-empty {
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.76);
      box-shadow:
        0 22px 60px
        rgba(42, 32, 20, 0.09);
    }

    .forum-panel {
      padding: 14px;
      border-radius: 26px;
    }

    .forum-panel.is-sticky {
      position: sticky;
      top: 112px;
    }

    .forum-panel h2 {
      padding: 10px 12px 12px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .category-list {
      display: grid;
      gap: 5px;
    }

    .category-button {
      width: 100%;
      min-height: 44px;
      padding: 0 12px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.62);
      font-size: 11px;
      font-weight: 700;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .category-button:hover,
    .category-button.active {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .category-count {
      min-width: 24px;
      color: rgba(23, 23, 23, 0.46);
      font-size: 10px;
      text-align: right;
    }

    .forum-feed {
      min-width: 0;
    }

    .forum-toolbar {
      margin-bottom: 14px;
      padding: 10px;
      border-radius: 26px;
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        180px;
      gap: 10px;
    }

    .forum-toolbar input,
    .forum-toolbar select,
    .form-field input,
    .form-field select,
    .form-field textarea,
    .reply-form textarea {
      width: 100%;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 18px;
      background: rgba(247, 244, 238, 0.72);
      color: #171717;
      outline: none;
    }

    .forum-toolbar input,
    .forum-toolbar select,
    .form-field input,
    .form-field select {
      min-height: 48px;
      padding: 0 16px;
    }

    .forum-toolbar input:focus,
    .forum-toolbar select:focus,
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus,
    .reply-form textarea:focus {
      border-color:
        rgba(192, 154, 92, 0.58);
      box-shadow:
        0 0 0 4px
        rgba(192, 154, 92, 0.12);
    }

    .feed-summary {
      margin: 0 0 12px;
      padding: 0 4px;
      color: rgba(23, 23, 23, 0.52);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .post-list {
      display: grid;
      gap: 12px;
    }

    .post-card {
      padding: 22px;
      border-radius: 24px;
      transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;
    }

    .post-card:hover {
      border-color: rgba(192, 154, 92, 0.32);
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }

    .post-card-top,
    .post-card-footer,
    .post-meta,
    .post-badges,
    .post-actions,
    .detail-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .post-card-top,
    .post-card-footer {
      justify-content: space-between;
    }

    .post-title-button {
      width: 100%;
      margin: 15px 0 9px;
      border: 0;
      background: transparent;
      color: #171717;
      font-size: 21px;
      font-weight: 700;
      line-height: 1.18;
      text-align: left;
    }

    .post-title-button:hover {
      color: rgba(126, 86, 26, 0.96);
    }

    .post-preview {
      margin-bottom: 18px;
      color: rgba(23, 23, 23, 0.64);
      font-size: 14px;
      line-height: 1.65;
    }

    .post-author,
    .post-time {
      color: rgba(23, 23, 23, 0.5);
      font-size: 11px;
      font-weight: 700;
    }

    .like-button {
      min-height: 36px;
      padding: 0 12px;
      border: 1px solid
        rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.76);
      color: rgba(23, 23, 23, 0.6);
      font-size: 10px;
      font-weight: 800;
    }

    .like-button.active {
      border-color: rgba(192, 154, 92, 0.32);
      background: rgba(192, 154, 92, 0.14);
      color: rgba(126, 86, 26, 0.98);
    }

    .forum-empty {
      padding: 34px;
      border-radius: 24px;
      text-align: center;
    }

    .forum-empty h3 {
      margin-bottom: 8px;
      font-size: 20px;
    }

    .forum-empty p,
    .side-copy,
    .rule-list,
    .trend-item p {
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      line-height: 1.65;
    }

    .side-section + .side-section {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid
        rgba(23, 23, 23, 0.08);
    }

    .side-section h3 {
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .rule-list {
      padding-left: 18px;
      display: grid;
      gap: 7px;
    }

    .trending-list {
      display: grid;
      gap: 9px;
    }

    .trend-item {
      width: 100%;
      padding: 12px;
      border: 0;
      border-radius: 16px;
      background: rgba(247, 244, 238, 0.72);
      text-align: left;
    }

    .trend-item strong {
      font-size: 12px;
      line-height: 1.4;
      display: block;
    }

    .text-button {
      margin-top: 12px;
    }

    .modal {
      position: fixed;
      inset: 0;
      z-index: 2500;
      padding: 24px;
      background: rgba(23, 23, 23, 0.38);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: grid;
      place-items: center;
      overflow-y: auto;
    }

    .modal-card {
      width: min(720px, 100%);
      max-height: calc(100dvh - 48px);
      overflow-y: auto;
      padding: 28px;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 28px;
      background: rgba(255, 253, 248, 0.98);
      box-shadow:
        0 34px 100px
        rgba(23, 23, 23, 0.24);
    }

    .modal-card.is-wide {
      width: min(820px, 100%);
    }

    .modal-header {
      margin-bottom: 22px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }

    .modal-header h2 {
      font-size: clamp(26px, 4vw, 38px);
      line-height: 1.08;
      text-transform: uppercase;
    }

    .modal-close {
      flex: 0 0 auto;
      width: 42px;
      height: 42px;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 50%;
      background: rgba(247, 244, 238, 0.82);
      color: #171717;
      font-size: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-field {
      display: grid;
      gap: 8px;
    }

    .form-field.is-full {
      grid-column: 1 / -1;
    }

    .form-field label,
    .reply-form label {
      color: rgba(23, 23, 23, 0.62);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .form-field textarea,
    .reply-form textarea {
      min-height: 170px;
      padding: 15px 16px;
      resize: vertical;
      line-height: 1.55;
    }

    .checkbox-row {
      min-height: 46px;
      padding: 0 4px;
      color: rgba(23, 23, 23, 0.66);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .checkbox-row input {
      width: 18px;
      height: 18px;
      accent-color: rgba(192, 154, 92, 0.94);
    }

    .form-note {
      margin-top: 14px;
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(192, 154, 92, 0.11);
      color: rgba(23, 23, 23, 0.64);
      font-size: 12px;
      line-height: 1.6;
    }

    .form-actions {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .detail-heading {
      margin: 14px 0 12px;
      font-size: clamp(26px, 4vw, 40px);
      line-height: 1.12;
    }

    .detail-copy {
      margin: 20px 0;
      color: rgba(23, 23, 23, 0.72);
      font-size: 15px;
      line-height: 1.75;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .reply-section {
      margin-top: 26px;
      padding-top: 22px;
      border-top: 1px solid
        rgba(23, 23, 23, 0.1);
    }

    .reply-section h3 {
      margin-bottom: 14px;
      font-size: 18px;
    }

    .reply-list {
      display: grid;
      gap: 10px;
    }

    .reply-card {
      padding: 16px;
      border: 1px solid
        rgba(23, 23, 23, 0.08);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.72);
    }

    .reply-card header {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .reply-card strong {
      font-size: 12px;
    }

    .reply-card time {
      color: rgba(23, 23, 23, 0.46);
      font-size: 10px;
    }

    .reply-card p {
      color: rgba(23, 23, 23, 0.68);
      font-size: 13px;
      line-height: 1.65;
      white-space: pre-wrap;
    }

    .reply-form {
      margin-top: 16px;
      display: grid;
      gap: 10px;
    }

    .reply-form textarea {
      min-height: 110px;
    }

    .danger-button {
      color: #ad2525;
    }

    .toast {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 3000;
      max-width: min(380px, calc(100% - 48px));
      padding: 15px 18px;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 18px;
      background: #171717;
      box-shadow:
        0 24px 60px
        rgba(23, 23, 23, 0.26);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }

    @media (max-width: 1080px) {
      .forum-layout {
        grid-template-columns:
          220px
          minmax(0, 1fr);
      }

      .forum-right {
        grid-column: 1 / -1;
      }

      .forum-right .forum-panel {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .forum-right
      .side-section + .side-section {
        margin: 0;
        padding: 0;
        border: 0;
      }
    }

    @media (max-width: 760px) {
      .forum-page {
        padding-top: 112px;
      }

      .forum-hero,
      .forum-layout,
      .forum-toolbar,
      .form-grid,
      .forum-right .forum-panel {
        grid-template-columns: 1fr;
      }

      .forum-hero-side {
        justify-items: start;
      }

      .forum-hero-copy {
        text-align: left;
      }

      .forum-demo-notice {
        padding: 16px;
        border-radius: 22px;
        align-items: flex-start;
        flex-direction: column;
      }

      .forum-panel.is-sticky {
        position: static;
      }

      .category-list {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .category-button {
        border-radius: 16px;
      }

      .form-field.is-full {
        grid-column: auto;
      }

      .modal {
        padding: 10px;
        align-items: end;
      }

      .modal-card {
        max-height: calc(100dvh - 20px);
        padding: 22px;
        border-radius:
          24px 24px 18px 18px;
      }
    }

    @media (max-width: 470px) {
      .category-list {
        grid-template-columns: 1fr;
      }

      .post-card-footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div id="site-header-root"></div>

  <main class="forum-page">
    <div class="forum-inner">
      <section class="forum-hero">
        <div>
          <p class="forum-kicker">
            Student community
          </p>
          <h1>AUC Atlas Community</h1>
        </div>

        <div class="forum-hero-side">
          <p class="forum-hero-copy">
            Ask questions, share experiences,
            discuss campus life, and connect
            with the AUC community.
          </p>

          <button
            class="primary-button"
            id="open-composer"
            type="button"
          >
            Create Post
          </button>
        </div>
      </section>

      <section
        class="forum-demo-notice"
        aria-label="Demo status"
      >
        <p>
          <strong>
            Administrator-only demo.
          </strong>
          Posts and replies are saved only
          in this browser and are not
          published to Firestore.
        </p>

        <span class="admin-preview-badge">
          Admin preview
        </span>
      </section>

      <div class="forum-layout">
        <aside>
          <section class="forum-panel is-sticky">
            <h2>Categories</h2>
            <div
              class="category-list"
              id="category-list"
            ></div>
          </section>
        </aside>

        <section
          class="forum-feed"
          aria-label="Community posts"
        >
          <div class="forum-toolbar">
            <input
              id="forum-search"
              type="search"
              placeholder="Search discussions"
              aria-label="Search discussions"
            >

            <select
              id="forum-sort"
              aria-label="Sort discussions"
            >
              <option value="latest">
                Latest
              </option>
              <option value="popular">
                Popular
              </option>
              <option value="unanswered">
                Unanswered
              </option>
            </select>
          </div>

          <p
            class="feed-summary"
            id="feed-summary"
          ></p>

          <div
            class="post-list"
            id="post-list"
          ></div>
        </section>

        <aside class="forum-right">
          <section class="forum-panel is-sticky">
            <div class="side-section">
              <p class="panel-kicker">
                Previewing as
              </p>
              <h3 id="admin-name"></h3>
              <p class="side-copy">
                Only accounts configured
                through <strong>ADMIN_UIDS</strong>
                or the Firebase admin claim
                can open this page.
              </p>
            </div>

            <div class="side-section">
              <h3>Community rules</h3>
              <ol class="rule-list">
                <li>
                  Be respectful and helpful.
                </li>
                <li>
                  Do not expose private
                  information.
                </li>
                <li>
                  No cheating, scams,
                  harassment, or spam.
                </li>
                <li>
                  Use the closest matching
                  category.
                </li>
              </ol>
            </div>

            <div class="side-section">
              <h3>Trending now</h3>

              <div
                class="trending-list"
                id="trending-list"
              ></div>

              <button
                class="text-button danger-button"
                id="reset-demo"
                type="button"
              >
                Reset Demo Data
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>

  <div
    class="modal"
    id="composer-modal"
    hidden
  >
    <section
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <header class="modal-header">
        <div>
          <p class="panel-kicker">
            New discussion
          </p>
          <h2 id="composer-title">
            Create a post
          </h2>
        </div>

        <button
          class="modal-close"
          type="button"
          data-close-modal
          aria-label="Close"
        >
          &times;
        </button>
      </header>

      <form id="composer-form">
        <div class="form-grid">
          <div class="form-field">
            <label for="post-category">
              Category
            </label>
            <select
              id="post-category"
              required
            ></select>
          </div>

          <div class="form-field">
            <label for="post-tag">
              Optional tag
            </label>
            <input
              id="post-tag"
              maxlength="28"
              placeholder="Example: CSCE 1101"
            >
          </div>

          <div class="form-field is-full">
            <label for="post-title">
              Title
            </label>
            <input
              id="post-title"
              maxlength="120"
              required
              placeholder="What would you like to discuss?"
            >
          </div>

          <div class="form-field is-full">
            <label for="post-body">
              Post
            </label>
            <textarea
              id="post-body"
              maxlength="4000"
              required
              placeholder="Share enough context for other students to respond."
            ></textarea>
          </div>

          <label class="checkbox-row is-full">
            <input
              id="post-anonymous"
              type="checkbox"
            >
            Post anonymously in the
            community preview
          </label>
        </div>

        <p class="form-note">
          This demo stores content in your
          browser only. Anonymous posts still
          remain attributable to administrators
          in a future production moderation
          system.
        </p>

        <div class="form-actions">
          <button
            class="secondary-button"
            type="button"
            data-close-modal
          >
            Cancel
          </button>

          <button
            class="primary-button"
            type="submit"
          >
            Publish Demo Post
          </button>
        </div>
      </form>
    </section>
  </div>

  <div
    class="modal"
    id="detail-modal"
    hidden
  >
    <section
      class="modal-card is-wide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <header class="modal-header">
        <div>
          <p class="panel-kicker">
            Discussion
          </p>
          <span class="detail-author-badge">
            Admin preview
          </span>
        </div>

        <button
          class="modal-close"
          type="button"
          data-close-modal
          aria-label="Close"
        >
          &times;
        </button>
      </header>

      <div id="detail-content"></div>
    </section>
  </div>

  <div
    class="toast"
    id="forum-toast"
    hidden
  ></div>

  <script src="/site-header.js"></script>

  <script>
    window.aucAtlasForumAdmin =
      ${forumAdmin};

    (function () {
      var STORAGE_KEY =
        "auc-atlas-forum-demo-v1";

      var categories = [
        "Academics & Courses",
        "Registration & Professors",
        "Campus Life",
        "Clubs & Events",
        "Opportunities",
        "Buy, Sell & Exchange",
        "Housing & Transportation",
        "Technology & Gaming",
        "General Discussion"
      ];

      var admin =
        window.aucAtlasForumAdmin || {};

      var state = {
        posts: [],
        category: "All Discussions",
        search: "",
        sort: "latest",
        activePostId: ""
      };

      var toastTimer = 0;

      var categoryList =
        document.getElementById(
          "category-list"
        );

      var postList =
        document.getElementById(
          "post-list"
        );

      var feedSummary =
        document.getElementById(
          "feed-summary"
        );

      var searchInput =
        document.getElementById(
          "forum-search"
        );

      var sortInput =
        document.getElementById(
          "forum-sort"
        );

      var composerModal =
        document.getElementById(
          "composer-modal"
        );

      var detailModal =
        document.getElementById(
          "detail-modal"
        );

      var composerForm =
        document.getElementById(
          "composer-form"
        );

      var postCategory =
        document.getElementById(
          "post-category"
        );

      var detailContent =
        document.getElementById(
          "detail-content"
        );

      var trendingList =
        document.getElementById(
          "trending-list"
        );

      var toast =
        document.getElementById(
          "forum-toast"
        );

      function createSeedPosts() {
        var now = Date.now();

        return [
          {
            id: "demo-registration",
            category:
              "Registration & Professors",
            tag: "Fall registration",
            title:
              "What is your best strategy for building a balanced schedule?",
            body:
              "I am testing a schedule with two demanding major courses and two core requirements. How do you normally balance workload, gaps, and instructor preferences?",
            author: "AUC Atlas Admin",
            createdAt:
              new Date(
                now - 42 * 60 * 1000
              ).toISOString(),
            likes: 14,
            liked: false,
            views: 86,
            pinned: true,
            solved: false,
            replies: [
              {
                id:
                  "reply-registration-1",
                author: "Demo Student",
                body:
                  "I start with the fixed major courses, then use core requirements to avoid having three heavy days in a row.",
                createdAt:
                  new Date(
                    now - 24 * 60 * 1000
                  ).toISOString()
              }
            ]
          },
          {
            id: "demo-clubs",
            category: "Clubs & Events",
            tag: "New students",
            title:
              "Which student clubs are welcoming new members this semester?",
            body:
              "Share clubs, communities, and upcoming events that would be helpful for students who want to meet people and try something new.",
            author: "Anonymous",
            createdAt:
              new Date(
                now - 3 * 60 * 60 * 1000
              ).toISOString(),
            likes: 9,
            liked: false,
            views: 53,
            pinned: false,
            solved: false,
            replies: []
          },
          {
            id: "demo-course",
            category:
              "Academics & Courses",
            tag: "CSCE 1101",
            title:
              "Study-group planning for introductory programming",
            body:
              "Would anyone be interested in a weekly study group focused on practice, explaining concepts, and reviewing mistakes without sharing graded solutions?",
            author: "AUC Atlas Admin",
            createdAt:
              new Date(
                now - 7 * 60 * 60 * 1000
              ).toISOString(),
            likes: 21,
            liked: false,
            views: 124,
            pinned: false,
            solved: true,
            replies: [
              {
                id: "reply-course-1",
                author: "Demo Student",
                body:
                  "A weekly session before the lab would be useful. Keeping it focused on concepts makes sense.",
                createdAt:
                  new Date(
                    now - 5 * 60 * 60 * 1000
                  ).toISOString()
              },
              {
                id: "reply-course-2",
                author:
                  "AUC Atlas Admin",
                body:
                  "Great. The final forum could also let students follow course tags for updates.",
                createdAt:
                  new Date(
                    now - 4 * 60 * 60 * 1000
                  ).toISOString()
              }
            ]
          },
          {
            id: "demo-transport",
            category:
              "Housing & Transportation",
            tag: "New Cairo",
            title:
              "Ideas for making daily commutes easier",
            body:
              "What transportation tips, safe carpool practices, or scheduling habits have made commuting to campus more manageable?",
            author: "Demo Student",
            createdAt:
              new Date(
                now - 25 * 60 * 60 * 1000
              ).toISOString(),
            likes: 7,
            liked: false,
            views: 47,
            pinned: false,
            solved: false,
            replies: []
          }
        ];
      }

      function loadPosts() {
        try {
          var saved = JSON.parse(
            localStorage.getItem(
              STORAGE_KEY
            ) || "null"
          );

          if (Array.isArray(saved)) {
            return saved;
          }
        } catch (error) {}

        var seeded = createSeedPosts();

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(seeded)
        );

        return seeded;
      }

      function savePosts() {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(state.posts)
        );
      }

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function formatRelative(value) {
        var time =
          new Date(value).getTime();

        var difference = Math.max(
          0,
          Date.now() - time
        );

        var minutes = Math.floor(
          difference / 60000
        );

        if (minutes < 1) {
          return "Just now";
        }

        if (minutes < 60) {
          return minutes + "m ago";
        }

        var hours = Math.floor(
          minutes / 60
        );

        if (hours < 24) {
          return hours + "h ago";
        }

        var days = Math.floor(
          hours / 24
        );

        if (days < 7) {
          return days + "d ago";
        }

        return new Date(value)
          .toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric"
            }
          );
      }

      function showToast(message) {
        window.clearTimeout(
          toastTimer
        );

        toast.textContent = message;
        toast.hidden = false;

        toastTimer =
          window.setTimeout(
            function () {
              toast.hidden = true;
            },
            2800
          );
      }

      function openModal(modal) {
        modal.hidden = false;

        document.body.classList.add(
          "modal-open"
        );
      }

      function closeModals() {
        composerModal.hidden = true;
        detailModal.hidden = true;

        document.body.classList.remove(
          "modal-open"
        );
      }

      function getFilteredPosts() {
        var search =
          state.search.toLowerCase();

        var posts =
          state.posts.filter(
            function (post) {
              var matchesCategory =
                state.category ===
                  "All Discussions" ||
                post.category ===
                  state.category;

              var searchable = [
                post.title,
                post.body,
                post.category,
                post.tag,
                post.author
              ]
                .join(" ")
                .toLowerCase();

              return (
                matchesCategory &&
                (
                  !search ||
                  searchable.includes(
                    search
                  )
                )
              );
            }
          );

        if (
          state.sort === "popular"
        ) {
          posts.sort(
            function (a, b) {
              return (
                b.likes +
                b.replies.length * 3 +
                b.views / 10
              ) - (
                a.likes +
                a.replies.length * 3 +
                a.views / 10
              );
            }
          );
        } else if (
          state.sort === "unanswered"
        ) {
          posts = posts.filter(
            function (post) {
              return !post.replies.length;
            }
          );

          posts.sort(
            function (a, b) {
              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );
            }
          );
        } else {
          posts.sort(
            function (a, b) {
              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );
            }
          );
        }

        return posts;
      }

      function renderCategories() {
        var allCategories = [
          "All Discussions"
        ].concat(categories);

        categoryList.innerHTML =
          allCategories
            .map(function (category) {
              var count =
                category ===
                  "All Discussions"
                  ? state.posts.length
                  : state.posts.filter(
                      function (post) {
                        return (
                          post.category ===
                          category
                        );
                      }
                    ).length;

              return [
                '<button class="category-button',
                category === state.category
                  ? ' active'
                  : '',
                '" type="button" data-category="',
                escapeHtml(category),
                '">',
                  '<span>',
                    escapeHtml(category),
                  '</span>',
                  '<span class="category-count">',
                    count,
                  '</span>',
                '</button>'
              ].join("");
            })
            .join("");
      }

      function renderPostCard(post) {
        var preview =
          post.body.length > 190
            ? post.body.slice(
                0,
                187
              ) + "..."
            : post.body;

        return [
          '<article class="post-card">',
            '<div class="post-card-top">',
              '<div class="post-badges">',
                '<span class="post-badge is-gold">',
                  escapeHtml(
                    post.category
                  ),
                '</span>',
                post.tag
                  ? '<span class="post-badge">' +
                    escapeHtml(
                      post.tag
                    ) +
                    '</span>'
                  : '',
                post.pinned
                  ? '<span class="post-badge">Pinned</span>'
                  : '',
                post.solved
                  ? '<span class="post-badge">Solved</span>'
                  : '',
              '</div>',
            '</div>',

            '<button class="post-title-button" type="button" data-open-post="',
              escapeHtml(post.id),
            '">',
              escapeHtml(post.title),
            '</button>',

            '<p class="post-preview">',
              escapeHtml(preview),
            '</p>',

            '<footer class="post-card-footer">',
              '<div class="post-meta">',
                '<span class="post-author">',
                  escapeHtml(post.author),
                '</span>',
                '<span class="post-time">',
                  escapeHtml(
                    formatRelative(
                      post.createdAt
                    )
                  ),
                '</span>',
              '</div>',

              '<div class="post-actions">',
                '<span class="post-stat">',
                  post.replies.length,
                  ' replies',
                '</span>',
                '<span class="post-stat">',
                  post.views,
                  ' views',
                '</span>',
                '<button class="like-button',
                  post.liked
                    ? ' active'
                    : '',
                  '" type="button" data-like-post="',
                  escapeHtml(post.id),
                '">',
                  'Helpful · ',
                  post.likes,
                '</button>',
              '</div>',
            '</footer>',
          '</article>'
        ].join("");
      }

      function renderTrending() {
        var trending =
          state.posts
            .slice()
            .sort(function (a, b) {
              return (
                b.likes +
                b.replies.length * 3
              ) - (
                a.likes +
                a.replies.length * 3
              );
            })
            .slice(0, 3);

        trendingList.innerHTML =
          trending
            .map(function (post) {
              return [
                '<button class="trend-item" type="button" data-open-post="',
                  escapeHtml(post.id),
                '">',
                  '<strong>',
                    escapeHtml(
                      post.title
                    ),
                  '</strong>',
                  '<p>',
                    post.replies.length,
                    ' replies · ',
                    post.likes,
                    ' helpful',
                  '</p>',
                '</button>'
              ].join("");
            })
            .join("");
      }

      function renderFeed() {
        var posts =
          getFilteredPosts();

        feedSummary.textContent =
          posts.length +
          (
            posts.length === 1
              ? " discussion"
              : " discussions"
          ) +
          " · " +
          state.category;

        if (!posts.length) {
          postList.innerHTML =
            '<div class="forum-empty">' +
              '<h3>No discussions found</h3>' +
              '<p>Try another category or create the first post for this topic.</p>' +
            '</div>';
        } else {
          postList.innerHTML =
            posts
              .map(renderPostCard)
              .join("");
        }

        renderCategories();
        renderTrending();
      }

      function findPost(postId) {
        return state.posts.find(
          function (post) {
            return post.id === postId;
          }
        );
      }

      function toggleLike(postId) {
        var post =
          findPost(postId);

        if (!post) {
          return;
        }

        post.liked = !post.liked;

        post.likes = Math.max(
          0,
          post.likes +
            (post.liked ? 1 : -1)
        );

        savePosts();
        renderFeed();

        if (
          !detailModal.hidden &&
          state.activePostId === postId
        ) {
          renderDetail(post);
        }
      }

      function renderDetail(post) {
        var replies =
          post.replies.length
            ? post.replies
                .map(function (reply) {
                  return [
                    '<article class="reply-card">',
                      '<header>',
                        '<strong>',
                          escapeHtml(
                            reply.author
                          ),
                        '</strong>',
                        '<time>',
                          escapeHtml(
                            formatRelative(
                              reply.createdAt
                            )
                          ),
                        '</time>',
                      '</header>',
                      '<p>',
                        escapeHtml(
                          reply.body
                        ),
                      '</p>',
                    '</article>'
                  ].join("");
                })
                .join("")
            : (
              '<div class="forum-empty">' +
                '<h3>No replies yet</h3>' +
                '<p>Start the conversation with a helpful response.</p>' +
              '</div>'
            );

        detailContent.innerHTML = [
          '<div class="post-badges">',
            '<span class="post-badge is-gold">',
              escapeHtml(post.category),
            '</span>',
            post.tag
              ? '<span class="post-badge">' +
                escapeHtml(post.tag) +
                '</span>'
              : '',
            post.pinned
              ? '<span class="post-badge">Pinned</span>'
              : '',
            post.solved
              ? '<span class="post-badge">Solved</span>'
              : '',
          '</div>',

          '<h2 class="detail-heading" id="detail-title">',
            escapeHtml(post.title),
          '</h2>',

          '<div class="post-meta">',
            '<span class="post-author">',
              escapeHtml(post.author),
            '</span>',
            '<span class="post-time">',
              escapeHtml(
                formatRelative(
                  post.createdAt
                )
              ),
            '</span>',
            '<span class="post-time">',
              post.views,
              ' views',
            '</span>',
          '</div>',

          '<p class="detail-copy">',
            escapeHtml(post.body),
          '</p>',

          '<div class="detail-actions">',
            '<button class="like-button',
              post.liked
                ? ' active'
                : '',
              '" type="button" data-like-post="',
              escapeHtml(post.id),
            '">',
              'Helpful · ',
              post.likes,
            '</button>',

            '<button class="secondary-button" type="button" data-toggle-solved="',
              escapeHtml(post.id),
            '">',
              post.solved
                ? 'Remove Solved Status'
                : 'Mark as Solved',
            '</button>',

            '<button class="secondary-button danger-button" type="button" data-delete-post="',
              escapeHtml(post.id),
            '">',
              'Delete Demo Post',
            '</button>',
          '</div>',

          '<section class="reply-section">',
            '<h3>',
              post.replies.length,
              post.replies.length === 1
                ? ' Reply'
                : ' Replies',
            '</h3>',

            '<div class="reply-list">',
              replies,
            '</div>',

            '<form class="reply-form" id="reply-form">',
              '<label for="reply-body">',
                'Add a reply',
              '</label>',

              '<textarea id="reply-body" maxlength="2000" required placeholder="Write a constructive response."></textarea>',

              '<div class="form-actions">',
                '<button class="primary-button" type="submit">',
                  'Post Reply',
                '</button>',
              '</div>',
            '</form>',
          '</section>'
        ].join("");

        document
          .getElementById("reply-form")
          .addEventListener(
            "submit",
            function (event) {
              event.preventDefault();

              var replyBody =
                document
                  .getElementById(
                    "reply-body"
                  )
                  .value
                  .trim();

              if (!replyBody) {
                return;
              }

              post.replies.push({
                id:
                  "reply-" +
                  Date.now().toString(36),
                author:
                  admin.displayName ||
                  "AUC Atlas Admin",
                body: replyBody,
                createdAt:
                  new Date()
                    .toISOString()
              });

              savePosts();
              renderFeed();
              renderDetail(post);

              showToast(
                "Demo reply posted."
              );
            }
          );
      }

      function openPost(postId) {
        var post =
          findPost(postId);

        if (!post) {
          return;
        }

        state.activePostId = postId;
        post.views += 1;

        savePosts();
        renderFeed();
        renderDetail(post);
        openModal(detailModal);
      }

      categoryList.addEventListener(
        "click",
        function (event) {
          var button =
            event.target.closest(
              "[data-category]"
            );

          if (!button) {
            return;
          }

          state.category =
            button.dataset.category;

          renderFeed();
        }
      );

      function handlePostAction(event) {
        var openButton =
          event.target.closest(
            "[data-open-post]"
          );

        if (openButton) {
          openPost(
            openButton.dataset.openPost
          );
          return;
        }

        var likeButton =
          event.target.closest(
            "[data-like-post]"
          );

        if (likeButton) {
          toggleLike(
            likeButton.dataset.likePost
          );
          return;
        }

        var solvedButton =
          event.target.closest(
            "[data-toggle-solved]"
          );

        if (solvedButton) {
          var solvedPost =
            findPost(
              solvedButton.dataset
                .toggleSolved
            );

          if (!solvedPost) {
            return;
          }

          solvedPost.solved =
            !solvedPost.solved;

          savePosts();
          renderFeed();
          renderDetail(solvedPost);

          showToast(
            solvedPost.solved
              ? "Discussion marked as solved."
              : "Solved status removed."
          );

          return;
        }

        var deleteButton =
          event.target.closest(
            "[data-delete-post]"
          );

        if (deleteButton) {
          if (
            !window.confirm(
              "Delete this demo post from this browser?"
            )
          ) {
            return;
          }

          state.posts =
            state.posts.filter(
              function (post) {
                return (
                  post.id !==
                  deleteButton.dataset
                    .deletePost
                );
              }
            );

          savePosts();
          closeModals();
          renderFeed();

          showToast(
            "Demo post deleted."
          );
        }
      }

      postList.addEventListener(
        "click",
        handlePostAction
      );

      trendingList.addEventListener(
        "click",
        handlePostAction
      );

      detailContent.addEventListener(
        "click",
        handlePostAction
      );

      searchInput.addEventListener(
        "input",
        function () {
          state.search =
            searchInput.value.trim();

          renderFeed();
        }
      );

      sortInput.addEventListener(
        "change",
        function () {
          state.sort =
            sortInput.value;

          renderFeed();
        }
      );

      document
        .getElementById(
          "open-composer"
        )
        .addEventListener(
          "click",
          function () {
            composerForm.reset();
            openModal(composerModal);

            window.setTimeout(
              function () {
                document
                  .getElementById(
                    "post-title"
                  )
                  .focus();
              },
              40
            );
          }
        );

      composerForm.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          var title =
            document
              .getElementById(
                "post-title"
              )
              .value
              .trim();

          var body =
            document
              .getElementById(
                "post-body"
              )
              .value
              .trim();

          var category =
            postCategory.value;

          var tag =
            document
              .getElementById(
                "post-tag"
              )
              .value
              .trim();

          var anonymous =
            document
              .getElementById(
                "post-anonymous"
              )
              .checked;

          if (
            !title ||
            !body ||
            !categories.includes(
              category
            )
          ) {
            return;
          }

          state.posts.unshift({
            id:
              "post-" +
              Date.now().toString(36),
            category: category,
            tag: tag,
            title: title,
            body: body,
            author:
              anonymous
                ? "Anonymous"
                : (
                  admin.displayName ||
                  "AUC Atlas Admin"
                ),
            createdAt:
              new Date().toISOString(),
            likes: 0,
            liked: false,
            views: 0,
            pinned: false,
            solved: false,
            replies: []
          });

          state.category =
            "All Discussions";
          state.search = "";
          searchInput.value = "";

          savePosts();
          closeModals();
          renderFeed();

          showToast(
            "Demo post published in this browser."
          );
        }
      );

      document
        .querySelectorAll(
          "[data-close-modal]"
        )
        .forEach(function (button) {
          button.addEventListener(
            "click",
            closeModals
          );
        });

      [
        composerModal,
        detailModal
      ].forEach(function (modal) {
        modal.addEventListener(
          "click",
          function (event) {
            if (event.target === modal) {
              closeModals();
            }
          }
        );
      });

      document.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Escape") {
            closeModals();
          }
        }
      );

      document
        .getElementById("reset-demo")
        .addEventListener(
          "click",
          function () {
            if (
              !window.confirm(
                "Reset all forum demo posts and replies in this browser?"
              )
            ) {
              return;
            }

            state.posts =
              createSeedPosts();
            state.category =
              "All Discussions";
            state.search = "";
            state.sort = "latest";

            searchInput.value = "";
            sortInput.value = "latest";

            savePosts();
            renderFeed();

            showToast(
              "Demo data reset."
            );
          }
        );

      document
        .getElementById(
          "admin-name"
        )
        .textContent =
          admin.displayName ||
          "AUC Atlas Admin";

      postCategory.innerHTML =
        categories
          .map(function (category) {
            return (
              '<option value="' +
              escapeHtml(category) +
              '">' +
              escapeHtml(category) +
              '</option>'
            );
          })
          .join("");

      state.posts = loadPosts();
      renderFeed();
    })();
  </script>
</body>
</html>`;
}

module.exports = async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res
      .status(405)
      .send(
        renderAccessPage(403)
      );
  }

  try {
    const actor =
      await ensureAdminUser(req);

    return res
      .status(200)
      .send(
        renderForumPage(actor)
      );
  } catch (error) {
    const statusCode =
      error &&
      error.statusCode === 401
        ? 401
        : 403;

    return res
      .status(statusCode)
      .send(
        renderAccessPage(statusCode)
      );
  }
};
