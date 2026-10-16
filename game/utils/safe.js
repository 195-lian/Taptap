/**
 * utils/safe.js
 */
import { logger } from '../core/logger.js';

export function safeRun(tag, fn, fallback) {
  try {
    return fn();
  } catch (err) {
    logger.error(tag, 'safeRun failed', err);
    return typeof fallback === 'function' ? fallback(err) : fallback;
  }
}

export async function safeRunAsync(tag, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    logger.error(tag, 'safeRunAsync failed', err);
    return typeof fallback === 'function' ? fallback(err) : fallback;
  }
}
