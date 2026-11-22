"use client";

import { useEffect, useState, type FormEvent } from "react";

type RecentFile = {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  href: string;
};
type RecentMaterial = {
  id: string;
  title: string;
  materialType: string;
  professor: string;
  semester: string;
  createdAt: string;
  files: RecentFile[];
};
type CurrentCourse = {
  code: string;
  title: string;
  materials: RecentMaterial[];
};
type MaterialResponse = {
  status: "loading" | "ready" | "sign-in" | "verify-email" | "select-major"
    | "unsupported-major" | "plan-pending" | "error";
  term?: string;
  semester?: number;
  upcoming?: boolean;
  currentSemester?: number;
  preview?: boolean;
  fallback?: boolean;
  courses: CurrentCourse[];
};

const initial: MaterialResponse = { status: "loading", courses: [] };
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function timestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function uploadedWhen(value: string): string {
  const ms = timestamp(value);
  if (!ms) return "Date unavailable";
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 14) return "1 week ago";
  if (days < 35) return Math.floor(days / 7) + " weeks ago";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric"
  }).format(new Date(ms));
}

function latestUpload(course: CurrentCourse): number {
  return course.materials.reduce(
    (latest, material) => Math.max(latest, timestamp(material.createdAt)), 0
  );
}

function recentlyUpdated(course: CurrentCourse, now: number): boolean {
  const latest = latestUpload(course);
  return latest > 0 && latest <= now && latest >= now - WEEK_MS;
}

function courseHref(code: string): string {
  return "/courses/" + code.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function MaterialIcon() {
  return (
    <span className="homepagenew-material-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    </span>
  );
}

function fileExtension(file: RecentFile): string {
  return file.fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";
}

function fileLabel(file: RecentFile): string {
  const ext = fileExtension(file);
  if (ext === "pdf") return "PDF document";
  if (ext === "doc" || ext === "docx") return "Word document";
  if (ext === "ppt" || ext === "pptx") return "PowerPoint presentation";
  if (ext === "xls" || ext === "xlsx") return "Excel spreadsheet";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "Image";
  return ext ? ext.toUpperCase() + " file" : "File";
}

function fileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "Size unavailable";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return Math.round(size / 1024) + " KB";
  return (size / (1024 * 1024)).toFixed(1).replace(/\.0$/, "") + " MB";
}

function FileIcon({ file }: { file: RecentFile }) {
  const ext = fileExtension(file);
  const asset = ext === "pdf" ? "/PDF.svg"
    : ["doc", "docx"].includes(ext) ? "/MSWord.svg"
    : ["ppt", "pptx"].includes(ext) ? "/PPTX.svg"
    : ["xls", "xlsx"].includes(ext) ? "/Excel.svg" : "";
  return (
    <span className="homepagenew-material-file-icon" aria-hidden="true">
      {asset ? <img src={asset} alt="" /> :
        <span>{ext ? ext.toUpperCase().slice(0, 4) : "FILE"}</span>}
    </span>
  );
}

const inlineExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "gif"];
const officeExtensions = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];

function securedFileUrl(href: string): URL | null {
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin &&
      url.pathname === "/api/course-material-download" &&
      Boolean(url.searchParams.get("id")) ? url : null;
  } catch {
    return null;
  }
}

/** Match the preview behavior of the course page, never its attachment URL. */
function previewFile(file: RecentFile, onError: (message: string) => void) {
  const url = securedFileUrl(file.href);
  if (!url) {
    onError("This file cannot be opened.");
    return;
  }
  const extension = fileExtension(file);
  if (inlineExtensions.includes(extension)) {
    url.searchParams.set("disposition", "inline");
    window.open(url.href, "_blank", "noopener,noreferrer");
    return;
  }
  if (!officeExtensions.includes(extension)) {
    onError("Preview is unavailable for this file type. Use Download instead.");
    return;
  }

  // Open the tab in the click handler, before the async signed-URL request.
  const previewTab = window.open("about:blank", "_blank");
  if (previewTab) {
    previewTab.document.title = "Opening Office document";
    previewTab.document.body.textContent = "Opening in Microsoft Office viewer…";
    previewTab.opener = null;
  }
  url.searchParams.set("disposition", "office-url");
  void fetch(url.href, { credentials: "same-origin", cache: "no-store" })
    .then(async response => {
      if (!response.ok) throw new Error("The document could not be opened.");
      return response.json() as Promise<{ url?: string }>;
    })
    .then(data => {
      const signedUrl = new URL(String(data.url || ""));
      if (signedUrl.protocol !== "https:") throw new Error("Invalid preview link.");
      const officeUrl = "https://view.officeapps.live.com/op/view.aspx?src=" +
        encodeURIComponent(signedUrl.href);
      if (previewTab && !previewTab.closed) {
        previewTab.location.replace(officeUrl);
      } else {
        window.location.assign(officeUrl);
      }
    }).catch(error => {
      const message = error instanceof Error ? error.message : "Preview unavailable.";
      if (previewTab && !previewTab.closed) {
        previewTab.document.body.textContent = message;
      } else {
        onError(message);
      }
    });
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 17a5 5 0 0 1-1-9.8 6 6 0 0 1 11 1.7A4 4 0 0 1 19 17" />
    <path d="M12 12v9m0 0-3-3m3 3 3-3" />
  </svg>;
}

function FlagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 21V4m0 0c3-3 6 3 9 0s5-1 5-1v11s-2-2-5 1-6-3-9 0" />
  </svg>;
}

function MaterialSkeleton() {
  return (
    <div className="homepagenew-material-course-list" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="homepagenew-material-course-loading" key={index}>
          <span className="homepagenew-material-loading-title" />
          <span className="homepagenew-material-loading-meta" />
        </div>
      ))}
    </div>
  );
}

export default function NewHomepageMaterials({
  viewingSemester = null
}: { viewingSemester?: number | null }) {
  const [result, setResult] = useState<MaterialResponse>(initial);
  // Start with every course collapsed; expand only when a student clicks it.
  const [openedCourse, setOpenedCourse] = useState<string>("");
  const [openedUpload, setOpenedUpload] = useState<string>("");
  const [reportFile, setReportFile] = useState<RecentFile | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setResult(initial);
    setOpenedCourse("");
    setOpenedUpload("");
    setReportFile(null);
    setPreviewError("");
    const url = "/api/homepage-personalized-materials" +
      (viewingSemester === null ? "" : "?semester=" + viewingSemester);
    void fetch(url, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw Error("Could not load course materials");
      return response.json() as Promise<MaterialResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setResult({ status: "error", courses: [] });
      }
    });
    return () => controller.abort();
  }, [viewingSemester]);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportFile || reportBusy) return;
    const reason = reportReason.trim();
    if (reason.length < 3) {
      setReportError("Briefly explain why you are reporting this file.");
      return;
    }
    setReportBusy(true);
    setReportError("");
    try {
      const response = await fetch("/api/content-reports", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "material", targetId: reportFile.id, reason })
      });
      if (!response.ok && response.status !== 409) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Could not submit the report.");
      }
      setReportedIds(ids => [...ids, reportFile.id]);
      setReportFile(null);
      setReportReason("");
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Could not submit the report.");
    } finally {
      setReportBusy(false);
    }
  }

  useEffect(() => {
    if (!reportFile) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !reportBusy) setReportFile(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [reportFile, reportBusy]);

  const ready = result.status === "ready";
  const now = Date.now();
  // Updated courses first; otherwise preserve the fixed semester course order.
  const ordered = result.courses.filter(course => course.materials.length > 0).sort((a, b) => {
    const updateDifference = Number(recentlyUpdated(b, now)) -
      Number(recentlyUpdated(a, now));
    return updateDifference || latestUpload(b) - latestUpload(a);
  });
  const notice = {
    "sign-in": { label: "Sign in to see materials for your courses", href: "/login" },
    "verify-email": { label: "Verify your AUC email to access course materials", href: "/accounts" },
    "select-major": { label: "Choose your major and enrollment term in Account", href: "/accounts" },
    "unsupported-major": { label: "Materials for your major are coming soon", href: "/courses" },
    "plan-pending": { label: "The course plan for this semester is not available yet. Select Semester 1 or 2 to browse materials.", href: "" },
    "error": { label: "Could not load materials for your courses", href: "/courses" }
  }[result.status as "sign-in" | "verify-email" | "select-major"
    | "unsupported-major" | "plan-pending" | "error"];

  return (
    <section className="homepagenew-materials" aria-labelledby="homepagenew-materials-title"
      aria-busy={result.status === "loading"}>
      <div className="homepagenew-materials-heading">
        <h2 id="homepagenew-materials-title">Your Course Materials</h2>
        <a href="/courses">View all</a>
      </div>
      {result.status === "loading" ? (
        <MaterialSkeleton />
      ) : ready && ordered.length ? (
        <div className="homepagenew-material-course-list">
          {ordered.map(course => {
            const open = course.code === openedCourse;
            const updated = recentlyUpdated(course, now);
            const panelId = "homepagenew-materials-" + course.code.toLowerCase().replace(/\s+/g, "-");
            return (
              <div className="homepagenew-material-course" key={course.code}>
                <button className="homepagenew-material-course-trigger" type="button"
                  aria-expanded={open} aria-controls={panelId}
                  onClick={() => {
                    setOpenedCourse(open ? "" : course.code);
                    setOpenedUpload("");
                    setPreviewError("");
                  }}>
                  <span className="homepagenew-material-course-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5.5c2.5-1.8 5.6-1.8 9 0v15c-3.4-1.8-6.5-1.8-9 0v-15Z" />
                      <path d="M21 5.5c-2.5-1.8-5.6-1.8-9 0v15c3.4-1.8 6.5-1.8 9 0v-15Z" />
                    </svg>
                  </span>
                  <span className="homepagenew-material-course-identity">
                    <strong>{course.title}</strong>
                    <span aria-hidden="true">·</span>
                    <span className="homepagenew-material-course-code">{course.code}</span>
                  </span>
                  <span className="homepagenew-material-course-trailing">
                    {updated && (
                      <span className="homepagenew-material-new">New uploads</span>
                    )}
                    <svg className={open ? "is-open" : ""} viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.7"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div id={panelId} className="homepagenew-material-course-panel" hidden={!open}>
                  <div className="homepagenew-material-course-items">
                    {course.materials.map(material => {
                      const uploadKey = course.code + ":" + material.id;
                      const uploadOpen = openedUpload === uploadKey;
                      const uploadPanelId = "homepagenew-upload-" +
                        uploadKey.replace(/[^a-z0-9-]/gi, "-");
                      return (
                        <div className="homepagenew-material-upload" key={uploadKey}>
                          <button type="button" className="homepagenew-material-upload-summary"
                            aria-expanded={uploadOpen} aria-controls={uploadPanelId}
                            onClick={() => setOpenedUpload(uploadOpen ? "" : uploadKey)}>
                            <MaterialIcon />
                            <span className="homepagenew-material-details">
                              <strong>{material.title}</strong>
                              <span>{[material.professor, material.semester].filter(Boolean).join(" · ")}</span>
                            </span>
                            <span className="homepagenew-material-upload-end">
                              <span>{uploadedWhen(material.createdAt)}</span>
                              <svg className={uploadOpen ? "is-open" : ""} viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="1.7"
                                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </span>
                          </button>
                          <div id={uploadPanelId} className="homepagenew-material-upload-files"
                            hidden={!uploadOpen}>
                            {material.files.map(file => {
                              const canPreview = inlineExtensions.includes(fileExtension(file)) ||
                                officeExtensions.includes(fileExtension(file));
                              return (
                                <div className="homepagenew-material-file-row" key={file.id}>
                                  {canPreview ? (
                                    <button className="homepagenew-material-file-main" type="button"
                                      onClick={() => { setPreviewError(""); previewFile(file, setPreviewError); }}
                                      aria-label={"Preview " + file.fileName}>
                                      <FileIcon file={file} />
                                      <span className="homepagenew-material-file-copy">
                                        <strong>{file.fileName}</strong>
                                        <small>{fileLabel(file)} · {fileSize(file.size)}</small>
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="homepagenew-material-file-main">
                                      <FileIcon file={file} />
                                      <span className="homepagenew-material-file-copy">
                                        <strong>{file.fileName}</strong>
                                        <small>{fileLabel(file)} · {fileSize(file.size)}</small>
                                      </span>
                                    </div>
                                  )}
                                  <span className="homepagenew-material-file-actions">
                                    <a href={file.href} target="_blank" rel="noopener noreferrer"
                                      aria-label={"Download " + file.fileName} title="Download file">
                                      <DownloadIcon />
                                    </a>
                                    <button type="button" title="Report file"
                                      aria-label={"Report " + file.fileName}
                                      disabled={reportedIds.includes(file.id)}
                                      onClick={() => {
                                        setReportReason("");
                                        setReportError("");
                                        setReportFile(file);
                                      }}>
                                      <FlagIcon />
                                    </button>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <a className="homepagenew-material-course-link" href={courseHref(course.code)}>
                    Browse all {course.code} materials
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : ready ? (
        <div className="homepagenew-material-empty">
          <span>No materials have been uploaded for this semester's courses yet.</span>
        </div>
      ) : notice ? (
        <div className="homepagenew-material-empty">
          {notice.href ? <a href={notice.href}>{notice.label}</a> : <span>{notice.label}</span>}
        </div>
      ) : null}
      {previewError && (
        <p className="homepagenew-material-preview-error" role="alert">
          {previewError}
          <button type="button" onClick={() => setPreviewError("")} aria-label="Dismiss preview message">×</button>
        </p>
      )}
      {reportFile && (
        <div className="homepagenew-material-report-modal">
          <button className="homepagenew-material-report-backdrop" type="button"
            onClick={() => !reportBusy && setReportFile(null)}
            aria-label="Close report form" />
          <section className="homepagenew-material-report-dialog" role="dialog"
            aria-modal="true" aria-labelledby="homepagenew-material-report-title">
            <h3 id="homepagenew-material-report-title">Report material</h3>
            <p>{reportFile.fileName}</p>
            <form onSubmit={submitReport}>
              <label htmlFor="homepagenew-material-report-reason">Reason for report</label>
              <textarea id="homepagenew-material-report-reason" autoFocus required
                minLength={3} maxLength={1000}
                placeholder="Describe the issue with this file…"
                value={reportReason} onChange={event => setReportReason(event.target.value)}
                disabled={reportBusy} />
              {reportError && <p role="alert" className="homepagenew-material-report-error">{reportError}</p>}
              <div className="homepagenew-material-report-actions">
                <button type="submit" disabled={reportBusy}>
                  {reportBusy ? "Submitting…" : "Submit report"}
                </button>
                <button type="button" disabled={reportBusy}
                  onClick={() => setReportFile(null)}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
