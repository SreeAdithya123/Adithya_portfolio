import React, { useState } from "react";
import { PORTFOLIO_CONFIG } from "../config/portfolio";
import { InteractivePixelBreakout } from "./InteractivePixelBreakout";
import { Gamepad2, RotateCcw } from "lucide-react";

export const PixelBreakoutSection: React.FC = () => {
  const { breakout, theme } = PORTFOLIO_CONFIG;
  const [headline, setHeadline] = useState<string[]>(breakout.headline);
  const [line1, setLine1] = useState(breakout.headline[0]);
  const [line2, setLine2] = useState(breakout.headline[1]);

  const handleUpdateText = (e: React.FormEvent) => {
    e.preventDefault();
    const l1 = line1.trim().toUpperCase() || "AI THAT";
    const l2 = line2.trim().toUpperCase() || "SHIPS";
    setHeadline([l1, l2]);
  };

  const handleReset = () => {
    setLine1(breakout.headline[0]);
    setLine2(breakout.headline[1]);
    setHeadline(breakout.headline);
  };

  return (
    <section
      id="play"
      className="bg-[#050505] text-white py-24 md:py-36 px-4 sm:px-6 md:px-16 border-t border-white/5 relative overflow-hidden"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
            <Gamepad2 className="w-4 h-4 text-[#ff5c3d]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-gray-300">
              Interactive Arcade Showcase
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
            Break It If You Can
          </h2>
          <p className="mt-3 text-sm text-gray-400 max-w-lg mx-auto">
            {breakout.caption} Move your mouse or use arrow keys to control the paddle.
          </p>
        </div>

        {/* The Breakout Game Component */}
        <InteractivePixelBreakout
          lines={headline}
          caption="Destructible 5x7 ASCII Bitmap Font Matrix"
          accentColor={theme.accent}
          panelClassName="aspect-[5/6] sm:aspect-[4/3] lg:aspect-[16/9]"
        />

        {/* Dynamic Text Customizer Bar */}
        <form
          onSubmit={handleUpdateText}
          className="mt-8 p-4 rounded-2xl bg-[#0b0b0b] border border-white/10 flex flex-wrap items-center justify-between gap-4 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Line 1"
              maxLength={10}
              className="w-1/2 px-3 py-2 rounded-lg bg-black border border-white/10 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#ff5c3d]"
            />
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Line 2"
              maxLength={10}
              className="w-1/2 px-3 py-2 rounded-lg bg-black border border-white/10 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#ff5c3d]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              style={{ backgroundColor: theme.accent }}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Rasterize Custom Text
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Headline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
export default PixelBreakoutSection;
