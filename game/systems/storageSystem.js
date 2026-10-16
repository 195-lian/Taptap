/**
 * systems/storageSystem.js — TapTap 本地存档（禁用 localStorage）
 * 平台 API 通过 platform 注入，便于预览与测试
 */
import { SAVE, DEFAULT_META } from '../data/gameConfig.js';
import { logger } from '../core/logger.js';
import { safeRun } from '../utils/safe.js';

/** 默认平台适配：TapTap tt.*；预览可注入 mock */
const defaultPlatform = {
  getStorageSync(key) {
    if (typeof tt !== 'undefined' && tt.getStorageSync) {
      return tt.getStorageSync(key);
    }
    throw new Error('storage platform missing');
  },
  setStorageSync(key, value) {
    if (typeof tt !== 'undefined' && tt.setStorageSync) {
      tt.setStorageSync(key, value);
      return;
    }
    throw new Error('storage platform missing');
  },
};

let platform = defaultPlatform;
let pendingWrite = null;
let throttleTimer = null;

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const version = Number(raw.version) || 0;
  // future: version switch
  if (version > SAVE.VERSION) {
    logger.warn('Storage', 'save version newer than client', version);
  }
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  return {
    version: SAVE.VERSION,
    updatedAt: Number(raw.updatedAt) || Date.now(),
    meta: {
      gold: Number(meta.gold) || DEFAULT_META.gold,
      shards: Number(meta.shards) || DEFAULT_META.shards,
      hammerLevel: Number(meta.hammerLevel) || DEFAULT_META.hammerLevel,
      vaultBombs: Number(meta.vaultBombs) || 0,
      vaultHammers: Number(meta.vaultHammers) || 0,
      vaultBricks:
        meta.vaultBricks == null ? DEFAULT_META.vaultBricks : Number(meta.vaultBricks),
    },
  };
}

export const storageSystem = {
  injectPlatform(p) {
    platform = p;
  },

  read() {
    return safeRun(
      'Storage.read',
      () => {
        const raw = platform.getStorageSync(SAVE.KEY);
        const data = migrate(raw);
        if (!data) {
          logger.info('Storage', 'no save, using defaults');
          return {
            version: SAVE.VERSION,
            updatedAt: Date.now(),
            meta: { ...DEFAULT_META },
          };
        }
        return data;
      },
      () => ({
        version: SAVE.VERSION,
        updatedAt: Date.now(),
        meta: { ...DEFAULT_META },
      })
    );
  },

  writeNow(meta) {
    const payload = {
      version: SAVE.VERSION,
      updatedAt: Date.now(),
      meta: { ...meta },
    };
    return safeRun(
      'Storage.writeNow',
      () => {
        platform.setStorageSync(SAVE.KEY, payload);
        logger.debug('Storage', 'saved', payload.updatedAt);
        return true;
      },
      false
    );
  },

  /** 节流写，避免频繁 setStorageSync */
  writeThrottled(meta) {
    pendingWrite = meta;
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      if (pendingWrite) {
        storageSystem.writeNow(pendingWrite);
        pendingWrite = null;
      }
    }, SAVE.WRITE_THROTTLE_MS);
  },

  flush(meta) {
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    pendingWrite = null;
    return storageSystem.writeNow(meta);
  },
};
