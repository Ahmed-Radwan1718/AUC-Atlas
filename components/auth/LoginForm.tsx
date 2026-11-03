"use client";

import { type FormEvent, useState } from "react";
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import { VerificationPanel } from "@/components/auth/VerificationPanel";

type MessageType = "error" | "success" | "";
type LoginModal = "authenticator" | "email-signin" | "recovery" | null;

type LoginUser = {
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  fullName?: string;
  photoURL?: string;
};

type LoginResponse = {
  success?: boolean;
  error?: string;
  requiresTwoFactor?: boolean;
  method?: "app" | "email" | string;
  emailRecoveryAvailable?: boolean;
  user?: LoginUser | null;
};

type LoginCodeResponse = LoginResponse & {
  challengeId?: string;
  email?: string;
};

type GoogleConfigResponse = {
  success?: boolean;
  error?: string;
  firebase?: FirebaseOptions;
};

type AucAtlasWindow = Window & {
  aucAtlasCurrentUser?: LoginUser | null;
};

const GOOGLE_APP_NAME = "aucAtlasGoogleLogin";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordlessLoading, setPasswordlessLoading] = useState(false);

  const [modal, setModal] = useState<LoginModal>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [modalMessageType, setModalMessageType] = useState<MessageType>("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [verificationReset, setVerificationReset] = useState(0);
  const [authRecoveryAvailable, setAuthRecoveryAvailable] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState("");
  const [activeEmailAddress, setActiveEmailAddress] = useState("");
  const [recoveryEmailOnly, setRecoveryEmailOnly] = useState(false);

  function showMessage(nextMessage: string, type: MessageType = "") {
    setMessage(nextMessage);
    setMessageType(type);
  }

  function showModalMessage(nextMessage: string, type: MessageType = "") {
    setModalMessage(nextMessage);
    setModalMessageType(type);
  }

  function resetVerificationInputs() {
    setVerificationReset((value) => value + 1);
  }

  function clearLocalSignedInState() {
    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
    } catch {}

    (window as AucAtlasWindow).aucAtlasCurrentUser = null;
  }

  function markLocalSignedIn(user: LoginUser | null | undefined) {
    try {
      localStorage.setItem("auc-atlas-signed-in", "1");
      localStorage.setItem("aucAtlasSignedIn", "true");
    } catch {}

    (window as AucAtlasWindow).aucAtlasCurrentUser = user || null;
  }

  function getLoginRedirectTarget() {
    try {
      const savedRedirect = localStorage.getItem("auc-atlas-login-redirect");
      if (savedRedirect) {
        localStorage.removeItem("auc-atlas-login-redirect");
        return savedRedirect;
      }
    } catch {}

    return "/";
  }

  function finishLogin(user: LoginUser | null | undefined) {
    markLocalSignedIn(user);

    if (modal) {
      showModalMessage("Logged in successfully.", "success");
    } else {
      showMessage("Logged in successfully.", "success");
    }

    window.setTimeout(() => {
      window.location.href = getLoginRedirectTarget();
    }, 700);
  }

  function openAuthenticatorPanel(emailRecoveryAvailable: boolean) {
    clearLocalSignedInState();
    setAuthRecoveryAvailable(emailRecoveryAvailable);
    setModal("authenticator");
    showMessage("");
    showModalMessage("");
    resetVerificationInputs();
  }

  async function handleLoginResult(data: LoginResponse) {
    if (data.requiresTwoFactor) {
      if (data.method === "email") {
        await requestRecoveryCode(true, false);
        return;
      }

      openAuthenticatorPanel(Boolean(data.emailRecoveryAvailable));
      return;
    }

    finishLogin(data.user || null);
  }

  async function verifyAuthenticator(code: string) {
    if (!/^\d{6}$/.test(code)) {
      showModalMessage("Please enter your 6-digit authenticator code.", "error");
      return;
    }

    setModalSubmitting(true);
    showModalMessage("");

    try {
      const response = await fetch("/api/verify-login-authenticator", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid authenticator code.");
      }

      finishLogin(data.user || null);
    } catch (error) {
      showModalMessage(
        error instanceof Error ? error.message : "The authenticator code is incorrect.",
        "error",
      );
      resetVerificationInputs();
    } finally {
      setModalSubmitting(false);
    }
  }

  async function requestEmailSignInCode(fromPanel = false) {
    const cleanEmail = (fromPanel ? activeEmailAddress : email).trim().toLowerCase();

    if (!/^[^@\s]+@aucegypt\.edu$/i.test(cleanEmail)) {
      showMessage("Please enter your AUC email address (@aucegypt.edu).", "error");
      return;
    }

    if (fromPanel) {
      setSecondaryLoading(true);
      showModalMessage("");
    } else {
      setPasswordlessLoading(true);
      showMessage("");
    }

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email: cleanEmail }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginCodeResponse;

      if (
        !response.ok ||
        !data.success ||
        !/^[a-f0-9]{64}$/i.test(data.challengeId || "")
      ) {
        throw new Error(data.error || "Could not send the sign-in code.");
      }

      setEmail(cleanEmail);
      setActiveEmailAddress(cleanEmail);
      setActiveChallengeId(data.challengeId || "");
      setModal("email-signin");
      showMessage("");
      showModalMessage("Code sent. Check your inbox.", "success");
      resetVerificationInputs();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not send the sign-in code. Please try again.";

      if (fromPanel) showModalMessage(errorMessage, "error");
      else showMessage(errorMessage, "error");
    } finally {
      setPasswordlessLoading(false);
      setSecondaryLoading(false);
    }
  }

  async function verifyEmailSignInCode(code: string) {
    if (!activeChallengeId || !activeEmailAddress) {
      showModalMessage("Request a new sign-in code.", "error");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showModalMessage("Please enter the 6-digit code.", "error");
      return;
    }

    setModalSubmitting(true);
    showModalMessage("");

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          email: activeEmailAddress,
          challengeId: activeChallengeId,
          code,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "The sign-in code is invalid or has expired.");
      }

      setActiveChallengeId("");

      if (data.requiresTwoFactor) {
        openAuthenticatorPanel(false);
        return;
      }

      finishLogin(data.user || null);
    } catch (error) {
      showModalMessage(
        error instanceof Error
          ? error.message
          : "The sign-in code is invalid or has expired.",
        "error",
      );
      resetVerificationInputs();
    } finally {
      setModalSubmitting(false);
    }
  }

  async function requestRecoveryCode(emailOnly: boolean, fromPanel: boolean) {
    setRecoveryEmailOnly(emailOnly);

    if (fromPanel) {
      setSecondaryLoading(true);
      showModalMessage("");
    } else if (!emailOnly) {
      setSecondaryLoading(true);
      showModalMessage("");
    }

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", recovery: true }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginCodeResponse;

      if (
        !response.ok ||
        !data.success ||
        !/^[a-f0-9]{64}$/i.test(data.challengeId || "")
      ) {
        throw new Error(data.error || "Could not send the email verification code.");
      }

      setActiveChallengeId(data.challengeId || "");
      setActiveEmailAddress(data.email || "");
      setModal("recovery");
      showModalMessage("Code sent. Check your inbox.", "success");
      resetVerificationInputs();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not send the email verification code. Please try again.";

      if (emailOnly) {
        setModal(null);
        setLoginLoading(false);
        showMessage(errorMessage, "error");
      } else {
        showModalMessage(errorMessage, "error");
      }
    } finally {
      setSecondaryLoading(false);
    }
  }

  async function verifyRecoveryCode(code: string) {
    if (!activeChallengeId) {
      showModalMessage("Request a new recovery code.", "error");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showModalMessage("Please enter the 6-digit code.", "error");
      return;
    }

    setModalSubmitting(true);
    showModalMessage("");

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          recovery: true,
          challengeId: activeChallengeId,
          code,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "The email verification code is invalid or has expired.");
      }

      setActiveChallengeId("");
      finishLogin(data.user || null);
    } catch (error) {
      showModalMessage(
        error instanceof Error ? error.message : "The recovery code is invalid or has expired.",
        "error",
      );
      resetVerificationInputs();
    } finally {
      setModalSubmitting(false);
    }
  }

  function cancelEmailSignIn() {
    setModal(null);
    setActiveChallengeId("");
    setActiveEmailAddress("");
    showModalMessage("");
    showMessage("Sign in cancelled.", "error");
  }

  function closeRecoveryPanel() {
    setActiveChallengeId("");
    showModalMessage("");
    resetVerificationInputs();

    if (recoveryEmailOnly) {
      setModal(null);
      setLoginLoading(false);
      showMessage("Sign in cancelled.", "error");
      return;
    }

    setModal("authenticator");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    showMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Incorrect email or password.");
      }

      await handleLoginResult(data);
    } catch (error) {
      clearLocalSignedInState();
      showMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
        "error",
      );
      setLoginLoading(false);
    } finally {
      if (!modal) setLoginLoading(false);
    }
  }

  function getGoogleLoginError(error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";

    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in was closed before it finished.";
    }
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the Google popup. Please allow popups and try again.";
    }
    if (code === "auth/account-exists-with-different-credential") {
      return "This Google account is not connected yet. Log in with your AUC email and connect Google from My Account.";
    }

    return error instanceof Error
      ? error.message
      : "Could not log in with Google. Please try again.";
  }

  async function startGoogleLogin() {
    setGoogleLoading(true);
    showMessage("");
    let googleAuth: Auth | null = null;

    try {
      const configResponse = await fetch("/api/google-auth", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const configData = (await configResponse.json().catch(() => ({}))) as GoogleConfigResponse;

      if (!configResponse.ok || !configData.firebase) {
        throw new Error(configData.error || "Google sign-in is not configured.");
      }

      const existingApp = getApps().find((app) => app.name === GOOGLE_APP_NAME);
      const firebaseApp = existingApp || initializeApp(configData.firebase, GOOGLE_APP_NAME);
      googleAuth = getAuth(firebaseApp);
      await setPersistence(googleAuth, inMemoryPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(googleAuth, provider);
      const idToken = await result.user.getIdToken(true);

      const response = await fetch("/api/google-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", idToken }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "This Google account is not connected to an existing AUC Atlas account.",
        );
      }

      await signOut(googleAuth).catch(() => {});
      googleAuth = null;
      await handleLoginResult(data);
    } catch (error) {
      showMessage(getGoogleLoginError(error), "error");
    } finally {
      if (googleAuth) await signOut(googleAuth).catch(() => {});
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <button
          className="auth-google-button"
          type="button"
          disabled={googleLoading}
          onClick={startGoogleLogin}
        >
          {googleLoading ? (
            "Opening Google..."
          ) : (
            <>
              <img
                className="auth-google-icon"
                src="/google-logo.png"
                alt=""
                aria-hidden="true"
              />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <div className="auth-field">
          <label htmlFor="login-email">Email Address</label>
          <input
            type="email"
            id="login-email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <div className="auth-login-options">
          <button className="auth-button" type="submit" disabled={loginLoading}>
            {loginLoading ? "Logging In..." : "Log In"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            className="auth-passwordless-button"
            type="button"
            disabled={passwordlessLoading}
            onClick={() => requestEmailSignInCode(false)}
          >
            {passwordlessLoading ? "Sending..." : "Email Me a Sign-In Code"}
          </button>
        </div>

        <p className={`auth-message${messageType ? ` ${messageType}` : ""}`} aria-live="polite">
          {message}
        </p>
      </form>

      <div className="auth-panel-footer">
        <span>Forgot your password?</span>
        <a href="/forgot-password">Reset Password</a>
      </div>

      <div className="auth-panel-footer">
        <span>Do not have an account?</span>
        <a href="/signup">Create Account</a>
      </div>

      {modal === "authenticator" ? (
        <VerificationPanel
          key={`authenticator-${verificationReset}`}
          eyebrow="Two-Factor Authentication"
          title="Enter Authenticator Code"
          description="Open your authenticator app and enter the 6-digit code for AUC Atlas."
          label="Authenticator Code"
          submitLabel="Verify Code"
          submittingLabel="Verifying..."
          message={modalMessage}
          messageType={modalMessageType}
          submitting={modalSubmitting}
          onSubmit={verifyAuthenticator}
          actions={
            authRecoveryAvailable ? (
              <button
                className="auth-two-factor-link-button"
                type="button"
                disabled={secondaryLoading}
                onClick={() => requestRecoveryCode(false, false)}
              >
                {secondaryLoading ? (
                  "Sending code..."
                ) : (
                  <>
                    Lost access to your authenticator app?
                    <br />
                    <span>Receive a code by email</span>
                  </>
                )}
              </button>
            ) : null
          }
        />
      ) : null}

      {modal === "email-signin" ? (
        <VerificationPanel
          key={`email-signin-${verificationReset}`}
          eyebrow="Email Sign-In"
          title="Enter Email Code"
          description={`Enter the 6-digit code sent to ${activeEmailAddress}. It expires in 10 minutes.`}
          label="Email Sign-In Code"
          submitLabel="Verify Code"
          submittingLabel="Verifying..."
          message={modalMessage}
          messageType={modalMessageType}
          submitting={modalSubmitting}
          onSubmit={verifyEmailSignInCode}
          onEscape={cancelEmailSignIn}
          actions={
            <>
              <button
                className="auth-two-factor-link-button"
                type="button"
                disabled={secondaryLoading}
                onClick={() => requestEmailSignInCode(true)}
              >
                {secondaryLoading ? "Sending..." : "Send a new code"}
              </button>
              <button
                className="auth-two-factor-link-button"
                type="button"
                onClick={cancelEmailSignIn}
              >
                Cancel sign in
              </button>
            </>
          }
        />
      ) : null}

      {modal === "recovery" ? (
        <VerificationPanel
          key={`recovery-${verificationReset}`}
          eyebrow="Email Recovery"
          title="Enter Email Code"
          description={`Enter the 6-digit code sent to ${
            activeEmailAddress || "your AUC email address"
          }. It expires in 10 minutes.`}
          label="Email Recovery Code"
          submitLabel="Verify Code"
          submittingLabel="Verifying..."
          message={modalMessage}
          messageType={modalMessageType}
          submitting={modalSubmitting}
          onSubmit={verifyRecoveryCode}
          onEscape={closeRecoveryPanel}
          actions={
            <>
              <button
                className="auth-two-factor-link-button"
                type="button"
                disabled={secondaryLoading}
                onClick={() => requestRecoveryCode(recoveryEmailOnly, true)}
              >
                {secondaryLoading ? "Sending..." : "Send a new code"}
              </button>
              <button
                className="auth-two-factor-link-button"
                type="button"
                onClick={closeRecoveryPanel}
              >
                {recoveryEmailOnly ? "Cancel sign in" : "Back to authenticator app"}
              </button>
            </>
          }
        />
      ) : null}
    </>
  );
}
