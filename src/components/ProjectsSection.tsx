import React, { useState } from "react";
import { PORTFOLIO_CONFIG, type Project } from "../config/portfolio";
import { ArrowUpRight, Sparkles, X, CheckCircle } from "lucide-react";
import { GithubIcon } from "./SocialIcons";
import { useSectionReveals } from "../hooks/useSectionReveals";

/**
 * Featured Engineering — full-width project showcase.
 *
 * One project per horizontal section, stacked vertically with a
 * generous rhythm. Odd-numbered projects (1st, 3rd …) put the large
 * landscape image on the left with the text vertically centered on
 * the right; even-numbered projects reverse the arrangement. No card
 * grid and no bordered containers — premium black, oversized white
 * type with a subtle italic-serif accent on the closing word of each
 * title, muted gray descriptions, and LIVE DEMO / GITHUB actions when
 * links exist. Stacks vertically on mobile.
 */

/** Renders a title with its final word as a subtle italic serif accent. */
const TitleWithAccent: React.FC<{ title: string }> = ({ title }) => {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return <>{title}</>;
  const lead = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];
  return (
    <>
      {lead}{" "}
      <span
        style={{ textTransform: "none" }}
        className="font-serif font-light italic tracking-normal text-gray-200"
      >
        {tail}
      </span>
    </>
  );
};

export const ProjectsSection: React.FC = () => {
  const { projects, theme } = PORTFOLIO_CONFIG;
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sectionRef = useSectionReveals<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="bg-[#050505] text-white py-24 md:py-36 px-6 md:px-16 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div data-reveal="up" className="mb-20 md:mb-28">
          <div className="flex items-center gap-2 mb-3">
            <span
              style={{ backgroundColor: theme.accent }}
              className="w-1.5 h-1.5 rounded-full"
            />
            <span className="text-xs uppercase font-mono tracking-widest text-gray-400">
              Production Systems
            </span>
          </div>
          <h2
            data-reveal-lines
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase"
          >
            {["Featured", "Engineering"].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <span className="line block">{line}</span>
              </span>
            ))}
          </h2>
        </div>

        {/* Project showcase — alternating full-width rows */}
        <div className="flex flex-col gap-24 md:gap-36 lg:gap-44">
          {projects.map((project, idx) => {
            // Odd-numbered projects (1st, 3rd …) → image on the left.
            const imageLeft = idx % 2 === 0;

            return (
              <article
                key={project.id}
                className={`flex flex-col gap-8 md:gap-14 lg:gap-20 md:items-center ${
                  imageLeft ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Landscape image */}
                <div
                  data-reveal={imageLeft ? "left" : "right"}
                  className="w-full md:w-1/2"
                >
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    aria-label={`View details for ${project.title}`}
                    className="group/image relative block w-full overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 bg-white/[0.03] aspect-[16/10] cursor-pointer"
                  >
                    {project.image && (
                      <img
                        src={project.image}
                        alt={`${project.title} — preview`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover/image:scale-[1.04]"
                      />
                    )}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/image:opacity-100" />
                    <span className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-black opacity-0 translate-y-2 transition-all duration-500 group-hover/image:opacity-100 group-hover/image:translate-y-0">
                      View details <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>

                {/* Vertically centered text */}
                <div
                  data-reveal={imageLeft ? "right" : "left"}
                  className="w-full md:w-1/2 flex flex-col"
                >
                  <span className="mb-5 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-gray-500">
                    <span style={{ color: theme.accent }}>/</span>
                    {`0${idx + 1}`}
                    <span className="h-px w-8 bg-white/20" />
                    {project.category}
                  </span>

                  <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-5">
                    <TitleWithAccent title={project.title} />
                  </h3>

                  <p className="text-base md:text-lg leading-relaxed text-gray-300 font-light max-w-xl mb-3">
                    {project.subtitle}
                  </p>

                  <p className="text-sm md:text-base leading-relaxed text-gray-500 font-light max-w-xl mb-8">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-[var(--accent)]"
                      >
                        Live Demo <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:border-white/60 hover:bg-white/5"
                      >
                        <GithubIcon className="h-4 w-4" /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Project Details Modal */}
      {activeProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in-up"
          onClick={() => setActiveProject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0c0c0c] border border-white/20 rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveProject(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {activeProject.image && (
              <img
                src={activeProject.image}
                alt={`${activeProject.title} — preview`}
                className="w-full aspect-[16/10] object-cover rounded-2xl border border-white/10 mb-6"
              />
            )}

            <span className="text-xs font-mono uppercase tracking-widest text-[#ff5c3d]">
              {activeProject.category}
            </span>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight mt-1 mb-2">
              {activeProject.title}
            </h3>
            <p className="text-sm font-mono text-gray-400 mb-6">
              {activeProject.subtitle}
            </p>

            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              {activeProject.description}
            </p>

            {/* Key Metrics */}
            {activeProject.metrics && activeProject.metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/10 mb-6 bg-white/[0.02] rounded-xl px-3">
                {activeProject.metrics.map((metric) => (
                  <div key={metric} className="text-center">
                    <div className="text-[11px] md:text-xs font-mono font-bold text-white">
                      {metric}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Architecture Details */}
            {activeProject.architecture && activeProject.architecture.length > 0 && (
              <>
                <h4 className="text-sm font-mono uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff5c3d]" /> System Architecture
                </h4>
                <ul className="space-y-2.5 mb-6">
                  {activeProject.architecture.map((arch) => (
                    <li key={arch} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[#ff5c3d] shrink-0 mt-0.5" />
                      <span>{arch}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {activeProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono text-gray-400 bg-white/5 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-4 pt-6 border-t border-white/10">
              {activeProject.githubUrl && (
                <a
                  href={activeProject.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: theme.accent }}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                >
                  <GithubIcon className="w-4 h-4" /> View Architecture Repo
                </a>
              )}
              <button
                onClick={() => setActiveProject(null)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectsSection;
