"use client";

import { useEffect, useRef } from "react";

type LegacyInfoPageProps = {
  html: string;
};

export function LegacyInfoPage({ html }: LegacyInfoPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const controller = new AbortController();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.querySelectorAll<HTMLButtonElement>(".info-toggle").forEach((toggle) => {
      const item = toggle.closest<HTMLElement>(".info-item, .info-section");
      const answerId = toggle.getAttribute("aria-controls");
      const answer = answerId
        ? root.querySelector<HTMLElement>(`#${answerId}`)
        : null;

      if (!item || !answer) return;

      toggle.setAttribute("aria-expanded", "false");
      answer.hidden = true;

      toggle.addEventListener(
        "click",
        () => {
          const willOpen = toggle.getAttribute("aria-expanded") !== "true";

          answer.getAnimations().forEach((animation) => animation.cancel());
          item.classList.toggle("open", willOpen);
          toggle.setAttribute("aria-expanded", String(willOpen));

          if (willOpen) {
            answer.hidden = false;

            if (reduceMotion) return;

            const styles = window.getComputedStyle(answer);
            const targetPaddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
            const targetHeight = answer.scrollHeight;
            const animation = answer.animate(
              [
                {
                  height: "0px",
                  opacity: 0,
                  paddingBottom: "0px",
                  transform: "translateY(-6px)",
                },
                {
                  height: `${targetHeight}px`,
                  opacity: 1,
                  paddingBottom: `${targetPaddingBottom}px`,
                  transform: "translateY(0)",
                },
              ],
              {
                duration: 440,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
              },
            );

            animation.addEventListener(
              "finish",
              () => animation.cancel(),
              { once: true },
            );
            return;
          }

          if (reduceMotion) {
            answer.hidden = true;
            return;
          }

          const styles = window.getComputedStyle(answer);
          const currentHeight = answer.getBoundingClientRect().height;
          const currentPaddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
          const animation = answer.animate(
            [
              {
                height: `${currentHeight}px`,
                opacity: 1,
                paddingBottom: `${currentPaddingBottom}px`,
                transform: "translateY(0)",
              },
              {
                height: "0px",
                opacity: 0,
                paddingBottom: "0px",
                transform: "translateY(-6px)",
              },
            ],
            {
              duration: 320,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              fill: "both",
            },
          );

          animation.addEventListener(
            "finish",
            () => {
              if (toggle.getAttribute("aria-expanded") === "false") {
                answer.hidden = true;
              }
              animation.cancel();
            },
            { once: true },
          );
        },
        { signal: controller.signal },
      );
    });

    return () => controller.abort();
  }, [html]);

  return (
    <div
      ref={rootRef}
      className="legacy-info-page-root"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
