// @ts-nocheck
// Original AUC Atlas signup behavior, mounted once after React hydration.
export function initializeSignup() {
  const root=document.querySelector(".auth-page");
  if(!root || root.getAttribute("data-atlas-signup-initialized")==="true")return;
  root.setAttribute("data-atlas-signup-initialized","true");

    const signupForm = document.getElementById("signup-form");
    const signupButton = document.getElementById("signup-submit");
    const signupMessage = document.getElementById("signup-message");
    const passwordVisibilityToggles = document.querySelectorAll(".auth-password-visibility-toggle");

    function showMessage(message, type) {
      signupMessage.textContent = message;
      signupMessage.className = "auth-message";

      if (type) {
        signupMessage.classList.add(type);
      }
    }

    passwordVisibilityToggles.forEach(function (toggleButton) {
      const targetId = toggleButton.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);

      toggleButton.addEventListener("click", function () {
        if (!targetInput) {
          return;
        }

        if (targetInput.type === "password") {
          targetInput.type = "text";
          toggleButton.classList.remove("password-hidden");
          toggleButton.classList.add("password-visible");
          toggleButton.setAttribute("aria-label", "Hide password");
        } else {
          targetInput.type = "password";
          toggleButton.classList.add("password-hidden");
          toggleButton.classList.remove("password-visible");
          toggleButton.setAttribute("aria-label", "Show password");
        }
      });
    });

    signupForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const fullName = document.getElementById("signup-name").value.trim();
      const aucId = document.getElementById("signup-auc-id").value.replace(/\D/g, "");
      const email = document.getElementById("signup-email").value.trim().toLowerCase();
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm-password").value;
      const consentAccepted = document.getElementById("signup-consent").checked;

      if (!fullName || !aucId || !email || !password || !confirmPassword) {
        showMessage("Please complete all required fields.", "error");
        return;
      }

      if (!/^900\d{6}$/.test(aucId)) {
        showMessage("Incorrect ID number.", "error");
        return;
      }

      if (!/^[^@\s]+@aucegypt\.edu$/.test(email)) {
        showMessage("Please use your AUC email address (@aucegypt.edu).", "error");
        return;
      }

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
      }

      if (
        password.length < 10 ||
        password.length > 48 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9\s]/.test(password)
      ) {
        showMessage("Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.", "error");
        return;
      }

      signupButton.disabled = true;
      signupButton.textContent = "Creating Account...";
      showMessage("", "");

      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: fullName,
            aucId: aucId,
            email: email,
            password: password,
            confirmPassword: confirmPassword,
            consentAccepted: consentAccepted
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not create account. Please try again.");
        }

        signupForm.reset();
        window.aucAtlasCurrentUser = null;

        showMessage(
          data.message ||
            "Account created successfully. Verify your AUC email before logging in.",
          "success"
        );

        setTimeout(function () {
          window.location.href = "/login";
        }, 2500);
      } catch (error) {
        showMessage(error.message || "Something went wrong. Please try again.", "error");
      } finally {
        signupButton.disabled = false;
        signupButton.textContent = "Create Account";
      }
    });

  
}
