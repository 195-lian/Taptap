/**
 * systems/cloudSaveSystem.js — 云存档；失败不阻断
 */
import { SAVE } from '../data/gameConfig.js';
import { logger } from '../core/logger.js';
import { safeRunAsync } from '../utils/safe.js';
import { storageSystem } from './storageSystem.js';

const defaultCloud = {
  async upload(key, data) {
    if (typeof tt !== 'undefined' && tt.setCloudStorage) {
      return new Promise((resolve, reject) => {
        tt.setCloudStorage({
          KVDataList: [{ key, value: JSON.stringify(data) }],
          success: resolve,
          fail: reject,
        });
      });
    }
    throw new Error('cloud platform missing');
  },
  async download(key) {
    if (typeof tt !== 'undefined' && tt.getCloudStorage) {
      return new Promise((resolve, reject) => {
        tt.getCloudStorage({
          keyList: [key],
          success: (res) => {
            const item = res?.KVDataList?.find((x) => x.key === key);
            resolve(item ? JSON.parse(item.value) : null);
          },
          fail: reject,
        });
      });
    }
    throw new Error('cloud platform missing');
  },
};

let cloud = defaultCloud;
const CLOUD_KEY = `${SAVE.KEY}_cloud`;

export const cloudSaveSystem = {
  injectCloud(adapter) {
    cloud = adapter;
  },

  /**
   * 关键节点备份：结算、升级、金库大额
   */
  async backupOnCritical(meta) {
    const payload = {
      version: SAVE.VERSION,
      updatedAt: Date.now(),
      meta: { ...meta },
    };
    const ok = await safeRunAsync(
      'Cloud.backup',
      async () => {
        await cloud.upload(CLOUD_KEY, payload);
        logger.info('Cloud', 'backup ok', payload.updatedAt);
        return true;
      },
      false
    );
    // 同步本地，保证至少一份最新
    storageSystem.writeNow(meta);
    return ok;
  },

  async pullAndMerge(meta) {
    const remote = await safeRunAsync('Cloud.pull', () => cloud.download(CLOUD_KEY), null);
    if (!remote || !remote.meta) return { meta, merged: false };

    const remoteTime = Number(remote.updatedAt) || 0;
    // 简单策略：金币取 max，锤子取 max，时间戳新者覆盖碎片/金库
    const merged = {
      ...meta,
      gold: Math.max(meta.gold || 0, remote.meta.gold || 0),
      hammerLevel: Math.max(meta.hammerLevel || 1, remote.meta.hammerLevel || 1),
      shards: Math.max(meta.shards || 0, remote.meta.shards || 0),
      vaultBombs: Math.max(meta.vaultBombs || 0, remote.meta.vaultBombs || 0),
      vaultHammers: Math.max(meta.vaultHammers || 0, remote.meta.vaultHammers || 0),
      vaultBricks:
        remoteTime > localTime
          ? remote.meta.vaultBricks ?? meta.vaultBricks
          : meta.vaultBricks,
    };
    logger.info('Cloud', 'merged remote save', { remoteTime });
    return { meta: merged, merged: true };
  },
};
