"use client";

import { useEffect } from "react";
import { mountSmoothAccordion } from "../../lib/smoothAccordion";

/** Server-rendered content, with the same smooth motion as professor filters. */
export default function FaqAccordion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".faq-page");
    if (!page) return;
    return mountSmoothAccordion(page, {
      toggle: ".faq-toggle",
      item: ".faq-item",
      answer: ".faq-answer",
    });
  }, []);

  return null;
}
