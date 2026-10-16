import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   Global reveal system — exact values extracted from the
   production bundle:

     Rc = `power3.out`
     zc = .9
     Bc = `top 88%`
     Vc = { up:{y:40}, down:{y:-40}, left:{x:-48},
             right:{x:48}, scale:{scale:.94}, fade:{} }

   Each section is wired through gsap.matchMedia() with the
   `motion` / `desktop` conditions, so every tween lives inside
   a context that reverts cleanly on unmount (no cross-killing
   of other sections' ScrollTriggers).
   ───────────────────────────────────────────────────────────── */

export const REVEAL_EASE = "power3.out";
export const REVEAL_DURATION = 0.9;
export const REVEAL_START = "top 88%";

const REVEAL_VARIANTS: Record<string, gsap.TweenVars> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: -48 },
  right: { x: 48 },
  scale: { scale: 0.94 },
  fade: {},
};

export interface SectionScope {
  scope: HTMLElement;
  desktop: boolean;
  mobile: boolean;
}

type SetupResult = void | (() => void);

/** `[data-reveal]` — single element reveal (variant + opacity, once). */
function applyReveals(scope: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]", scope).forEach((el) => {
    const variant =
      REVEAL_VARIANTS[el.dataset.reveal ?? ""] ?? REVEAL_VARIANTS.up;
    gsap.from(el, {
      ...variant,
      opacity: 0,
      duration: REVEAL_DURATION,
      delay: parseFloat(el.dataset.revealDelay || "0") || 0,
      ease: REVEAL_EASE,
      scrollTrigger: {
        trigger: el,
        start: REVEAL_START,
        once: true,
      },
    });
  });
}

/** `[data-reveal-group]` — direct children staggered as a group. */
function applyRevealGroups(scope: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-reveal-group]", scope).forEach((el) => {
    const children = gsap.utils.toArray<HTMLElement>(":scope > *", el);
    if (!children.length) return;
    gsap.from(children, {
      y: 32,
      opacity: 0,
      duration: REVEAL_DURATION,
      ease: REVEAL_EASE,
      stagger: parseFloat(el.dataset.revealGroup || "") || 0.08,
      scrollTrigger: {
        trigger: el,
        start: REVEAL_START,
        once: true,
      },
    });
  });
}

/** `[data-reveal-lines]` — masked `.line` children rise into place. */
function applyRevealLines(scope: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-reveal-lines]", scope).forEach((el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".line", el);
    if (!lines.length) return;
    gsap.from(lines, {
      yPercent: 110,
      duration: 1.1,
      ease: REVEAL_EASE,
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        once: true,
      },
    });
  });
}

/** `[data-parallax]` — scrubbed Y drift inside a `[data-parallax-frame]`. */
function applyParallax(scope: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-parallax]", scope).forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || "") || 40;
    gsap.fromTo(
      el,
      { yPercent: -amount / 10 },
      {
        yPercent: amount / 10,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-parallax-frame]") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
}

/**
 * Section-scoped animation hook. Returns a ref the section must
 * attach; all data-reveal* systems plus the section-specific
 * `setup` callback are created inside a gsap.matchMedia context
 * guarded by `(prefers-reduced-motion: no-preference)` — matching
 * the bundle's `Hc()` helper.
 */
export function useSectionReveals<T extends HTMLElement = HTMLElement>(
  setup?: (args: SectionScope) => SetupResult
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const scope = ref.current;
    if (!scope) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 768px)",
      },
      (ctx) => {
        const { motion, desktop } = ctx.conditions as {
          motion: boolean;
          desktop: boolean;
        };
        if (!motion) return;
        applyReveals(scope);
        applyRevealGroups(scope);
        applyRevealLines(scope);
        applyParallax(scope);
        return setup?.({ scope, desktop, mobile: !desktop });
      }
    );

    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Refresh ScrollTrigger once fonts/page finish loading (bundle parity). */
let refreshBound = false;
export function initScrollRefresh() {
  if (refreshBound || typeof window === "undefined") return;
  refreshBound = true;

  const refresh = () => ScrollTrigger.refresh();
  if (document.readyState === "complete") refresh();
  else window.addEventListener("load", refresh, { once: true });
  document.fonts?.ready.then(refresh);
}
