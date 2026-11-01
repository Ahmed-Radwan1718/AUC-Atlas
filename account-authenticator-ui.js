(function () {
  function initializeAuthenticatorSetupUi() {
    const modal = document.getElementById("authenticator-modal");

    if (!modal || modal.dataset.uiRedesignReady === "true") {
      return;
    }

    modal.dataset.uiRedesignReady = "true";

    const styles = document.createElement("style");
    styles.id = "account-authenticator-redesign-styles";
    styles.textContent = `
      html:has(#authenticator-modal:not([hidden])),
      body:has(#authenticator-modal:not([hidden])) {
        overflow: hidden;
        overscroll-behavior: none;
      }

      body:has(#authenticator-modal:not([hidden])) .site-header,
      body:has(#authenticator-modal:not([hidden])) .account-page {
        filter: blur(12px);
        pointer-events: none;
        user-select: none;
      }

      #authenticator-modal .account-authenticator-modal-backdrop {
        background: rgba(12, 12, 12, 0.68);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
      }

      #authenticator-modal .account-authenticator-modal-card {
        width: min(calc(100vw - 48px), 470px);
        padding: 30px;
        gap: 24px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 28px 70px rgba(23, 23, 23, 0.28);
      }

      #authenticator-modal .account-authenticator-modal-header {
        padding: 0 18px;
        text-align: center;
        display: grid;
        gap: 9px;
      }

      #authenticator-modal .account-authenticator-modal-header h2 {
        padding-right: 0;
        font-size: 25px;
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: -0.02em;
        text-transform: none;
      }

      #authenticator-modal .account-authenticator-modal-header p {
        max-width: 360px;
        margin: 0 auto;
        color: rgba(23, 23, 23, 0.6);
        font-size: 14px;
        line-height: 1.6;
      }

      #authenticator-modal .account-authenticator-setup-grid {
        display: grid;
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 14px;
      }

      #authenticator-modal .account-authenticator-qr-wrap {
        width: 196px;
        height: 196px;
        padding: 8px;
        border: 1px solid rgba(23, 23, 23, 0.1);
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 10px 28px rgba(42, 32, 20, 0.07);
      }

      #authenticator-modal .account-authenticator-manual {
        width: 100%;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        display: block;
      }

      #authenticator-modal .account-authenticator-manual summary {
        width: fit-content;
        margin: 0 auto;
        padding: 6px 10px;
        border-radius: 999px;
        color: rgba(126, 90, 34, 0.94);
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.4;
        text-align: center;
        cursor: pointer;
        list-style: none;
        transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
      }

      #authenticator-modal .account-authenticator-manual summary::-webkit-details-marker {
        display: none;
      }

      #authenticator-modal .account-authenticator-manual summary::marker {
        content: "";
      }

      #authenticator-modal .account-authenticator-manual summary:hover,
      #authenticator-modal .account-authenticator-manual summary:focus-visible {
        background: rgba(192, 154, 92, 0.12);
        color: #171717;
        outline: none;
      }

      #authenticator-modal .account-authenticator-manual-key {
        margin-top: 10px;
        padding: 13px 14px;
        border: 1px solid rgba(23, 23, 23, 0.09);
        border-radius: 16px;
        background: rgba(247, 244, 238, 0.72);
        display: grid;
        gap: 7px;
        text-align: left;
      }

      #authenticator-modal .account-authenticator-manual-key span {
        color: rgba(23, 23, 23, 0.5);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.11em;
        line-height: 1.35;
        text-transform: uppercase;
      }

      #authenticator-modal .account-authenticator-manual-key strong {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #171717;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1.55;
        text-transform: uppercase;
        overflow-wrap: anywhere;
      }

      #authenticator-modal #authenticator-setup-form {
        gap: 20px;
      }

      #authenticator-modal .account-authenticator-code-field {
        gap: 12px;
      }

      #authenticator-modal .account-authenticator-code-field > label {
        color: #171717;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.4;
        text-align: center;
        text-transform: none;
      }

      #authenticator-modal .account-authenticator-code-inputs {
        grid-template-columns: repeat(6, 52px);
        justify-content: center;
        gap: 8px;
      }

      #authenticator-modal .account-authenticator-code-input {
        width: 52px;
        height: 56px;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.9);
        font-size: 22px;
        font-weight: 700;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      }

      #authenticator-modal .account-authenticator-modal-actions {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      #authenticator-modal .account-authenticator-modal-actions .account-primary-button {
        order: 1;
        width: 100%;
        min-height: 52px;
        margin-top: 2px;
        border-color: rgba(192, 154, 92, 0.88);
        background: rgba(192, 154, 92, 0.88);
      }

      #authenticator-modal .account-authenticator-modal-actions .account-primary-button:not(:disabled):hover {
        border-color: rgba(171, 132, 70, 0.96);
        background: rgba(171, 132, 70, 0.96);
        box-shadow: 0 12px 26px rgba(192, 154, 92, 0.2);
        transform: translateY(-1px);
      }

      #authenticator-modal .account-authenticator-modal-actions .account-secondary-button {
        order: 2;
        width: 100%;
        min-height: 42px;
        padding: 0 14px;
        border: 0;
        background: transparent;
        color: rgba(23, 23, 23, 0.56);
      }

      #authenticator-modal .account-authenticator-modal-actions .account-secondary-button:hover {
        color: #171717;
        background: rgba(23, 23, 23, 0.04);
      }

      #authenticator-modal #authenticator-message {
        margin-top: -4px;
        text-align: center;
      }

      #authenticator-modal #authenticator-message:empty {
        display: none;
      }

      @media (max-width: 620px) {
        #authenticator-modal .account-authenticator-modal-card {
          width: calc(100vw - 24px);
          max-height: calc(100dvh - 24px);
          padding: 22px 18px;
          gap: 20px;
          border-radius: 22px;
        }

        #authenticator-modal .account-authenticator-modal-header {
          padding: 0 28px;
        }

        #authenticator-modal .account-authenticator-modal-header h2 {
          font-size: 22px;
        }

        #authenticator-modal .account-authenticator-qr-wrap {
          width: 184px;
          height: 184px;
        }

        #authenticator-modal .account-authenticator-code-inputs {
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 7px;
        }

        #authenticator-modal .account-authenticator-code-input {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(styles);

    const headerCopy = modal.querySelector(".account-authenticator-modal-header p");
    if (headerCopy) {
      headerCopy.textContent = "Scan this code with your authenticator app, then enter the code below.";
    }

    const manual = modal.querySelector(".account-authenticator-manual");
    const secretKey = document.getElementById("authenticator-secret-key");

    if (manual && secretKey && manual.tagName !== "DETAILS") {
      const details = document.createElement("details");
      details.className = "account-authenticator-manual";

      const summary = document.createElement("summary");
      summary.textContent = "Can't scan the code? Use setup key";

      const keyWrap = document.createElement("div");
      keyWrap.className = "account-authenticator-manual-key";

      const keyLabel = document.createElement("span");
      keyLabel.textContent = "Manual setup key";

      keyWrap.appendChild(keyLabel);
      keyWrap.appendChild(secretKey);
      details.appendChild(summary);
      details.appendChild(keyWrap);
      manual.replaceWith(details);
    }

    const codeLabel = modal.querySelector(".account-authenticator-code-field > label");
    if (codeLabel) {
      codeLabel.textContent = "Enter the 6-digit code";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAuthenticatorSetupUi, { once: true });
  } else {
    initializeAuthenticatorSetupUi();
  }
})();
