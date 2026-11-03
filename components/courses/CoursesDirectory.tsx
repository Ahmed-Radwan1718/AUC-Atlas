"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogResponse, Course } from "@/lib/types";

const FALLBACK_POPULAR_CODES = [
  "MACT 1121",
  "CSCE 1001",
  "PHYS 1011",
  "CHEM 1005",
  "ACCT 2001",
  "ECON 2011",
  "MKTG 2101",
  "BADM 2001",
];

const SEARCH_SUGGESTIONS = [
  "Search Computer Science",
  "Search Calculus II",
  "Search CSCE 1101",
  "Search Business",
  "Search 3000 Level",
  "Search Senior Project",
];

const LEGACY_ORIGIN = "https://aucatlas.com";

type PopularCourseResponse = {
  popularCourses?: Array<{ courseCode?: string }>;
};

type CourseMaterial = {
  id?: string;
  courseCode?: string;
  courseTitle?: string;
  title?: string;
  materialType?: string;
  professor?: string;
  semester?: string;
  fileName?: string;
  fileType?: string;
  uploaderDisplayName?: string;
  uploaderPhotoURL?: string;
  isAnonymous?: boolean;
  createdAt?: string;
};

type CourseMaterialsResponse = {
  materials?: CourseMaterial[];
  error?: string;
};

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function normalizeCourseCode(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
}

function getCourseSlug(value: unknown) {
  return normalizeCourseCode(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCourseUrl(courseCode: string, hash = "") {
  const slug = getCourseSlug(courseCode);
  return slug ? `/courses/${encodeURIComponent(slug)}${hash}` : "/courses";
}

function getFileExtension(fileName?: string, fileType?: string) {
  const name = String(fileName || "").trim();
  const match = name.match(/\.([a-z0-9]+)$/i);
  if (match?.[1]) return match[1].toLowerCase();

  const type = String(fileType || "").toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.includes("word") || type.includes("document")) return "doc";
  if (type.includes("powerpoint") || type.includes("presentation")) return "ppt";
  if (type.includes("excel") || type.includes("spreadsheet")) return "xls";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return "file";
}

function getFileIcon(extension: string) {
  const map: Record<string, string> = {
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

  return map[extension] ? `${LEGACY_ORIGIN}/${map[extension]}` : "";
}

function formatMaterialDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function useAnimatedPlaceholder(query: string) {
  const [placeholder, setPlaceholder] = useState("Search courses...");

  useEffect(() => {
    if (query.trim()) {
      setPlaceholder("Search courses...");
      return;
    }

    let cancelled = false;
    let suggestionIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      if (cancelled) return;

      const suggestion = SEARCH_SUGGESTIONS[suggestionIndex];
      setPlaceholder(suggestion.substring(0, characterIndex));

      if (!deleting && characterIndex < suggestion.length) {
        characterIndex += 1;
        timer = window.setTimeout(tick, 70);
        return;
      }

      if (!deleting && characterIndex === suggestion.length) {
        deleting = true;
        timer = window.setTimeout(tick, 1200);
        return;
      }

      if (deleting && characterIndex > 0) {
        characterIndex -= 1;
        timer = window.setTimeout(tick, 35);
        return;
      }

      deleting = false;
      suggestionIndex = (suggestionIndex + 1) % SEARCH_SUGGESTIONS.length;
      timer = window.setTimeout(tick, 250);
    };

    timer = window.setTimeout(tick, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return placeholder;
}

export function CoursesDirectory() {
  const [catalog, setCatalog] = useState<CatalogResponse>({
    courses: [],
    professors: [],
  });
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [popularCodes, setPopularCodes] = useState<string[]>(FALLBACK_POPULAR_CODES);
  const [materials, setMaterials] = useState<CourseMaterial[] | null>(null);
  const [materialsStatus, setMaterialsStatus] = useState<
    "loading" | "ready" | "locked" | "error"
  >("loading");
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const placeholder = useAnimatedPlaceholder(query);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((data: CatalogResponse) => {
        if (active) setCatalog(data);
      })
      .catch(() => {});

    fetch("/api/course-popularity", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("popularity");
        return response.json();
      })
      .then((data: PopularCourseResponse) => {
        if (!active) return;

        const ranked = Array.isArray(data.popularCourses)
          ? data.popularCourses
              .map((item) => normalizeCourseCode(item?.courseCode))
              .filter(Boolean)
          : [];

        setPopularCodes([...ranked, ...FALLBACK_POPULAR_CODES]);
      })
      .catch(() => {});

    fetch("/api/course-materials?random=true&limit=6", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as CourseMaterialsResponse;

        if (response.status === 401 || response.status === 403) {
          if (active) setMaterialsStatus("locked");
          return;
        }

        if (!response.ok) throw new Error(data.error || "materials");

        if (active) {
          setMaterials(Array.isArray(data.materials) ? data.materials.slice(0, 6) : []);
          setMaterialsStatus("ready");
        }
      })
      .catch(() => {
        if (active) setMaterialsStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const matchingCourses = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    return catalog.courses.filter((course) => {
      const searchable = normalize(
        [course.code, course.title, course.subject, course.department, course.level].join(" "),
      );
      return searchable.includes(normalizedQuery);
    });
  }, [catalog.courses, query]);

  const coursesByCode = useMemo(() => {
    const map = new Map<string, Course>();
    catalog.courses.forEach((course) => map.set(normalizeCourseCode(course.code), course));
    return map;
  }, [catalog.courses]);

  const popularCourses = useMemo(() => {
    const seen = new Set<string>();
    const result: Course[] = [];

    for (const code of popularCodes) {
      const normalizedCode = normalizeCourseCode(code);
      const course = coursesByCode.get(normalizedCode);
      if (!course || seen.has(normalizedCode)) continue;
      seen.add(normalizedCode);
      result.push(course);
      if (result.length === 8) break;
    }

    return result;
  }, [coursesByCode, popularCodes]);

  const hasActiveSearch = Boolean(query.trim() && searchOpen);

  function handleSearchChange(value: string) {
    setQuery(value);
    setSearchOpen(Boolean(value.trim()));
  }

  return (
    <main className="courses-page">
      <div className="courses-inner">
        <div className="courses-list-view">
          <section className="courses-header">
            <h1>Find your course material.</h1>
            <p>Search by course code, title, subject, department, or level.</p>
          </section>

          <section className="courses-browser" aria-label="Course search and discovery">
            <section className={`courses-results${hasActiveSearch ? " is-search-active" : ""}`}>
              <div className="courses-search-box" ref={searchBoxRef}>
                <input
                  id="course-search-input"
                  type="search"
                  placeholder={placeholder}
                  aria-label="Search courses"
                  aria-controls="course-search-dropdown"
                  aria-expanded={hasActiveSearch}
                  autoComplete="off"
                  value={query}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onFocus={() => {
                    if (query.trim()) setSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchOpen(false);
                      event.currentTarget.blur();
                    }
                  }}
                />

                <div
                  className="courses-search-dropdown"
                  id="course-search-dropdown"
                  hidden={!hasActiveSearch}
                >
                  <div className="courses-result-count">
                    {matchingCourses.length} matches
                  </div>

                  <section className="courses-grid" aria-label="Course search results">
                    {matchingCourses.map((course) => (
                      <a
                        className="course-card"
                        href={getCourseUrl(course.code)}
                        aria-label={`Open ${course.code} course page`}
                        key={course.code}
                      >
                        <span className="course-code">{course.code}</span>
                        <span className="course-search-copy">
                          <strong>{course.title}</strong>
                          <small>
                            {course.department} · {course.level}
                          </small>
                        </span>
                        <span className="course-search-arrow" aria-hidden="true">
                          →
                        </span>
                      </a>
                    ))}

                    {matchingCourses.length === 0 && (
                      <p className="courses-empty">
                        No courses found. Try a course code, title, department, or broader keyword.
                      </p>
                    )}
                  </section>
                </div>
              </div>

              <div className="courses-home-content">
                <section className="course-home-section" aria-labelledby="popular-courses-title">
                  <div className="course-section-heading course-popular-heading">
                    <div>
                      <p className="course-section-kicker">Start here</p>
                      <h2 id="popular-courses-title">Popular courses</h2>
                    </div>
                    <p>
                      Quick access to the foundational courses students search for most across AUC.
                    </p>
                  </div>

                  <div className="course-popular-grid" aria-label="Popular courses">
                    {popularCourses.map((course) => (
                      <a
                        className="course-feature-card"
                        href={getCourseUrl(course.code)}
                        aria-label={`Open ${course.code} course page`}
                        key={course.code}
                      >
                        <span className="course-feature-code">{course.code}</span>
                        <h3>{course.title}</h3>
                        <div className="course-feature-meta">
                          <span>{course.department}</span>
                          <span>{course.level}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>

                <section className="course-home-section" aria-labelledby="recent-materials-title">
                  <div className="course-section-heading">
                    <p className="course-section-kicker">Across AUC Atlas</p>
                    <h2 id="recent-materials-title">Explore course materials</h2>
                    <p>
                      Discover a rotating selection of notes, review sheets, slides, and practice files shared by students.
                    </p>
                  </div>

                  <div className="course-recent-grid" aria-live="polite">
                    {materialsStatus === "loading" && (
                      <div className="course-recent-status">
                        <strong>Loading course materials...</strong>
                      </div>
                    )}

                    {materialsStatus === "locked" && (
                      <div className="course-recent-status">
                        <strong>Sign in to view course materials.</strong>
                        <p>Course files are available to students with a verified AUC email.</p>
                        <a href={`${LEGACY_ORIGIN}/login.html`}>Log in</a>
                      </div>
                    )}

                    {materialsStatus === "error" && (
                      <div className="course-recent-status">
                        <strong>Course materials are unavailable right now.</strong>
                        <p>Please try again later.</p>
                      </div>
                    )}

                    {materialsStatus === "ready" && materials?.length === 0 && (
                      <div className="course-recent-status">
                        <strong>No course materials yet.</strong>
                        <p>New uploads will appear here as soon as students share them.</p>
                      </div>
                    )}

                    {materialsStatus === "ready" &&
                      materials?.map((material, index) => {
                        const courseCode = String(material.courseCode || "").trim();
                        const courseTitle = String(material.courseTitle || "").trim();
                        const courseLabel = [courseCode, courseTitle].filter(Boolean).join(" — ");
                        const fileName = String(material.fileName || material.title || "Course material");
                        const extension = getFileExtension(fileName, material.fileType);
                        const iconUrl = getFileIcon(extension);
                        const uploaderName = String(material.uploaderDisplayName || "AUC student").trim();
                        const uploaderPhoto = material.isAnonymous
                          ? ""
                          : String(material.uploaderPhotoURL || "").trim();
                        const key = material.id || `${courseCode}-${material.title || index}-${index}`;

                        return (
                          <a
                            className="course-recent-card"
                            href={courseCode ? getCourseUrl(courseCode, "#course-materials-access") : "/courses"}
                            key={key}
                          >
                            <div className="course-recent-icon-shell">
                              {iconUrl ? (
                                <img
                                  className="course-recent-file-icon-image"
                                  src={iconUrl}
                                  alt=""
                                  aria-hidden="true"
                                />
                              ) : (
                                <span className="course-recent-file-icon-fallback" aria-hidden="true">
                                  <strong>{extension === "file" ? "FILE" : extension.slice(0, 5).toUpperCase()}</strong>
                                </span>
                              )}
                            </div>

                            <div className="course-recent-card-copy">
                              <span className="course-recent-type">
                                {material.materialType || "Course material"}
                              </span>
                              <h3>{material.title || "Course material"}</h3>
                              <p>{courseLabel || "AUC course material"}</p>
                            </div>

                            <div className="course-recent-meta">
                              <span>{material.professor || "Professor not listed"}</span>
                              <span>{material.semester || "Semester not listed"}</span>
                            </div>

                            <div className="course-recent-footer">
                              <span className="course-recent-uploader">
                                <span className="course-recent-uploader-avatar" aria-hidden="true">
                                  {uploaderName.charAt(0).toUpperCase() || "A"}
                                  {uploaderPhoto && (
                                    <img src={uploaderPhoto} alt="" loading="lazy" decoding="async" />
                                  )}
                                </span>
                                <span className="course-recent-uploader-name">
                                  Uploaded by {uploaderName}
                                </span>
                              </span>
                              <small>{formatMaterialDate(material.createdAt)}</small>
                            </div>
                          </a>
                        );
                      })}
                  </div>
                </section>

                <section className="course-contribute" aria-labelledby="course-contribute-title">
                  <div className="course-contribute-copy">
                    <p className="course-section-kicker">Help another student</p>
                    <h2 id="course-contribute-title">Have useful course material?</h2>
                    <p>
                      Choose the course and upload lecture notes, review sheets, assignments, slides, or practice material without leaving this page.
                    </p>
                  </div>

                  <a
                    className="course-upload-start"
                    href={`${LEGACY_ORIGIN}/courses`}
                    aria-label="Upload course material"
                  >
                    Upload course material
                  </a>
                </section>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
