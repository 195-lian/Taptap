/**
 * utils/pool.js — 通用对象池
 */
export function createPool(factory, reset, maxSize = 64) {
  const free = [];
  let total = 0;

  return {
    obtain() {
      const obj = free.pop() || factory();
      total += 1;
      return obj;
    },
    release(obj) {
      if (!obj) return;
      if (reset) reset(obj);
      if (free.length < maxSize) free.push(obj);
      total -= 1;
    },
    get size() {
      return total;
    },
    get freeCount() {
      return free.length;
    },
  };
}
