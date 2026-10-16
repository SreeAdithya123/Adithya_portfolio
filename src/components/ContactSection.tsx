import React, { useState } from "react";
import gsap from "gsap";
import { PORTFOLIO_CONFIG } from "../config/portfolio";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "./SocialIcons";
import { useSectionReveals, REVEAL_EASE } from "../hooks/useSectionReveals";

/**
 * Contact — rebuilt against the production bundle's `Dl` component:
 *
 *   panel timeline   from { y:48, opacity:0, dur:1.1, power3.out }
 *                    trigger panel, start "top 85%", once
 *   rows             from { yPercent:105, opacity:0, dur:.85,
 *                            stagger:.08 } @ "-=0.75"
 *   desktop parallax panel yPercent 3.5 → -3.5, scrub 1
 *   magnetic         power3.out quickTo, strengths .28 (buttons) /
 *                    .35 (icons), pointer:fine only
 */

const ContactRow: React.FC<{
  label: string;
  value: string;
  href?: string;
  breakAll?: boolean;
}> = ({ label, value, href, breakAll }) => {
  const inner = (
    <>
      <span data-row-inner className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-2">
          {label}
        </span>
        <span
          className={`block text-base md:text-lg tracking-wide text-white/85 transition-colors duration-500 ${
            breakAll ? "break-all" : ""
          }`}
        >
          {value}
        </span>
      </span>
      {href && (
        <ArrowUpRight className="w-4 h-4 shrink-0 text-gray-500 transition-colors duration-300" />
      )}
    </>
  );

  const base =
    "group/row flex items-center justify-between gap-4 px-6 md:px-8 py-5 md:py-6 overflow-hidden transition-colors duration-500";

  return href ? (
    <a
      href={href}
      className={`${base} hover:bg-white/[0.05] focus-visible:bg-white/[0.05] outline-none`}
    >
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
};

export const ContactSection: React.FC = () => {
  const { profile, theme } = PORTFOLIO_CONFIG;
  const [copied, setCopied] = useState(false);

  const sectionRef = useSectionReveals<HTMLElement>(({ scope, desktop }) => {
    const panel = scope.querySelector<HTMLElement>("[data-contact-panel]");
    if (panel) {
      gsap
        .timeline({
          scrollTrigger: { trigger: panel, start: "top 85%", once: true },
        })
        .from(panel, { y: 48, opacity: 0, duration: 1.1, ease: REVEAL_EASE })
        .from(
          panel.querySelectorAll("[data-row-inner]"),
          {
            yPercent: 105,
            opacity: 0,
            duration: 0.85,
            ease: REVEAL_EASE,
            stagger: 0.08,
          },
          "-=0.75"
        );

      if (desktop) {
        gsap.fromTo(
          panel,
          { yPercent: 3.5 },
          {
            yPercent: -3.5,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }
    }

    // Magnetic buttons / icons — pointer:fine only.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cleanups: Array<() => void> = [];
    scope.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic || "") || 0.3;
      const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const reset = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", reset);
      el.addEventListener("blur", reset);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", reset);
        el.removeEventListener("blur", reset);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    { label: "GitHub", href: profile.socials.github, Icon: GithubIcon },
    { label: "LinkedIn", href: profile.socials.linkedin, Icon: LinkedinIcon },
    { label: "X / Twitter", href: profile.socials.twitter, Icon: TwitterIcon },
  ];

  const headline = ["Let's Build", "Intelligent", "Systems."];

  return (
    <footer
      ref={sectionRef}
      id="contact"
      className="relative min-h-screen text-white flex flex-col overflow-hidden"
    >
      {/* Background glows */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,#1a1310_0%,#050505_62%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/85"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pt-28 pb-16 md:pt-32 flex-1 flex items-center">
        <div className="w-full flex flex-col lg:flex-row gap-14 lg:gap-24">
          {/* Left: CTA */}
          <div className="w-full lg:w-6/12 flex flex-col">
            <div data-reveal className="mb-7">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md px-3.5 py-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.26em] text-gray-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-halo" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {profile.availability}
              </span>
            </div>

            <h2
              data-reveal-lines
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter drop-shadow-2xl mb-7 leading-[0.95] uppercase"
            >
              {headline.map((line, i) => (
                <span
                  key={line}
                  className="block overflow-hidden pb-[0.08em]"
                >
                  <span
                    className={`line block ${
                      i === 1
                        ? "italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#ff5c3d] to-amber-300"
                        : "text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-800"
                    }`}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            <p
              data-reveal
              data-reveal-delay="0.15"
              className="text-gray-300 text-base md:text-lg font-light leading-relaxed max-w-md"
            >
              Available for AI architecture consulting, autonomous agent design,
              and enterprise RAG infrastructure reviews.
            </p>

            <div data-reveal-group="0.12" className="flex flex-wrap gap-3 mt-10">
              <a
                data-magnetic="0.28"
                href={`mailto:${profile.email}`}
                style={{ backgroundColor: theme.accent }}
                className="group px-6 py-3.5 rounded-full text-black text-sm font-medium inline-flex items-center gap-2.5 shadow-lg shadow-black/30 transition-[background-color,box-shadow] duration-300 ease-out hover:brightness-110"
              >
                Send an email
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <button
                type="button"
                data-magnetic="0.28"
                onClick={handleCopyEmail}
                className="group px-6 py-3.5 rounded-full border border-white/25 text-white text-sm inline-flex items-center gap-2.5 backdrop-blur-md transition-[background-color,color,border-color] duration-300 ease-out hover:bg-white hover:text-black hover:border-white cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: contact panel */}
          <div className="w-full lg:w-6/12 flex lg:items-center">
            <div
              data-contact-panel
              className="w-full rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)] overflow-hidden divide-y divide-white/[0.08]"
            >
              <ContactRow
                label="Email"
                value={profile.email}
                href={`mailto:${profile.email}`}
                breakAll
              />
              <ContactRow label="Based in" value={profile.location} />
              <ContactRow
                label="Focus"
                value="Agent orchestration · RAG · Inference"
              />
              <div className="px-6 md:px-8 py-6 md:py-7 overflow-hidden">
                <div data-row-inner>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-4">
                    Elsewhere
                  </p>
                  <div className="flex items-center gap-3">
                    {socials.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        data-magnetic="0.35"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="w-11 h-11 rounded-full border border-white/10 bg-white/[0.07] flex items-center justify-center transition-[background-color,color,border-color] duration-300 ease-out hover:bg-white hover:text-black hover:border-white"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pb-8">
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500">
          <div>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </div>
          <a href="#home" className="hover:text-white transition-colors">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
};
export default ContactSection;
