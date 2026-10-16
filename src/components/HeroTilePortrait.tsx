import React, { useEffect, useRef } from "react";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════════════
   Interactive Tile-Mosaic Portrait
   ───────────────────────────────────────────────────────────────
   Faithful port of the production bundle's WebGL2 portrait:

     • the hero photo is rasterised into a grid of point sprites
     • each tile samples a 56px window from a 2×2 atlas of
       project screenshots (hue from the screenshot, value from
       the portrait's brightness)
     • tiles fly in from a drifting "air" state on curved paths,
       staggered by delay/duration/phase attributes
     • scrolling scatters them in a ragged order; the pointer
       parts the tiles it passes over
     • dust specks (7% extra points) float permanently
     • renders on the gsap ticker, pauses off-screen via
       IntersectionObserver, falls back to the plain image when
       WebGL2 / reduced-motion requires it
   ═══════════════════════════════════════════════════════════════ */

/* ── Bundle constants ───────────────────────────────────────── */
const ATLAS_W = 1024;
const ATLAS_H = 640;
const WINDOW_PX = 56;
const DUST_RATIO = 0.07;

export interface PortraitThumb {
  /** Short label drawn into the procedural screenshot */
  label: string;
  /** Base hue (0–360) for the screenshot palette */
  hue: number;
  /** Atlas crop rect (uv) — defaults to the full thumbnail */
  crop?: [number, number, number, number];
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** `Hi = e => Math.min(6, Math.max(3.5, e / 200))` */
const cellPitch = (width: number) => Math.min(6, Math.max(3.5, width / 200));

const smoothstep01 = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ── Shaders (verbatim from the bundle) ─────────────────────── */
const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aHome;   // 0..1 inside the anchor rect
in vec3 aAir;    // x,y 0..1 over the canvas, z = depth (0 near, 1 far)
in vec4 aInfo;   // brightness, delay, duration, phase
in vec3 aCell;   // atlas window origin (uv), kind (0 tile, 1 dust)

uniform vec2 uRes;       // canvas, CSS px
uniform vec4 uRect;      // anchor x, y, w, h in canvas CSS px
uniform float uCell;     // tile pitch, CSS px
uniform float uDpr;
uniform float uTime;     // seconds, always running
uniform float uReveal;   // seconds since play
uniform float uScatter;  // 0 = face, 1 = blown back into the air
uniform vec2 uMouse;     // CSS px, far away when absent

out vec2 vCell;
out float vBright;
out float vLand;
out float vAlpha;
out float vPhase;

float inOut(float t) { return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0; }

void main() {
  float bright = aInfo.x;
  float delay  = aInfo.y;
  float dur    = aInfo.z;
  float phase  = aInfo.w;
  float depth  = aAir.z;
  bool dust    = aCell.z > 0.5;

  // Air position: a slow float, nearer specks drift further.
  vec2 drift = vec2(sin(uTime*0.31 + phase*6.283), cos(uTime*0.23 + phase*9.1))
             * (6.0 + 22.0*(1.0 - depth));
  vec2 air  = aAir.xy * uRes + drift;
  vec2 home = uRect.xy + aHome * uRect.zw;

  // Reveal: fade in as a speck (staggered), then fly home.
  float appear = smoothstep(0.0, 0.8, uReveal - delay*0.35);
  float fly    = dust ? 0.0 : clamp((uReveal - delay) / dur, 0.0, 1.0);
  float e      = inOut(fly);

  // Scroll: tiles leave in a ragged order rather than all at once.
  float q = clamp(uScatter*1.7 - phase*0.7, 0.0, 1.0);
  q = q*q;

  float k = e * (1.0 - q);              // 1 = sitting in the face
  vec2 pos = mix(air, home, k);

  // A curved path reads as gathered, a straight one as tweened.
  vec2 d = home - air;
  pos += vec2(-d.y, d.x) * 0.18 * sin(3.14159*k) * (phase - 0.5);

  // The pointer parts the tiles it passes over.
  vec2 m = pos - uMouse;
  float ml = length(m);
  pos += (ml > 0.001 ? m/ml : vec2(0.0)) * smoothstep(110.0, 0.0, ml) * 16.0 * k;

  float land  = smoothstep(0.55, 1.0, k);
  float speck = mix(2.2, 0.9, depth);
  float tile  = uCell * (0.25 + 0.7*bright);
  float size  = mix(speck, tile, land);

  float dustA = dust ? mix(0.55, 0.22, smoothstep(2.0, 4.0, uReveal)) : 1.0;
  vAlpha  = appear * mix(0.25 + 0.55*(1.0 - depth), 1.0, land) * dustA;
  vBright = bright;
  vLand   = land;
  vCell   = aCell.xy;
  vPhase  = phase;

  vec2 clip = pos / uRes * 2.0 - 1.0;
  gl_Position  = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = max(size * uDpr, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uAtlas;
uniform vec2 uWin;     // window size in atlas uv
uniform float uTime;

in vec2 vCell;
in float vBright;
in float vLand;
in float vAlpha;
in float vPhase;
out vec4 outColor;

void main() {
  vec3 c = texture(uAtlas, vCell + gl_PointCoord * uWin).rgb;
  // Hue from the screenshot, value from the portrait: normalise the sample to
  // full brightness (a dark UI grey becomes white, a dim blue a vivid one),
  // keep some of its real detail, then let the face decide how bright it is.
  float peak = max(max(c.r, c.g), max(c.b, 0.06));
  vec3 hue = c / peak;
  vec3 tile = mix(hue, min(c * 1.8, 1.0), 0.35);
  tile = mix(tile, vec3(1.0), 0.15);
  float twinkle = 0.9 + 0.1*sin(uTime*1.6 + vPhase*47.0);
  tile *= (0.1 + 0.95*vBright) * twinkle;

  vec3 speck = vec3(0.9, 0.92, 1.0);
  vec3 rgb = mix(speck, tile, vLand);
  outColor = vec4(rgb * vAlpha, vAlpha);
}
`;

/* ── Procedural project screenshots (atlas sources) ─────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws a small deterministic "UI screenshot" for a project so the
 * tiles pick up real screenshot-like hues — standing in for the
 * demo's four app screenshots.
 */
function renderThumb(spec: PortraitThumb, index: number): HTMLCanvasElement {
  const w = 640;
  const h = 400;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const rnd = mulberry32(index * 9176 + 17);
  const hue = spec.hue;

  // Page background
  const bg = x.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, `hsl(${hue} 52% 17%)`);
  bg.addColorStop(1, `hsl(${(hue + 45) % 360} 55% 8%)`);
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);

  // Faint grid texture
  x.strokeStyle = "rgba(255,255,255,0.05)";
  x.lineWidth = 1;
  for (let gx = 0; gx <= w; gx += 40) {
    x.beginPath();
    x.moveTo(gx + 0.5, 0);
    x.lineTo(gx + 0.5, h);
    x.stroke();
  }
  for (let gy = 0; gy <= h; gy += 40) {
    x.beginPath();
    x.moveTo(0, gy + 0.5);
    x.lineTo(w, gy + 0.5);
    x.stroke();
  }

  // Browser chrome
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.fillRect(0, 0, w, 36);
  const dots = ["#ff5f57", "#febc2e", "#28c840"];
  dots.forEach((col, i) => {
    x.fillStyle = col;
    x.beginPath();
    x.arc(20 + i * 20, 18, 5.5, 0, Math.PI * 2);
    x.fill();
  });
  x.fillStyle = "rgba(255,255,255,0.12)";
  x.fillRect(w * 0.3, 9, w * 0.4, 18);

  // Sidebar
  x.fillStyle = "rgba(0,0,0,0.3)";
  x.fillRect(0, 36, 96, h - 36);
  x.fillStyle = `hsl(${hue} 85% 60%)`;
  x.fillRect(16, 54, 26, 26);
  for (let i = 0; i < 5; i++) {
    x.fillStyle = i === index % 5 ? `hsl(${hue} 80% 65%)` : "rgba(255,255,255,0.18)";
    x.fillRect(16, 104 + i * 30, 64 - (i % 2) * 14, 9);
  }

  // Title
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.font = "700 30px ui-monospace, SFMono-Regular, Menlo, monospace";
  x.fillText(spec.label.toUpperCase().slice(0, 16), 124, 78);
  x.fillStyle = `hsl(${hue} 85% 62%)`;
  x.fillRect(124, 92, 150, 4);

  // Stat cards
  for (let i = 0; i < 3; i++) {
    const cx = 124 + i * 168;
    x.fillStyle = "rgba(255,255,255,0.07)";
    x.fillRect(cx, 116, 150, 74);
    x.fillStyle = "rgba(255,255,255,0.55)";
    x.fillRect(cx + 14, 132, 60 + rnd() * 40, 8);
    x.fillStyle = i === 1 ? `hsl(${(hue + 140) % 360} 70% 58%)` : `hsl(${hue} 85% 62%)`;
    x.fillRect(cx + 14, 152, 44 + rnd() * 30, 16);
  }

  // Chart panel
  x.fillStyle = "rgba(255,255,255,0.06)";
  x.fillRect(124, 210, 318, 150);
  const bars = 9;
  for (let i = 0; i < bars; i++) {
    const bh = 24 + rnd() * 100;
    x.fillStyle =
      i % 3 === 1
        ? `hsl(${(hue + 140) % 360} 70% 58%)`
        : `hsl(${hue} 82% ${52 + rnd() * 18}%)`;
    x.fillRect(140 + i * 33, 344 - bh, 22, bh);
  }

  // Right panel with code-ish lines
  x.fillStyle = "rgba(0,0,0,0.35)";
  x.fillRect(458, 116, 166, 244);
  for (let i = 0; i < 11; i++) {
    const lw = 40 + rnd() * 100;
    x.fillStyle =
      rnd() > 0.75
        ? `hsl(${(hue + 140) % 360} 75% 62%)`
        : rnd() > 0.5
          ? `hsl(${hue} 85% 66%)`
          : "rgba(255,255,255,0.28)";
    x.fillRect(472, 134 + i * 20, lw, 8);
  }

  // Force the atlas to neutral greys. The shader normalises any grey sample to
  // full white (`hue = c / peak`), so the portrait renders as white dots and
  // the little window "traffic-light" dots turn white too — independent of the
  // per-category hue map.
  x.globalCompositeOperation = "saturation";
  x.fillStyle = "hsl(0, 0%, 50%)";
  x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = "source-over";

  return c;
}

function buildAtlas(
  thumbs: Array<{ canvas: HTMLCanvasElement; crop?: [number, number, number, number] }>
): HTMLCanvasElement {
  const atlas = document.createElement("canvas");
  atlas.width = ATLAS_W;
  atlas.height = ATLAS_H;
  const ctx = atlas.getContext("2d")!;
  const halfW = ATLAS_W / 2;
  const halfH = ATLAS_H / 2;

  thumbs.slice(0, 4).forEach(({ canvas, crop }, i) => {
    const [sx, sy, sw, sh] = crop ?? [0, 0, 1, 1];
    const dx = (i % 2) * halfW;
    const dy = Math.floor(i / 2) * halfH;
    ctx.drawImage(
      canvas,
      sx * canvas.width,
      sy * canvas.height,
      sw * canvas.width,
      sh * canvas.height,
      dx,
      dy,
      halfW,
      halfH
    );
  });
  return atlas;
}

/* ── Cell building — exact port of `$i()` ───────────────────── */

interface CellBuffers {
  settle: number;
  cell: number;
  count: number;
  home: Float32Array;
  air: Float32Array;
  info: Float32Array;
  cellAttr: Float32Array;
}

function buildCells(
  img: HTMLImageElement,
  anchorWidth: number,
  visibleFrac: number
): CellBuffers {
  const pitch = cellPitch(anchorWidth);
  const cols = Math.max(20, Math.round(anchorWidth / pitch));
  const rows = Math.round((cols * img.naturalHeight) / img.naturalWidth);

  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;

  const home: number[] = [];
  const air: number[] = [];
  const info: number[] = [];
  const cellAttr: number[] = [];
  const winU = WINDOW_PX / ATLAS_W;
  const winV = WINDOW_PX / ATLAS_H;
  let settle = 0;

  const pushCell = (
    hx: number,
    hy: number,
    brightness: number,
    isDust: boolean
  ) => {
    home.push(hx, hy);
    air.push(Math.random() * 1.2 - 0.1, Math.random() * 1.2 - 0.1, Math.random());
    const delay = 0.35 + Math.random() * 1 + hy * 0.45;
    const dur = 1.35 + Math.random() * 0.55;
    if (!isDust) settle = Math.max(settle, delay + dur);
    info.push(brightness, delay, dur, Math.random());
    cellAttr.push(
      Math.random() * (1 - winU),
      Math.random() * (1 - winV),
      isDust ? 1 : 0
    );
  };

  // Rec.709 luma × alpha
  const luma = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    const t = i * 4;
    luma[i] =
      ((0.2126 * data[t] + 0.7152 * data[t + 1] + 0.0722 * data[t + 2]) / 255) *
      (data[t + 3] / 255);
  }

  // 2% / 97% percentile normalisation over non-empty pixels
  const sorted = Array.from(luma)
    .filter((v) => v >= 0.035)
    .sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.97)] ?? 1;

  const rowLimit = Math.min(rows, Math.ceil(rows * visibleFrac));
  for (let y = 0; y < rowLimit; y++) {
    for (let x = 0; x < cols; x++) {
      const v = luma[y * cols + x];
      if (v < 0.035 || (v < 0.08 && Math.random() < 0.45)) continue;
      const norm = clamp((v - lo) / (hi - lo), 0, 1);
      const brightness = 0.2 * norm + 0.8 * smoothstep01(0.1, 0.55, norm);
      pushCell((x + 0.5) / cols, (y + 0.5) / rows, brightness, false);
    }
  }

  // Ambient dust
  const tileCount = home.length / 2;
  for (let i = 0; i < Math.round(tileCount * DUST_RATIO); i++) {
    pushCell(0.5, 0.5, 0.3, true);
  }

  return {
    settle,
    cell: pitch,
    count: home.length / 2,
    home: new Float32Array(home),
    air: new Float32Array(air),
    info: new Float32Array(info),
    cellAttr: new Float32Array(cellAttr),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw Error(gl.getShaderInfoLog(shader) ?? "shader");
  }
  return shader;
}

/* ── Component ──────────────────────────────────────────────── */

export interface HeroTilePortraitProps {
  /** Hero photo that forms the portrait */
  src: string;
  /** Project thumbnails sampled by the tiles */
  thumbs: PortraitThumb[];
  /** Invisible anchor element that defines the portrait rect */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Flip to true when the preloader timeline should start the reveal */
  play: boolean;
  label: string;
  className?: string;
}

export const HeroTilePortrait: React.FC<HeroTilePortraitProps> = ({
  src,
  thumbs,
  anchorRef,
  play,
  label,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playRef = useRef<number | null>(null);

  // Reveal clock starts when the preloader timeline calls in
  // (reduced motion: start far in the past so the face is formed)
  useEffect(() => {
    if (play && playRef.current === null) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      playRef.current = performance.now() / 1000 - (reduced ? 100 : 0);
    }
  }, [play]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    if (!canvas || !anchor) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });

    const fallback = () => {
      anchor.style.visibility = "visible";
      canvas.style.display = "none";
    };
    if (!gl) {
      fallback();
      return;
    }

    let disposed = false;
    let running = false;
    let visible = false;
    let cellCount = 0;
    let pitch = 6;
    let settle = 0;
    let portrait: HTMLImageElement | null = null;
    let lastAnchorW = -1;
    let program: WebGLProgram;

    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw Error(gl.getProgramInfoLog(program) ?? "link");
      }
    } catch (err) {
      console.error(err);
      fallback();
      return;
    }

    gl.useProgram(program);
    const loc = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      res: loc("uRes"),
      rect: loc("uRect"),
      cell: loc("uCell"),
      dpr: loc("uDpr"),
      time: loc("uTime"),
      reveal: loc("uReveal"),
      scatter: loc("uScatter"),
      mouse: loc("uMouse"),
      atlas: loc("uAtlas"),
      win: loc("uWin"),
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = ["aHome", "aAir", "aInfo", "aCell"].map((name, i) => {
      const buf = gl.createBuffer();
      const locIdx = gl.getAttribLocation(program, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(locIdx);
      gl.vertexAttribPointer(locIdx, [2, 3, 4, 3][i], gl.FLOAT, false, 0, 0);
      return buf;
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(u.win, WINDOW_PX / ATLAS_W, WINDOW_PX / ATLAS_H);

    const epoch = performance.now() / 1000;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const setState = (state: string) => {
      if (canvas.dataset.state !== state) canvas.dataset.state = state;
    };
    setState("idle");

    /** Rebuild cell buffers whenever the anchor's width changes. */
    const rebuild = () => {
      if (!portrait) return;
      const rect = anchor.getBoundingClientRect();
      const w = rect.width;
      if (w < 10 || Math.abs(w - lastAnchorW) < 1) return;
      lastAnchorW = w;

      const canvasRect = canvas.getBoundingClientRect();
      const visibleFrac = clamp(
        (canvasRect.bottom - rect.top) / rect.height,
        0,
        1
      );
      const cells = buildCells(portrait, w, visibleFrac);
      cellCount = cells.count;
      pitch = cells.cell;
      settle = cells.settle;
      [cells.home, cells.air, cells.info, cells.cellAttr].forEach((arr, i) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      });
    };

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
      if (mouse.x < -999) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
    };
    const onPointerLeave = () => {
      mouse.tx = mouse.ty = -9999;
      mouse.x = mouse.y = -9999;
    };

    /** One frame — attached to the gsap ticker while active. */
    const render = () => {
      if (!cellCount || playRef.current === null) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvasRect = canvas.getBoundingClientRect();
      const w = Math.round(canvasRect.width * dpr);
      const h = Math.round(canvasRect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      rebuild();

      const anchorRect = anchor.getBoundingClientRect();
      const now = performance.now() / 1000;
      const scatter = reduced
        ? 0
        : clamp(-canvasRect.top / (canvasRect.height * 0.7), 0, 1);

      mouse.x += (mouse.tx - mouse.x) * 0.18;
      mouse.y += (mouse.ty - mouse.y) * 0.18;

      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.res, canvasRect.width, canvasRect.height);
      gl.uniform4f(
        u.rect,
        anchorRect.left - canvasRect.left,
        anchorRect.top - canvasRect.top,
        anchorRect.width,
        anchorRect.height
      );
      gl.uniform1f(u.cell, pitch);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform1f(u.time, now - epoch);
      gl.uniform1f(u.reveal, now - playRef.current);
      gl.uniform1f(u.scatter, scatter);
      setState(
        scatter >= 1
          ? "gone"
          : scatter > 0
            ? "scattering"
            : now - playRef.current < settle
              ? "gathering"
              : "formed"
      );
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.drawArrays(gl.POINTS, 0, cellCount);
    };

    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      if (on) gsap.ticker.add(render);
      else gsap.ticker.remove(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      setRunning(visible && cellCount > 0);
    });
    observer.observe(canvas);

    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    }

    Promise.all([
      loadImage(src),
      Promise.resolve(
        thumbs
          .slice(0, 4)
          .map((spec, i) => ({ canvas: renderThumb(spec, i), crop: spec.crop }))
      ),
    ])
      .then(([img, thumbCanvases]) => {
        if (disposed) return;
        portrait = img;

        const atlas = buildAtlas(thumbCanvases);
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(u.atlas, 0);

        rebuild();
        setRunning(visible && cellCount > 0);
      })
      .catch((err) => {
        console.error(err);
        fallback();
      });

    return () => {
      disposed = true;
      setRunning(false);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      buffers.forEach((buf) => gl.deleteBuffer(buf));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [src, thumbs, anchorRef, label]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}
    />
  );
};

export default HeroTilePortrait;
