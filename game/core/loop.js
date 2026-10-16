/**
 * core/loop.js — 主循环
 */
import { RUN } from '../data/gameConfig.js';

let rafId = 0;
let lastTs = 0;
let acc = 0;
let isRunning = false;
let updateFn = null;
let renderFn = null;

export const loop = {
  start(update, render) {
    updateFn = update;
    renderFn = render;
    if (isRunning) return;
    isRunning = true;
    lastTs = Date.now();
    acc = 0;
    const frame = () => {
      if (!isRunning) return;
      const now = Date.now();
      const dt = Math.min(100, now - lastTs);
      lastTs = now;
      acc += dt;
      while (acc >= RUN.TICK_MS) {
        updateFn?.(RUN.TICK_MS);
        acc -= RUN.TICK_MS;
      }
      renderFn?.(dt);
      if (typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = setTimeout(frame, RUN.TICK_MS);
      }
    };
    frame();
  },
  stop() {
    isRunning = false;
    if (rafId) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      else clearTimeout(rafId);
    }
    rafId = 0;
  },
};
