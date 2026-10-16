import React from "react";
import gsap from "gsap";
import { PORTFOLIO_CONFIG } from "../config/portfolio";
import { ShieldCheck, Cpu, Zap, Layers } from "lucide-react";
import { StackMarquee } from "./StackMarquee";
import {
  useSectionReveals,
  REVEAL_EASE,
  REVEAL_DURATION,
} from "../hooks/useSectionReveals";

/**
 * About — rebuilt against the production bundle's `Xc` component:
 *
 *   • `[data-intro]`   from { y:100, opacity:0, dur:1, power3.out }
 *                      trigger scope, start "top 70%", once
 *   • desktop          word-by-word scrub from #52525b/.2 → #fff/1,
 *                      stagger .1, trigger text, "top 85%" → "bottom 50%"
 *   • mobile           whole-block fade  { y:24, dur:.9, "top 90%" }
 *   • stack marquee    "The stack" full-bleed band (StackMarquee)
 */

const STATEMENT =
  "I architect autonomous agent swarms, hybrid vector-graph retrieval engines, and high-throughput inference infrastructure that run in production. Modern AI requires more than prompt chaining; it demands deterministic tool contracts, verifiable citations, sub-50ms token latency, and self-healing orchestration.";

/** Words rendered with the demo's emphasized treatment. */
const EMPHASIS = new Set([
  "autonomous",
  "hybrid",
  "high-throughput",
  "deterministic",
  "verifiable",
  "sub-50ms",
  "self-healing",
]);

const METRIC_ICONS = [
  <Cpu key="cpu" className="w-5 h-5 text-[#ff5c3d]" />,
  <ShieldCheck key="shield" className="w-5 h-5 text-emerald-400" />,
  <Zap key="zap" className="w-5 h-5 text-amber-400" />,
  <Layers key="layers" className="w-5 h-5 text-cyan-400" />,
];

export const AboutSection: React.FC = () => {
  const { metrics, theme, stack } = PORTFOLIO_CONFIG;

  const sectionRef = useSectionReveals<HTMLElement>(({ scope, desktop }) => {
    // `[data-intro]` — big word rises in from below the fold.
    const intro = gsap.utils.toArray<HTMLElement>("[data-intro]", scope);
    if (intro.length) {
      gsap.from(intro, {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: REVEAL_EASE,
        scrollTrigger: { trigger: scope, start: "top 70%", once: true },
      });
    }

    const textEl = scope.querySelector<HTMLElement>("[data-scrub]");
    if (!textEl) return;

    if (desktop) {
      // Word-by-word colour scrub reading with the scroll position.
      gsap.fromTo(
        textEl.querySelectorAll(".word"),
        { color: "#52525b", opacity: 0.2 },
        {
          color: "#ffffff",
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: textEl,
            start: "top 85%",
            end: "bottom 50%",
            scrub: true,
          },
        }
      );
    } else {
      // Mobile: simple block fade.
      gsap.from(textEl, {
        y: 24,
        opacity: 0,
        duration: REVEAL_DURATION,
        ease: REVEAL_EASE,
        scrollTrigger: { trigger: textEl, start: "top 90%", once: true },
      });
    }
  });

  const words = STATEMENT.split(" ");

  return (
    <section
      ref={sectionRef}
      id="about"
      className="bg-[#050505] text-white pt-24 pb-0 px-6 md:px-16 flex flex-col justify-center relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full z-10 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 md:gap-12 lg:gap-24 items-center">
          {/* Big word + label */}
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-gray-500 mb-4 md:mb-6">
              About me
            </span>
            <h2
              data-intro
              className="text-[18vw] md:text-[9rem] lg:text-[11rem] xl:text-[13rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-800 drop-shadow-2xl leading-[0.85]"
            >
              Intro
            </h2>
          </div>

          {/* Scrubbed statement card */}
          <div className="relative bg-white/5 backdrop-blur-md px-5 py-7 md:p-10 lg:p-12 rounded-3xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/[0.07] transition-colors duration-300 text-left">
            <p
              data-scrub
              lang="en"
              className="text-gray-300 text-[15px] sm:text-base md:text-lg lg:text-xl leading-[1.7] md:leading-relaxed font-light text-pretty hyphens-auto"
            >
              {words.map((word, i) => (
                <React.Fragment key={`${word}-${i}`}>
                  <span
                    className={`word ${
                      EMPHASIS.has(word.replace(/[.,;:]/g, ""))
                        ? "text-white font-medium"
                        : ""
                    }`}
                  >
                    {word}
                  </span>
                  {i < words.length - 1 && " "}
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>

        {/* Impact metrics */}
        <div
          data-reveal-group="0.1"
          className="mt-16 md:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {metrics.map((item, idx) => (
            <div
              key={item.label}
              className="p-6 rounded-2xl bg-[#0b0b0b] border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 rounded-xl bg-white/5 border border-white/10">
                  {METRIC_ICONS[idx % METRIC_ICONS.length]}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  0{idx + 1}
                </span>
              </div>
              <div
                style={{ color: idx === 0 ? theme.accent : "#ffffff" }}
                className="text-2xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight"
              >
                {item.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-200">
                {item.label}
              </div>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The stack — full-bleed marquee band */}
      <StackMarquee groups={stack} />
    </section>
  );
};
export default AboutSection;
