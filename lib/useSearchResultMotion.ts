"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Animate result changes without delaying filtering or replacing live controls. */
export function useSearchResultMotion(
  containerRef: RefObject<HTMLDivElement | null>,
  signature: string,
  visible = true,
  resizePanel = false
) {
  const previous = useRef(new Map<string, number>());
  const previousHeight = useRef<number | null>(null);
  const running = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const oldHeight = running.current.some(a => a.playState === "running" && a.effect instanceof KeyframeEffect && a.effect.target === container)
      ? container?.getBoundingClientRect().height ?? null : previousHeight.current;
    running.current.forEach(animation => animation.cancel());
    running.current = [];
    if (!container || !visible || !container.getClientRects().length) {
      previous.current.clear();
      previousHeight.current = null;
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = !reduced && typeof container.animate === "function";
    const top = container.getBoundingClientRect().top;
    const next = new Map<string, number>();
    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-search-motion-key]"));
    const height = container.offsetHeight;

    rows.forEach((row, index) => {
      const key = row.dataset.searchMotionKey!;
      const y = row.getBoundingClientRect().top - top + container.scrollTop;
      next.set(key, y);
      if (!animate) return;
      const before = previous.current.get(key);
      // Only animate rows near the visible area; large jumps become short entrances.
      const inView = y >= container.scrollTop - 60 && y <= container.scrollTop + height + 60;
      if (!inView) return;
      const delta = before === undefined ? 0 : before - y;
      if (before === undefined || Math.abs(delta) > height) {
        running.current.push(row.animate(
          [{ opacity: 0, translate: "0 5px" }, { opacity: 1, translate: "0 0" }],
          { duration: 180, delay: Math.min(index * 9, 36), easing, fill: "backwards" }
        ));
      } else if (Math.abs(delta) > 1) {
        running.current.push(row.animate(
          [{ translate: "0 " + delta + "px" }, { translate: "0 0" }],
          { duration: 210, easing }
        ));
      }
    });

    previous.current = next;
    previousHeight.current = height;
    if (animate && resizePanel && height > 0) {
      const from = oldHeight ?? Math.min(56, height);
      if (Math.abs(from - height) > 1) {
        running.current.push(container.animate(
          [{ height: from + "px" }, { height: height + "px" }],
          { duration: 220, easing }
        ));
      }
    }
  }, [containerRef, signature, visible, resizePanel]);

  useLayoutEffect(() => () => {
    running.current.forEach(animation => animation.cancel());
    running.current = [];
    previous.current.clear();
    previousHeight.current = null;
  }, []);
}
