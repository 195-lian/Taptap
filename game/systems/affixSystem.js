/**
 * systems/affixSystem.js — 局内词条
 */
import { AFFIX, ECONOMY } from '../data/gameConfig.js';
import { stateApi } from '../core/state.js';
import { pickNUnique } from '../utils/random.js';

export const affixSystem = {
  getStack(id) {
    const run = stateApi.getRun();
    if (!run) return 0;
    const item = run.affixes.find((a) => a.id === id);
    return item ? item.stacks : 0;
  },

  addStack(id) {
    const run = stateApi.getRun();
    const def = AFFIX.POOL.find((x) => x.id === id);
    if (!run || !def) return false;
    let item = run.affixes.find((x) => x.id === id);
    if (!item) {
      item = { id, stacks: 0 };
      run.affixes.push(item);
    }
    if (item.stacks >= def.maxStacks) return false;
    item.stacks += 1;
    stateApi.patchRun({ affixes: run.affixes.slice() });
    return true;
  },

  buildPickOptions() {
    const run = stateApi.getRun();
    if (!run) return [];
    const available = AFFIX.POOL.filter((def) => {
      const cur = run.affixes.find((x) => x.id === def.id);
      return !cur || cur.stacks < def.maxStacks;
    });
    const picks = pickNUnique(available, 3);
    while (picks.length < 3) {
      picks.push({ ...AFFIX.GOLD_PACK_FALLBACK, isGoldPack: true });
    }
    return picks;
  },

  choose(def) {
    const run = stateApi.getRun();
    if (!run || !def) return { ok: false };
    if (def.isGoldPack || def.id === AFFIX.GOLD_PACK_FALLBACK.id) {
      stateApi.patchRun({ coins: run.coins + ECONOMY.GOLD_PACK_COIN });
      return { ok: true, kind: 'gold', amount: ECONOMY.GOLD_PACK_COIN };
    }
    const ok = affixSystem.addStack(def.id);
    return { ok, kind: 'affix', id: def.id };
  },
};
