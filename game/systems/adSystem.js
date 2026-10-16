/**
 * systems/adSystem.js — 激励视频状态机
 * 奖励必须 COMPLETED 后由 onRewarded 发放；防连点、防重复
 */
import { AD } from '../data/gameConfig.js';
import { logger } from '../core/logger.js';
import { safeRunAsync } from '../utils/safe.js';

export const AdStatus = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  SHOWING: 'SHOWING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
};

/** 预览用模拟平台；真机注入 TapTap 激励视频 */
const simulatePlatform = {
  async load() {
    await new Promise((r) => setTimeout(r, 200));
    return true;
  },
  async show() {
    await new Promise((r) => setTimeout(r, AD.SIMULATE_WATCH_MS));
    return { isCompleted: true };
  },
};

let platform = simulatePlatform;
const statusByType = new Map();
const usedTokens = new Set();

function getStatus(type) {
  return statusByType.get(type) || AdStatus.IDLE;
}

function setStatus(type, status) {
  statusByType.set(type, status);
}

function makeToken(type) {
  const token = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return token;
}

export const adSystem = {
  injectPlatform(p) {
    platform = p;
  },

  getStatus(type) {
    return getStatus(type);
  },

  canShow(type) {
    const s = getStatus(type);
    return s === AdStatus.IDLE || s === AdStatus.READY || s === AdStatus.FAILED;
  },

  /**
   * @param {string} type AD.TYPES.*
   * @param {{ onRewarded: (payload:{token:string,type:string})=>void, onFailed?: (reason:string)=>void }} handlers
   */
  async showRewarded(type, handlers) {
    if (!this.canShow(type)) {
      logger.warn('Ad', 'reject show, busy', { type, status: getStatus(type) });
      handlers.onFailed?.('busy');
      return { ok: false, reason: 'busy' };
    }

    setStatus(type, AdStatus.LOADING);
    const loaded = await safeRunAsync('Ad.load', () => platform.load(), false);
    if (!loaded) {
      setStatus(type, AdStatus.FAILED);
      logger.error('Ad', 'load failed', type);
      handlers.onFailed?.('load_failed');
      return { ok: false, reason: 'load_failed' };
    }

    setStatus(type, AdStatus.READY);
    setStatus(type, AdStatus.SHOWING);
    const result = await safeRunAsync('Ad.show', () => platform.show(), null);

    if (!result || !result.isCompleted) {
      setStatus(type, result ? AdStatus.SKIPPED : AdStatus.FAILED);
      logger.warn('Ad', 'not completed', type);
      handlers.onFailed?.(result ? 'skipped' : 'show_failed');
      return { ok: false, reason: result ? 'skipped' : 'show_failed' };
    }

    const token = makeToken(type);
    if (usedTokens.has(token)) {
      setStatus(type, AdStatus.FAILED);
      logger.error('Ad', 'duplicate token', token);
      handlers.onFailed?.('duplicate');
      return { ok: false, reason: 'duplicate' };
    }
    usedTokens.add(token);
    // 控制集合规模
    if (usedTokens.size > 32) {
      const first = usedTokens.values().next().value;
      usedTokens.delete(first);
    }

    setStatus(type, AdStatus.COMPLETED);
    logger.info('Ad', 'completed', type);
    try {
      handlers.onRewarded({ token, type });
    } catch (err) {
      logger.error('Ad', 'onRewarded threw', err);
    }
    setStatus(type, AdStatus.IDLE);
    return { ok: true, token };
  },
};
