// @ts-nocheck
// Original AUC Atlas forgot-password behavior, mounted once after React hydration.
export function initializeForgotPassword() {
  const root=document.querySelector(".auth-page");
  if(!root || root.getAttribute("data-atlas-forgot-password-initialized")==="true")return;
  root.setAttribute("data-atlas-forgot-password-initialized","true");

    const forgotPasswordForm = document.getElementById("forgot-password-form");
    const resetEmailInput = document.getElementById("reset-email");
    const resetSubmitButton = document.getElementById("reset-submit");
    const resetMessage = document.getElementById("reset-message");

    function showResetMessage(message, type) {
      resetMessage.textContent = message;
      resetMessage.className = "auth-message";

      if (type) {
        resetMessage.classList.add(type);
      }
    }

    forgotPasswordForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = resetEmailInput.value.trim();

      if (!email) {
        showResetMessage(
          "Please enter your email address.",
          "error"
        );
        resetEmailInput.focus();
        return;
      }

      if (!resetEmailInput.checkValidity()) {
        showResetMessage(
          "Please enter a valid email address.",
          "error"
        );
        resetEmailInput.focus();
        return;
      }

      resetSubmitButton.disabled = true;
      resetSubmitButton.textContent = "Sending...";
      showResetMessage("", "");

      try {
        const response = await fetch(
          "/api/forgot-password",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              email
            })
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
            "Could not send the password reset email."
          );
        }

        showResetMessage(
          data.message ||
          "If an AUC Atlas account exists for this email, a password reset link has been sent.",
          "success"
        );
      } catch (error) {
        showResetMessage(
          error.message ||
          "Could not send the password reset email. Please try again.",
          "error"
        );
      } finally {
        resetSubmitButton.disabled = false;
        resetSubmitButton.textContent =
          "Send Reset Link";
      }
    });
  
}
