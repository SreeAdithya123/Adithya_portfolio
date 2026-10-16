import React, { useState } from "react";
import gsap from "gsap";
import { PORTFOLIO_CONFIG } from "../config/portfolio";
import { useSectionReveals } from "../hooks/useSectionReveals";

/**
 * What We Can Do — the services we offer, rebuilt as the bundle's
 * `service` section: full-bleed rows with an animated scaleX rule
 * (--rule-scale), a click-to-expand accordion (capabilities left,
 * description + CTA right), desktop hover "lit" state, and the exact
 * entrance timeline from the production bundle:
 *
 *   from(rows, { yPercent:12, opacity:0, dur:.7, ease:power3.out, stagger:.08 })
 *   from(rows, { "--rule-scale":0, dur:.6, ease:power2.out, stagger:.08 }, 0)
 *   trigger: first row, start "top 88%", once
 */
export const ServicesSection: React.FC = () => {
  const { capabilities, theme } = PORTFOLIO_CONFIG;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useSectionReveals<HTMLElement>(({ scope }) => {
    const rows = gsap.utils.toArray<HTMLElement>("[data-service-row]", scope);
    if (!rows.length) return;
    gsap
      .timeline({
        scrollTrigger: {
          trigger: rows[0],
          start: "top 88%",
          once: true,
        },
      })
      .from(rows, {
        yPercent: 12,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      })
      .from(
        rows,
        {
          "--rule-scale": 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
        },
        0
      );
  });

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const headingLines = ["WHAT WE", "CAN DO"];

  return (
    <section
      ref={sectionRef}
      id="services"
      className="bg-[#050505] text-white pt-12 pb-0 px-6 md:px-16 flex flex-col relative overflow-hidden border-t border-white/5"
    >
      {/* Right-aligned masked heading — data-reveal-lines */}
      <div className="flex flex-col md:flex-row items-end md:items-start justify-end w-full mt-0 z-0 pb-12">
        <div className="flex flex-col md:flex-row items-start justify-end gap-2 md:gap-4 lg:gap-8 pr-2 md:pr-0 text-right">
          <h2
            data-reveal-lines
            className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-2xl leading-[1.1] md:leading-[0.9] text-right uppercase"
          >
            {headingLines.map((line) => (
              <span
                key={line}
                className="block overflow-hidden pb-[0.06em]"
              >
                <span className="line block text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-800">
                  {line}
                </span>
              </span>
            ))}
          </h2>
        </div>
      </div>

      {/* Service rows */}
      <div className="z-10 relative mt-0 -mx-6 md:-mx-16 border-t border-white/20">
        {capabilities.map((item, idx) => {
          const isLit = expanded === idx || (!isMobile && hovered === idx);
          const isOpen = expanded === idx;

          return (
            <div
              key={item.title}
              data-index={idx}
              data-service-row
              className={`service-row relative py-5 md:py-7 px-6 md:px-16 cursor-pointer transition-colors duration-500 ease-out ${
                isLit ? "bg-[var(--surface-lit)]" : ""
              }`}
              onClick={() => setExpanded(isOpen ? null : idx)}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start">
                {/* Left half: number, title, capabilities */}
                <div className="flex items-start justify-between w-full lg:w-1/2 gap-2">
                  <div className="flex items-start gap-3 md:gap-16 w-full min-w-0">
                    <div className="min-h-7 flex items-center md:min-h-10 flex-shrink-0">
                      <span
                        className={`text-lg md:text-3xl font-medium transition-colors duration-300 ease-in-out leading-none ${
                          isLit ? "text-[var(--surface-lit-ink)]" : "text-white"
                        }`}
                      >
                        {`0${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex flex-col w-full min-w-0">
                      <div className="min-h-7 flex items-center md:min-h-10">
                        <h3
                          className={`text-[11px] sm:text-sm md:text-xl lg:text-2xl font-black uppercase tracking-wide leading-tight transition-colors duration-300 ease-in-out ${
                            isLit ? "text-[var(--surface-lit-ink)]" : "text-white"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      {/* Capabilities (max-h accordion) */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out w-full ${
                          isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pt-6 lg:pt-8 flex flex-col gap-3">
                          <ul
                            className={`transition-colors duration-300 ease-in-out text-sm md:text-base font-light space-y-2 flex flex-col ${
                              isLit ? "text-[var(--surface-lit-ink-soft)]" : "text-gray-300"
                            }`}
                          >
                            {item.features.map((feat) => (
                              <li key={feat} className="flex items-start gap-3">
                                <span
                                  className={`transition-colors duration-300 ease-in-out mt-1.5 opacity-70 text-[10px] ${
                                    isLit ? "text-[var(--surface-lit-ink)]" : "text-[var(--accent)]"
                                  }`}
                                >
                                  ■
                                </span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile arrow */}
                  <div className="min-h-7 flex items-center flex-shrink-0 lg:hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-6 h-6 transition-all duration-300 ${
                        isLit ? "text-[var(--surface-lit-ink)]" : "text-[var(--accent)]"
                      } ${isOpen ? "-rotate-45" : "rotate-45"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Right half: description + CTA, desktop arrow */}
                <div className="flex flex-row gap-6 w-full lg:w-1/2 justify-between lg:justify-end relative items-start">
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out flex flex-col items-start w-full ${
                      isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pt-4 md:pt-6 lg:pt-[72px] flex flex-col gap-6 w-full pr-0 lg:pr-12">
                      <p
                        className={`transition-colors duration-300 ease-in-out text-base md:text-lg leading-relaxed max-w-lg font-light ${
                          isLit ? "text-[var(--surface-lit-ink-soft)]" : "text-gray-300"
                        }`}
                      >
                        {item.description}
                      </p>
                      <a
                        href="#contact"
                        onClick={(e) => e.stopPropagation()}
                        className={`font-bold uppercase tracking-wider text-xs md:text-sm px-6 py-3 border transition-colors duration-300 ease-in-out flex items-center gap-2 mt-4 ${
                          isLit
                            ? "bg-[var(--surface-lit-ink)] text-[var(--surface-lit)] border-[var(--surface-lit-ink)]"
                            : "bg-[var(--accent)] text-[#050505] border-[var(--accent)]"
                        }`}
                      >
                        <span className="w-2 h-2 border-t border-l border-current" />
                        Start a Project
                        <span className="w-2 h-2 border-b border-r border-current" />
                      </a>
                    </div>
                  </div>

                  {/* Desktop arrow */}
                  <div className="hidden lg:flex flex-shrink-0 h-10 items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-10 h-10 transition-all duration-300 ${
                        isLit ? "text-[var(--surface-lit-ink)]" : "text-[var(--accent)]"
                      } ${isOpen ? "-rotate-45" : "rotate-45"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default ServicesSection;
