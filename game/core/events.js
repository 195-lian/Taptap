/**
 * core/events.js — 轻量事件总线
 */
const handlers = new Map();

export const events = {
  on(type, fn) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(fn);
    return () => events.off(type, fn);
  },
  off(type, fn) {
    handlers.get(type)?.delete(fn);
  },
  emit(type, payload) {
    const set = handlers.get(type);
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        // listeners must not break game
      }
    });
  },
  clear() {
    handlers.clear();
  },
};
