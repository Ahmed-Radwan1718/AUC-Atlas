"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { professors } from "../../data/professors";
import { buildProfileMarkup } from "./profileMarkup";
import { setupReviewModalBehavior, loadProfessorReviews } from "./reviewModal";
import "./professors.css";
import "./professors-ui-1.css";
import "./professors-ui-2.css";
import "./professors-ui-3.css";

export default function ProfessorProfile() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || "").trim().toLowerCase();
  const professor = useMemo(() => professors.find(item => item.id === slug), [slug]);
  const markup = useMemo(() => professor ? buildProfileMarkup(professor) : "", [professor]);

  useEffect(() => {
    if (!professor) {
      document.title = "Professor Not Found | AUC Atlas";
      return;
    }
    document.title = professor.name + " | AUC Atlas";
    const grid = document.querySelector<HTMLElement>(".professor-profile-grid");
    if (!grid || grid.dataset.profileInitialized === "true") return;
    grid.dataset.profileInitialized = "true";
    setupReviewModalBehavior(grid);
    void loadProfessorReviews(professor.id);
  }, [professor]);

  return (
    <main className="professors-page">
      <div className="professors-inner">
        <section className="professors-browser professor-profile-mode" aria-label="Professor filters and results">
          <section className="professors-results">
            <section className="professors-grid professor-profile-grid" id="professors-grid"
              aria-label={professor ? "Professor profile" : "Professor not found"}
              dangerouslySetInnerHTML={professor ? { __html: markup } : undefined}>
              {professor ? null : <div className="professors-empty">
                Professor &quot;{slug}&quot; was not found. <a href="/professors">Back to all professors</a>.
              </div>}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
