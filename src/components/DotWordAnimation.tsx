import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

/**
 * DotWordAnimation — faithful port of the demo bundle's `Vi` component.
 *
 * The letters fly in from off-axis one after another while a small dot hops
 * along the baseline, orbits the pivot glyph, then spins out as the word
 * settles. `onComplete` fires once the whole choreography is finished.
 *
 * Bundle constants: rotation target `63` (Ri), dot timeScale `.5`,
 * cursor start `1.4 / .5`, mouse-less letter spin `random(170, 300)`.
 */
const ROTATION = 63; // bundle: Ri

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** bundle: zi — canvas glyph metrics relative to the line box */
const measureGlyph = (char: string, el: HTMLElement, lineHeight: number) => {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText(char) as TextMetrics & {
      actualBoundingBoxLeft: number;
      actualBoundingBoxRight: number;
      fontBoundingBoxAscent: number;
      fontBoundingBoxDescent: number;
    };
    if (!Number.isFinite(m.actualBoundingBoxLeft)) return null;
    const bottom =
      (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 +
      m.fontBoundingBoxAscent;
    return {
      cx: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
      bottom,
      height: m.actualBoundingBoxAscent + m.fontBoundingBoxDescent,
    };
  } catch {
    return null;
  }
};

interface DotWordAnimationProps {
  word: string;
  pivotIndex?: number;
  className?: string;
  letterClassName?: string;
  dotClassName?: string;
  loop?: boolean;
  speed?: number;
  onComplete?: () => void;
}

export const DotWordAnimation: React.FC<DotWordAnimationProps> = ({
  word,
  pivotIndex,
  className = "",
  letterClassName = "",
  dotClassName = "bg-white",
  loop = false,
  speed = 1,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // Bumped on resize while looping, to force the choreography to replay.
  const [cycle, setCycle] = useState(0);

  const letters = useMemo(() => Array.from(word), [word]);
  const pivot = useMemo(() => {
    if (Number.isInteger(pivotIndex) && letters[pivotIndex as number]?.trim()) {
      return pivotIndex as number;
    }
    const found = letters.findIndex((c) => "Iil1".includes(c));
    return found === -1 ? 0 : found;
  }, [letters, pivotIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const wordEl = wordRef.current;
    const dot = dotRef.current;
    const glow = glowRef.current;
    const allLetters = letterRefs.current.slice(0, letters.length);
    const pivotEl = allLetters[pivot];
    const filled = allLetters.filter((el): el is HTMLSpanElement => Boolean(el));
    if (!container || !wordEl || !dot || !glow || !pivotEl) return;

    // Every non-pivot, non-space letter, in source order.
    const others = allLetters
      .map((el, i) => (el && i !== pivot && letters[i].trim() ? i : -1))
      .filter((i) => i !== -1);

    let ctx: gsap.Context | undefined;
    let killed = false;
    let cleanupResize = () => {};

    if (prefersReducedMotion()) {
      gsap.set(filled, { opacity: 1 });
      gsap.set(dot, { opacity: 0 });
      const t = window.setTimeout(() => completeRef.current?.(), 250);
      return () => window.clearTimeout(t);
    }

    gsap.set(filled, { opacity: 0 });
    gsap.set(dot, { opacity: 0 });

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (killed) return;

      ctx = gsap.context(() => {
        gsap.set([...filled, dot], { clearProps: "transform" });

        const box = container.getBoundingClientRect();
        const fontSize = parseFloat(getComputedStyle(wordEl).fontSize) || 16;
        const rects = allLetters.map((el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            left: r.left - box.left,
            top: r.top - box.top,
            w: r.width,
            h: r.height,
            cx: r.left - box.left + r.width / 2,
            cy: r.top - box.top + r.height / 2,
          };
        });
        const pr = rects[pivot];
        if (!pr) return;

        const glyph = measureGlyph(letters[pivot], pivotEl, pr.h) ?? {
          cx: pr.w / 2,
          bottom: pr.h,
          height: pr.h * 0.78,
        };
        const home = { x: pr.left + glyph.cx, y: pr.top + glyph.bottom };
        const orbit = glyph.height;
        const dotSize = fontSize * 0.24;

        gsap.set(pivotEl, {
          transformOrigin: `${(glyph.cx / pr.w) * 100}% ${(glyph.bottom / pr.h) * 100}%`,
        });
        gsap.set(dot, {
          width: dotSize,
          height: dotSize,
          left: home.x - dotSize / 2,
          top: home.y + fontSize * 0.1,
        });

        const orbitPoint = (deg: number) => {
          const t = (deg * Math.PI) / 180;
          return { x: home.x + Math.sin(t) * orbit, y: home.y - Math.cos(t) * orbit };
        };

        const startY = -(box.top + home.y) - fontSize;
        const glowSize = fontSize * 2.6;

        // bundle: T — a short pulse of the radial glow at a given point
        const pulse = (
          tl: gsap.core.Timeline,
          at: { x: number; y: number },
          opacity: number,
          time: number
        ) => {
          tl.set(
            glow,
            {
              width: glowSize,
              height: glowSize,
              left: at.x - glowSize / 2,
              top: at.y - glowSize / 2,
            },
            time
          )
            .to(glow, { opacity, duration: 0.05, ease: "none" }, time)
            .to(glow, { opacity: 0, duration: 0.34, ease: "power2.out" }, time + 0.05);
        };

        // bundle: E — fly a single letter to a point; returns its end time
        const flyLetter = (
          tl: gsap.core.Timeline,
          index: number,
          target: { x: number; y: number },
          time: number
        ) => {
          const el = allLetters[index];
          const r = rects[index];
          if (!el || !r) return time;
          const dx = target.x - r.cx;
          const dy = target.y - r.cy;
          const d = 0.5 + Math.min(Math.abs(dx) / 900, 0.32);
          const lift = -(Math.abs(dx) * 0.3 + fontSize * 0.25);
          const spin = (dx > 0 ? -1 : 1) * gsap.utils.random(170, 300);
          tl.set(
            el,
            { x: dx, y: dy, rotation: spin, scale: 0.3, opacity: 0, transformOrigin: "50% 50%" },
            time
          )
            .to(el, { opacity: 1, scale: 1, duration: d * 0.45 }, time)
            .to(el, { x: 0, duration: d, ease: "power1.out" }, time)
            .to(el, { y: Math.min(dy, 0) + lift, duration: d * 0.45, ease: "power2.out" }, time)
            .to(el, { y: 0, duration: d * 0.55, ease: "power2.in" }, time + d * 0.45)
            .to(el, { rotation: 0, duration: d, ease: "power2.out" }, time)
            .to(el, { y: -fontSize * 0.05, duration: 0.09, ease: "power2.out" }, time + d)
            .to(el, { y: 0, duration: 0.16, ease: "power2.in" }, time + d + 0.09);
          return time + d;
        };

        // bundle: D — bounce the pivot dot to an angle, then seat the letters
        const settle = (
          tl: gsap.core.Timeline,
          angle: number,
          indexes: number[],
          time: number
        ) => {
          if (!indexes.length) return time;
          const at = orbitPoint(angle);
          tl.to(pivotEl, { rotation: angle, duration: 0.4, ease: "back.out(1.4)" }, time)
            .to(pivotEl, { rotation: angle + (angle < 0 ? 6 : -6), duration: 0.08 }, time + 0.34)
            .to(pivotEl, { rotation: angle, duration: 0.3, ease: "elastic.out(1, 0.5)" }, time + 0.42);
          let end = time;
          indexes.forEach((idx, n) => {
            const t = time + 0.34 + n * 0.1;
            pulse(tl, at, 0.5 - n * 0.1, t);
            end = Math.max(end, flyLetter(tl, idx, at, t));
          });
          return end;
        };

        const master = gsap.timeline({
          defaults: { ease: "power2.out" },
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? 1.1 : 0,
          onComplete: () => {
            if (!loop) completeRef.current?.();
          },
        });

        master
          .timeScale(speed)
          .set(container, { opacity: 1 })
          .set(filled, { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 })
          .set(pivotEl, { opacity: 0, y: startY, rotation: 0 })
          .set(dot, { opacity: 0, y: startY, scale: 1 });

        // ── The dot bounce + pivot-letter drop-in (bundle: timeline A) ──
        const dotScale = 0.5; // bundle: k
        const hop = fontSize * 0.4; // bundle: j
        const bounce = gsap.timeline({ defaults: { ease: "power2.out" } });
        bounce
          .set(dot, { opacity: 1 }, 0)
          .to(dot, { y: 0, duration: 0.42, ease: "power2.in" }, 0)
          .to(dot, { scaleX: 0.82, scaleY: 1.22, duration: 0.28, ease: "power1.in" }, 0.14)
          .to(dot, { scaleX: 1.4, scaleY: 0.52, duration: 0.06 }, 0.42)
          .to(dot, { y: -hop, duration: 0.2 }, 0.48)
          .to(dot, { scaleX: 1, scaleY: 1, duration: 0.18 }, 0.48)
          .to(dot, { y: 0, duration: 0.18, ease: "power2.in" }, 0.68)
          .to(dot, { scaleX: 0.92, scaleY: 1.08, duration: 0.14, ease: "power1.in" }, 0.72)
          .to(dot, { scaleX: 1.2, scaleY: 0.74, duration: 0.05 }, 0.86)
          .to(dot, { scaleX: 1, scaleY: 1, duration: 0.36, ease: "elastic.out(1, 0.42)" }, 0.91);
        pulse(bounce, home, 0.4, 0.42);
        pulse(bounce, home, 0.24, 0.86);

        const pivotHop = fontSize * 0.13; // bundle: M
        bounce
          .set(pivotEl, { opacity: 1 }, 0.8)
          .to(pivotEl, { y: 0, duration: 0.34, ease: "power2.in" }, 0.8)
          .to(pivotEl, { scaleX: 0.86, scaleY: 1.16, duration: 0.24, ease: "power1.in" }, 0.88)
          .to(pivotEl, { scaleX: 1.32, scaleY: 0.64, duration: 0.06 }, 1.14)
          .to(pivotEl, { y: -pivotHop, duration: 0.1 }, 1.2)
          .to(pivotEl, { scaleX: 1, scaleY: 1, duration: 0.12 }, 1.2)
          .to(pivotEl, { y: 0, duration: 0.1, ease: "power2.in" }, 1.3)
          .to(pivotEl, { scaleX: 1.12, scaleY: 0.88, duration: 0.05 }, 1.4)
          .to(pivotEl, { scaleX: 1, scaleY: 1, duration: 0.38, ease: "elastic.out(1, 0.4)" }, 1.45)
          .fromTo(
            pivotEl,
            { rotation: -9 },
            { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.36)" },
            1.19
          );
        pulse(bounce, home, 0.6, 1.14);
        pulse(bounce, home, 0.26, 1.4);
        master.add(bounce.timeScale(dotScale), 0);

        // ── Left letters (dot travels counter-clockwise), then right ──
        const left = others.filter((i) => i < pivot).reverse();
        const right = others.filter((i) => i > pivot);
        let cursor = 1.4 / dotScale;
        cursor = settle(master, -ROTATION, left, cursor);
        cursor = settle(master, ROTATION, right, left.length ? cursor - 0.3 : cursor);
        master
          .to(pivotEl, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.55)" }, cursor - 0.16)
          .to(dot, { opacity: 0, scale: 0, duration: 0.3, ease: "power2.in" }, cursor - 0.12);

        // Seamlessly snap to the finished word on resize instead of jumping.
        let resizeTimer: number | undefined;
        const onResize = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            if (loop) setCycle((c) => c + 1);
            else if (master.progress() < 1) master.progress(1);
          }, 150);
        };
        window.addEventListener("resize", onResize);
        cleanupResize = () => {
          window.clearTimeout(resizeTimer);
          window.removeEventListener("resize", onResize);
        };
      }, container);
    });

    return () => {
      killed = true;
      cleanupResize();
      ctx?.revert();
    };
  }, [letters, pivot, loop, speed, cycle]);

  return (
    <div ref={containerRef} aria-hidden="true" className="absolute top-0 left-0 opacity-0">
      <h1 ref={wordRef} className={className}>
        {letters.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className={`inline-block will-change-transform ${letterClassName}`}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </h1>
      <span
        ref={dotRef}
        className={`absolute rounded-full pointer-events-none ${dotClassName}`}
      />
      <span
        ref={glowRef}
        className="absolute rounded-full opacity-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
};

export default DotWordAnimation;
