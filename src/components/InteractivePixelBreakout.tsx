import React, { useEffect, useRef, useState, useCallback } from "react";

// 5x7 ASCII Bitmap Font Dictionary reverse-engineered from the target
const BITMAP_FONT: Record<string, string> = {
  A: "..#../.#.#./#...#/#...#/#####/#...#/#...#",
  B: "####./#...#/#...#/####./#...#/#...#/####.",
  C: ".####/#..../#..../#..../#..../#..../.####",
  D: "####./#...#/#...#/#...#/#...#/#...#/####.",
  E: "#####/#..../#..../####./#..../#..../#####",
  F: "#####/#..../#..../####./#..../#..../#....",
  G: ".####/#..../#..../#.###/#...#/#...#/.###.",
  H: "#...#/#...#/#...#/#####/#...#/#...#/#...#",
  I: "#####/..#../..#../..#../..#../..#../#####",
  J: "..###/...#./...#./...#./...#./#..#./.##..",
  K: "#...#/#..#./#.#../##.../#.#../#..#./#...#",
  L: "#..../#..../#..../#..../#..../#..../#####",
  M: "#...#/##.##/#.#.#/#...#/#...#/#...#/#...#",
  N: "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#",
  O: ".###./#...#/#...#/#...#/#...#/#...#/.###.",
  P: "####./#...#/#...#/####./#..../#..../#....",
  Q: ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",
  R: "####./#...#/#...#/####./#.#../#..#./#...#",
  S: ".####/#..../#..../.###./....#/....#/####.",
  T: "#####/..#../..#../..#../..#../..#../..#..",
  U: "#...#/#...#/#...#/#...#/#...#/#...#/.###.",
  V: "#...#/#...#/#...#/#...#/#...#/.#.#./..#..",
  W: "#...#/#...#/#...#/#...#/#.#.#/##.##/#...#",
  X: "#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
  Y: "#...#/#...#/.#.#./..#../..#../..#../..#..",
  Z: "#####/....#/...#./..#../.#.../#..../#####",
  "0": ".###./#...#/#..##/#.#.#/##..#/#...#/.###.",
  "1": "..#../.##../..#../..#../..#../..#../.###.",
  "2": ".###./#...#/....#/...#./..#../.#.../#####",
  "3": "#####/...#./..#../...#./....#/#...#/.###.",
  "4": "...#./..##./.#.#./#..#./#####/...#./...#.",
  "5": "#####/#..../####./....#/....#/#...#/.###.",
  "6": "..##./.#.../#..../####./#...#/#...#/.###.",
  "7": "#####/....#/...#./..#../.#.../.#.../.#...",
  "8": ".###./#...#/#...#/.###./#...#/#...#/.###.",
  "9": ".###./#...#/#...#/.####/....#/...#./.##..",
  ".": "...../...../...../...../...../.##../.##..",
  ",": "...../...../...../...../.##../.##../#....",
  "!": "..#../..#../..#../..#../..#../...../..#..",
  "?": ".###./#...#/....#/..##./..#../...../..#..",
  "-": "...../...../...../#####/...../...../.....",
  "'": "..#../..#../...../...../...../...../.....",
  "&": ".##../#..#./#..#./.##../#.#.#/#..#./.##.#",
  "/": "....#/....#/...#./..#../.#.../#..../#....",
  "+": "...../..#../..#../#####/..#../..#../.....",
  ":": "...../..#../..#../...../..#../..#../.....",
  " ": "...../...../...../...../...../...../.....",
};

const CELL_ACTIVE = 1;
const CELL_DESTROYED = 2;
const CELL_EMPTY = 0;
const REGROW_DELAY_SEC = 1.4;

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

// Calculate string pixel width (5 columns + 1 gap per char, minus trailing gap)
const measureLineWidth = (line: string): number =>
  Math.max(0, line.length * 6 - 1);

// Calculate total text bounding box
const measureTextBounds = (lines: string[]) => ({
  w: Math.max(1, ...lines.map(measureLineWidth)),
  h: lines.length * 7 + (lines.length - 1) * 3, // 7 rows per char + 3 row line gap
});

// Rasterize text into a 2D Uint8Array grid
function rasterizeLines(
  lines: string[],
  cols: number,
  rows: number,
  verticalRatio = 0.35,
): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  const bounds = measureTextBounds(lines);
  const startY = Math.max(0, Math.round(rows * verticalRatio - bounds.h / 2));

  lines.forEach((line, lineIdx) => {
    const lineWidth = measureLineWidth(line);
    const startX = Math.round((cols - lineWidth) / 2);
    const lineY = startY + lineIdx * 10; // 7 rows + 3 gap

    Array.from(line.toUpperCase()).forEach((char, charIdx) => {
      const glyph = BITMAP_FONT[char] || BITMAP_FONT[" "];
      const charX = startX + charIdx * 6;
      const glyphRows = glyph.split("/");

      glyphRows.forEach((rowStr, rIdx) => {
        for (let cIdx = 0; cIdx < 5; cIdx++) {
          if (rowStr[cIdx] === "#") {
            const gx = charX + cIdx;
            const gy = lineY + rIdx;
            if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
              grid[gy * cols + gx] = CELL_ACTIVE;
            }
          }
        }
      });
    });
  });

  return grid;
}

export interface InteractivePixelBreakoutProps {
  lines?: string[];
  caption?: string;
  startingLives?: number;
  autoPlay?: boolean;
  speed?: number;
  accentColor?: string;
  className?: string;
  panelClassName?: string;
  onWin?: () => void;
}

interface GameState {
  width: number;
  height: number;
  cell: number;
  cols: number;
  rows: number;
  grid: Uint8Array;
  standing: number;
  ox: number;
  oy: number;
  gap: number;
  accent: string;
  layer: HTMLCanvasElement;
  layerCtx: CanvasRenderingContext2D;
  layerDirty: boolean;
  radius: number;
  paddle: { x: number; y: number; w: number; h: number };
  ball: { x: number; y: number; vx: number; vy: number };
  baseSpeed: number;
  serving: boolean;
  serveDelay: number;
  lives: number;
  phase: "idle" | "attract" | "playing" | "won" | "over";
  clock: number;
  regrow: Array<{ cell: number; at: number }>;
  last: number;
  acc: number;
}

export const InteractivePixelBreakout: React.FC<InteractivePixelBreakoutProps> = ({
  lines = ["BREAK IT", "IF YOU CAN"],
  caption = "Break it if you can. It still ships.",
  startingLives = 3,
  autoPlay = true,
  speed = 1,
  accentColor = "#ff5c3d",
  className = "",
  panelClassName = "aspect-[16/10] sm:aspect-[2/1]",
  onWin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<{
    launch: () => void;
    movePaddleTo: (x: number) => void;
    nudgePaddle: (dx: number) => void;
  } | null>(null);
  const stateRef = useRef<GameState | null>(null);

  const linesRef = useRef(lines);
  const onWinRef = useRef(onWin);
  useEffect(() => {
    linesRef.current = lines;
    onWinRef.current = onWin;
  }, [lines, onWin]);

  const [phase, setPhase] = useState<GameState["phase"]>("idle");
  const [lives, setLives] = useState(startingLives);

  // Play subtle synthesize sound effects using Web Audio API
  const playSound = useCallback((type: "bounce" | "brick" | "lose" | "win") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "bounce") {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "brick") {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "lose") {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "win") {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // AudioContext might be blocked until user gesture, ignore silently
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    let animId = 0;
    let isVisible = true;
    let isIntersecting = false;

    // Render offscreen brick cache
    const redrawLayer = () => {
      const s = stateRef.current;
      if (!s) return;
      const { layerCtx, cell, gap, cols, rows, grid, ox, oy } = s;
      layerCtx.clearRect(0, 0, s.width, s.height);
      const innerSize = cell - gap;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r * cols + c];
          if (val !== CELL_EMPTY) {
            layerCtx.fillStyle =
              val === CELL_ACTIVE ? "#f2efe9" : "rgba(242, 239, 233, 0.06)";
            layerCtx.fillRect(ox + c * cell, oy + r * cell, innerSize, innerSize);
          }
        }
      }
      s.layerDirty = false;
    };

    // Main Canvas Render
    const renderFrame = () => {
      const s = stateRef.current;
      if (!s) return;

      if (s.layerDirty) redrawLayer();

      ctx.clearRect(0, 0, s.width, s.height);
      ctx.drawImage(s.layer, 0, 0, s.width, s.height);

      if (s.phase !== "playing" && s.phase !== "attract") return;

      const { paddle, ball, radius } = s;

      // Draw Paddle
      ctx.fillStyle = s.accent;
      const px = paddle.x - paddle.w / 2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(px, paddle.y, paddle.w, paddle.h, paddle.h / 2);
        ctx.fill();
      } else {
        ctx.fillRect(px, paddle.y, paddle.w, paddle.h);
      }

      // Draw Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    // Setup or resize game bounds
    const resizeGame = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w < 40 || h < 40) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bounds = measureTextBounds(linesRef.current);
      const scaleFactor = Math.min(
        (w * (w < 520 ? 0.94 : 0.88)) / bounds.w,
        (h * 0.56) / bounds.h
      );
      const snap = 1 / dpr;
      const cell = clamp(Math.floor(scaleFactor / snap) * snap, 4, 26);
      const cols = Math.floor(w / cell);
      const rows = Math.floor(h / cell);
      const grid = rasterizeLines(
        linesRef.current,
        cols,
        rows,
        clamp(0.3 + (h / w) * 0.12, 0.3, 0.44)
      );

      let standing = 0;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === CELL_ACTIVE) standing++;
      }

      const layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      const layerCtx = layer.getContext("2d")!;
      layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isAutoplay = autoPlay;

      stateRef.current = {
        width: w,
        height: h,
        cell,
        cols,
        rows,
        grid,
        standing,
        ox: (w - cols * cell) / 2,
        oy: (h - rows * cell) / 2,
        gap: Math.max(1, Math.round(cell * 0.22)),
        accent: accentColor,
        layer,
        layerCtx,
        layerDirty: true,
        radius: clamp(cell * 0.5, 4, 9),
        paddle: {
          x: w / 2,
          w: clamp(w * 0.26, 64, 200),
          h: clamp(cell * 0.8, 5, 14),
          y: h - Math.max(26, cell * 2.4),
        },
        ball: { x: w / 2, y: 0, vx: 0, vy: 0 },
        baseSpeed: clamp(h * 0.46, 150, 420) * speed,
        serving: true,
        serveDelay: isAutoplay ? 0.6 : Infinity,
        lives: startingLives,
        phase: isAutoplay ? "attract" : "idle",
        clock: 0,
        regrow: [],
        last: 0,
        acc: 0,
      };

      setPhase(isAutoplay ? "attract" : "idle");
      setLives(startingLives);
      renderFrame();
    };

    // Check ball intersection with brick cells
    const getIntersectedBricks = (): number[] => {
      const s = stateRef.current;
      if (!s) return [];
      const { ball, radius, cell, cols, rows, ox, oy, grid } = s;
      const minCol = Math.floor((ball.x - radius - ox) / cell);
      const maxCol = Math.floor((ball.x + radius - ox) / cell);
      const minRow = Math.floor((ball.y - radius - oy) / cell);
      const maxRow = Math.floor((ball.y + radius - oy) / cell);

      const hitIndices: number[] = [];
      for (let r = Math.max(0, minRow); r <= Math.min(rows - 1, maxRow); r++) {
        for (let c = Math.max(0, minCol); c <= Math.min(cols - 1, maxCol); c++) {
          const idx = r * cols + c;
          if (grid[idx] === CELL_ACTIVE) {
            hitIndices.push(idx);
          }
        }
      }
      return hitIndices;
    };

    // Step physics along one axis and resolve collisions
    const stepAxis = (axis: "x" | "y", dt: number) => {
      const s = stateRef.current;
      if (!s) return;
      const { ball } = s;

      if (axis === "x") ball.x += ball.vx * dt;
      else ball.y += ball.vy * dt;

      const hit = getIntersectedBricks();
      if (!hit.length) return;

      const isAttract = s.phase === "attract";
      hit.forEach((idx) => {
        s.grid[idx] = CELL_DESTROYED;
        s.standing--;
        if (isAttract) {
          s.regrow.push({ cell: idx, at: s.clock + REGROW_DELAY_SEC });
        }
      });

      playSound("brick");
      s.layerDirty = true;
      if (axis === "x") {
        ball.x -= ball.vx * dt;
        ball.vx = -ball.vx;
      } else {
        ball.y -= ball.vy * dt;
        ball.vy = -ball.vy;
      }
    };

    const resetBallServe = () => {
      const s = stateRef.current;
      if (!s) return;
      s.serving = true;
      s.serveDelay = 0.8;
      s.ball.vx = 0;
      s.ball.vy = 0;
    };

    const setGamePhase = (newPhase: GameState["phase"]) => {
      if (!stateRef.current) return;
      stateRef.current.phase = newPhase;
      setPhase(newPhase);
      if (newPhase === "won") {
        playSound("win");
        onWinRef.current?.();
      } else if (newPhase === "over") {
        playSound("lose");
      }
    };

    // Fixed timestep physics update (120 Hz)
    const tickPhysics = (dt: number) => {
      const s = stateRef.current;
      if (!s) return;
      const { ball, paddle, radius } = s;
      const isAttract = s.phase === "attract";

      // Process regrowth in attract mode
      s.clock += dt;
      while (s.regrow.length && s.regrow[0].at <= s.clock) {
        const item = s.regrow.shift()!;
        if (s.grid[item.cell] === CELL_DESTROYED) {
          s.grid[item.cell] = CELL_ACTIVE;
          s.standing++;
          s.layerDirty = true;
        }
      }

      // AI Paddle Tracking in Attract Mode
      if (isAttract && !s.serving) {
        paddle.x = clamp(
          paddle.x + (ball.x - paddle.x) * Math.min(1, dt * 7),
          paddle.w / 2,
          s.width - paddle.w / 2
        );
      }

      // Serving State
      if (s.serving) {
        ball.x = paddle.x;
        ball.y = paddle.y - radius - 1;
        if (Number.isFinite(s.serveDelay)) {
          s.serveDelay -= dt;
          if (s.serveDelay <= 0) {
            s.serving = false;
            ball.vx = s.baseSpeed * 0.35 * (Math.random() < 0.5 ? -1 : 1);
            ball.vy = -s.baseSpeed;
          }
        }
        return;
      }

      // Step X and Y collisions independently
      stepAxis("x", dt);
      stepAxis("y", dt);

      // Screen Boundary Collisions
      if (ball.x - radius < 0) {
        ball.x = radius;
        ball.vx = Math.abs(ball.vx);
        playSound("bounce");
      }
      if (ball.x + radius > s.width) {
        ball.x = s.width - radius;
        ball.vx = -Math.abs(ball.vx);
        playSound("bounce");
      }
      if (ball.y - radius < 0) {
        ball.y = radius;
        ball.vy = Math.abs(ball.vy);
        playSound("bounce");
      }

      // Paddle Collision with Curved Normal Deflection
      const isXOverlap = Math.abs(ball.x - paddle.x) <= paddle.w / 2 + radius;
      const isYOverlap =
        ball.vy > 0 &&
        ball.y + radius >= paddle.y &&
        ball.y - radius <= paddle.y + paddle.h;

      if (isXOverlap && isYOverlap) {
        const hitOffset = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1);
        const angle = hitOffset * 1.05; // Deflection angle up to ~60 deg
        const currentSpeed = Math.min(
          Math.hypot(ball.vx, ball.vy) * 1.008,
          s.baseSpeed * 1.45
        );
        ball.vx = Math.sin(angle) * currentSpeed;
        ball.vy = -Math.cos(angle) * currentSpeed;
        ball.y = paddle.y - radius - 0.5;
        playSound("bounce");
      }

      // Ball Out of Bounds (Bottom)
      if (ball.y - radius > s.height) {
        if (isAttract) {
          resetBallServe();
        } else {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) {
            setGamePhase("over");
          } else {
            playSound("lose");
            resetBallServe();
          }
        }
      }

      // Win Condition
      if (!isAttract && s.standing === 0) {
        setGamePhase("won");
      }
    };

    // 120Hz Fixed Timestep Accumulator Game Loop
    const FIXED_STEP = 1 / 120;
    const gameLoop = (timestamp: number) => {
      animId = requestAnimationFrame(gameLoop);
      const s = stateRef.current;
      if (!s) return;

      const delta = s.last ? Math.min((timestamp - s.last) / 1000, 4 * FIXED_STEP) : 0;
      s.last = timestamp;

      if (s.phase === "playing" || s.phase === "attract") {
        s.acc += delta;
        let subSteps = 0;
        while (s.acc >= FIXED_STEP && subSteps < 4) {
          tickPhysics(FIXED_STEP);
          s.acc -= FIXED_STEP;
          subSteps++;
        }
        if (subSteps === 4) s.acc = 0;
      }

      renderFrame();
    };

    const isRunning = () => isVisible && isIntersecting;
    const startLoop = () => {
      if (!animId && isRunning()) {
        if (stateRef.current) {
          stateRef.current.last = 0;
          stateRef.current.acc = 0;
        }
        animId = requestAnimationFrame(gameLoop);
      }
    };
    const stopLoop = () => {
      cancelAnimationFrame(animId);
      animId = 0;
    };

    controlsRef.current = {
      launch: () => {
        let s = stateRef.current;
        if (!s) return;
        if (s.phase !== "playing") {
          resizeGame();
          s = stateRef.current!;
        }
        s.phase = "playing";
        setPhase("playing");
        if (s.serving) {
          s.ball.x = s.paddle.x;
          s.ball.y = s.paddle.y - s.radius - 1;
          s.serving = false;
          s.serveDelay = Infinity;
          s.ball.vx = s.baseSpeed * 0.35 * (Math.random() < 0.5 ? -1 : 1);
          s.ball.vy = -s.baseSpeed;
        }
        startLoop();
      },
      movePaddleTo: (x: number) => {
        const s = stateRef.current;
        if (s) s.paddle.x = clamp(x, s.paddle.w / 2, s.width - s.paddle.w / 2);
      },
      nudgePaddle: (dx: number) => {
        const s = stateRef.current;
        if (s) s.paddle.x = clamp(s.paddle.x + dx, s.paddle.w / 2, s.width - s.paddle.w / 2);
      },
    };

    resizeGame();
    startLoop();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeGame, 180);
    });
    ro.observe(container);

    const io = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      isRunning() ? startLoop() : stopLoop();
    }, { threshold: 0.01 });
    io.observe(container);

    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      isRunning() ? startLoop() : stopLoop();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopLoop();
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      controlsRef.current = null;
    };
  }, [lines, startingLives, autoPlay, speed, accentColor, playSound]);

  const handleUserTrigger = useCallback(() => {
    if (stateRef.current?.phase === "attract" || stateRef.current?.phase === "idle") {
      controlsRef.current?.launch();
      return true;
    }
    return false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    handleUserTrigger();
    const rect = container.getBoundingClientRect();
    controlsRef.current?.movePaddleTo(e.clientX - rect.left);
  }, [handleUserTrigger]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const s = stateRef.current;
    const step = (s?.cell ?? 8) * 4;
    if (e.key === "ArrowLeft") {
      handleUserTrigger();
      controlsRef.current?.nudgePaddle(-step);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      handleUserTrigger();
      controlsRef.current?.nudgePaddle(step);
      e.preventDefault();
    } else if (e.key === " " || e.key === "Enter") {
      controlsRef.current?.launch();
      e.preventDefault();
    }
  }, [handleUserTrigger]);

  return (
    <div className={`relative ${className}`}>
      {caption && (
        <div className="mb-4 flex items-center justify-between">
          <p
            style={{ borderColor: accentColor }}
            className="inline-block pb-1 border-b-2 text-xs sm:text-sm font-semibold tracking-wide text-white/90 uppercase"
          >
            {caption}
          </p>
          {phase === "playing" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 tracking-wider uppercase font-mono">
                Balls
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: startingLives }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: i < lives ? accentColor : "rgba(255,255,255,0.15)",
                    }}
                    className="w-2.5 h-2.5 rounded-full transition-colors duration-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        role="application"
        aria-roledescription="brick breaker headline game"
        aria-label={`${lines.join(" ")} — Playable interactive arcade game`}
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerDown={() => controlsRef.current?.launch()}
        onKeyDown={handleKeyDown}
        style={{
          touchAction: phase === "playing" ? "none" : "auto",
        }}
        className={`relative w-full ${panelClassName} select-none outline-none rounded-lg bg-[#050505] border border-white/10 shadow-2xl overflow-hidden focus-visible:ring-2 focus-visible:ring-white/50 ${
          phase === "playing" ? "cursor-none" : "cursor-pointer"
        }`}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Status Badge / Interactive CTA */}
        {phase !== "playing" && (
          <div className="absolute inset-x-0 bottom-4 px-6 flex items-center justify-between pointer-events-none">
            <span className="text-[11px] sm:text-xs font-mono tracking-wider text-white/40 uppercase bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              {phase === "attract" ? "Auto-Play Demo" : "Ready"}
            </span>

            <span
              style={{
                backgroundColor: phase === "won" ? accentColor : "rgba(0,0,0,0.75)",
                color: phase === "won" ? "#161616" : accentColor,
                borderColor: accentColor,
              }}
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-widest uppercase border backdrop-blur-md shadow-lg pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
            >
              {phase === "won"
                ? "Cleared! Play Again"
                : phase === "over"
                ? "Out of balls · Try Again"
                : "Click or Move to Play"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractivePixelBreakout;
