/**
 * ui/screenManager.js — 界面状态机（无 DOM）
 */
import { events } from '../core/events.js';
import { logger } from '../core/logger.js';

export const ScreenId = {
  HOME: 'home',
  RUN: 'run',
  PICK: 'pick',
  RESULT: 'result',
  VAULT: 'vault',
};

let current = ScreenId.HOME;
const stack = [];

export const screenManager = {
  get current() {
    return current;
  },
  go(id, payload) {
    if (!Object.values(ScreenId).includes(id)) {
      logger.warn('Screen', 'unknown screen', id);
      return;
    }
    current = id;
    events.emit('screen:changed', { id, payload });
  },
  push(id, payload) {
    stack.push(current);
    this.go(id, payload);
  },
  back() {
    const prev = stack.pop() || ScreenId.HOME;
    this.go(prev);
  },
};
