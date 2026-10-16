import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { PORTFOLIO_CONFIG } from "../config/portfolio";
import DotWordAnimation from "./DotWordAnimation";
import HeroTilePortrait from "./HeroTilePortrait";

interface HeroPreloaderProps {
  onPreloadComplete: () => void;
}

/** Hero wordmark type (bundle: `sa`) + gradient treatment (bundle: `ca`) */
const WORD_CLASS =
  "flex items-baseline text-[16vw] md:text-[10rem] lg:text-[14rem] font-black tracking-tighter drop-shadow-2xl leading-none uppercase";
const GRADIENT_CLASS =
  "text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-800";

/** How long the assembled name sits still before it morphs (user spec: 2s). */
const HOLD_MS = 2000;

export const HeroPreloader: React.FC<HeroPreloaderProps> = ({ onPreloadComplete }) => {
  const { profile, projects } = PORTFOLIO_CONFIG;

  // Bundle: `let e = "PORTFOLIO", t = y.wordmark` — the dot animation writes
  // the NAME first, it holds, then it morphs left-to-right into "PORTFOLIO".
  const startWord = profile.wordmark; // e.g. "ADITHYA" — appears first
  const targetWord = "PORTFOLIO"; // ...then the name turns into this

  const [displayText, setDisplayText] = useState(startWord);
  const [scrambleStarted, setScrambleStarted] = useState(false);
  const [showDots, setShowDots] = useState(true);
  const [playPortrait, setPlayPortrait] = useState(false);

  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const leftHalfRef = useRef<HTMLSpanElement>(null);
  const rightHalfRef = useRef<HTMLSpanElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);
  const anchorRef = useRef<HTMLImageElement>(null);

  const dotsDone = useRef(false);
  const timers = useRef<number[]>([]);

  // Keep the latest callback without restarting the intro
  const doneRef = useRef(onPreloadComplete);
  useEffect(() => {
    doneRef.current = onPreloadComplete;
  }, [onPreloadComplete]);

  // Split at the bundle's fixed pivot (t.slice(0, 4) / t.slice(4))
  const splitIndex = 4;
  const leftText = displayText.slice(0, splitIndex);
  const rightText = displayText.slice(splitIndex);

  // Project thumbnails that make up the portrait tiles
  const thumbSpecs = useMemo(() => {
    const hues: Record<string, number> = {
      Agents: 18,
      "RAG & Search": 155,
      Multimodal: 195,
      Infrastructure: 265,
    };
    return projects.map((p) => ({
      label: p.title.split(" ")[0],
      hue: hues[p.category] ?? 30,
    }));
  }, [projects]);

  // Preload the portrait in parallel so the morph never waits on the network.
  const portraitReady = useMemo(
    () =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.src = profile.portraitUrl;
        if (img.complete) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      }),
    [profile.portraitUrl]
  );

  // Lock scrolling for the whole preloader.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Clear pending intro timers on unmount.
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  // Dot animation finished → hold the name → then let the morph begin.
  const handleDotsComplete = useCallback(() => {
    if (dotsDone.current) return;
    dotsDone.current = true;
    timers.current.push(
      window.setTimeout(() => {
        setScrambleStarted(true);
        timers.current.push(window.setTimeout(() => setShowDots(false), 320));
      }, HOLD_MS)
    );
  }, []);

  // The morph: name → PORTFOLIO, one character at a time from the left.
  useEffect(() => {
    if (!scrambleStarted) return;

    let cancelled = false;
    let interval: number | undefined;
    let ctx: gsap.Context | undefined;

    portraitReady.then(() => {
      if (cancelled) return;

      let step = 0;
      interval = window.setInterval(() => {
        // Exact bundle cadence + order: render → check → advance.
        //   r < floor(step) ? e[r]        (reveal PORTFOLIO char)
        //   r < t.length    ? t[r]        (else keep NAME char)
        //   :               ""
        setDisplayText(
          targetWord
            .split("")
            .map((char, idx) =>
              idx < Math.floor(step)
                ? char
                : idx < startWord.length
                  ? startWord[idx]
                  : ""
            )
            .join("")
        );

        if (step >= targetWord.length) {
          window.clearInterval(interval);
          setDisplayText(targetWord);

          // Signature reveal timeline — values extracted from the bundle:
          //   top      → 20% / 74% (mobile / desktop)  dur 1.5  power3.inOut @ +=0.2
          //   content  → y:50 → 0                       dur 1.2  stagger .2   @ -=1.0
          //   portrait → play                           call                 @ -=1.2
          //   halves   → ±min(300, w*.2)/2              dur 1.5  power3.out   @ <
          ctx = gsap.context(() => {
            const isMobile = window.innerWidth < 768;
            const tl = gsap.timeline({
              onComplete: () => {
                document.body.style.overflow = "auto";
                doneRef.current?.();
              },
            });

            tl.to(
              headingWrapperRef.current,
              {
                top: isMobile ? "20%" : "74%",
                duration: 1.5,
                ease: "power3.inOut",
              },
              "+=0.2"
            );

            tl.fromTo(
              roleRef.current,
              { y: 50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.2,
                ease: "power3.out",
              },
              "-=1.0"
            );

            tl.call(() => setPlayPortrait(true), undefined, "-=1.2");

            const split = isMobile
              ? window.innerWidth * 0.2
              : Math.min(300, window.innerWidth * 0.2);
            tl.to(leftHalfRef.current, { x: -split / 2, duration: 1.5, ease: "power3.out" }, "<");
            tl.to(rightHalfRef.current, { x: split / 2, duration: 1.5, ease: "power3.out" }, "<");
          });
        }

        step += 1 / 3;
      }, 50);
    });

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      ctx?.revert();
    };
  }, [scrambleStarted, portraitReady, startWord, targetWord]);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-end justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ background: `radial-gradient(circle, #222222 0%, #000000 80%)` }}
    >
      {/* Dimming layer behind the portrait (bundle) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Main title centerpiece */}
      <div
        ref={headingWrapperRef}
        className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none flex flex-col items-start w-max"
      >
        {/* Wordmark — two halves (bundle: t.slice(0,4) / t.slice(4)), re-rendered
            each tick; hidden while the dot animation plays */}
        <h1
          className={`${WORD_CLASS} ${GRADIENT_CLASS} transition-opacity duration-300 ${
            scrambleStarted ? "opacity-100" : "opacity-0"
          }`}
        >
          <span ref={leftHalfRef} className="inline-block will-change-transform">
            {leftText}
          </span>
          <span ref={rightHalfRef} className="inline-block will-change-transform">
            {rightText}
          </span>
        </h1>

        {/* Dot-animation overlay — the name assembles letter by letter */}
        {showDots && (
          <div
            className={`absolute top-0 left-0 transition-opacity duration-300 ${
              scrambleStarted ? "opacity-0" : "opacity-100"
            }`}
          >
            <DotWordAnimation
              word={profile.wordmark}
              className={WORD_CLASS}
              letterClassName={GRADIENT_CLASS}
              dotClassName="bg-gray-200"
              speed={1.15}
              onComplete={handleDotsComplete}
            />
          </div>
        )}

        {/* Job title, beneath the wordmark (bundle placement) */}
        <p
          ref={roleRef}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:-bottom-12 md:left-8 text-white text-base md:text-2xl lg:text-4xl drop-shadow-md z-10 opacity-0 w-max"
        >
          <span className="font-bold">{profile.role.bold}</span>{" "}
          <span className="font-light italic text-gray-300">{profile.role.light}</span>
        </p>
      </div>

      {/* Invisible anchor that positions the WebGL tile portrait
          (exact demo geometry: 110vh mobile / 143vh desktop) */}
      <div className="absolute inset-x-0 top-[30vh] md:top-[2vh] z-10 text-center text-white flex flex-col items-center w-full pointer-events-none">
        <img
          ref={anchorRef}
          src={profile.portraitUrl}
          alt=""
          aria-hidden="true"
          className="invisible w-auto max-w-none h-[110vh] md:h-[143vh]"
        />
      </div>

      {/* WebGL tile-mosaic portrait — project thumbnail tiles form the face,
          scatter on scroll, part around the pointer */}
      <HeroTilePortrait
        src={profile.portraitUrl}
        thumbs={thumbSpecs}
        anchorRef={anchorRef}
        play={playPortrait}
        label={`Portrait of ${profile.name} made of tiles from his projects`}
        className="z-10"
      />
    </section>
  );
};

export default HeroPreloader;
