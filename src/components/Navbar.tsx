import React, { useEffect, useRef, useState } from "react";
import { PORTFOLIO_CONFIG } from "../config/portfolio";

const NAV_ITEMS = ["Home", "About", "Services", "Projects", "Play", "Contact"];

/**
 * Navbar — direct port of the demo bundle's nav (`ma`):
 *   • slide-in 100ms after mount (`translate-y-full` → `translate-y-0`)
 *   • rAF-throttled scroll; `scrolled` flips at scrollY > 24
 *   • bottom rule is a `scaleX(progress)` line, `opacity-60` once scrolled
 *   • active section via IntersectionObserver,
 *     `rootMargin: "-45% 0px -45% 0px"`, threshold 0
 *   • brand is the name in `font-black tracking-widest uppercase`; the
 *     surname is hidden on mobile and nudges right on hover
 */
export const Navbar: React.FC = () => {
  const { profile } = PORTFOLIO_CONFIG;
  const [first, ...restParts] = profile.name.split(" ");
  const rest = restParts.join(" ");

  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const ticking = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Slide the bar in shortly after mount (bundle: 100ms).
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 24);
      setProgress(total > 0 ? Math.min(y / total, 1) : 0);
      ticking.current = false;
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = NAV_ITEMS.map((label) =>
      document.getElementById(label.toLowerCase())
    ).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock background scroll while the mobile overlay is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Escape closes the overlay and returns focus to the toggle.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  const linkBase =
    "group relative block py-1 text-sm uppercase tracking-wider font-medium transition-colors duration-300 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-black";

  return (
    <>
      <header
        aria-label="Main"
        className={`fixed top-0 left-0 w-full z-50 transition-[transform,opacity,background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        } ${
          mobileOpen || scrolled
            ? "bg-black/70 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
          {/* Brand — the name, in the same black/wide-tracking treatment */}
          <a
            href="#home"
            aria-label={profile.name}
            onClick={closeMenu}
            className="group relative z-50 text-white font-black text-xl md:text-2xl tracking-widest uppercase leading-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
          >
            <span
              aria-hidden="true"
              className="inline-block transition-colors duration-300 group-hover:text-[var(--accent)]"
            >
              {first}
              {rest && (
                <span className="hidden md:inline-block overflow-hidden align-bottom">
                  <span className="inline-block translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:translate-x-1">
                    {"\u00A0"}
                    {rest}
                  </span>
                </span>
              )}
            </span>
            <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:scale-x-100" />
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((label) => {
              const id = label.toLowerCase();
              const isActive = active === id;
              return (
                <li key={label}>
                  <a
                    href={`#${id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`${linkBase} ${
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-gray-300 hover:text-[var(--accent)]"
                    }`}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px w-full bg-[var(--accent)] origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger — two rules that cross */}
          <button
            ref={toggleRef}
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span
              className={`block h-px w-6 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                mobileOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-6 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                mobileOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Scroll progress rule */}
        <div
          aria-hidden="true"
          className={`h-px w-full origin-left bg-[var(--accent)] transition-opacity duration-300 ${
            scrolled ? "opacity-60" : "opacity-0"
          }`}
          style={{ transform: `scaleX(${progress})` }}
        />
      </header>

      {/* Full-screen mobile overlay */}
      <div
        id="mobile-menu"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0a0a] transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none md:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col items-center gap-8">
          {NAV_ITEMS.map((label, i) => (
            <li
              key={label}
              className={`transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                mobileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: mobileOpen ? `${120 + i * 60}ms` : "0ms" }}
            >
              <a
                href={`#${label.toLowerCase()}`}
                onClick={closeMenu}
                className="block text-3xl font-black uppercase tracking-widest text-white transition-colors duration-300 hover:text-[var(--accent)] active:text-[var(--accent)] outline-none focus-visible:text-[var(--accent)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;
