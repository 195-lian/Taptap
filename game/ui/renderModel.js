/**
 * ui/renderModel.js — 把 state 投影成绘制模型（逻辑与绘制分离）
 */
import { stateApi } from '../core/state.js';
import { HAMMER, ECONOMY, EGG, AFFIX, VAULT, RUN } from '../data/gameConfig.js';
import { getEggImageIndex } from '../systems/smashSystem.js';
import { vaultSystem } from '../systems/vaultSystem.js';
import { formatInt, clamp } from '../utils/format.js';

export function buildHomeModel() {
  const meta = stateApi.getMeta();
  const level = meta.hammerLevel;
  const cost = HAMMER.COSTS[level - 1];
  const canUpgrade = cost != null && meta.gold >= cost;
  return {
    goldText: formatInt(meta.gold),
    shardText: formatInt(meta.shards),
    unlockText: `${Math.min(meta.shards, ECONOMY.UNLOCK_NEED)}/${ECONOMY.UNLOCK_NEED}`,
    unlockRatio: clamp(meta.shards / ECONOMY.UNLOCK_NEED, 0, 1),
    upgradeText:
      cost == null
        ? `锤子 Lv${level} · 已满级`
        : `锤子 Lv${level} · 升级 ${cost}`,
    canUpgrade,
    vaultGoods: vaultSystem.getGoods(),
    eggImage: EGG.CRACK_IMAGES[0],
  };
}

export function buildRunModel() {
  const run = stateApi.getRun();
  const meta = stateApi.getMeta();
  if (!run) return null;
  return {
    goldText: formatInt(meta.gold + run.coins),
    comboText: `连击 ×${run.combo}`,
    isComboHot: run.combo >= 8,
    timeText: `${Math.ceil(Math.max(0, run.leftMs / 1000))}s`,
    timeRatio: clamp(run.leftMs / run.durationMs, 0, 1),
    hintText: `全屏可点 · 本蛋还需 ${Math.max(0, run.hitsLeft)} 击`,
    eggImage: EGG.CRACK_IMAGES[getEggImageIndex(run.hitsLeft, run.maxHits)],
    affixes: run.affixes.map((a) => {
      const def = AFFIX.POOL.find((x) => x.id === a.id);
      return def ? { ...a, icon: def.icon, rarity: def.rarity } : null;
    }).filter(Boolean),
  };
}

export function buildPickModel(options, leftSec) {
  return {
    title: '获得肉鸽宝珠！',
    subtitle: '三选一 · 只在本局生效，可叠加',
    countdown: `${leftSec} 秒不选将默认中间`,
    cards: options.map((def) => ({
      id: def.id,
      name: def.name,
      desc: def.desc,
      rarity: def.rarity,
      icon: def.icon,
      isGoldPack: !!def.isGoldPack,
    })),
    defaultIndex: UI ? RUN.PICK_DEFAULT_INDEX : 1,
  };
}

export function buildResultModel() {
  const run = stateApi.getRun();
  if (!run) return null;
  return {
    coinsText: `+${formatInt(run.coins)}`,
    shardsText: `+${formatInt(run.shards)}`,
    eggsText: `${formatInt(run.eggs)}`,
    hasDoubled: run.hasDoubled,
  };
}

export function buildVaultModel() {
  const meta = stateApi.getMeta();
  const power = vaultSystem.getPower();
  const canBlast = power > 0 && meta.vaultBricks > 0;
  const hitCount = Math.min(power, meta.vaultBricks);
  return {
    bombText: `小爆弹 ×${meta.vaultBombs} · 炸 ${VAULT.BOMB_POWER} 格`,
    hammerText: `黄金锤 ×${meta.vaultHammers} · 炸 ${VAULT.HAMMER_POWER} 格`,
    estText: canBlast
      ? `本轮预估 ≈ +${hitCount * VAULT.BRICK_GOLD} 金币`
      : '没有炸物，去砸蛋攒一点',
    canBlast,
    bricks: meta.vaultBricks,
    brickTotal: VAULT.BRICK_COUNT,
  };
}
