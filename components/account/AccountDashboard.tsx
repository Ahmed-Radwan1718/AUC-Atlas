"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  inMemoryPersistence,
  linkWithPopup,
  setPersistence,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  accountRequest,
  authenticatorAction,
  changePassword,
  deleteAccount,
  deleteMaterial,
  deleteReview,
  loadAccount,
  loadMaterials,
  loadReviews,
  loadSessions,
  logoutAccount,
  profilePhotoAction,
  revokeSession,
  saveAccount,
  updateMaterial,
  updateReview,
} from "@/features/account/api";
import {
  MAJORS,
  MATERIAL_TYPES,
  SEMESTERS,
  type AccountMaterial,
  type AccountPanel,
  type AccountReview,
  type AccountSession,
  type AccountUser,
  type ActivityTab,
  type AuthenticatorResponse,
  type CatalogData,
  type GoogleAccountResponse,
  type MessageState,
  type TwoFactorState,
} from "@/features/account/types";

const ASSET_BASE = "";
const GOOGLE_APP_NAME = "aucAtlasGoogleConnection";
const DISPLAY_NAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const PROFILE_PHOTO_MAX_SIZE = 4 * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const EMPTY_MESSAGE: MessageState = { text: "", type: "" };

const REVIEW_SELECTS = {
  recommendation: ["Yes", "Depends", "No"],
  attendancePolicy: ["Required", "Sometimes checked", "Not important", "Not sure"],
  workload: ["Light", "Moderate", "Heavy"],
  lectureUsefulness: [
    "Essential",
    "Helpful",
    "Attending means less work at home",
    "Skippable",
    "Not lecture-based",
  ],
  officeHours: ["Helpful", "Available but limited", "Hard to reach", "Did not use"],
  gradingStyle: [
    "Exams-heavy",
    "Projects-heavy",
    "Assignments-heavy",
    "Participation-heavy",
    "Mixed",
  ],
  examDifficulty: [
    "Easier than class material",
    "Matches class material",
    "Harder than class material",
    "No exams",
  ],
  gradingTransparency: ["Rubric is clear", "Somewhat clear", "Unclear"],
  feedbackQuality: ["Helpful", "Minimal", "None", "Not applicable"],
} as const;

type ReviewDraft = {
  reviewId: string;
  courseTaken: string;
  semesterTaken: string;
  rating: string;
  recommendation: string;
  recommendationReason: string;
  attendancePolicy: string;
  workload: string;
  lectureUsefulness: string;
  officeHours: string;
  gradingStyle: string;
  examDifficulty: string;
  gradingTransparency: string;
  feedbackQuality: string;
  studentNote: string;
};

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function timestampMillis(value: AccountUser["displayNameLastChangedAt"]) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const seconds = Number(value.seconds ?? value._seconds ?? 0);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

function displayNameUnlockDate(user: AccountUser | null) {
  if (!user) return null;
  const changedAt = timestampMillis(
    user.displayNameLastChangedAt || user.usernameLastChangedAt || null,
  );
  if (!changedAt) return null;
  return new Date(changedAt + DISPLAY_NAME_CHANGE_COOLDOWN_MS);
}

function formatDate(value?: string, includeTime = false) {
  if (!value) return includeTime ? "Not available" : "Recently submitted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return includeTime ? "Not available" : "Recently submitted";
  return includeTime
    ? date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(user: AccountUser | null) {
  const name = String(user?.fullName || user?.displayName || "").trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }
  return String(user?.email || "AUC").charAt(0).toUpperCase();
}

function formatMaterialSize(value?: number) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "Size not listed";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const number = unitIndex === 0 ? Math.round(size) : size.toFixed(size >= 10 ? 0 : 1);
  return `${number} ${units[unitIndex]}`;
}

function professorSlug(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAsset(value?: string) {
  const source = String(value || "").trim();
  if (!source) return `${ASSET_BASE}/user.png`;
  if (/^https?:\/\//i.test(source)) return source;
  return `${ASSET_BASE}/${source.replace(/^\/+/, "")}`;
}

function materialIcon(fileName?: string) {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    pdf: "pdf.png",
    doc: "doc.png",
    docx: "doc.png",
    xls: "xls.png",
    xlsx: "xls.png",
    ppt: "ppt.png",
    pptx: "ppt.png",
    png: "png.png",
    jpg: "jpg.png",
    jpeg: "jpg.png",
  };
  return icons[extension] ? `/${icons[extension]}` : "";
}

function browserIcon(session: AccountSession) {
  const key = String(session.browserKey || "").toLowerCase();
  const name = String(session.browserName || session.browserLabel || "").toLowerCase();
  if (key === "safari" || name.includes("safari")) return `${ASSET_BASE}/safari-icon.png`;
  if (key === "firefox" || name.includes("firefox")) return `${ASSET_BASE}/firefox-icon.png`;
  return `${ASSET_BASE}/chrome-icon.png`;
}

function Message({ value }: { value: MessageState }) {
  return (
    <p className={`account-message${value.type ? ` ${value.type}` : ""}`} aria-live="polite">
      {value.text}
    </p>
  );
}

function CodeInputs({
  digits,
  onChange,
  inputRefs,
}: {
  digits: string[];
  onChange: (digits: string[]) => void;
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[index] = value;
    onChange(next);
    if (value) inputRefs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index]) inputRefs.current[index - 1]?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    onChange(Array.from({ length: 6 }, (_, index) => pasted.charAt(index) || ""));
    inputRefs.current[Math.max(0, Math.min(6, pasted.length) - 1)]?.focus();
  }

  return (
    <div className="account-code-inputs" aria-label="Authenticator code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          className="account-code-input"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${index + 1}`}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}

function Modal({
  children,
  onClose,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={`account-modal ${className}`}>
      <button className="account-modal-backdrop" type="button" aria-label="Close" onClick={onClose} />
      <div className="account-modal-card" role="dialog" aria-modal="true">
        <button className="account-modal-close" type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function toTwoFactor(user: AccountUser | null): TwoFactorState {
  return {
    appEnabled: Boolean(user?.twoFactor?.appEnabled),
    emailEnabled: Boolean(user?.twoFactor?.emailEnabled),
  };
}

export function AccountDashboard() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<AccountPanel>("details");
  const [activityTab, setActivityTab] = useState<ActivityTab>("reviews");
  const [catalog, setCatalog] = useState<CatalogData>({});

  const [displayName, setDisplayName] = useState("");
  const [displayNameEditMode, setDisplayNameEditMode] = useState(false);
  const [major, setMajor] = useState("");
  const [majorOpen, setMajorOpen] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);

  const [securityAccessToken, setSecurityAccessToken] = useState("");
  const [securityGateOpen, setSecurityGateOpen] = useState(false);
  const [securityDigits, setSecurityDigits] = useState(["", "", "", "", "", ""]);
  const [securityGateMessage, setSecurityGateMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [securityGateBusy, setSecurityGateBusy] = useState(false);
  const securityCodeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [securityMessage, setSecurityMessage] = useState<MessageState>(EMPTY_MESSAGE);

  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionBusy, setSessionBusy] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<MessageState>(EMPTY_MESSAGE);

  const [authenticatorSetup, setAuthenticatorSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [authenticatorDigits, setAuthenticatorDigits] = useState(["", "", "", "", "", ""]);
  const [authenticatorMessage, setAuthenticatorMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [authenticatorBusy, setAuthenticatorBusy] = useState(false);
  const authenticatorRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [disableAppOpen, setDisableAppOpen] = useState(false);
  const [disableDigits, setDisableDigits] = useState(["", "", "", "", "", ""]);
  const [disableMessage, setDisableMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [disableBusy, setDisableBusy] = useState(false);
  const disableRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [emailTwoFactorBusy, setEmailTwoFactorBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePasswordValue, setDeletePasswordValue] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [reviews, setReviews] = useState<AccountReview[]>([]);
  const [materials, setMaterials] = useState<AccountMaterial[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [reviewsMessage, setReviewsMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [uploadsMessage, setUploadsMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [activityBusy, setActivityBusy] = useState("");
  const [editingReview, setEditingReview] = useState<ReviewDraft | null>(null);
  const [reviewEditorMessage, setReviewEditorMessage] = useState<MessageState>(EMPTY_MESSAGE);
  const [editingMaterial, setEditingMaterial] = useState<AccountMaterial | null>(null);
  const [materialEditorTitle, setMaterialEditorTitle] = useState("");
  const [materialEditorType, setMaterialEditorType] = useState("");
  const [materialEditorMessage, setMaterialEditorMessage] = useState<MessageState>(EMPTY_MESSAGE);

  const twoFactor = toTwoFactor(user);
  const unlockDate = displayNameUnlockDate(user);
  const displayNameLocked = Boolean(unlockDate && unlockDate.getTime() > Date.now());

  const professorMap = useMemo(
    () => new Map((catalog.professors || []).map((professor) => [professor.id.toLowerCase(), professor])),
    [catalog.professors],
  );

  function hydrate(nextUser: AccountUser) {
    setUser(nextUser);
    setDisplayName(
      nextUser.fullName || nextUser.displayName || String(nextUser.email || "").split("@")[0] || "AUC Student",
    );
    setMajor(nextUser.major || "");
    setDisplayNameEditMode(false);
    setPhotoPreview("");
  }

  async function loadGoogleConnectionState() {
    try {
      const data = await accountRequest<GoogleAccountResponse>("/api/google-auth");
      setGoogleConnected(Boolean(data.connected));
      setGoogleEmail(data.googleEmail || "");
    } catch {
      setGoogleConnected(false);
      setGoogleEmail("");
    }
  }

  async function loadActivity() {
    setActivityLoading(true);
    setReviewsMessage(EMPTY_MESSAGE);
    setUploadsMessage(EMPTY_MESSAGE);

    const [reviewResult, materialResult] = await Promise.allSettled([loadReviews(), loadMaterials()]);
    if (reviewResult.status === "fulfilled") {
      setReviews(reviewResult.value.reviews || []);
    } else {
      setReviews([]);
      setReviewsMessage({ text: messageFrom(reviewResult.reason, "Could not load your reviews."), type: "error" });
    }
    if (materialResult.status === "fulfilled") {
      setMaterials(materialResult.value.materials || []);
    } else {
      setMaterials([]);
      setUploadsMessage({ text: messageFrom(materialResult.reason, "Could not load your uploads."), type: "error" });
    }
    setActivityLoading(false);
  }

  async function refreshSessions(token = securityAccessToken) {
    setSessionsLoading(true);
    setSecurityMessage(EMPTY_MESSAGE);
    try {
      const data = await loadSessions(token);
      setSessions(data.sessions || []);
    } catch (error) {
      setSessions([]);
      setSecurityMessage({ text: messageFrom(error, "Could not load signed-in sessions."), type: "error" });
    } finally {
      setSessionsLoading(false);
    }
  }

  async function activatePanel(panel: AccountPanel, initialUser = user) {
    if (panel === "security") {
      const state = toTwoFactor(initialUser);
      if (state.appEnabled && !securityAccessToken) {
        setSecurityDigits(["", "", "", "", "", ""]);
        setSecurityGateMessage(EMPTY_MESSAGE);
        setSecurityGateOpen(true);
        window.setTimeout(() => securityCodeRefs.current[0]?.focus(), 50);
        return;
      }
      setActivePanel("security");
      window.location.hash = "security";
      await refreshSessions(securityAccessToken);
      return;
    }

    setSecurityAccessToken("");
    setActivePanel(panel);
    window.location.hash = panel;
    if (panel === "reviews") await loadActivity();
  }

  useEffect(() => {
    document.body.classList.add("accounts-route");
    let active = true;

    async function initialize() {
      const catalogPromise = fetch("/api/catalog", { cache: "force-cache" })
        .then((response) => response.json())
        .then((data: CatalogData) => {
          if (active) setCatalog(data || {});
        })
        .catch(() => undefined);

      try {
        const data = await loadAccount();
        if (!data.signedIn || !data.user) throw new Error("Please log in to view your account.");
        if (!active) return;
        hydrate(data.user);
        setLoading(false);
        void loadGoogleConnectionState();

        const hash = window.location.hash.replace("#", "");
        const panel: AccountPanel = hash === "security" || hash === "reviews" ? hash : "details";
        if (panel === "security" && Boolean(data.user.twoFactor?.appEnabled)) {
          setSecurityGateOpen(true);
          window.setTimeout(() => securityCodeRefs.current[0]?.focus(), 50);
        } else {
          setActivePanel(panel);
          if (panel === "security") void refreshSessions("");
          if (panel === "reviews") void loadActivity();
        }
      } catch {
        try {
          localStorage.setItem("auc-atlas-login-redirect", "/accounts");
        } catch {}
        window.location.replace("/login");
      }
      await catalogPromise;
    }

    void initialize();
    return () => {
      active = false;
      document.body.classList.remove("accounts-route");
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
    // Route initialization intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".account-major-dropdown")) setMajorOpen(false);
    }
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = displayName.trim();
    const currentName = user?.fullName || user?.displayName || "";

    if (!nextName) {
      setDetailsMessage({ text: "Please enter your display name.", type: "error" });
      return;
    }
    if (nextName !== currentName && displayNameLocked) {
      setDisplayName(currentName);
      setDetailsMessage({
        text: `You can change your display name again on ${unlockDate?.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}.`,
        type: "error",
      });
      return;
    }

    setDetailsBusy(true);
    setDetailsMessage(EMPTY_MESSAGE);
    try {
      const data = await saveAccount(nextName, major.trim());
      if (!data.user) throw new Error(data.error || "Could not save your details.");
      hydrate(data.user);
      setDetailsMessage({ text: "Account details saved.", type: "success" });
    } catch (error) {
      setDisplayName(currentName);
      setDetailsMessage({ text: messageFrom(error, "Could not save your details. Please try again."), type: "error" });
    } finally {
      setDetailsBusy(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!PROFILE_PHOTO_ALLOWED_TYPES.includes(file.type)) {
      setDetailsMessage({ text: "Please choose a PNG, JPG, or WebP image.", type: "error" });
      event.target.value = "";
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setDetailsMessage({ text: "Please choose an image up to 4MB.", type: "error" });
      event.target.value = "";
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoBusy(true);
    setDetailsMessage(EMPTY_MESSAGE);

    try {
      const signature = await profilePhotoAction({ action: "signature" });
      if (
        !signature.cloudName ||
        !signature.apiKey ||
        !signature.timestamp ||
        !signature.publicId ||
        !signature.uploadPreset ||
        !signature.signature
      ) {
        throw new Error(signature.error || "Could not prepare the profile photo upload.");
      }

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signature.apiKey);
      form.append("timestamp", signature.timestamp);
      form.append("public_id", signature.publicId);
      form.append("overwrite", signature.overwrite || "false");
      form.append("invalidate", signature.invalidate || "true");
      form.append("allowed_formats", signature.allowedFormats || "jpg,jpeg,png,webp");
      form.append("upload_preset", signature.uploadPreset);
      form.append("signature", signature.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: "POST", body: form },
      );
      const upload = (await uploadResponse.json().catch(() => ({}))) as {
        secure_url?: string;
        public_id?: string;
        version?: number;
        error?: { message?: string };
      };
      const version = Number(upload.version);
      if (
        !uploadResponse.ok ||
        !upload.secure_url ||
        upload.public_id !== signature.publicId ||
        !Number.isSafeInteger(version) ||
        version <= 0
      ) {
        throw new Error(upload.error?.message || "Could not upload profile photo.");
      }

      const saved = await profilePhotoAction({ action: "save", publicId: upload.public_id, version });
      if (!saved.user) throw new Error(saved.error || "Could not save profile photo.");
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      hydrate(saved.user);
      setDetailsMessage({ text: "Profile photo updated.", type: "success" });
    } catch (error) {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      setDetailsMessage({ text: messageFrom(error, "Could not upload profile photo."), type: "error" });
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setDetailsMessage(EMPTY_MESSAGE);
    try {
      const data = await profilePhotoAction({ action: "remove" });
      if (!data.user) throw new Error(data.error || "Could not remove profile photo.");
      hydrate(data.user);
      setDetailsMessage({ text: "Profile photo removed.", type: "success" });
    } catch (error) {
      setDetailsMessage({ text: messageFrom(error, "Could not remove profile photo."), type: "error" });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function connectGoogleAccount() {
    if (googleConnected || googleBusy) return;
    setGoogleBusy(true);
    setDetailsMessage(EMPTY_MESSAGE);
    let auth: ReturnType<typeof getAuth> | null = null;

    try {
      const data = await accountRequest<GoogleAccountResponse>("/api/google-auth");
      if (!data.firebase || !data.customToken) {
        throw new Error(data.error || "Please log in again before connecting Google.");
      }

      const existingApp = getApps().find((app) => app.name === GOOGLE_APP_NAME);
      const app = existingApp || initializeApp(data.firebase, GOOGLE_APP_NAME);
      auth = getAuth(app);
      await setPersistence(auth, inMemoryPersistence);
      await signInWithCustomToken(auth, data.customToken);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Please log in again before connecting Google.");
      const alreadyLinked = currentUser.providerData.some((provider) => provider.providerId === "google.com");
      if (!alreadyLinked) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await linkWithPopup(currentUser, provider);
      }

      const idToken = await currentUser.getIdToken(true);
      const confirmed = await accountRequest<GoogleAccountResponse>("/api/google-auth", {
        method: "POST",
        body: { action: "connect", idToken },
      });
      if (!confirmed.success || !confirmed.connected) {
        throw new Error(confirmed.error || "Could not confirm the Google connection.");
      }
      setGoogleConnected(true);
      setGoogleEmail(confirmed.googleEmail || "");
      setDetailsMessage({ text: "Google connected successfully. You can now use it to log in.", type: "success" });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code || "")
          : "";
      let fallback = "Could not connect Google. Please try again.";
      if (code === "auth/popup-closed-by-user") fallback = "Google connection was closed before it finished.";
      if (code === "auth/popup-blocked") fallback = "Your browser blocked the Google popup. Please allow popups and try again.";
      if (code === "auth/credential-already-in-use" || code === "auth/account-exists-with-different-credential") {
        fallback = "That Google account is already connected to another AUC Atlas account.";
      }
      setDetailsMessage({ text: messageFrom(error, fallback), type: "error" });
    } finally {
      if (auth) await signOut(auth).catch(() => undefined);
      setGoogleBusy(false);
    }
  }

  async function verifySecurityGate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = securityDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      setSecurityGateMessage({ text: "Please enter your 6-digit authenticator code.", type: "error" });
      securityCodeRefs.current[0]?.focus();
      return;
    }

    setSecurityGateBusy(true);
    setSecurityGateMessage(EMPTY_MESSAGE);
    try {
      const data = await authenticatorAction("verify-security-panel", { code });
      const token = data.securityAccessToken || "";
      if (!token) throw new Error("Security verification could not be completed.");
      setSecurityAccessToken(token);
      setSecurityGateOpen(false);
      setSecurityDigits(["", "", "", "", "", ""]);
      setActivePanel("security");
      window.location.hash = "security";
      await refreshSessions(token);
    } catch (error) {
      setSecurityGateMessage({ text: messageFrom(error, "Invalid authenticator code."), type: "error" });
      setSecurityDigits(["", "", "", "", "", ""]);
      securityCodeRefs.current[0]?.focus();
    } finally {
      setSecurityGateBusy(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ text: "Please complete all password fields.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    if (
      newPassword.length < 10 ||
      newPassword.length > 48 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9\s]/.test(newPassword)
    ) {
      setPasswordMessage({
        text: "Password must be 10 to 48 characters and include uppercase, lowercase, special, and numeric characters.",
        type: "error",
      });
      return;
    }

    setPasswordBusy(true);
    setPasswordMessage(EMPTY_MESSAGE);
    try {
      const data = await changePassword(currentPassword, newPassword, confirmPassword, securityAccessToken);
      if (!data.success) throw new Error(data.error || "Could not change your password.");
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityMessage({ text: "Password changed successfully.", type: "success" });
    } catch (error) {
      setPasswordMessage({ text: messageFrom(error, "Could not change your password."), type: "error" });
    } finally {
      setPasswordBusy(false);
    }
  }

  function updateTwoFactorState(next: Partial<TwoFactorState>) {
    setUser((previous) =>
      previous
        ? {
            ...previous,
            twoFactor: { ...toTwoFactor(previous), ...next },
          }
        : previous,
    );
  }

  async function startAuthenticatorSetup() {
    setSecurityMessage(EMPTY_MESSAGE);
    try {
      const data = await authenticatorAction("setup");
      if (!data.qrDataUrl || !data.secret) throw new Error(data.error || "Could not start authenticator setup.");
      setAuthenticatorSetup({ qr: data.qrDataUrl, secret: data.secret });
      setAuthenticatorDigits(["", "", "", "", "", ""]);
      setAuthenticatorMessage(EMPTY_MESSAGE);
      window.setTimeout(() => authenticatorRefs.current[0]?.focus(), 50);
    } catch (error) {
      setSecurityMessage({ text: messageFrom(error, "Could not start authenticator setup."), type: "error" });
    }
  }

  async function verifyAuthenticatorSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = authenticatorDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      setAuthenticatorMessage({ text: "Please enter the 6-digit authenticator code.", type: "error" });
      return;
    }
    setAuthenticatorBusy(true);
    setAuthenticatorMessage(EMPTY_MESSAGE);
    try {
      const data = await authenticatorAction("verify-setup", { code });
      updateTwoFactorState(data.twoFactor || { appEnabled: true });
      if (data.securityAccessToken) setSecurityAccessToken(data.securityAccessToken);
      setAuthenticatorSetup(null);
      setSecurityMessage({ text: "Authenticator app enabled.", type: "success" });
    } catch (error) {
      setAuthenticatorMessage({ text: messageFrom(error, "Invalid authenticator code."), type: "error" });
      setAuthenticatorDigits(["", "", "", "", "", ""]);
    } finally {
      setAuthenticatorBusy(false);
    }
  }

  async function disableAuthenticator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = disableDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      setDisableMessage({ text: "Please enter your 6-digit authenticator code.", type: "error" });
      return;
    }
    setDisableBusy(true);
    setDisableMessage(EMPTY_MESSAGE);
    try {
      const data = await authenticatorAction("disable", { code }, securityAccessToken);
      updateTwoFactorState(data.twoFactor || { appEnabled: false });
      setSecurityAccessToken("");
      setDisableAppOpen(false);
      setDisableDigits(["", "", "", "", "", ""]);
      setSecurityMessage({ text: "Authenticator app disabled.", type: "success" });
      await refreshSessions("");
    } catch (error) {
      setDisableMessage({ text: messageFrom(error, "Could not disable authenticator app."), type: "error" });
      setDisableDigits(["", "", "", "", "", ""]);
    } finally {
      setDisableBusy(false);
    }
  }

  async function toggleEmailTwoFactor() {
    setEmailTwoFactorBusy(true);
    setSecurityMessage(EMPTY_MESSAGE);
    try {
      const action = twoFactor.emailEnabled ? "disable-email" : "enable-email";
      const data = await authenticatorAction(action, {}, securityAccessToken);
      updateTwoFactorState(data.twoFactor || { emailEnabled: !twoFactor.emailEnabled });
      setSecurityMessage({
        text: twoFactor.emailEnabled ? "Email two-factor authentication disabled." : "Email two-factor authentication enabled.",
        type: "success",
      });
    } catch (error) {
      setSecurityMessage({ text: messageFrom(error, "Could not update email two-factor authentication."), type: "error" });
    } finally {
      setEmailTwoFactorBusy(false);
    }
  }

  async function handleSessionRevoke(sessionId: string) {
    if (!sessionId) return;
    setSessionBusy(sessionId);
    setSecurityMessage(EMPTY_MESSAGE);
    try {
      const data = await revokeSession(sessionId, securityAccessToken);
      if (data.currentSignedOut) {
        window.location.replace("/login");
        return;
      }
      setSessions(data.sessions || []);
      setSecurityMessage({ text: "Session signed out.", type: "success" });
    } catch (error) {
      setSecurityMessage({ text: messageFrom(error, "Could not sign out this session."), type: "error" });
    } finally {
      setSessionBusy("");
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteConfirmation !== "DELETE") {
      setDeleteMessage({ text: "Type DELETE exactly to confirm account deletion.", type: "error" });
      return;
    }
    setDeleteBusy(true);
    setDeleteMessage(EMPTY_MESSAGE);
    try {
      const data = await deleteAccount(deletePasswordValue, deleteConfirmation, securityAccessToken);
      if (!data.success) throw new Error(data.error || "Could not delete your account.");
      try {
        localStorage.removeItem("auc-atlas-signed-in");
        localStorage.removeItem("aucAtlasSignedIn");
        sessionStorage.removeItem("auc-atlas-signed-in");
        sessionStorage.removeItem("aucAtlasSignedIn");
      } catch {}
      window.location.replace("/");
    } catch (error) {
      setDeleteMessage({ text: messageFrom(error, "Could not delete your account."), type: "error" });
      setDeleteBusy(false);
    }
  }

  function beginReviewEdit(review: AccountReview) {
    setReviewEditorMessage(EMPTY_MESSAGE);
    setEditingReview({
      reviewId: review.id || "",
      courseTaken: review.courseTaken || review.courseCode || "",
      semesterTaken: review.semesterTaken || "",
      rating: String(review.rating || ""),
      recommendation: review.recommendation || "Yes",
      recommendationReason: review.recommendationReason || "",
      attendancePolicy: review.attendancePolicy || "Required",
      workload: review.workload || "Moderate",
      lectureUsefulness: review.lectureUsefulness || "Helpful",
      officeHours: review.officeHours || "Did not use",
      gradingStyle: review.gradingStyle || "Mixed",
      examDifficulty: review.examDifficulty || "Matches class material",
      gradingTransparency: review.gradingTransparency || "Somewhat clear",
      feedbackQuality: review.feedbackQuality || "Helpful",
      studentNote: review.studentNote || "",
    });
  }

  function updateReviewDraft<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) {
    setEditingReview((previous) => (previous ? { ...previous, [key]: value } : previous));
  }

  async function saveReviewEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingReview) return;
    if (editingReview.recommendation === "Depends" && !editingReview.recommendationReason.trim()) {
      setReviewEditorMessage({ text: "Please explain what the recommendation depends on.", type: "error" });
      return;
    }
    setActivityBusy(`review:${editingReview.reviewId}`);
    setReviewEditorMessage(EMPTY_MESSAGE);
    try {
      const data = await updateReview({
        ...editingReview,
        rating: Number(editingReview.rating),
        recommendationReason: editingReview.recommendationReason.trim(),
        studentNote: editingReview.studentNote.trim(),
      });
      setReviews(data.reviews || []);
      setEditingReview(null);
      setReviewsMessage({ text: "Review updated.", type: "success" });
    } catch (error) {
      setReviewEditorMessage({ text: messageFrom(error, "Could not update your review."), type: "error" });
    } finally {
      setActivityBusy("");
    }
  }

  async function removeReview(review: AccountReview) {
    if (!review.id) return;
    if (!window.confirm(`Delete your review for ${review.professorName || "this professor"}? This cannot be undone.`)) return;
    setActivityBusy(`review:${review.id}`);
    setReviewsMessage(EMPTY_MESSAGE);
    try {
      const data = await deleteReview(review.id);
      setReviews(data.reviews || []);
      setReviewsMessage({ text: "Review deleted.", type: "success" });
    } catch (error) {
      setReviewsMessage({ text: messageFrom(error, "Could not delete your review."), type: "error" });
    } finally {
      setActivityBusy("");
    }
  }

  function beginMaterialEdit(material: AccountMaterial) {
    setEditingMaterial(material);
    setMaterialEditorTitle(material.title || "");
    setMaterialEditorType(material.materialType || "");
    setMaterialEditorMessage(EMPTY_MESSAGE);
  }

  async function saveMaterialEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMaterial?.id) return;
    setActivityBusy(`material:${editingMaterial.id}`);
    setMaterialEditorMessage(EMPTY_MESSAGE);
    try {
      const data = await updateMaterial(editingMaterial.id, materialEditorTitle.trim(), materialEditorType);
      setMaterials(data.materials || []);
      setEditingMaterial(null);
      setUploadsMessage({ text: "Upload updated.", type: "success" });
    } catch (error) {
      setMaterialEditorMessage({ text: messageFrom(error, "Could not update your upload."), type: "error" });
    } finally {
      setActivityBusy("");
    }
  }

  async function removeMaterial(material: AccountMaterial) {
    if (!material.id) return;
    if (!window.confirm(`Delete ${material.title || material.fileName || "this upload"}? This cannot be undone.`)) return;
    setActivityBusy(`material:${material.id}`);
    setUploadsMessage(EMPTY_MESSAGE);
    try {
      const data = await deleteMaterial(material.id);
      setMaterials(data.materials || []);
      setUploadsMessage({ text: "Upload deleted.", type: "success" });
    } catch (error) {
      setUploadsMessage({ text: messageFrom(error, "Could not delete your upload."), type: "error" });
    } finally {
      setActivityBusy("");
    }
  }

  async function logout() {
    await logoutAccount();
    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
      sessionStorage.removeItem("auc-atlas-signed-in");
      sessionStorage.removeItem("aucAtlasSignedIn");
    } catch {}
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="account-page">
        <section className="account-section">
          <div className="account-section-inner">
            <div className="account-panel account-route-loading active">
              <span className="account-loading-spinner" aria-hidden="true" />
              <strong>Loading account details</strong>
              <p>Retrieving your saved profile information.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const photoSrc = photoPreview || user?.photoURL || "";

  return (
    <main className="account-page">
      <section className="account-section">
        <div className="account-section-inner">
          <div className="account-header">
            <h1>My Account</h1>
            <p>Manage your details, degree progression, security, reviews, and uploaded materials.</p>
          </div>

          <div className="account-layout">
            <aside className="account-sidebar">
              <button
                className={`account-sidebar-link${activePanel === "details" ? " active" : ""}`}
                type="button"
                onClick={() => void activatePanel("details")}
              >
                <span className="account-sidebar-icon account-details-icon" aria-hidden="true" />
                <span>Account Details</span>
              </button>
              <button
                className={`account-sidebar-link${activePanel === "security" ? " active" : ""}`}
                type="button"
                onClick={() => void activatePanel("security")}
              >
                <span className="account-sidebar-icon account-security-icon" aria-hidden="true" />
                <span>Security</span>
              </button>
              <a className="account-sidebar-link" href="/degree-progression">
                <span className="account-sidebar-icon account-degree-icon" aria-hidden="true" />
                <span>Degree Progression</span>
              </a>
              <button
                className={`account-sidebar-link${activePanel === "reviews" ? " active" : ""}`}
                type="button"
                onClick={() => void activatePanel("reviews")}
              >
                <span className="account-sidebar-icon account-reviews-icon" aria-hidden="true" />
                <span>Activity History</span>
              </button>
              <button className="account-sidebar-link account-logout-link" type="button" onClick={() => void logout()}>
                <span className="account-logout-icon" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </aside>

            <section className="account-content">
              <article className={`account-panel${activePanel === "details" ? " active" : ""}`}>
                <div className="account-panel-header">
                  <h2>Saved Details</h2>
                  <p>Update your profile photo, display name, and major. Your email address and AUC ID are read-only.</p>
                </div>

                <form className="account-form" onSubmit={handleDetailsSubmit}>
                  <div className="account-profile-photo-section">
                    <div className="account-profile-photo-preview-wrap">
                      {photoSrc ? (
                        <img src={photoSrc} alt="Profile photo preview" className="account-profile-photo-preview" />
                      ) : (
                        <span className="account-profile-photo-initial">{getInitials(user)}</span>
                      )}
                    </div>
                    <div className="account-profile-photo-actions">
                      <h3>Profile Photo</h3>
                      <p>Choose an image up to 4MB.</p>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        onChange={(event) => void handlePhotoChange(event)}
                      />
                      <div className="account-profile-photo-button-row">
                        <button
                          className="account-profile-photo-button"
                          type="button"
                          disabled={photoBusy}
                          onClick={() => photoInputRef.current?.click()}
                        >
                          {photoBusy ? "Uploading..." : "Choose Photo"}
                        </button>
                        {user?.photoURL || photoPreview ? (
                          <button
                            className="account-profile-photo-remove-button"
                            type="button"
                            disabled={photoBusy}
                            onClick={() => void removePhoto()}
                          >
                            Remove Photo
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="account-form-grid account-details-grid">
                    <div className="account-field account-display-name-field">
                      <label htmlFor="account-name">Display Name</label>
                      <div className="account-display-name-row">
                        <div className="account-display-name-input-wrap">
                          <input
                            id="account-name"
                            type="text"
                            autoComplete="name"
                            maxLength={80}
                            readOnly={!displayNameEditMode || displayNameLocked}
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                          />
                          <span className="account-display-name-info-button" aria-label="Display name information">
                            <img src={`${ASSET_BASE}/username-info-icon.png`} alt="" />
                            <span className="account-display-name-tooltip">You can change your display name once every 30 days.</span>
                          </span>
                        </div>
                        <button
                          className="account-display-name-edit-button"
                          type="button"
                          aria-label={displayNameLocked ? "Display name locked" : "Edit display name"}
                          disabled={displayNameLocked}
                          onClick={() => setDisplayNameEditMode(true)}
                        >
                          <img src={`${ASSET_BASE}/username-edit-icon.png`} alt="" />
                        </button>
                      </div>
                      <p className="account-display-name-note">
                        {displayNameLocked && unlockDate
                          ? `You can change your display name again on ${unlockDate.toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}.`
                          : ""}
                      </p>
                    </div>

                    <div className="account-field">
                      <label htmlFor="account-email">Email Address</label>
                      <input id="account-email" type="email" value={user?.email || ""} readOnly />
                    </div>

                    <div className="account-field">
                      <label>Major</label>
                      <div className={`account-major-dropdown${majorOpen ? " open" : ""}`}>
                        <button
                          className="account-major-trigger"
                          type="button"
                          aria-expanded={majorOpen}
                          onClick={() => setMajorOpen((value) => !value)}
                        >
                          <span>{major || "Select your major"}</span>
                          <span className="account-major-chevron" aria-hidden="true" />
                        </button>
                        <div className="account-major-menu" hidden={!majorOpen}>
                          <button type="button" className={!major ? "active" : ""} onClick={() => { setMajor(""); setMajorOpen(false); }}>
                            Select your major
                          </button>
                          {MAJORS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={major === option ? "active" : ""}
                              onClick={() => { setMajor(option); setMajorOpen(false); }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="account-field">
                      <label htmlFor="account-auc-id">AUC ID</label>
                      <input id="account-auc-id" type="text" value={user?.aucId || user?.aucIdLookupKey || ""} readOnly />
                    </div>
                  </div>

                  <div className="account-divider" />
                  <div className="account-panel-subheader">
                    <div>
                      <h3>Connected Accounts</h3>
                      <p>View the sign-in methods currently connected to your account.</p>
                    </div>
                  </div>

                  <div className="account-connected-grid">
                    <div className="account-connected-account-card">
                      <div className="account-connected-account-main">
                        <div className="account-connected-title">
                          <img src={`${ASSET_BASE}/email-2fa-icon.png`} alt="" />
                          <span>Email &amp; Password</span>
                        </div>
                        <strong>Connected</strong>
                        <p>Use your email address and password to sign in.</p>
                      </div>
                      <div className="account-connected-actions">
                        <span className="account-connected-badge is-connected">Connected</span>
                      </div>
                    </div>

                    <div className="account-connected-account-card">
                      <div className="account-connected-account-main">
                        <div className="account-connected-title">
                          <img src={`${ASSET_BASE}/google-logo.png`} alt="" />
                          <span>Google</span>
                        </div>
                        <strong>{googleConnected ? "Connected" : "Not Connected"}</strong>
                        <p>Use your Google account to sign in faster.</p>
                      </div>
                      <div className="account-connected-actions">
                        <button
                          className={`account-connected-action-button ${googleConnected ? "is-connected" : "is-connect"}`}
                          type="button"
                          disabled={googleConnected || googleBusy}
                          title={googleConnected && googleEmail ? `Connected to ${googleEmail}` : undefined}
                          onClick={() => void connectGoogleAccount()}
                        >
                          {googleBusy ? "Connecting..." : googleConnected ? "Connected" : "Connect"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button className="account-primary-button" type="submit" disabled={detailsBusy}>
                    {detailsBusy ? "Saving..." : "Save Changes"}
                  </button>
                  <Message value={detailsMessage} />
                </form>
              </article>

              <article className={`account-panel${activePanel === "security" ? " active" : ""}`}>
                <div className="account-panel-header">
                  <h2>Change your password</h2>
                  <p>For your security, choose a unique password that you do not use for any other account.</p>
                </div>

                {!passwordOpen ? (
                  <button className="account-primary-button" type="button" onClick={() => { setPasswordOpen(true); setPasswordMessage(EMPTY_MESSAGE); }}>
                    Change Password
                  </button>
                ) : (
                  <form className="account-form account-password-form" onSubmit={handlePasswordSubmit}>
                    <div className="account-form-grid">
                      <div className="account-field">
                        <label htmlFor="current-password">Current Password</label>
                        <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                      </div>
                      <div className="account-field">
                        <label htmlFor="new-password">New Password</label>
                        <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                      </div>
                      <div className="account-field">
                        <label htmlFor="confirm-new-password">Confirm New Password</label>
                        <input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                      </div>
                    </div>
                    <div className="account-password-actions">
                      <button className="account-secondary-button" type="button" disabled={passwordBusy} onClick={() => { setPasswordOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
                        Cancel
                      </button>
                      <button className="account-primary-button" type="submit" disabled={passwordBusy}>
                        {passwordBusy ? "Saving..." : "Save Password"}
                      </button>
                    </div>
                    <Message value={passwordMessage} />
                  </form>
                )}

                <div className="account-divider" />
                <div className="account-two-factor-section">
                  <div className="account-panel-subheader"><h3>Two-Factor Authentication</h3></div>
                  <div className="account-two-factor-methods">
                    <article className="account-two-factor-card">
                      <div className="account-two-factor-icon"><img src={`${ASSET_BASE}/authenticator-icon.png`} alt="" /></div>
                      <div className="account-two-factor-text">
                        <h4>Authenticator App <span className={`account-two-factor-status${twoFactor.appEnabled ? " enabled" : ""}`}>{twoFactor.appEnabled ? "On" : "Off"}</span></h4>
                        <p>Use a code from Google Authenticator, Microsoft Authenticator, Authy, or another authenticator app.</p>
                      </div>
                      <button
                        className={`account-two-factor-button${twoFactor.appEnabled ? " is-danger" : ""}`}
                        type="button"
                        onClick={() => {
                          if (twoFactor.appEnabled) {
                            setDisableDigits(["", "", "", "", "", ""]);
                            setDisableMessage(EMPTY_MESSAGE);
                            setDisableAppOpen(true);
                            window.setTimeout(() => disableRefs.current[0]?.focus(), 50);
                          } else {
                            void startAuthenticatorSetup();
                          }
                        }}
                      >
                        {twoFactor.appEnabled ? "Disable app" : "Set up app"}
                      </button>
                    </article>

                    <article className="account-two-factor-card">
                      <div className="account-two-factor-icon"><img src={`${ASSET_BASE}/email-2fa-icon.png`} alt="" /></div>
                      <div className="account-two-factor-text">
                        <h4>Email <span className={`account-two-factor-status${twoFactor.emailEnabled ? " enabled" : ""}`}>{twoFactor.emailEnabled ? "On" : "Off"}</span></h4>
                        <p>Use a 6-digit code sent to the email address connected to your account.</p>
                      </div>
                      <button
                        className={`account-two-factor-button${twoFactor.emailEnabled ? " is-danger" : ""}`}
                        type="button"
                        disabled={emailTwoFactorBusy}
                        onClick={() => void toggleEmailTwoFactor()}
                      >
                        {emailTwoFactorBusy ? "Saving..." : twoFactor.emailEnabled ? "Disable" : "Enable"}
                      </button>
                    </article>
                  </div>
                </div>

                <div className="account-divider" />
                <div className="account-login-sessions-section">
                  <div className="account-panel-subheader">
                    <h3>Logged-In Sessions</h3>
                    <p>Browsers and devices that are currently signed in to your account.</p>
                  </div>
                  <div className="account-login-sessions-list">
                    {sessionsLoading ? (
                      <div className="account-empty-state"><h3>Loading sessions</h3><p>Checking browsers and devices signed in to your account.</p></div>
                    ) : sessions.length ? (
                      sessions.map((session) => {
                        const browser = session.browserName || session.browserLabel || "Browser";
                        const platform = session.platformLabel || session.osName || "Device";
                        const title = session.deviceLabel || `${browser} on ${platform}`;
                        return (
                          <article key={session.id || `${title}-${session.createdAt}`} className={`account-login-session-card${session.current ? " current" : ""}`}>
                            <div className="account-login-session-main">
                              <div className="account-login-session-head">
                                <div className="account-login-session-title">
                                  <img className="account-login-session-browser-icon" src={browserIcon(session)} alt="" />
                                  <h4>{title}</h4>
                                </div>
                                <div className="account-login-session-actions">
                                  {session.current ? <span className="account-login-session-current">Current</span> : null}
                                  {!session.current && session.id ? (
                                    <button className="account-login-session-revoke" type="button" disabled={sessionBusy === session.id} onClick={() => void handleSessionRevoke(session.id || "")}>
                                      {sessionBusy === session.id ? "Signing out..." : "SIGN OUT"}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              <p>{browser} · {platform}</p>
                              <div className="account-login-session-meta">
                                <span>Last active {formatDate(session.lastSeenAt || session.createdAt, true)}</span>
                                <span>Signed in {formatDate(session.createdAt, true)}</span>
                                {session.ipAddress ? <span>IP {session.ipAddress}</span> : null}
                              </div>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="account-empty-state"><h3>No active sessions</h3><p>No browsers or devices are currently signed in to your account.</p></div>
                    )}
                  </div>
                </div>

                <div className="account-divider" />
                <div className="account-panel-subheader">
                  <div><h3>Delete Account</h3><p>This permanently deletes your account, profile data, reviews, and uploaded materials.</p></div>
                </div>
                <button className="account-danger-button" type="button" onClick={() => { setDeleteOpen(true); setDeleteMessage(EMPTY_MESSAGE); }}>
                  Delete Account
                </button>
                <Message value={securityMessage} />
              </article>

              <article className={`account-panel${activePanel === "reviews" ? " active" : ""}`}>
                <div className="account-panel-header">
                  <h2>Activity History</h2>
                  <p>Manage the reviews and course materials submitted from your account.</p>
                </div>
                <div className="account-activity-tabs" role="tablist" aria-label="Activity history">
                  <button className={`account-activity-tab${activityTab === "reviews" ? " active" : ""}`} type="button" role="tab" aria-selected={activityTab === "reviews"} onClick={() => setActivityTab("reviews")}>Reviews</button>
                  <button className={`account-activity-tab${activityTab === "uploads" ? " active" : ""}`} type="button" role="tab" aria-selected={activityTab === "uploads"} onClick={() => setActivityTab("uploads")}>Uploads</button>
                </div>

                {activityTab === "reviews" ? (
                  <section className="account-activity-section" role="tabpanel">
                    <div className="account-review-list">
                      {activityLoading ? (
                        <div className="account-empty-state"><h3>Loading reviews</h3><p>Checking the reviews submitted from your account.</p></div>
                      ) : reviews.length ? (
                        reviews.map((review) => {
                          const professor = professorMap.get(String(review.professorId || "").toLowerCase());
                          const name = review.professorName || professor?.name || "Professor review";
                          const slug = professorSlug(review.professorId);
                          const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating || 0))));
                          return (
                            <article className="account-review-item" key={review.id || `${name}-${review.createdAt}`}>
                              {slug ? (
                                <a className="account-review-professor-photo" href={`/professors/${encodeURIComponent(slug)}`} aria-label={`Open ${name} profile`}>
                                  <img src={normalizeAsset(professor?.image)} alt={name} />
                                </a>
                              ) : (
                                <div className="account-review-professor-photo"><img src={normalizeAsset(professor?.image)} alt={name} /></div>
                              )}
                              <div className="account-review-body">
                                <div className="account-review-head">
                                  <div>
                                    <h3>{slug ? <a className="account-review-professor-name" href={`/professors/${encodeURIComponent(slug)}`}>{name}</a> : name}</h3>
                                    <p>{formatDate(review.createdAt)}</p>
                                  </div>
                                  <span className="account-review-rating" aria-label={`${rating} out of 5 stars`}>
                                    {Array.from({ length: 5 }, (_, index) => <span key={index} className={`account-review-star${index < rating ? " is-filled" : ""}`}>★</span>)}
                                  </span>
                                </div>
                                <div className="account-review-meta"><span>{review.courseTaken || review.courseCode || "Course not listed"}</span><span>{review.semesterTaken || "Semester not listed"}</span></div>
                                <p className="account-review-copy">{review.studentNote || "No written note."}</p>
                                <div className="account-review-actions">
                                  <button className="account-review-action-button" type="button" onClick={() => beginReviewEdit(review)}>Edit</button>
                                  <button className="account-review-action-button is-danger" type="button" disabled={activityBusy === `review:${review.id}`} onClick={() => void removeReview(review)}>{activityBusy === `review:${review.id}` ? "Deleting..." : "Delete"}</button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="account-empty-state"><h3>No reviews yet</h3><p>Your professor and course reviews will appear here after submission.</p></div>
                      )}
                    </div>
                    <Message value={reviewsMessage} />
                  </section>
                ) : (
                  <section className="account-activity-section" role="tabpanel">
                    <div className="account-upload-list">
                      {activityLoading ? (
                        <div className="account-empty-state"><h3>Loading uploads</h3><p>Checking the course materials submitted from your account.</p></div>
                      ) : materials.length ? (
                        materials.map((material) => {
                          const icon = materialIcon(material.fileName);
                          const extension = String(material.fileName || "FILE").split(".").pop()?.slice(0, 5).toUpperCase() || "FILE";
                          return (
                            <article className="account-upload-item" key={material.id || `${material.fileName}-${material.createdAt}`}>
                              <div className="account-upload-icon-wrap">
                                {icon ? <img className="account-upload-file-icon" src={icon} alt="" /> : <span className="account-upload-file-icon-fallback">{extension}</span>}
                              </div>
                              <div className="account-upload-body">
                                <div className="account-upload-head">
                                  <div><h3>{material.title || "Course material"}</h3><p>{formatDate(material.createdAt)}</p></div>
                                </div>
                                <div className="account-review-meta"><span>{material.courseCode || "Course not listed"}</span><span>{material.materialType || "Material"}</span><span>{formatMaterialSize(material.size)}</span></div>
                                <p className="account-review-copy">{material.fileName || "File name not listed"}</p>
                                <div className="account-upload-actions">
                                  {material.downloadUrl ? <a className="account-upload-download-button" href={material.downloadUrl}>Download</a> : null}
                                  <button className="account-review-action-button" type="button" onClick={() => beginMaterialEdit(material)}>Edit</button>
                                  <button className="account-review-action-button is-danger" type="button" disabled={activityBusy === `material:${material.id}`} onClick={() => void removeMaterial(material)}>{activityBusy === `material:${material.id}` ? "Deleting..." : "Delete"}</button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="account-empty-state"><h3>No uploads yet</h3><p>Course materials uploaded from your account will appear here.</p></div>
                      )}
                    </div>
                    <Message value={uploadsMessage} />
                  </section>
                )}
              </article>
            </section>
          </div>
        </div>
      </section>

      {securityGateOpen ? (
        <Modal onClose={() => setSecurityGateOpen(false)} className="security-access-modal">
          <div className="account-modal-header">
            <span>Security check</span>
            <h2>Verify Security Access</h2>
            <p>Enter the 6-digit code from your authenticator app before opening sensitive account settings.</p>
          </div>
          <form className="account-modal-form" onSubmit={verifySecurityGate}>
            <div className="account-field"><label>Authenticator Code</label><CodeInputs digits={securityDigits} onChange={setSecurityDigits} inputRefs={securityCodeRefs} /></div>
            <button className="account-primary-button account-modal-primary" type="submit" disabled={securityGateBusy}>{securityGateBusy ? "Verifying..." : "Verify Code"}</button>
            <button className="account-modal-link-button" type="button" onClick={() => setSecurityGateOpen(false)}>Cancel</button>
            <Message value={securityGateMessage} />
          </form>
        </Modal>
      ) : null}

      {authenticatorSetup ? (
        <Modal onClose={() => setAuthenticatorSetup(null)}>
          <div className="account-modal-header"><h2>Set up authenticator app</h2><p>Scan this QR code in your authenticator app, then enter the 6-digit code it shows.</p></div>
          <div className="account-authenticator-setup-grid">
            <div className="account-authenticator-qr-wrap"><img src={authenticatorSetup.qr} alt="Authenticator setup QR code" /></div>
            <div className="account-authenticator-manual"><span>Manual setup key</span><strong>{authenticatorSetup.secret.replace(/(.{4})/g, "$1 ").trim()}</strong></div>
          </div>
          <form className="account-modal-form" onSubmit={verifyAuthenticatorSetup}>
            <div className="account-field"><label>Authenticator Code</label><CodeInputs digits={authenticatorDigits} onChange={setAuthenticatorDigits} inputRefs={authenticatorRefs} /></div>
            <div className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setAuthenticatorSetup(null)}>Cancel</button><button className="account-primary-button" type="submit" disabled={authenticatorBusy}>{authenticatorBusy ? "Verifying..." : "Verify and Enable"}</button></div>
            <Message value={authenticatorMessage} />
          </form>
        </Modal>
      ) : null}

      {disableAppOpen ? (
        <Modal onClose={() => setDisableAppOpen(false)}>
          <div className="account-modal-header"><span>Two-Factor Authentication</span><h2>Disable Authenticator App</h2><p>Enter a current 6-digit authenticator code to confirm this security change.</p></div>
          <form className="account-modal-form" onSubmit={disableAuthenticator}>
            <div className="account-field"><label>Authenticator Code</label><CodeInputs digits={disableDigits} onChange={setDisableDigits} inputRefs={disableRefs} /></div>
            <div className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setDisableAppOpen(false)}>Cancel</button><button className="account-danger-button" type="submit" disabled={disableBusy}>{disableBusy ? "Disabling..." : "Disable App"}</button></div>
            <Message value={disableMessage} />
          </form>
        </Modal>
      ) : null}

      {deleteOpen ? (
        <Modal onClose={() => setDeleteOpen(false)}>
          <div className="account-modal-header"><span>Permanent action</span><h2>Delete Account</h2><p>This permanently deletes your profile, reviews, uploaded materials, security settings, and account. This cannot be undone.</p></div>
          <form className="account-modal-form" onSubmit={handleDeleteAccount}>
            <div className="account-field"><label htmlFor="delete-account-password">Current password</label><input id="delete-account-password" type="password" maxLength={1024} autoComplete="current-password" value={deletePasswordValue} onChange={(event) => setDeletePasswordValue(event.target.value)} required /></div>
            <div className="account-field"><label htmlFor="delete-account-confirmation">Type DELETE to confirm</label><input id="delete-account-confirmation" type="text" maxLength={6} autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} required /></div>
            <div className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="account-danger-button" type="submit" disabled={deleteBusy}>{deleteBusy ? "Deleting..." : "Delete Account"}</button></div>
            <Message value={deleteMessage} />
          </form>
        </Modal>
      ) : null}

      {editingReview ? (
        <Modal onClose={() => setEditingReview(null)} className="account-review-editor-modal">
          <div className="account-modal-header"><span>Edit review</span><h2>{reviews.find((review) => review.id === editingReview.reviewId)?.professorName || "Professor Review"}</h2></div>
          <form className="account-review-editor-form" onSubmit={saveReviewEdit}>
            <div className="account-review-editor-grid">
              <div className="account-review-editor-section-heading">Course context</div>
              <label className="account-review-editor-field"><span>Course taken</span><select required value={editingReview.courseTaken} onChange={(event) => updateReviewDraft("courseTaken", event.target.value)}><option value="" disabled>Choose course</option>{(catalog.courses || []).map((course) => <option key={course.code} value={course.code}>{course.code} — {course.title}</option>)}</select></label>
              <label className="account-review-editor-field"><span>Semester taken</span><select required value={editingReview.semesterTaken} onChange={(event) => updateReviewDraft("semesterTaken", event.target.value)}><option value="" disabled>Choose semester</option>{SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}</select></label>
              <label className="account-review-editor-field"><span>Overall rating</span><select required value={editingReview.rating} onChange={(event) => updateReviewDraft("rating", event.target.value)}><option value="" disabled>Choose rating</option>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label>
              <label className="account-review-editor-field"><span>Would you recommend for this course?</span><select value={editingReview.recommendation} onChange={(event) => updateReviewDraft("recommendation", event.target.value)}>{REVIEW_SELECTS.recommendation.map((value) => <option key={value}>{value}</option>)}</select></label>
              {editingReview.recommendation === "Depends" ? <label className="account-review-editor-field full"><span>If your answer depends, what does it depend on?</span><input maxLength={5000} value={editingReview.recommendationReason} onChange={(event) => updateReviewDraft("recommendationReason", event.target.value)} /></label> : null}
              <div className="account-review-editor-section-heading">Class experience</div>
              {([
                ["attendancePolicy", "Attendance policy", REVIEW_SELECTS.attendancePolicy],
                ["workload", "Workload", REVIEW_SELECTS.workload],
                ["lectureUsefulness", "Lecture usefulness", REVIEW_SELECTS.lectureUsefulness],
                ["officeHours", "Office hours/help", REVIEW_SELECTS.officeHours],
                ["gradingStyle", "Grading style", REVIEW_SELECTS.gradingStyle],
                ["examDifficulty", "Exam difficulty", REVIEW_SELECTS.examDifficulty],
                ["gradingTransparency", "Grading transparency", REVIEW_SELECTS.gradingTransparency],
                ["feedbackQuality", "Feedback quality", REVIEW_SELECTS.feedbackQuality],
              ] as const).map(([key, label, values]) => <label className="account-review-editor-field" key={key}><span>{label}</span><select value={editingReview[key]} onChange={(event) => updateReviewDraft(key, event.target.value)}>{values.map((value) => <option key={value}>{value}</option>)}</select></label>)}
              <label className="account-review-editor-field full"><span>Additional comments (optional)</span><textarea maxLength={5000} value={editingReview.studentNote} onChange={(event) => updateReviewDraft("studentNote", event.target.value)} /></label>
            </div>
            <div className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setEditingReview(null)}>Cancel</button><button className="account-primary-button" type="submit" disabled={activityBusy === `review:${editingReview.reviewId}`}>{activityBusy === `review:${editingReview.reviewId}` ? "Saving..." : "Save Changes"}</button></div>
            <Message value={reviewEditorMessage} />
          </form>
        </Modal>
      ) : null}

      {editingMaterial ? (
        <Modal onClose={() => setEditingMaterial(null)}>
          <div className="account-modal-header"><span>Edit upload</span><h2>Course Material</h2></div>
          <form className="account-modal-form" onSubmit={saveMaterialEdit}>
            <div className="account-field"><label htmlFor="account-material-title">Material name</label><input id="account-material-title" type="text" maxLength={160} required value={materialEditorTitle} onChange={(event) => setMaterialEditorTitle(event.target.value)} /></div>
            <div className="account-field"><label htmlFor="account-material-type">Category</label><select id="account-material-type" required value={materialEditorType} onChange={(event) => setMaterialEditorType(event.target.value)}><option value="" disabled>Choose category</option>{MATERIAL_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
            <div className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setEditingMaterial(null)}>Cancel</button><button className="account-primary-button" type="submit" disabled={activityBusy === `material:${editingMaterial.id}`}>{activityBusy === `material:${editingMaterial.id}` ? "Saving..." : "Save Changes"}</button></div>
            <Message value={materialEditorMessage} />
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
