"use client";

import { useEffect } from "react";

/**
 * Original FAQ's accessible, individually expandable rows and motion timings.
 * The questions and answers are SSR HTML; only the animation needs JavaScript.
 */
export default function FaqAccordion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".faq-page");
    if (!page) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const toggle = event.target.closest<HTMLButtonElement>(".faq-toggle");
      if (!toggle || !page?.contains(toggle)) return;

      const item = toggle.closest<HTMLElement>(".faq-item");
      const controlledId = toggle.getAttribute("aria-controls");
      const answer = controlledId ? document.getElementById(controlledId) : null;
      if (!item || !answer || !item.contains(answer)) return;

      const willOpen = toggle.getAttribute("aria-expanded") !== "true";
      const style = answer.hidden ? null : window.getComputedStyle(answer);
      const currentHeight = answer.hidden ? 0 : answer.getBoundingClientRect().height;
      const currentOpacity = answer.hidden ? 0 : Number.parseFloat(style?.opacity || "1") || 1;
      const currentPaddingBottom = answer.hidden ? 0 : Number.parseFloat(style?.paddingBottom || "0") || 0;
      const currentTransform = !style || style.transform === "none"
        ? "translateY(-6px)"
        : style.transform;

      answer.getAnimations().forEach(animation => animation.cancel());
      item.classList.toggle("open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));

      if (willOpen) {
        answer.hidden = false;
        if (reduceMotion) return;

        const targetPaddingBottom = Number.parseFloat(window.getComputedStyle(answer).paddingBottom) || 0;
        const animation = answer.animate([
          {
            height: currentHeight + "px",
            opacity: currentOpacity,
            paddingBottom: currentPaddingBottom + "px",
            transform: currentTransform,
          },
          {
            height: answer.scrollHeight + "px",
            opacity: 1,
            paddingBottom: targetPaddingBottom + "px",
            transform: "translateY(0)",
          },
        ], {
          duration: 440,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        });
        animation.addEventListener("finish", () => animation.cancel(), { once: true });
        return;
      }

      if (reduceMotion) {
        answer.hidden = true;
        return;
      }

      const animation = answer.animate([
        {
          height: currentHeight + "px",
          opacity: currentOpacity,
          paddingBottom: currentPaddingBottom + "px",
          transform: currentTransform,
        },
        {
          height: "0px",
          opacity: 0,
          paddingBottom: "0px",
          transform: "translateY(-6px)",
        },
      ], {
        duration: 320,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      });

      animation.addEventListener("finish", () => {
        if (toggle.getAttribute("aria-expanded") === "false") answer.hidden = true;
        animation.cancel();
      }, { once: true });
    }

    page.addEventListener("click", onClick);
    return () => {
      page.removeEventListener("click", onClick);
      page.querySelectorAll<HTMLElement>(".faq-answer").forEach(answer =>
        answer.getAnimations().forEach(animation => animation.cancel())
      );
    };
  }, []);

  return null;
}
