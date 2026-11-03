"use client";

import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ADMIN_ACCESS_STORAGE_KEY = "auc-atlas-admin-access";

type AdminPanel =
  | "users"
  | "reports"
  | "reviews"
  | "materials"
  | "notifications";

type MessageState = { text: string; type: "" | "error" | "success" };

type AdminError = Error & {
  status?: number;
  code?: string;
  requiresTwoFactor?: boolean;
};

type AdminUser = {
  uid: string;
  email?: string;
  displayName?: string;
  major?: string;
  aucId?: string;
  disabled?: boolean;
  emailVerified?: boolean;
  isAdmin?: boolean;
  activeSessionRecords?: number | null;
  banReason?: string;
  createdAt?: string;
  lastSignInAt?: string;
};

type AdminReport = {
  id: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  reason?: string;
  reporterUid?: string;
  reporterEmail?: string;
  createdAt?: string;
  targetSnapshot?: {
    professorName?: string;
    courseCode?: string;
    studentNote?: string;
    title?: string;
    fileName?: string;
  };
};

type AdminReview = {
  id: string;
  professorName?: string;
  courseCode?: string;
  rating?: number;
  semesterTaken?: string;
  studentNote?: string;
  authorName?: string;
  authorUid?: string;
  createdAt?: string;
};

type AdminMaterial = {
  id: string;
  source?: string;
  courseCode?: string;
  materialType?: string;
  title?: string;
  fileName?: string;
  fileId?: string;
  status?: string;
  uploaderDisplayName?: string;
  uploaderUid?: string;
  createdAt?: string;
};

type AdminNotification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  expiresAt?: string;
  active?: boolean;
  linkUrl?: string;
  linkLabel?: string;
};

type AdminDashboardData = {
  success?: boolean;
  admin?: {
    uid?: string;
    email?: string;
    displayName?: string;
  };
  stats?: {
    users?: number;
    reviews?: number;
    materials?: number;
    bannedUsers?: number;
  };
  users?: AdminUser[];
  reports?: AdminReport[];
  reviews?: AdminReview[];
  materials?: AdminMaterial[];
  notifications?: AdminNotification[];
  requiresTwoFactor?: boolean;
  adminChallengeToken?: string;
  adminAccessToken?: string;
  adminAccessExpiresAt?: string;
  error?: string;
  code?: string;
};

function normalizeSearch(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value: unknown) {
  if (!value) return "Date unavailable";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readStoredAdminAccess() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ADMIN_ACCESS_STORAGE_KEY) || "{}") as {
      token?: unknown;
      expiresAt?: unknown;
    };
    const token = String(stored.token || "");
    const expiresAt = String(stored.expiresAt || "");
    const expiresAtTime = new Date(expiresAt).getTime();

    if (
      !/^[a-f0-9]{64}$/i.test(token) ||
      !Number.isFinite(expiresAtTime) ||
      expiresAtTime <= Date.now()
    ) {
      sessionStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
      return { token: "", expiresAt: "" };
    }

    return { token, expiresAt };
  } catch {
    try {
      sessionStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
    } catch {}
    return { token: "", expiresAt: "" };
  }
}

export function AdminDashboard() {
  const [screen, setScreen] = useState<"loading" | "auth" | "denied" | "app">("loading");
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [activePanel, setActivePanel] = useState<AdminPanel>("users");
  const [adminAccessToken, setAdminAccessToken] = useState("");
  const [adminAccessExpiresAt, setAdminAccessExpiresAt] = useState("");
  const [adminChallengeToken, setAdminChallengeToken] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<MessageState>({ text: "", type: "" });
  const [deniedMessage, setDeniedMessage] = useState(
    "You must be an authorized AUC Atlas administrator to open this page.",
  );
  const [authBusy, setAuthBusy] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorDigits, setTwoFactorDigits] = useState(["", "", "", "", "", ""]);
  const [twoFactorMessage, setTwoFactorMessage] = useState<MessageState>({ text: "", type: "" });
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [notificationFormMessage, setNotificationFormMessage] = useState<MessageState>({
    text: "",
    type: "",
  });
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  function clearStoredAccess() {
    setAdminAccessToken("");
    setAdminAccessExpiresAt("");
    try {
      sessionStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
    } catch {}
  }

  function showAuthenticationGate(message = "") {
    clearStoredAccess();
    setAdminChallengeToken("");
    setTwoFactorOpen(false);
    setTwoFactorDigits(["", "", "", "", "", ""]);
    setTwoFactorMessage({ text: "", type: "" });
    setAuthPassword("");
    setAuthMessage({ text: message, type: message ? "error" : "" });
    setScreen("auth");
    window.requestAnimationFrame(() => passwordRef.current?.focus());
  }

  function showDenied(message?: string) {
    clearStoredAccess();
    setAdminChallengeToken("");
    setTwoFactorOpen(false);
    setDeniedMessage(message || "Administrator access could not be verified.");
    setScreen("denied");
  }

  async function requestJson(
    method: "GET" | "POST",
    payload?: Record<string, unknown>,
    explicitToken?: string,
  ) {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (method === "POST") headers["Content-Type"] = "application/json";

    const token = explicitToken ?? adminAccessToken;
    if (token) headers["X-AUC-Admin-Access"] = token;

    const response = await fetch("/api/admin", {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers,
      body: method === "POST" ? JSON.stringify(payload || {}) : undefined,
    });
    const data = (await response.json().catch(() => ({}))) as AdminDashboardData;

    if (!response.ok) {
      const error = new Error(data.error || "The request could not be completed.") as AdminError;
      error.status = response.status;
      error.code = data.code || "";
      error.requiresTwoFactor = Boolean(data.requiresTwoFactor);

      if (error.code === "admin-fresh-auth-required" && token) {
        showAuthenticationGate(error.message);
      }
      throw error;
    }

    return data;
  }

  async function loadDashboard(token = adminAccessToken, message = "") {
    try {
      const data = await requestJson("GET", undefined, token);
      setDashboard(data);
      setScreen("app");
      if (message) setToast(message);
    } catch (error) {
      const adminError = error as AdminError;
      if (adminError.code === "admin-fresh-auth-required") return;
      showDenied(adminError.message || "Administrator access could not be verified.");
    }
  }

  async function prepareAdminAuthentication() {
    setScreen("loading");
    const stored = readStoredAdminAccess();
    if (stored.token) {
      setAdminAccessToken(stored.token);
      setAdminAccessExpiresAt(stored.expiresAt);
      await loadDashboard(stored.token);
      return;
    }

    try {
      await requestJson("POST", { action: "getAuthenticationRequirements" }, "");
      showAuthenticationGate();
    } catch (error) {
      showDenied((error as Error).message || "Administrator access could not be verified.");
    }
  }

  useEffect(() => {
    document.body.classList.add("admin-dashboard-route");
    void prepareAdminAuthentication();
    return () => document.body.classList.remove("admin-dashboard-route");
    // Initial access check intentionally runs only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function completeAdminAuthentication(data: AdminDashboardData) {
    const token = String(data.adminAccessToken || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new Error("Administrator access could not be created.");
    }

    const expiresAt = String(data.adminAccessExpiresAt || "");
    setAdminAccessToken(token);
    setAdminAccessExpiresAt(expiresAt);
    setAdminChallengeToken("");
    setAuthPassword("");
    setTwoFactorOpen(false);
    setTwoFactorDigits(["", "", "", "", "", ""]);

    try {
      sessionStorage.setItem(
        ADMIN_ACCESS_STORAGE_KEY,
        JSON.stringify({ token, expiresAt }),
      );
    } catch {}

    setScreen("loading");
    await loadDashboard(token);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy) return;

    if (!authPassword) {
      setAuthMessage({ text: "Enter your administrator account password.", type: "error" });
      passwordRef.current?.focus();
      return;
    }

    setAuthBusy(true);
    setAuthMessage({ text: "Verifying administrator password...", type: "" });

    try {
      const data = await requestJson(
        "POST",
        { action: "authenticateAdminPassword", password: authPassword },
        "",
      );
      setAuthPassword("");

      if (data.requiresTwoFactor) {
        const challengeToken = String(data.adminChallengeToken || "");
        if (!/^[a-f0-9]{64}$/i.test(challengeToken)) {
          throw new Error("Authenticator verification could not be started.");
        }

        setAdminChallengeToken(challengeToken);
        setTwoFactorDigits(["", "", "", "", "", ""]);
        setTwoFactorMessage({ text: "", type: "" });
        setTwoFactorOpen(true);
        window.setTimeout(() => codeRefs.current[0]?.focus(), 50);
      } else {
        await completeAdminAuthentication(data);
      }
    } catch (error) {
      setAuthMessage({
        text: (error as Error).message || "Administrator authentication failed.",
        type: "error",
      });
      passwordRef.current?.focus();
    } finally {
      setAuthBusy(false);
    }
  }

  function updateCodeDigit(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, "").slice(0, 1);
    setTwoFactorDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
    if (value && codeRefs.current[index + 1]) codeRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !twoFactorDigits[index] && codeRefs.current[index - 1]) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;
    event.preventDefault();
    const digits = Array.from({ length: 6 }, (_, index) => pastedCode.charAt(index) || "");
    setTwoFactorDigits(digits);
    const focusIndex = Math.max(0, Math.min(pastedCode.length, 6) - 1);
    codeRefs.current[focusIndex]?.focus();
  }

  async function handleTwoFactorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy) return;
    const authenticatorCode = twoFactorDigits.join("");

    if (!/^\d{6}$/.test(authenticatorCode)) {
      setTwoFactorMessage({ text: "Enter your 6-digit authenticator code.", type: "error" });
      codeRefs.current[0]?.focus();
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(adminChallengeToken)) {
      showAuthenticationGate("Administrator verification expired. Enter your password again.");
      return;
    }

    setAuthBusy(true);
    setTwoFactorMessage({ text: "", type: "" });

    try {
      const data = await requestJson(
        "POST",
        {
          action: "verifyAdminAuthenticator",
          adminChallengeToken,
          authenticatorCode,
        },
        "",
      );
      await completeAdminAuthentication(data);
    } catch (error) {
      const adminError = error as AdminError;
      if (adminError.code === "admin-auth-challenge-invalid") {
        showAuthenticationGate(
          adminError.message || "Administrator verification expired. Enter your password again.",
        );
        return;
      }

      setTwoFactorDigits(["", "", "", "", "", ""]);
      setTwoFactorMessage({
        text: adminError.message || "The authenticator code is incorrect.",
        type: "error",
      });
      codeRefs.current[0]?.focus();
    } finally {
      setAuthBusy(false);
    }
  }

  async function runAction(key: string, payload: Record<string, unknown>, successMessage: string) {
    if (busyKey) return;
    setBusyKey(key);
    try {
      await requestJson("POST", payload);
      await loadDashboard(adminAccessToken, successMessage);
    } catch (error) {
      setToast((error as Error).message || "The administrator action could not be completed.");
    } finally {
      setBusyKey("");
    }
  }

  const filteredUsers = useMemo(() => {
    const search = normalizeSearch(userSearch);
    return (dashboard?.users || []).filter(
      (user) =>
        !search ||
        normalizeSearch(
          [user.displayName, user.email, user.uid, user.major, user.aucId, user.banReason].join(" "),
        ).includes(search),
    );
  }, [dashboard?.users, userSearch]);

  const filteredReports = useMemo(() => {
    const search = normalizeSearch(reportSearch);
    return (dashboard?.reports || []).filter(
      (report) =>
        !search ||
        normalizeSearch(
          [
            report.targetType,
            report.targetId,
            report.targetLabel,
            report.reason,
            report.reporterUid,
            report.reporterEmail,
            JSON.stringify(report.targetSnapshot || {}),
          ].join(" "),
        ).includes(search),
    );
  }, [dashboard?.reports, reportSearch]);

  const filteredReviews = useMemo(() => {
    const search = normalizeSearch(reviewSearch);
    return (dashboard?.reviews || []).filter(
      (review) =>
        !search ||
        normalizeSearch(
          [
            review.id,
            review.professorName,
            review.courseCode,
            review.authorName,
            review.authorUid,
            review.studentNote,
          ].join(" "),
        ).includes(search),
    );
  }, [dashboard?.reviews, reviewSearch]);

  const filteredMaterials = useMemo(() => {
    const search = normalizeSearch(materialSearch);
    return (dashboard?.materials || []).filter(
      (material) =>
        !search ||
        normalizeSearch(
          [
            material.id,
            material.title,
            material.fileName,
            material.courseCode,
            material.uploaderDisplayName,
            material.uploaderUid,
            material.materialType,
            material.status,
          ].join(" "),
        ).includes(search),
    );
  }, [dashboard?.materials, materialSearch]);

  function openReportTarget(report: AdminReport) {
    if (report.targetType === "review") {
      setReviewSearch(report.targetId || "");
      setActivePanel("reviews");
    } else {
      setMaterialSearch(report.targetId || "");
      setActivePanel("materials");
    }
  }

  function dismissReport(report: AdminReport) {
    const reason = window.prompt("Internal reason for dismissing this report?", "Reviewed and dismissed");
    if (reason === null || !window.confirm("Dismiss all open reports for this content?")) return;
    void runAction(
      `report-${report.id}`,
      { action: "dismissReport", reportId: report.id, reason },
      "Content report dismissed.",
    );
  }

  function deleteReview(review: AdminReview) {
    const reason = window.prompt("Reason for deleting this review?", "");
    if (reason === null || !window.confirm("Permanently delete this review?")) return;
    void runAction(
      `review-${review.id}`,
      { action: "deleteReview", reviewId: review.id, reason },
      "Review deleted.",
    );
  }

  function deleteMaterial(material: AdminMaterial) {
    const reason = window.prompt("Reason for deleting this upload?", "");
    if (reason === null || !window.confirm("Delete this uploaded content?")) return;
    void runAction(
      `material-${material.id}`,
      {
        action: "deleteMaterial",
        materialId: material.id,
        source: material.source || "firestore",
        fileId: material.fileId || "",
        title: material.title || material.fileName || "Course material",
        reason,
      },
      "Uploaded content deleted.",
    );
  }

  function updateUserBan(user: AdminUser) {
    const isBanning = !user.disabled;
    const reason = window.prompt(
      isBanning ? "Reason for banning this user?" : "Reason for unbanning this user?",
      isBanning ? "Violation of AUC Atlas rules" : "",
    );
    if (
      reason === null ||
      !window.confirm(isBanning ? "Ban this user and revoke all sessions?" : "Unban this user?")
    ) {
      return;
    }

    void runAction(
      `ban-${user.uid}`,
      { action: "setUserBan", uid: user.uid, banned: isBanning, reason },
      isBanning ? "User banned." : "User unbanned.",
    );
  }

  function revokeSessions(user: AdminUser) {
    const reason = window.prompt("Reason for revoking all sessions?", "Security reset");
    if (reason === null || !window.confirm("Sign this user out of every recorded session?")) return;
    void runAction(
      `sessions-${user.uid}`,
      { action: "revokeUserSessions", uid: user.uid, reason },
      "All user sessions were revoked.",
    );
  }

  async function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotificationFormMessage({ text: "", type: "" });
    if (busyKey) return;
    setBusyKey("notification-create");

    try {
      await requestJson("POST", {
        action: "createNotification",
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
      });
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationType("info");
      setNotificationFormMessage({ text: "Notification published.", type: "success" });
      await loadDashboard(adminAccessToken, "Notification published.");
    } catch (error) {
      setNotificationFormMessage({
        text: (error as Error).message || "Could not publish the notification.",
        type: "error",
      });
    } finally {
      setBusyKey("");
    }
  }

  function deleteNotification(notification: AdminNotification) {
    if (!window.confirm("Delete this notification for everyone?")) return;
    void runAction(
      `notification-${notification.id}`,
      { action: "deleteNotification", notificationId: notification.id },
      "Notification deleted.",
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        {screen === "loading" ? (
          <section className="admin-state-card" id="admin-loading">
            <p className="admin-kicker">AUC Atlas administration</p>
            <h1>Checking access</h1>
            <p>Verifying your administrator session before opening the secure dashboard.</p>
          </section>
        ) : null}

        {screen === "auth" ? (
          <section className="admin-state-card" id="admin-auth">
            <p className="admin-kicker">Fresh authentication required</p>
            <h1>Verify access</h1>
            <p>Enter the current password for your administrator account to continue.</p>
            <form className="admin-form admin-auth-form" onSubmit={handlePasswordSubmit}>
              <div className="admin-field">
                <label htmlFor="admin-auth-password">Administrator password</label>
                <input
                  ref={passwordRef}
                  id="admin-auth-password"
                  name="password"
                  type="password"
                  maxLength={1024}
                  autoComplete="current-password"
                  required
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              </div>
              <button className="admin-button primary admin-auth-submit" type="submit" disabled={authBusy}>
                {authBusy ? "Checking password..." : "Continue"}
              </button>
              <p className={`admin-message${authMessage.type ? ` ${authMessage.type}` : ""}`} aria-live="polite">
                {authMessage.text}
              </p>
            </form>
          </section>
        ) : null}

        {screen === "denied" ? (
          <section className="admin-state-card" id="admin-denied">
            <p className="admin-kicker">Restricted area</p>
            <h1>Access denied</h1>
            <p>{deniedMessage}</p>
            <a href="/login">Go to login</a>
          </section>
        ) : null}

        {screen === "app" && dashboard ? (
          <div id="admin-app">
            <header className="admin-header">
              <div>
                <p className="admin-kicker">AUC Atlas administration</p>
                <h1>Admin Dashboard</h1>
              </div>
              <div className="admin-header-copy">
                Review registered users, moderate reviews and uploads, and manage site notifications.
                {dashboard.admin?.email ? <p className="admin-identity">{dashboard.admin.email}</p> : null}
              </div>
            </header>

            <section className="admin-stats" aria-label="Site statistics">
              <article className="admin-stat"><span>Registered profiles</span><strong>{Number(dashboard.stats?.users || 0).toLocaleString("en-US")}</strong></article>
              <article className="admin-stat"><span>Professor reviews</span><strong>{Number(dashboard.stats?.reviews || 0).toLocaleString("en-US")}</strong></article>
              <article className="admin-stat"><span>Active materials</span><strong>{Number(dashboard.stats?.materials || 0).toLocaleString("en-US")}</strong></article>
              <article className="admin-stat"><span>Banned users</span><strong>{Number(dashboard.stats?.bannedUsers || 0).toLocaleString("en-US")}</strong></article>
            </section>

            <div className="admin-layout">
              <aside className="admin-sidebar" aria-label="Admin sections">
                {([
                  ["users", "Users"],
                  ["reports", "Reports"],
                  ["reviews", "Reviews"],
                  ["materials", "Uploads"],
                  ["notifications", "Notifications"],
                ] as Array<[AdminPanel, string]>).map(([panel, label]) => (
                  <button
                    key={panel}
                    className={`admin-nav-button${activePanel === panel ? " active" : ""}`}
                    type="button"
                    onClick={() => setActivePanel(panel)}
                  >
                    {label}
                  </button>
                ))}
              </aside>

              <section>
                <article className={`admin-panel${activePanel === "reports" ? " active" : ""}`}>
                  <div className="admin-panel-heading">
                    <div><h2>Content reports</h2><p>Review user reports for professor reviews and approved course-material uploads.</p></div>
                    <input className="admin-search" type="search" placeholder="Search reports" aria-label="Search content reports" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} />
                  </div>
                  <div className="admin-list">
                    {filteredReports.length ? filteredReports.map((report) => {
                      const snapshot = report.targetSnapshot || {};
                      const targetType = report.targetType === "material" ? "material" : "review";
                      const targetSummary = targetType === "review"
                        ? [snapshot.professorName, snapshot.courseCode].filter(Boolean).join(" · ")
                        : [snapshot.title, snapshot.courseCode].filter(Boolean).join(" · ");
                      const targetCopy = targetType === "review" ? snapshot.studentNote : snapshot.fileName;
                      return (
                        <article className="admin-item" key={report.id}>
                          <div className="admin-item-main">
                            <div className="admin-item-title">{report.targetLabel || targetSummary || "Reported content"}</div>
                            <div className="admin-meta"><span className="admin-badge is-danger">Open report</span><span>{targetType}</span><span>{report.targetId || "Target unavailable"}</span><span>{formatDate(report.createdAt)}</span></div>
                            {targetSummary ? <p className="admin-item-copy"><strong>Content:</strong> {targetSummary}</p> : null}
                            {targetCopy ? <p className="admin-item-copy">{targetCopy}</p> : null}
                            <p className="admin-item-copy"><strong>Report reason:</strong> {report.reason || "No reason supplied."}</p>
                            <p className="admin-item-copy"><strong>Reporter:</strong> {report.reporterEmail || "Email unavailable"} · {report.reporterUid || "UID unavailable"}</p>
                          </div>
                          <div className="admin-item-actions">
                            <button className="admin-button" type="button" onClick={() => openReportTarget(report)}>{targetType === "review" ? "Open review" : "Open upload"}</button>
                            <button className="admin-button danger" type="button" disabled={busyKey === `report-${report.id}`} onClick={() => dismissReport(report)}>{busyKey === `report-${report.id}` ? "Working..." : "Dismiss report"}</button>
                          </div>
                        </article>
                      );
                    }) : <div className="admin-empty">No open content reports were found.</div>}
                  </div>
                </article>

                <article className={`admin-panel${activePanel === "reviews" ? " active" : ""}`}>
                  <div className="admin-panel-heading">
                    <div><h2>Professor reviews</h2><p>Search the latest reviews and permanently remove content that violates site rules.</p></div>
                    <input className="admin-search" type="search" placeholder="Search reviews" aria-label="Search reviews" value={reviewSearch} onChange={(event) => setReviewSearch(event.target.value)} />
                  </div>
                  <div className="admin-list">
                    {filteredReviews.length ? filteredReviews.map((review) => (
                      <article className="admin-item" key={review.id}>
                        <div className="admin-item-main">
                          <div className="admin-item-title">{review.professorName || "Professor review"}</div>
                          <div className="admin-meta"><span>{review.courseCode || "Course not listed"}</span><span>{Number(review.rating || 0)} / 5</span><span>{review.semesterTaken || "Semester not listed"}</span><span>{formatDate(review.createdAt)}</span></div>
                          <p className="admin-item-copy">{review.studentNote || "No written comment."}</p>
                          <p className="admin-item-copy"><strong>Author:</strong> {review.authorName || "AUC student"} · {review.authorUid || "UID unavailable"}</p>
                        </div>
                        <div className="admin-item-actions"><button className="admin-button danger" type="button" disabled={busyKey === `review-${review.id}`} onClick={() => deleteReview(review)}>{busyKey === `review-${review.id}` ? "Working..." : "Delete review"}</button></div>
                      </article>
                    )) : <div className="admin-empty">No matching professor reviews were found.</div>}
                  </div>
                </article>

                <article className={`admin-panel${activePanel === "materials" ? " active" : ""}`}>
                  <div className="admin-panel-heading">
                    <div><h2>Uploaded content</h2><p>Remove Cloudinary course-material uploads and reject their Firestore records from one place.</p></div>
                    <input className="admin-search" type="search" placeholder="Search uploads" aria-label="Search uploads" value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} />
                  </div>
                  <div className="admin-list">
                    {filteredMaterials.length ? filteredMaterials.map((material) => (
                      <article className="admin-item" key={material.id}>
                        <div className="admin-item-main">
                          <div className="admin-item-title">{material.title || material.fileName || "Course material"}</div>
                          <div className="admin-meta"><span>{material.courseCode || "Course not listed"}</span><span>{material.materialType || "Material"}</span><span>{material.source || "firestore"}</span><span>{normalizeSearch(material.status || "pending")}</span><span>{formatDate(material.createdAt)}</span></div>
                          <p className="admin-item-copy">{material.fileName || "Filename unavailable"}</p>
                          <p className="admin-item-copy"><strong>Uploader:</strong> {material.uploaderDisplayName || "AUC student"} · {material.uploaderUid || "UID unavailable"}</p>
                        </div>
                        <div className="admin-item-actions"><button className="admin-button danger" type="button" disabled={busyKey === `material-${material.id}`} onClick={() => deleteMaterial(material)}>{busyKey === `material-${material.id}` ? "Working..." : "Delete upload"}</button></div>
                      </article>
                    )) : <div className="admin-empty">No matching uploaded materials were found.</div>}
                  </div>
                </article>

                <article className={`admin-panel${activePanel === "users" ? " active" : ""}`}>
                  <div className="admin-panel-heading">
                    <div><h2>Registered users</h2><p>Every registered Firebase account is loaded automatically with its profile, account status, and moderation controls.</p></div>
                    <input className="admin-search" type="search" placeholder="Filter users" aria-label="Filter registered users" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                  </div>
                  <div className="admin-list">
                    {filteredUsers.length ? filteredUsers.map((user) => (
                      <article className="admin-user-result" key={user.uid}>
                        <div className="admin-user-head">
                          <div><h3>{user.displayName || user.email || user.uid}</h3><p className="admin-item-copy">{user.email || "Email unavailable"}</p></div>
                          <div className="admin-meta"><span className={`admin-badge${user.disabled ? " is-danger" : " is-success"}`}>{user.disabled ? "Banned" : "Active"}</span>{user.isAdmin ? <span className="admin-badge">Administrator</span> : null}</div>
                        </div>
                        <div className="admin-user-details">
                          <div className="admin-user-detail"><span>Firebase UID</span><strong>{user.uid}</strong></div>
                          <div className="admin-user-detail"><span>Email verified</span><strong>{user.emailVerified ? "Yes" : "No"}</strong></div>
                          <div className="admin-user-detail"><span>Major</span><strong>{user.major || "Not provided"}</strong></div>
                          <div className="admin-user-detail"><span>AUC ID</span><strong>{user.aucId || "Not provided"}</strong></div>
                          <div className="admin-user-detail"><span>Session records</span><strong>{user.activeSessionRecords === null || user.activeSessionRecords === undefined ? "Not loaded" : user.activeSessionRecords}</strong></div>
                          <div className="admin-user-detail"><span>Created</span><strong>{formatDate(user.createdAt)}</strong></div>
                          <div className="admin-user-detail"><span>Last sign in</span><strong>{formatDate(user.lastSignInAt)}</strong></div>
                          <div className="admin-user-detail"><span>Ban reason</span><strong>{user.banReason || "Not banned"}</strong></div>
                        </div>
                        {!user.isAdmin ? (
                          <div className="admin-user-actions">
                            <button className={`admin-button ${user.disabled ? "primary" : "danger"}`} type="button" disabled={busyKey === `ban-${user.uid}`} onClick={() => updateUserBan(user)}>{busyKey === `ban-${user.uid}` ? "Working..." : user.disabled ? "Unban user" : "Ban user"}</button>
                            <button className="admin-button" type="button" disabled={busyKey === `sessions-${user.uid}`} onClick={() => revokeSessions(user)}>{busyKey === `sessions-${user.uid}` ? "Working..." : "Revoke all sessions"}</button>
                          </div>
                        ) : null}
                      </article>
                    )) : <div className="admin-empty">{userSearch ? "No registered users match this filter." : "No registered Firebase users were found."}</div>}
                  </div>
                </article>

                <article className={`admin-panel${activePanel === "notifications" ? " active" : ""}`}>
                  <div className="admin-panel-heading"><div><h2>Site notifications</h2><p>Publish an announcement for every visitor. Signed-in users keep their read state across devices.</p></div></div>
                  <div className="admin-form-card">
                    <form className="admin-form" onSubmit={handleNotificationSubmit}>
                      <div className="admin-form-grid">
                        <div className="admin-field"><label htmlFor="admin-notification-title">Title</label><input id="admin-notification-title" type="text" maxLength={120} autoComplete="off" required value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} /></div>
                        <div className="admin-field"><label htmlFor="admin-notification-type">Type</label><select id="admin-notification-type" value={notificationType} onChange={(event) => setNotificationType(event.target.value)}><option value="info">Information</option><option value="important">Important</option><option value="maintenance">Maintenance</option></select></div>
                        <div className="admin-field full"><label htmlFor="admin-notification-message">Message</label><textarea id="admin-notification-message" maxLength={1600} placeholder="Write the notification shown to users." required value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} /></div>
                      </div>
                      <div><button className="admin-button primary" type="submit" disabled={busyKey === "notification-create"}>{busyKey === "notification-create" ? "Working..." : "Publish notification"}</button></div>
                      <p className={`admin-message${notificationFormMessage.type ? ` ${notificationFormMessage.type}` : ""}`} aria-live="polite">{notificationFormMessage.text}</p>
                    </form>
                  </div>
                  <div className="admin-list admin-notification-list">
                    {(dashboard.notifications || []).length ? (dashboard.notifications || []).map((notification) => {
                      const type = normalizeSearch(notification.type || "info");
                      const typeLabel = type === "important" ? "Important" : type === "maintenance" ? "Maintenance" : "Information";
                      return (
                        <article className="admin-item" key={notification.id}>
                          <div className="admin-item-main">
                            <div className="admin-item-title">{notification.title || "Site notification"}</div>
                            <div className="admin-meta"><span className={`admin-badge${type === "important" ? " is-danger" : ""}`}>{typeLabel}</span><span className={`admin-badge${notification.active ? " is-success" : ""}`}>{notification.active ? "Active" : "Expired"}</span><span>{formatDate(notification.createdAt)}</span>{notification.expiresAt ? <span>Expires {formatDate(notification.expiresAt)}</span> : null}</div>
                            <p className="admin-item-copy admin-notification-message">{notification.message || ""}</p>
                            {notification.linkUrl ? <p className="admin-item-copy"><strong>Link:</strong> {notification.linkUrl} · {notification.linkLabel || "View details"}</p> : null}
                          </div>
                          <div className="admin-item-actions"><button className="admin-button danger" type="button" disabled={busyKey === `notification-${notification.id}`} onClick={() => deleteNotification(notification)}>{busyKey === `notification-${notification.id}` ? "Working..." : "Delete notification"}</button></div>
                        </article>
                      );
                    }) : <div className="admin-empty">No site notifications have been published yet.</div>}
                  </div>
                </article>
              </section>
            </div>
          </div>
        ) : null}
      </div>

      {twoFactorOpen ? (
        <div className="admin-two-factor-panel">
          <div className="admin-two-factor-card">
            <div className="admin-two-factor-header">
              <p className="admin-two-factor-eyebrow">Two-Factor Authentication</p>
              <h2>Enter Authenticator Code</h2>
              <p>Open your authenticator app and enter the 6-digit code for AUC Atlas.</p>
            </div>
            <form className="admin-form" onSubmit={handleTwoFactorSubmit}>
              <div className="admin-field">
                <label>Authenticator Code</label>
                <div className="admin-two-factor-code-inputs" aria-label="Authenticator code">
                  {twoFactorDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => { codeRefs.current[index] = node; }}
                      className="admin-two-factor-code-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      aria-label={`Digit ${index + 1}`}
                      value={digit}
                      onChange={(event) => updateCodeDigit(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      onPaste={handleCodePaste}
                    />
                  ))}
                </div>
              </div>
              <div className="admin-two-factor-actions">
                <button className="admin-button primary" type="submit" disabled={authBusy}>{authBusy ? "Verifying..." : "Verify Code"}</button>
                <button className="admin-two-factor-link-button" type="button" onClick={() => showAuthenticationGate("Administrator authentication cancelled.")}>Cancel</button>
              </div>
              <p className={`admin-message${twoFactorMessage.type ? ` ${twoFactorMessage.type}` : ""}`} aria-live="polite">{twoFactorMessage.text}</p>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <div className="admin-toast" role="status">{toast}</div> : null}
      <span className="admin-access-expiry" aria-hidden="true" data-expires-at={adminAccessExpiresAt} />
    </main>
  );
}
