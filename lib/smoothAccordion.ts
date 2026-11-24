/**
 * Match professor filters: 420ms ease for expansion/collapse, 280ms ease for opacity.
 * Measure the natural answer height rather than using a fixed max-height, so
 * long legal sections are never clipped and short answers use the full duration.
 */
export function mountSmoothAccordion(
  page: HTMLElement,
  selectors: { toggle: string; item: string; answer: string }
) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const running = new Map<HTMLElement, Animation[]>();

  function settle(answer: HTMLElement, open: boolean) {
    answer.hidden = !open;
    answer.inert = !open;
  }

  function onClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest<HTMLButtonElement>(selectors.toggle);
    if (!toggle || !page.contains(toggle)) return;

    const item = toggle.closest<HTMLElement>(selectors.item);
    const controlledId = toggle.getAttribute("aria-controls");
    const answer = controlledId ? document.getElementById(controlledId) : null;
    if (!item || !answer || !item.contains(answer)) return;

    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    // Sample the current animated geometry before cancelling, so reversing an
    // in-flight expansion or collapse continues from the visible position.
    const style = answer.hidden ? null : window.getComputedStyle(answer);
    const startHeight = answer.hidden ? 0 : answer.getBoundingClientRect().height;
    const startPadding = style ? parseFloat(style.paddingBottom) || 0 : 0;
    const startOpacity = style ? Number(style.opacity) : 0;

    running.get(answer)?.forEach(animation => animation.cancel());
    running.delete(answer);
    item.classList.toggle("open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    if (!willOpen && answer.contains(document.activeElement)) toggle.focus();
    answer.inert = !willOpen;

    if (reduceMotion.matches || typeof answer.animate !== "function") {
      settle(answer, willOpen);
      return;
    }

    // Restore natural layout before measuring the destination. The answer
    // stays rendered during closing and is hidden only when motion completes.
    answer.hidden = false;
    const endHeight = willOpen ? answer.getBoundingClientRect().height : 0;
    const endPadding = willOpen
      ? parseFloat(window.getComputedStyle(answer).paddingBottom) || 0
      : 0;

    const geometry = answer.animate([
      { height: startHeight + "px", paddingBottom: startPadding + "px" },
      { height: endHeight + "px", paddingBottom: endPadding + "px" },
    ], { duration: 420, easing: "ease", fill: "both" });
    const fade = answer.animate([
      { opacity: startOpacity },
      { opacity: willOpen ? 1 : 0 },
    ], { duration: 280, easing: "ease", fill: "both" });
    const animations = [geometry, fade];
    running.set(answer, animations);

    geometry.addEventListener("finish", () => {
      if (running.get(answer) !== animations) return;
      settle(answer, willOpen);
      running.delete(answer);
      animations.forEach(animation => animation.cancel());
    }, { once: true });
  }

  page.addEventListener("click", onClick);
  return () => {
    page.removeEventListener("click", onClick);
    running.forEach((animations, answer) => {
      const item = answer.closest(selectors.item);
      const open = item?.querySelector(selectors.toggle)?.getAttribute("aria-expanded") === "true";
      settle(answer, open);
      animations.forEach(animation => animation.cancel());
    });
    running.clear();
  };
}
