"use client";

import { useEffect, useRef } from "react";
import { professors } from "../../data/professors";
import { initializeAdmin } from "./adminRuntime";
import { markup } from "./adminMarkup";
import "./admin.css";
import "./admin-users.css";

/**
 * Preserve the original administrator UI while replacing its original
 * static HTML page and injected global scripts with a Next.js client mount.
 * All administrator authorization and mutations are performed server-side.
 */
export default function Admin() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || root.dataset.atlasAdminInitialized === "true") return;
    root.dataset.atlasAdminInitialized = "true";
    (window as Window & { aucAtlasProfessors?: typeof professors }).aucAtlasProfessors = professors;
    initializeAdmin();
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: markup }} />;
}
