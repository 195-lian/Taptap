/**
 * systems/vaultSystem.js — 金库：掉落、引爆
 */
import { VAULT, DEFAULT_META } from '../data/gameConfig.js';
import { stateApi } from '../core/state.js';
import { chance } from '../utils/random.js';

export const vaultSystem = {
  getGoods() {
    const meta = stateApi.getMeta();
    return meta.vaultBombs + meta.vaultHammers;
  },

  getPower() {
    const meta = stateApi.getMeta();
    return meta.vaultBombs * VAULT.BOMB_POWER + meta.vaultHammers * VAULT.HAMMER_POWER;
  },

  /** @returns {{kind:'bomb'|'hammer'}|null} */
  rollDrop() {
    const roll = Math.random();
    if (roll < VAULT.HAMMER_ITEM_RATE) {
      stateApi.addVaultItem('hammer', 1);
      return { kind: 'hammer' };
    }
    if (roll < VAULT.HAMMER_ITEM_RATE + VAULT.BOMB_RATE) {
      stateApi.addVaultItem('bomb', 1);
      return { kind: 'bomb' };
    }
    return null;
  },

  /**
   * 引爆：消耗全部炸物，按威力炸砖
   * @returns {{ok:boolean, hitCount:number, goldGain:number, reason?:string}}
   */
  blast() {
    const meta = stateApi.getMeta();
    const power = vaultSystem.getPower();
    if (power <= 0) return { ok: false, hitCount: 0, goldGain: 0, reason: 'no_power' };

    const alive = meta.vaultBricks;
    if (alive <= 0) return { ok: false, hitCount: 0, goldGain: 0, reason: 'empty' };

    const hitCount = Math.min(power, alive);
    const goldGain = hitCount * VAULT.BRICK_GOLD;
    let left = alive - hitCount;
    if (left <= 0) left = DEFAULT_META.vaultBricks; // 补满一墙

    stateApi.consumeVaultAll();
    stateApi.setVaultBricks(left);
    stateApi.addGold(goldGain);
    return { ok: true, hitCount, goldGain };
  },
};
