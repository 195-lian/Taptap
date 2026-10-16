/**
 * systems/smashSystem.js — 砸蛋逻辑（纯数据，不碰 DOM）
 */
import { ECONOMY, HAMMER, EGG, AFFIX } from '../data/gameConfig.js';
import { stateApi } from '../core/state.js';
import { events } from '../core/events.js';
import { chance } from '../utils/random.js';
import { affixSystem } from './affixSystem.js';
import { vaultSystem } from './vaultSystem.js';

export function getEggImageIndex(hitsLeft, maxHits) {
  const used = maxHits - hitsLeft;
  return Math.max(0, Math.min(used, EGG.CRACK_IMAGES.length - 1));
}

export function computeEggCoin() {
  const idx = stateApi.getHammerIndex();
  const base = ECONOMY.BASE_COIN_PER_EGG * HAMMER.GOLD_MULTIPLIER[idx];
  const rain = affixSystem.getStack('rain');
  return Math.round(base + ECONOMY.RAIN_BONUS_PER_STACK * rain);
}

export function tryCrit() {
  const critStack = affixSystem.getStack('crit');
  const rate = ECONOMY.CRIT_BASE_RATE + ECONOMY.CRIT_BONUS_PER_STACK * critStack;
  return chance(rate);
}

/**
 * 一次点击（含连环）
 * @returns {{ hits:number, didBreak:boolean, coinGain:number, isCrit:boolean, gotOrb:boolean }}
 */
export function performHit() {
  const run = stateApi.getRun();
  if (!run || run.isPaused || run.isEnded) {
    return { hits: 0, didBreak: false, coinGain: 0, isCrit: false, gotOrb: false };
  }

  const chain = 1 + affixSystem.getStack('chain');
  const combo = run.combo + 1;
  let hitsLeft = run.hitsLeft;
  let didBreak = false;
  let coinGain = 0;
  let isCrit = false;
  let gotOrb = false;
  let appliedHits = 0;

  for (let i = 0; i < chain; i++) {
    hitsLeft -= 1;
    appliedHits += 1;
    if (hitsLeft <= 0) {
      didBreak = true;
      break;
    }
  }

  if (!didBreak) {
    stateApi.patchRun({ combo, hitsLeft });
    events.emit('run:hit', { combo, hitsLeft, appliedHits });
    return { hits: appliedHits, didBreak: false, coinGain: 0, isCrit: false, gotOrb: false };
  }

  isCrit = tryCrit();
  coinGain = computeEggCoin() * (isCrit ? ECONOMY.CRIT_COIN_MULTIPLIER : 1);
  const shardsAdd = chance(ECONOMY.SHARD_RATE) ? 1 : 0;
  const vaultDrop = vaultSystem.rollDrop();
  gotOrb = chance(AFFIX.ORB_RATE) && run.leftMs > 8000;

  stateApi.patchRun({
    combo,
    hitsLeft: 0,
    eggs: run.eggs + 1,
    coins: run.coins + coinGain,
    shards: run.shards + shardsAdd,
  });

  if (shardsAdd) events.emit('run:shard', shardsAdd);
  if (vaultDrop) events.emit('run:vaultDrop', vaultDrop);
  if (isCrit) events.emit('run:crit', coinGain);
  events.emit('run:break', { coinGain, isCrit, gotOrb });

  return { hits: appliedHits, didBreak: true, coinGain, isCrit, gotOrb };
}

export function refreshEggAfterBreak() {
  const run = stateApi.getRun();
  if (!run) return;
  const idx = stateApi.getHammerIndex();
  const maxHits = HAMMER.CLICKS_TO_BREAK[idx];
  stateApi.patchRun({ maxHits, hitsLeft: maxHits, stageIndex: 0 });
}
