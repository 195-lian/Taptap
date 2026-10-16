/**
 * systems/gameService.js — 玩法编排：开局/砸/词条/结算/广告/存档
 */
import { AD, RUN, UI } from '../data/gameConfig.js';
import { stateApi } from '../core/state.js';
import { logger } from '../core/logger.js';
import { events } from '../core/events.js';
import { smashSystem, refreshEggAfterBreak } from './smashSystem.js';
import { affixSystem } from './affixSystem.js';
import { vaultSystem } from './vaultSystem.js';
import { storageSystem } from './storageSystem.js';
import { cloudSaveSystem } from './cloudSaveSystem.js';
import { adSystem } from './adSystem.js';
import { particleSystem } from './particleSystem.js';

let pickLeftMs = 0;
let pickOptions = [];

export const gameService = {
  boot() {
    const saved = storageSystem.read();
    stateApi.hydrateMeta(saved.meta);
    // 云合并异步，不阻塞首屏
    cloudSaveSystem.pullAndMerge(stateApi.getMeta()).then(({ meta, merged }) => {
      if (merged) {
        stateApi.hydrateMeta(meta);
        storageSystem.writeNow(stateApi.getMeta());
      }
    });
    logger.info('Game', 'boot ok', { gold: stateApi.getMeta().gold });
  },

  startRun() {
    stateApi.startRun();
    particleSystem.clear();
  },

  hitStage() {
    const result = smashSystem.performHit();
    if (result.didBreak) {
      particleSystem.burstAt(0.5, 0.42, { isCrit: result.isCrit });
      if (result.gotOrb) {
        this.openPick();
        return result;
      }
      refreshEggAfterBreak();
      storageSystem.writeThrottled(stateApi.getMeta());
    }
    return result;
  },

  openPick() {
    pickOptions = affixSystem.buildPickOptions();
    pickLeftMs = RUN.PICK_TIMEOUT_MS;
    stateApi.patchRun({ isPaused: true });
    events.emit('pick:open', { options: pickOptions });
  },

  getPickState() {
    return {
      options: pickOptions,
      leftMs: pickLeftMs,
      leftSec: Math.ceil(pickLeftMs / 1000),
    };
  },

  tickPick(dtMs) {
    const run = stateApi.getRun();
    if (!run || !run.isPaused) return;
    if (pickLeftMs <= 0) return;
    pickLeftMs -= dtMs;
    if (pickLeftMs <= 0) {
      pickLeftMs = 0;
      const def = pickOptions[RUN.PICK_DEFAULT_INDEX] || pickOptions[0];
      this.choosePick(def);
    }
  },

  choosePick(def) {
    const res = affixSystem.choose(def);
    pickLeftMs = 0;
    pickOptions = [];
    refreshEggAfterBreak();
    stateApi.patchRun({ isPaused: false });
    events.emit('pick:chosen', res);
    return res;
  },

  tickRun(dtMs) {
    const run = stateApi.getRun();
    if (!run || run.isPaused || run.isEnded) return;
    const leftMs = run.leftMs - dtMs;
    if (leftMs <= 0) {
      this.endRun();
      return;
    }
    stateApi.patchRun({ leftMs });
    particleSystem.update(dtMs);
  },

  endRun() {
    stateApi.endRun();
    pickLeftMs = 0;
    pickOptions = [];
    events.emit('run:ended');
  },

  /**
   * 结算入账并触发云备份
   */
  settle({ double }) {
    const result = stateApi.settleRun({ double });
    if (!result.ok) return result;
    storageSystem.flush(stateApi.getMeta());
    cloudSaveSystem.backupOnCritical(stateApi.getMeta());
    events.emit('game:settled', result);
    return result;
  },

  upgradeHammer() {
    const res = stateApi.upgradeHammer();
    if (res.ok) {
      storageSystem.flush(stateApi.getMeta());
      cloudSaveSystem.backupOnCritical(stateApi.getMeta());
    }
    return res;
  },

  blastVault() {
    const res = vaultSystem.blast();
    if (res.ok) {
      storageSystem.flush(stateApi.getMeta());
      cloudSaveSystem.backupOnCritical(stateApi.getMeta());
    }
    return res;
  },

  /**
   * 结算双倍：仅 COMPLETED 回调后发奖
   */
  async doubleResultReward() {
    const run = stateApi.getRun();
    if (!run || run.hasDoubled || run.isSettled) {
      return { ok: false, reason: 'invalid' };
    }
    const type = AD.TYPES.RESULT_DOUBLE;
    const adRes = await adSystem.showRewarded(type, {
      onRewarded: () => {
        // 奖励只在这里发
        stateApi.patchRun({ hasDoubled: true });
        const settled = this.settle({ double: true });
        events.emit('ad:rewarded', { type, settled });
      },
      onFailed: (reason) => {
        logger.warn('Ad', 'result double failed', reason);
        events.emit('ad:failed', { type, reason });
      },
    });
    return adRes;
  },

  collectBaseReward() {
    return this.settle({ double: false });
  },

  tick(dtMs) {
    if (stateApi.getRun()) {
      this.tickRun(dtMs);
      this.tickPick(dtMs);
    }
  },
};
