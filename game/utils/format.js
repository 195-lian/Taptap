/**
 * utils/format.js
 */
export function formatInt(n) {
  return Math.floor(n).toLocaleString('en-US');
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
