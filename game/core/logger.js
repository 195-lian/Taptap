/**
 * core/logger.js — 分级日志，发布可关 debug
 */
import { LOG } from '../data/gameConfig.js';

const ORDER = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level) {
  const min = ORDER[LOG.LEVEL] ?? ORDER.info;
  return ORDER[level] >= min;
}

function write(level, tag, msg, data) {
  if (!shouldLog(level)) return;
  const line = `[${level}][${tag}] ${msg}`;
  const fn =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (data !== undefined) fn(line, data);
  else fn(line);
}

export const logger = {
  debug: (tag, msg, data) => write('debug', tag, msg, data),
  info: (tag, msg, data) => write('info', tag, msg, data),
  warn: (tag, msg, data) => write('warn', tag, msg, data),
  error: (tag, msg, data) => write('error', tag, msg, data),
};
