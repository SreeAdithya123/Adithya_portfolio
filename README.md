# Sree Adithya — AI Architect Portfolio

A high-performance, dark-brutalist portfolio website built for **Sree Adithya**, engineered with the same advanced interactive architecture reverse-engineered from [`https://demo.codeandchill.store/portfolio/`](https://demo.codeandchill.store/portfolio/).

---

## ⚡ Tech Stack & Architecture

- **Core**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 + Dark Brutalist Theme (`#050505`) + Neon Orange Accent (`#ff5c3d`)
- **Animation Engine**: GSAP 3 (ScrollTrigger, Timelines, Context)
- **Interactive Canvas**: Dual-Canvas Engine with 120Hz Fixed-Timestep Accumulator Loop
- **Icons**: Lucide React + Custom SVG Brand Glyphs

---

## 🎮 Signature Features

1. **Dot-Assembled Hero Preloader (`src/components/HeroPreloader.tsx` + `src/components/DotWordAnimation.tsx`)**:
   - The name `"ADITHYA"` is assembled letter by letter while a small dot hops along the baseline, orbits the pivot glyph and spins out (a faithful port of the demo bundle's `Vi` component).
   - The assembled name holds for 2s, then morphs left-to-right into `"PORTFOLIO"` (50ms ticker, `step += 1/3`).
   - GSAP split timeline: heading drops to `74%` desktop / `20%` mobile, the job title (`AI Architect`) fades up beneath it, then `PORT` / `FOLIO` split apart (`±min(300, w*0.2)/2`).
2. **WebGL Tile-Mosaic Portrait (`src/components/HeroTilePortrait.tsx`)**:
   - WebGL2 engine that builds the face out of tiny project-thumbnail tiles.
   - Tiles scatter on scroll, part around the pointer and re-assemble on reveal.
   - Graceful fallback to the plain portrait when WebGL or motion is unavailable.
3. **Word-by-Word Scrubbed About Section (`src/components/AboutSection.tsx`)**:
   - High-impact architectural philosophy with GSAP ScrollTrigger word scrubbing (`#52525b` ➔ `#ffffff`).
   - 4-column Bento metrics grid with token counts and latency benchmarks.
4. **What We Can Do — Services (`src/components/ServicesSection.tsx`)**:
   - Five offered services in clickable rows with an animated `--rule-scale` divider, lit state on hover/click and an expandable detail panel (features + "Start a Project" CTA).
5. **Production AI Projects Showcase (`src/components/ProjectsSection.tsx`)**:
   - Full-width, alternating project showcase: odd projects put the landscape image left with vertically-centered text right; even projects reverse. Oversized white titles with an italic-serif accent on the closing word, muted subtitle + description, and LIVE DEMO / GITHUB actions when links exist. No card grid or bordered containers.
   - Six projects (Vyoman Interviewer, Catalyst AI, Diabetic Foot Ulcer Classification, AI Daily Study Planner, Petsta, ParcelFlow), numbered 01–06 in display order.
   - Clicking an image opens an interactive deep-dive modal (metrics, architecture, tags — metrics/architecture are optional per project).
   - Project images live in `public/projects/`; source originals are kept in `project-assets/projects-src/`.
   - Reveal system (`data-reveal` / `data-reveal-lines`) drives the staggered entrance.
6. **Interactive Pixel Breakout Arcade (`src/components/PixelBreakoutSection.tsx`)**:
   - The exact reverse-engineered 5x7 ASCII bitmap font grid breakout game.
   - Dual-canvas performance optimization with offscreen brick caching.
   - AI autopilot "Attract" mode with time-delayed brick regrowth queue.
   - Interactive player mode with 3 lives, curved paddle normal deflection, and Web Audio API synthesized sound effects.
   - **Live Custom Text Input**: Type any custom phrase (e.g. `"HIRE SREE"`) and watch the game immediately re-rasterize it into destructible bricks!
7. **Contact & Footer (`src/components/ContactSection.tsx`)**:
   - One-click email copy pill with toast feedback (`Copied to clipboard!`).
   - Social links (GitHub, LinkedIn, X/Twitter).

---

## 🚀 Running Locally

```bash
# Navigate to the portfolio folder
cd /Users/sasi/project/portfolio

# Start the Vite development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build (port 4173)
npm run preview
```

---

## ⚙️ Customization

All your profile details, links, metrics, capabilities, and projects are centralized in one file:
👉 **[`src/config/portfolio.ts`](src/config/portfolio.ts)**

You can update:
- Name, Wordmark, and Role
- Social Links (GitHub, LinkedIn, X)
- Email address
- Featured projects, architecture bullets, and tags
- Breakout headline lines (e.g. `["AI THAT", "SHIPS"]`)
