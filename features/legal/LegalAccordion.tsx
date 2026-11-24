"use client";

import { useEffect } from "react";
import { mountSmoothAccordion } from "../../lib/smoothAccordion";

/** Server-rendered content, with the same smooth motion as professor filters. */
export default function LegalAccordion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".info-page");
    if (!page) return;
    return mountSmoothAccordion(page, {
      toggle: ".info-toggle",
      item: ".info-section",
      answer: ".info-answer",
    });
  }, []);

  return null;
}
