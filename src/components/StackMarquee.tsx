import React from "react";
import type { StackGroup } from "../config/portfolio";

/* ─────────────────────────────────────────────────────────────
   Tech-stack marquee — port of the bundle's `Jc` component.

   Each row duplicates its items `copies` times, renders the list
   twice, and the `.marquee-track` CSS animation translates it by
   -50% for a seamless loop. Duration and direction are driven by
   CSS custom properties so the layout never re-renders.
   ───────────────────────────────────────────────────────────── */

export const StackMarqueeRow: React.FC<StackGroup> = ({
  items,
  copies,
  duration,
  reverse,
}) => {
  const repeated = Array.from({ length: copies }, () => items).flat();

  return (
    <div className="marquee-row" aria-hidden="true">
      <div
        className="marquee-track"
        style={
          {
            "--marquee-duration": `${duration}s`,
            "--marquee-direction": reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {[...repeated, ...repeated].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-1 md:mx-1.5 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 md:px-5 md:py-2.5 text-[13px] md:text-[15px] font-medium tracking-wide text-gray-300 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-white/25" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Full-width "The stack" band (label rule + all marquee rows).
 * Rendered at the bottom of the About section with the demo's
 * `mt-auto -mx-6 md:-mx-16` full-bleed geometry.
 */
export const StackMarquee: React.FC<{ groups: StackGroup[] }> = ({
  groups,
}) => (
  <div className="relative mt-auto -mx-6 md:-mx-16 pt-10 pb-2 bg-[#030303]">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-4 px-6 md:px-16 mb-6">
      <span className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-gray-500 whitespace-nowrap">
        The stack
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
    <ul className="sr-only">
      {groups.flatMap((g) => g.items).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <div className="flex flex-col gap-2.5 md:gap-3">
      {groups.map((group) => (
        <StackMarqueeRow key={group.label} {...group} />
      ))}
    </div>
  </div>
);

export default StackMarquee;
