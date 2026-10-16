/**
 * core/state.js — 唯一状态树；只通过 mutator 修改
 */
import { DEFAULT_META, RUN, EGG, HAMMER } from '../data/gameConfig.js';
import { events } from './events.js';
import { clamp } from '../utils/format.js';

function createEmptyMeta() {
  return {
    gold: DEFAULT_META.gold,
    shards: DEFAULT_META.shards,
    hammerLevel: DEFAULT_META.hammerLevel,
    vaultBombs: DEFAULT_META.vaultBombs,
    vaultHammers: DEFAULT_META.vaultHammers,
    vaultBricks: DEFAULT_META.vaultBricks,
  };
}

const state = {
  meta: createEmptyMeta(),
  run: null,
};

function emit(key) {
  events.emit('state:changed', key);
}

function hammerIndex() {
  return clamp(state.meta.hammerLevel - 1, 0, HAMMER.CLICKS_TO_BREAK.length - 1);
}

export const stateApi = {
  getMeta() {
    return state.meta;
  },
  getRun() {
    return state.run;
  },

  hydrateMeta(partial) {
    const next = createEmptyMeta();
    if (partial && typeof partial === 'object') {
      next.gold = Number(partial.gold) || 0;
      next.shards = Number(partial.shards) || 0;
      next.hammerLevel = clamp(Number(partial.hammerLevel) || 1, 1, HAMMER.MAX_LEVEL);
      next.vaultBombs = Math.max(0, Number(partial.vaultBombs) || 0);
      next.vaultHammers = Math.max(0, Number(partial.vaultHammers) || 0);
      next.vaultBricks = clamp(
        Number(partial.vaultBricks ?? DEFAULT_META.vaultBricks),
        0,
        DEFAULT_META.vaultBricks
      );
    }
    state.meta = next;
    emit('meta');
  },

  addGold(amount) {
    state.meta.gold = Math.max(0, state.meta.gold + Math.floor(amount));
    emit('meta.gold');
    return state.meta.gold;
  },

  spendGold(amount) {
    const cost = Math.floor(amount);
    if (state.meta.gold < cost) return false;
    state.meta.gold -= cost;
    emit('meta.gold');
    return true;
  },

  addShards(n) {
    state.meta.shards = Math.max(0, state.meta.shards + Math.floor(n));
    emit('meta.shards');
  },

  upgradeHammer() {
    const level = state.meta.hammerLevel;
    if (level >= HAMMER.MAX_LEVEL) return { ok: false, reason: 'max' };
    const cost = HAMMER.COSTS[level - 1];
    if (cost == null) return { ok: false, reason: 'no_cost' };
    if (!stateApi.spendGold(cost)) return { ok: false, reason: 'not_enough' };
    state.meta.hammerLevel += 1;
    emit('meta.hammer');
    return { ok: true, level: state.meta.hammerLevel };
  },

  addVaultItem(kind, count = 1) {
    if (kind === 'bomb') state.meta.vaultBombs += count;
    else if (kind === 'hammer') state.meta.vaultHammers += count;
    emit('meta.vault');
  },

  consumeVaultAll() {
    state.meta.vaultBombs = 0;
    state.meta.vaultHammers = 0;
    emit('meta.vault');
  },

  setVaultBricks(n) {
    state.meta.vaultBricks = clamp(n, 0, DEFAULT_META.vaultBricks);
    emit('meta.vault');
  },

  getHammerIndex() {
    return hammerIndex();
  },

  startRun() {
    const idx = hammerIndex();
    state.run = {
      durationMs: RUN.DURATION_MS,
      leftMs: RUN.DURATION_MS,
      coins: 0,
      shards: 0,
      eggs: 0,
      combo: 0,
      affixes: [],
      maxHits: HAMMER.CLICKS_TO_BREAK[idx],
      hitsLeft: HAMMER.CLICKS_TO_BREAK[idx],
      isPaused: false,
      isEnded: false,
      isSettled: false,
      hasDoubled: false,
      stageIndex: 0,
    };
    emit('run');
    return state.run;
  },

  patchRun(partial) {
    if (!state.run) return null;
    Object.assign(state.run, partial);
    emit('run');
    return state.run;
  },

  endRun() {
    if (!state.run || state.run.isEnded) return state.run;
    state.run.isEnded = true;
    state.run.isPaused = true;
    emit('run');
    return state.run;
  },

  settleRun({ double }) {
    const run = state.run;
    if (!run || run.isSettled) return { ok: false };
    run.isSettled = true;
    const mult = double ? 2 : 1;
    const goldGain = Math.floor(run.coins * mult);
    const shardGain = run.shards;
    stateApi.addGold(goldGain);
    stateApi.addShards(shardGain);
    state.run = null;
    emit('run');
    return { ok: true, goldGain, shardGain };
  },

  clearRun() {
    state.run = null;
    emit('run');
  },

  /** 仅测试/开发 */
  __debugResetMeta() {
    state.meta = createEmptyMeta();
    emit('meta');
  },
};

export const EGG_STAGES = EGG.CRACK_IMAGES;
