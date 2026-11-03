"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { CatalogResponse, Course, Professor } from "@/lib/types";

type ProfessorReview = {
  professorId?: string;
  professorName?: string;
};

type CourseMaterial = {
  id?: string;
  courseCode?: string;
  courseTitle?: string;
  professor?: string;
  semester?: string;
  materialType?: string;
  uploadGroupId?: string;
  title?: string;
  fileName?: string;
  downloadUrl?: string;
  size?: number;
  fileType?: string;
  uploaderDisplayName?: string;
  uploaderPhotoURL?: string;
  isAnonymous?: boolean;
  createdAt?: string;
};

type MaterialsResponse = {
  materials?: CourseMaterial[];
  error?: string;
};

type CloudinaryAuthorization = {
  error?: string;
  authorizationId?: string;
  uploadUrl?: string;
  cloudinaryPublicId?: string;
  apiKey?: string;
  signature?: string;
  uploadParameters?: Record<string, string | number>;
};

type CloudinaryUploadResult = {
  asset_id?: string;
  public_id?: string;
  resource_type?: string;
  type?: string;
  bytes?: number;
};

const MATERIAL_TYPES = [
  "Notes",
  "Slides",
  "Syllabus",
  "Past exam",
  "Practice sheet",
  "Lab file",
  "Past assignments",
  "Review sheet",
];

const SEMESTERS = [
  "Fall 2026", "Summer 2026", "Spring 2026", "Winter 2026",
  "Fall 2025", "Summer 2025", "Spring 2025", "Winter 2025",
  "Fall 2024", "Summer 2024", "Spring 2024", "Winter 2024",
  "Fall 2023", "Summer 2023", "Spring 2023", "Winter 2023",
  "Fall 2022", "Summer 2022", "Spring 2022", "Winter 2022",
  "Fall 2021", "Summer 2021", "Spring 2021", "Winter 2021",
  "Fall 2020", "Summer 2020", "Spring 2020", "Winter 2020",
  "Fall 2019", "Summer 2019", "Spring 2019", "Winter 2019",
  "Fall 2018", "Summer 2018", "Spring 2018", "Winter 2018",
];

function normalizeProfessorId(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function materialTypeKey(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatBytes(value?: number) {
  const bytes = Math.max(0, Number(value) || 0);
  if (!bytes) return "Size unavailable";
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getExtension(fileName?: string) {
  const match = String(fileName || "").match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toUpperCase() || "FILE";
}

function uploadToCloudinary(
  uploadUrl: string,
  file: File,
  authorization: CloudinaryAuthorization,
  onProgress: (progress: number) => void,
) {
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file", file);
    Object.entries(authorization.uploadParameters || {}).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("api_key", String(authorization.apiKey || ""));
    formData.append("signature", String(authorization.signature || ""));

    request.open("POST", uploadUrl);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });
    request.addEventListener("load", () => {
      let data: CloudinaryUploadResult & { error?: { message?: string } | string } = {};
      try {
        data = JSON.parse(request.responseText || "{}");
      } catch {
        data = {};
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(data);
        return;
      }

      const error = data.error;
      reject(
        new Error(
          typeof error === "string"
            ? error
            : error?.message || "Cloudinary rejected the upload.",
        ),
      );
    });
    request.addEventListener("error", () => reject(new Error("The Cloudinary upload connection failed.")));
    request.addEventListener("abort", () => reject(new Error("The upload was cancelled.")));
    request.send(formData);
  });
}

export function CourseDetail({ course }: { course: Course }) {
  const [reviews, setReviews] = useState<ProfessorReview[]>([]);
  const [catalogProfessors, setCatalogProfessors] = useState<Professor[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [materialsState, setMaterialsState] = useState<"loading" | "ready" | "locked" | "error">("loading");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [uploadProfessor, setUploadProfessor] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadSemester, setUploadSemester] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAnonymous, setUploadAnonymous] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [reportMaterial, setReportMaterial] = useState<CourseMaterial | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  async function loadMaterials() {
    setMaterialsState("loading");
    try {
      const response = await fetch(
        `/api/course-materials?courseCode=${encodeURIComponent(course.code)}`,
        { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
      );
      const data = (await response.json().catch(() => ({}))) as MaterialsResponse;

      if (response.status === 401 || response.status === 403) {
        setMaterials([]);
        setMaterialsState("locked");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load course materials.");

      setMaterials(Array.isArray(data.materials) ? data.materials : []);
      setMaterialsState("ready");
    } catch {
      setMaterials([]);
      setMaterialsState("error");
    }
  }

  useEffect(() => {
    let active = true;

    fetch(`/api/professor-reviews?courseCode=${encodeURIComponent(course.code)}`, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { reviews?: ProfessorReview[] };
        if (!response.ok) throw new Error("reviews");
        if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {});

    fetch("/api/catalog", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((data: CatalogResponse) => {
        if (active) setCatalogProfessors(Array.isArray(data.professors) ? data.professors : []);
      })
      .catch(() => {});

    fetch("/api/course-popularity", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ courseCode: course.code }),
    }).catch(() => {});

    void loadMaterials();

    return () => {
      active = false;
    };
    // The route remounts when course.code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.code]);

  const courseProfessors = useMemo(() => {
    const byId = new Map(catalogProfessors.map((professor) => [normalizeProfessorId(professor.id), professor]));
    const byName = new Map(catalogProfessors.map((professor) => [String(professor.name || "").trim().toLowerCase(), professor]));
    const result = new Map<string, { id: string; name: string }>();

    reviews.forEach((review) => {
      const reviewId = normalizeProfessorId(review.professorId);
      const reviewName = String(review.professorName || "").trim();
      const known = (reviewId && byId.get(reviewId)) || byName.get(reviewName.toLowerCase());
      const id = normalizeProfessorId(known?.id || review.professorId || reviewName);
      const name = String(known?.name || reviewName).trim();
      if (id && name) result.set(id, { id, name });
    });

    return Array.from(result.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogProfessors, reviews]);

  const filteredMaterials = useMemo(() => {
    if (materialFilter === "all") return materials;
    return materials.filter((material) => materialTypeKey(material.materialType) === materialFilter);
  }, [materialFilter, materials]);

  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, CourseMaterial[]>();
    filteredMaterials.forEach((material) => {
      const key = String(material.uploadGroupId || material.id || `${material.title}-${material.fileName}`);
      const current = groups.get(key) || [];
      current.push(material);
      groups.set(key, current);
    });
    return Array.from(groups.values());
  }, [filteredMaterials]);

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!uploadProfessor || !uploadType || !uploadSemester || !uploadTitle.trim() || !uploadFiles.length) {
      setUploadError(true);
      setUploadStatus("Fill in the professor, material type, semester, title, and choose at least one file.");
      return;
    }

    const oversized = uploadFiles.find((file) => file.size > 25 * 1024 * 1024);
    if (oversized) {
      setUploadError(true);
      setUploadStatus(`${oversized.name} is above the 25MB upload limit.`);
      return;
    }

    setUploadBusy(true);
    setUploadError(false);
    setUploadStatus("");
    setUploadProgress(0);

    const totalBytes = uploadFiles.reduce((sum, file) => sum + file.size, 0);
    const uploadGroupId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    let completedBytes = 0;
    let activeAuthorizationId = "";

    try {
      for (let index = 0; index < uploadFiles.length; index += 1) {
        const file = uploadFiles[index];
        const authResponse = await fetch("/api/cloudinary-auth", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "authorize",
            courseCode: course.code,
            courseTitle: course.title,
            professor: uploadProfessor,
            semester: uploadSemester,
            materialType: uploadType,
            isAnonymous: uploadAnonymous,
            title: uploadTitle.trim(),
            fileName: file.name,
            fileSize: file.size,
          }),
        });
        const authorization = (await authResponse.json().catch(() => ({}))) as CloudinaryAuthorization;
        if (!authResponse.ok) throw new Error(authorization.error || "Could not prepare the next file upload.");

        const uploadUrl = String(authorization.uploadUrl || "");
        const publicId = String(authorization.cloudinaryPublicId || "");
        activeAuthorizationId = String(authorization.authorizationId || "");
        if (!uploadUrl || !publicId || !activeAuthorizationId || !authorization.apiKey || !authorization.signature) {
          throw new Error("The secure Cloudinary upload authorization is incomplete.");
        }

        const uploaded = await uploadToCloudinary(uploadUrl, file, authorization, (fileProgress) => {
          const uploadedBytes = completedBytes + file.size * fileProgress;
          setUploadProgress(totalBytes ? Math.round((uploadedBytes / totalBytes) * 100) : 0);
        });

        const assetId = String(uploaded.asset_id || "");
        if (
          uploaded.public_id !== publicId ||
          uploaded.resource_type !== "raw" ||
          uploaded.type !== "authenticated" ||
          Number(uploaded.bytes) !== file.size ||
          !assetId
        ) {
          throw new Error("Cloudinary returned an unexpected upload result.");
        }

        const saveResponse = await fetch("/api/course-materials", {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadAuthorizationId: activeAuthorizationId,
            uploadGroupId,
            cloudinaryPublicId: publicId,
            cloudinaryAssetId: assetId,
          }),
        });
        const saveData = (await saveResponse.json().catch(() => ({}))) as { error?: string };
        if (!saveResponse.ok) throw new Error(saveData.error || "The file uploaded, but its course-material record could not be saved.");

        activeAuthorizationId = "";
        completedBytes += file.size;
        setUploadProgress(totalBytes ? Math.round((completedBytes / totalBytes) * 100) : 100);
      }

      setUploadProfessor("");
      setUploadType("");
      setUploadSemester("");
      setUploadTitle("");
      setUploadAnonymous(false);
      setUploadFiles([]);
      setUploadStatus(uploadFiles.length === 1 ? "File uploaded successfully and added to the course materials library." : `${uploadFiles.length} files uploaded successfully and added to the course materials library.`);
      await loadMaterials();
    } catch (error) {
      if (activeAuthorizationId) {
        await fetch("/api/cloudinary-auth", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", authorizationId: activeAuthorizationId }),
        }).catch(() => {});
      }
      setUploadError(true);
      setUploadStatus(error instanceof Error ? error.message : "Upload failed. Try again.");
    } finally {
      setUploadBusy(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const materialId = String(reportMaterial?.id || "");
    const reason = reportReason.trim();
    if (!materialId || reason.length < 3) {
      setReportStatus("Briefly explain why you are reporting this content.");
      return;
    }

    setReportBusy(true);
    setReportStatus("");
    try {
      const response = await fetch("/api/content-reports", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "material", targetId: materialId, reason }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok && response.status !== 409) throw new Error(data.error || "Could not submit the report.");
      setReportStatus("Report submitted.");
      window.setTimeout(() => {
        setReportMaterial(null);
        setReportReason("");
        setReportStatus("");
      }, 650);
    } catch (error) {
      setReportStatus(error instanceof Error ? error.message : "Could not submit the report.");
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <main className="courses-page course-native-detail-page">
      <div className="courses-inner">
        <section className="course-detail-view" aria-label="Course details">
          <a className="course-back-link" href="/courses">Back to courses</a>

          <div className="course-profile-layout">
            <article className="course-profile-card">
              <section className="course-detail-hero">
                <p className="course-detail-kicker">{course.code}</p>
                <h1>{course.title}</h1>
                <p className="course-detail-description">
                  {course.description || "Course description coming soon."}
                </p>
              </section>

              <section className="course-detail-grid" aria-label="Course facts">
                <div className="course-detail-stat"><span>Subject</span><strong>{course.subject}</strong></div>
                <div className="course-detail-stat"><span>Level</span><strong>{course.level}</strong></div>
                <div className="course-detail-stat"><span>Code</span><strong>{course.code}</strong></div>
                {course.prerequisite ? (
                  <div className="course-detail-stat"><span>Prerequisite</span><strong>{course.prerequisite}</strong></div>
                ) : null}
                {courseProfessors.length ? (
                  <div className="course-detail-stat course-detail-professors">
                    <span>Professors</span>
                    <div className="course-professor-list">
                      {courseProfessors.map((professor) => (
                        <a className="course-professor-link" href={`/professors/${encodeURIComponent(professor.id)}`} key={professor.id}>
                          <strong>{professor.name}</strong>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </article>

            <aside className={`course-action-stack${materialsState === "loading" ? " is-loading" : ""}${materialsState === "locked" ? " is-locked" : ""}`} id="course-materials-access">
              {materialsState === "loading" ? (
                <div className="course-materials-loading" role="status" aria-live="polite">
                  <div className="course-materials-loading-spinner" aria-hidden="true" />
                  <p>Loading course materials</p>
                </div>
              ) : null}

              <section className="course-material-summary course-material-downloads" aria-label="Course materials">
                <div>
                  <span>Materials library</span>
                  <h2>Course files</h2>
                </div>

                <label className="course-material-filter-control">
                  <span className="sr-only">Filter course materials</span>
                  <select value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value)}>
                    <option value="all">All materials</option>
                    {MATERIAL_TYPES.map((type) => <option value={materialTypeKey(type)} key={type}>{type}</option>)}
                  </select>
                </label>

                <div className="course-materials-list" aria-label="Downloadable course files">
                  {materialsState === "error" ? <p className="course-material-status">Course materials are unavailable right now.</p> : null}
                  {materialsState === "locked" ? <p className="course-material-status">Verified account required.</p> : null}
                  {materialsState === "ready" && !groupedMaterials.length ? <p className="course-material-status">No materials match this filter yet.</p> : null}

                  {materialsState === "ready" && groupedMaterials.map((group) => {
                    const first = group[0];
                    const groupKey = first.uploadGroupId || first.id || `${first.title}-${first.fileName}`;
                    const commonMeta = [first.professor || "Professor not listed", first.semester || "Semester not listed", first.uploaderDisplayName || "AUC student", formatDate(first.createdAt)].join(" · ");

                    if (group.length > 1) {
                      return (
                        <details className="course-material-group" key={groupKey}>
                          <summary className="course-material-group-summary">
                            <span className="course-material-file-icon">{getExtension(first.fileName)}</span>
                            <span className="course-material-group-copy">
                              <span className="course-material-row-title-line"><strong>{first.title || "Course material"}</strong><em>{first.materialType || "Material"}</em></span>
                              <small>{commonMeta}</small>
                            </span>
                            <span className="course-material-file-count">{group.length} files</span>
                            <span className="course-material-group-chevron" aria-hidden="true" />
                          </summary>
                          <div className="course-material-group-files">
                            {group.map((material) => (
                              <div className="course-material-child-row" key={material.id || material.fileName}>
                                <span className="course-material-file-icon">{getExtension(material.fileName)}</span>
                                <span className="course-material-row-copy"><strong>{material.fileName || material.title || "Course material"}</strong><small>{formatBytes(material.size)}</small></span>
                                <a className="course-material-compact-download" href={material.downloadUrl || `/api/course-material-download?id=${encodeURIComponent(String(material.id || ""))}`} target="_blank" rel="noreferrer">Download</a>
                                {material.id ? <button className="course-material-report-button" type="button" onClick={() => { setReportMaterial(material); setReportReason(""); setReportStatus(""); }}>Report</button> : null}
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    }

                    const material = first;
                    return (
                      <article className="course-material-row" key={groupKey}>
                        <span className="course-material-file-icon">{getExtension(material.fileName)}</span>
                        <span className="course-material-row-copy">
                          <span className="course-material-row-title-line"><strong>{material.title || material.fileName || "Course material"}</strong><em>{material.materialType || "Material"}</em></span>
                          <small>{commonMeta} · {formatBytes(material.size)}</small>
                        </span>
                        <a className="course-material-compact-download" href={material.downloadUrl || `/api/course-material-download?id=${encodeURIComponent(String(material.id || ""))}`} target="_blank" rel="noreferrer">Download</a>
                        {material.id ? <button className="course-material-report-button" type="button" onClick={() => { setReportMaterial(material); setReportReason(""); setReportStatus(""); }}>Report</button> : null}
                      </article>
                    );
                  })}
                </div>

                {materialsState === "locked" ? (
                  <div className="course-material-access-lock">
                    <div className="course-material-access-lock-card">
                      <strong>Log in to view content</strong>
                      <p>Sign in with a verified AUC email to view and download course files.</p>
                      <a href={`/login?next=${encodeURIComponent(`/courses/${course.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}`}>Log in</a>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="material-upload-panel" aria-label="Upload course material">
                <div className="material-upload-panel-header"><span>Contribute material</span><h2>Upload material</h2></div>
                <p>Share a useful file and tie it to the professor and semester you took this course with.</p>

                <form className="material-upload-form" onSubmit={submitUpload}>
                  <div className="material-upload-grid">
                    <label className="material-upload-field">
                      <span>Professor</span>
                      <select value={uploadProfessor} onChange={(event) => setUploadProfessor(event.target.value)} required>
                        <option value="">Choose professor</option>
                        {catalogProfessors.map((professor) => <option value={professor.name} key={professor.id}>{professor.name}</option>)}
                      </select>
                    </label>
                    <label className="material-upload-field">
                      <span>Material type</span>
                      <select value={uploadType} onChange={(event) => setUploadType(event.target.value)} required>
                        <option value="">Choose material type</option>
                        {MATERIAL_TYPES.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                    <label className="material-upload-field">
                      <span>Semester</span>
                      <select value={uploadSemester} onChange={(event) => setUploadSemester(event.target.value)} required>
                        <option value="">Choose semester</option>
                        {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
                      </select>
                    </label>
                  </div>

                  <label className="material-upload-field"><span>Material title</span><input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Midterm notes, lab sheet, final review..." required /></label>
                  <label className="material-upload-field material-file-field">
                    <span>Files</span>
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png" multiple onChange={(event) => setUploadFiles(Array.from(event.target.files || []))} required />
                    <span className="material-file-control"><span className="material-file-icon" aria-hidden="true">+</span><span className="material-file-copy"><strong>{uploadFiles.length ? `${uploadFiles.length} file${uploadFiles.length === 1 ? "" : "s"} selected` : "Choose one or more files"}</strong><small>PDF, Word, PowerPoint, Excel, JPG or PNG · 25 MB per file</small></span></span>
                  </label>
                  {uploadFiles.length ? <div className="material-file-list">{uploadFiles.map((file) => <div className="material-file-item" key={`${file.name}-${file.size}`}><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>)}</div> : null}
                  <label className="material-anonymous-option"><input type="checkbox" checked={uploadAnonymous} onChange={(event) => setUploadAnonymous(event.target.checked)} /><span><strong>Upload anonymously</strong></span></label>
                  <button className="material-upload-button" type="submit" disabled={uploadBusy}>{uploadBusy ? "Uploading..." : "Upload material"}</button>
                  {uploadBusy ? <div className="material-upload-progress"><div className="material-upload-progress-head"><span>Uploading files</span><strong>{uploadProgress}%</strong></div><div className="material-upload-progress-track"><span className="material-upload-progress-fill" style={{ width: `${uploadProgress}%` }} /></div></div> : null}
                  {uploadStatus ? <p className={`material-upload-status${uploadError ? " error" : ""}`}>{uploadStatus}</p> : null}
                </form>

                {materialsState === "locked" ? (
                  <div className="course-material-access-lock">
                    <div className="course-material-access-lock-card">
                      <strong>Log in to view content</strong>
                      <p>Sign in with a verified AUC email to access the material upload form.</p>
                      <a href={`/login?next=${encodeURIComponent(`/courses/${course.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}`}>Log in</a>
                    </div>
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        </section>
      </div>

      {reportMaterial ? (
        <div className="course-report-modal" role="presentation">
          <button className="course-report-backdrop" type="button" aria-label="Close report panel" onClick={() => setReportMaterial(null)} />
          <section className="course-report-dialog" role="dialog" aria-modal="true" aria-labelledby="course-report-title">
            <header className="course-report-header">
              <div><p className="course-report-kicker">Content moderation</p><h2 id="course-report-title">Report material</h2><p>Tell us what is wrong with this course material. Our moderators will review your report.</p></div>
              <button className="course-report-close" type="button" aria-label="Close report panel" onClick={() => setReportMaterial(null)}>×</button>
            </header>
            <form className="course-report-form" onSubmit={submitReport}>
              <label className="course-report-field"><span>Reason for report</span><textarea maxLength={500} value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder="Describe the issue with this material..." required /></label>
              {reportStatus ? <p className="course-report-status">{reportStatus}</p> : null}
              <div className="course-report-actions"><button className="course-report-cancel" type="button" onClick={() => setReportMaterial(null)}>Cancel</button><button className="course-report-submit" type="submit" disabled={reportBusy}>{reportBusy ? "Submitting..." : "Submit report"}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
