// ═══════════════════════════════════════
// useCanvas — Reusable canvas drawing hook
// HiDPI-aware + optional continuous animation
// ═══════════════════════════════════════

import { useRef, useEffect } from "react";

/**
 * Deterministic pseudo-random number [0, 1) from a frame seed + index.
 * Same seed+index → same number every frame, so particles don't flicker.
 * @param {number} seed  - typically the frameCount
 * @param {number} index - per-call unique offset (loop index, etc.)
 */
export function prng(seed, index) {
  return ((Math.sin(seed * 0.37 + index * 7.13) + 1) * 43758.5453) % 1;
}

/**
 * @param {Function} draw - (ctx, W, H, frameCount) => void — drawing function
 * @param {Array} deps - React dependency array for redraws
 * @param {Object} opts - { animate: boolean } — if true, runs rAF loop
 */
export function useCanvas(draw, deps, opts = {}) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = c.getBoundingClientRect();
      const newW = rect.width || c.width / dpr;
      const newH = rect.height || c.height / dpr;
      if (newW <= 0 || newH <= 0) return;
      cssW = newW;
      cssH = newH;
      const scaledW = Math.round(cssW * dpr);
      const scaledH = Math.round(cssH * dpr);
      if (c.width !== scaledW || c.height !== scaledH) {
        c.width = scaledW;
        c.height = scaledH;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    let frameCount = 0;
    const render = (fc = 0) => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);
      drawRef.current(ctx, cssW, cssH, fc);
      ctx.restore();
    };

    resize();

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (opts.animate && !prefersReduced) {
      const loop = () => {
        frameCount++;
        render(frameCount);
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
    } else {
      render(0);
    }

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
            render();
          })
        : null;

    const themeObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver((records) => {
            for (const record of records) {
              if (record.attributeName === "data-theme") {
                resize();
                render();
                break;
              }
            }
          })
        : null;

    if (observer) observer.observe(c);
    if (themeObserver) themeObserver.observe(document.body, { attributes: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      if (observer) observer.disconnect();
      if (themeObserver) themeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
