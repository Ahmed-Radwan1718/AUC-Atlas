(function () {
  const emailInput =
    document.getElementById(
      "login-email"
    );

  const passwordlessButton =
    document.getElementById(
      "login-passwordless-button"
    );

  const emailCodePanel =
    document.getElementById(
      "login-email-code-panel"
    );

  const emailCodeForm =
    document.getElementById(
      "login-email-code-form"
    );

  const emailCodeDescription =
    document.getElementById(
      "login-email-code-description"
    );

  const emailCodeInputs =
    Array.from(
      document.querySelectorAll(
        "[data-login-email-code-input]"
      )
    );

  const emailCodeSubmit =
    document.getElementById(
      "login-email-code-submit"
    );

  const emailCodeResend =
    document.getElementById(
      "login-email-code-resend"
    );

  const emailCodeCancel =
    document.getElementById(
      "login-email-code-cancel"
    );

  const emailCodeMessage =
    document.getElementById(
      "login-email-code-message"
    );

  if (
    !emailInput ||
    !passwordlessButton ||
    !emailCodePanel ||
    !emailCodeForm ||
    !emailCodeInputs.length ||
    !emailCodeSubmit ||
    !emailCodeResend ||
    !emailCodeCancel ||
    !emailCodeMessage
  ) {
    return;
  }

  let activeChallengeId = "";
  let activeEmailAddress = "";
  let requestingCode = false;
  let verifyingCode = false;

  function showMainMessage(
    message,
    type
  ) {
    if (
      typeof showMessage ===
      "function"
    ) {
      showMessage(
        message,
        type
      );

      return;
    }

    const messageElement =
      document.getElementById(
        "login-message"
      );

    if (!messageElement) {
      return;
    }

    messageElement.textContent =
      message;

    messageElement.className =
      "auth-message" +
      (
        type
          ? " " + type
          : ""
      );
  }

  function showEmailCodeMessage(
    message,
    type
  ) {
    emailCodeMessage.textContent =
      message;

    emailCodeMessage.className =
      "auth-message" +
      (
        type
          ? " " + type
          : ""
      );
  }

  function clearEmailCodeInputs() {
    emailCodeInputs.forEach(
      function (input) {
        input.value = "";
      }
    );
  }

  function getEmailCodeValue() {
    return emailCodeInputs
      .map(function (input) {
        return input.value.trim();
      })
      .join("");
  }

  function focusFirstEmailCodeInput() {
    if (emailCodeInputs[0]) {
      emailCodeInputs[0].focus();
    }
  }

  function setRequestButtonsDisabled(
    disabled
  ) {
    passwordlessButton.disabled =
      disabled;

    emailCodeResend.disabled =
      disabled;
  }

  function openEmailCodePanel(
    email
  ) {
    if (
      typeof clearLocalSignedInState ===
      "function"
    ) {
      clearLocalSignedInState();
    }

    activeEmailAddress = email;

    if (emailCodeDescription) {
      emailCodeDescription.textContent =
        "Enter the 6-digit code sent to " +
        email +
        ". It expires in 10 minutes.";
    }

    clearEmailCodeInputs();
    showMainMessage("", "");
    showEmailCodeMessage(
      "Code sent. Check your inbox.",
      "success"
    );

    emailCodePanel.hidden = false;
    emailCodeSubmit.disabled = false;
    emailCodeSubmit.textContent =
      "Verify Code";

    window.setTimeout(
      function () {
        focusFirstEmailCodeInput();
      },
      50
    );
  }

  function closeEmailCodePanel(
    message
  ) {
    emailCodePanel.hidden = true;
    activeChallengeId = "";
    activeEmailAddress = "";
    verifyingCode = false;

    clearEmailCodeInputs();
    showEmailCodeMessage("", "");

    emailCodeSubmit.disabled = false;
    emailCodeSubmit.textContent =
      "Verify Code";

    emailCodeResend.disabled = false;
    emailCodeResend.textContent =
      "Send a new code";

    passwordlessButton.disabled =
      false;

    passwordlessButton.textContent =
      "Email Me a Sign-In Code";

    if (message) {
      showMainMessage(
        message,
        "error"
      );
    }
  }

  function isValidAucEmail(email) {
    return /^[^@\s]+@aucegypt\.edu$/i
      .test(email);
  }

  async function requestEmailCode(
    options
  ) {
    if (requestingCode) {
      return;
    }

    const settings = options || {};

    const email = String(
      settings.email ||
      emailInput.value ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!isValidAucEmail(email)) {
      showMainMessage(
        "Please enter your AUC email address (@aucegypt.edu).",
        "error"
      );

      emailInput.focus();
      return;
    }

    requestingCode = true;

    setRequestButtonsDisabled(true);

    if (settings.fromPanel) {
      emailCodeResend.textContent =
        "Sending...";
      showEmailCodeMessage("", "");
    } else {
      passwordlessButton.textContent =
        "Sending...";
      showMainMessage("", "");
    }

    try {
      const response = await fetch(
        "/api/login-code",
        {
          method: "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action: "request",
            email
          })
        }
      );

      const data =
        await response
          .json()
          .catch(function () {
            return {};
          });

      if (
        !response.ok ||
        !data.success ||
        !/^[a-f0-9]{64}$/i.test(
          data.challengeId || ""
        )
      ) {
        throw new Error(
          data.error ||
          "Could not send the sign-in code."
        );
      }

      activeChallengeId =
        data.challengeId;

      emailInput.value = email;

      openEmailCodePanel(email);
    } catch (error) {
      const message =
        error.message ||
        "Could not send the sign-in code. Please try again.";

      if (emailCodePanel.hidden) {
        showMainMessage(
          message,
          "error"
        );
      } else {
        showEmailCodeMessage(
          message,
          "error"
        );
      }
    } finally {
      requestingCode = false;

      setRequestButtonsDisabled(
        false
      );

      passwordlessButton.textContent =
        "Email Me a Sign-In Code";

      emailCodeResend.textContent =
        "Send a new code";
    }
  }

  async function verifyEmailCode() {
    if (verifyingCode) {
      return;
    }

    const code =
      getEmailCodeValue();

    if (
      !activeChallengeId ||
      !activeEmailAddress
    ) {
      showEmailCodeMessage(
        "Request a new sign-in code.",
        "error"
      );

      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showEmailCodeMessage(
        "Please enter the 6-digit code.",
        "error"
      );

      focusFirstEmailCodeInput();
      return;
    }

    verifyingCode = true;

    emailCodeSubmit.disabled = true;
    emailCodeSubmit.textContent =
      "Verifying...";

    showEmailCodeMessage("", "");

    try {
      const response = await fetch(
        "/api/login-code",
        {
          method: "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action: "verify",
            email:
              activeEmailAddress,
            challengeId:
              activeChallengeId,
            code
          })
        }
      );

      const data =
        await response
          .json()
          .catch(function () {
            return {};
          });

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
          "The sign-in code is invalid or has expired."
        );
      }

      emailCodePanel.hidden = true;
      activeChallengeId = "";

      clearEmailCodeInputs();
      showEmailCodeMessage("", "");

      if (data.requiresTwoFactor) {
        if (
          typeof openTwoFactorPanel ===
          "function"
        ) {
          openTwoFactorPanel({
            emailRecoveryAvailable: false
          });
          return;
        }

        throw new Error(
          "Authenticator verification could not be opened."
        );
      }

      if (
        typeof finishLogin ===
        "function"
      ) {
        finishLogin(
          data.user || null
        );

        return;
      }

      window.location.href =
        "accounts.html";
    } catch (error) {
      showEmailCodeMessage(
        error.message ||
        "The sign-in code is invalid or has expired.",
        "error"
      );

      clearEmailCodeInputs();
      focusFirstEmailCodeInput();
    } finally {
      verifyingCode = false;

      if (!emailCodePanel.hidden) {
        emailCodeSubmit.disabled =
          false;

        emailCodeSubmit.textContent =
          "Verify Code";
      }
    }
  }

  emailCodeInputs.forEach(
    function (input, index) {
      input.addEventListener(
        "input",
        function () {
          input.value =
            input.value
              .replace(/\D/g, "")
              .slice(0, 1);

          showEmailCodeMessage(
            "",
            ""
          );

          if (
            input.value &&
            emailCodeInputs[index + 1]
          ) {
            emailCodeInputs[
              index + 1
            ].focus();
          }
        }
      );

      input.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key ===
              "Backspace" &&
            !input.value &&
            emailCodeInputs[
              index - 1
            ]
          ) {
            emailCodeInputs[
              index - 1
            ].focus();
          }
        }
      );

      input.addEventListener(
        "paste",
        function (event) {
          const pastedCode =
            event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);

          if (!pastedCode) {
            return;
          }

          event.preventDefault();

          emailCodeInputs.forEach(
            function (
              codeInput,
              codeIndex
            ) {
              codeInput.value =
                pastedCode.charAt(
                  codeIndex
                ) || "";
            }
          );

          const focusIndex =
            Math.min(
              pastedCode.length,
              emailCodeInputs.length
            ) - 1;

          if (
            emailCodeInputs[
              focusIndex
            ]
          ) {
            emailCodeInputs[
              focusIndex
            ].focus();
          }
        }
      );
    }
  );

  passwordlessButton.addEventListener(
    "click",
    function () {
      requestEmailCode();
    }
  );

  emailCodeForm.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      verifyEmailCode();
    }
  );

  emailCodeResend.addEventListener(
    "click",
    function () {
      requestEmailCode({
        email:
          activeEmailAddress ||
          emailInput.value,
        fromPanel: true
      });
    }
  );

  emailCodeCancel.addEventListener(
    "click",
    function () {
      closeEmailCodePanel(
        "Sign in cancelled."
      );
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape" &&
        !emailCodePanel.hidden
      ) {
        closeEmailCodePanel(
          "Sign in cancelled."
        );
      }
    }
  );
})();
