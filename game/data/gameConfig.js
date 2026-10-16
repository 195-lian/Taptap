/**
 * data/gameConfig.js — 全部数值与文案，业务禁止硬编码
 */

export const SAVE = {
  KEY: 'zadan_save_v1',
  VERSION: 1,
  WRITE_THROTTLE_MS: 2000,
};

export const RUN_SHOP = {
  AFFIX: 50,
  SUPER_SMASH: 80,
  AUTO_HAMMER: 120,
  FIVE_PICK: 200,
  AUTO_HAMMER_MS: 10000,
};

export const SPECIAL_EGG = {
  RATE: 0.18,
  BOSS_TRIGGER_LEFT_SEC: 45,
};

export const RUN = {
  DURATION_MS: 90000,
  PICK_TIMEOUT_MS: 8000,
  PICK_DEFAULT_INDEX: 1,
  TICK_MS: 100,
};

export const EGG = {
  HIT_STAGES: 3,
  CRACK_IMAGES: [
    'assets/web/icon_egg_full.webp',
    'assets/web/icon_egg_crack1.webp',
    'assets/web/icon_egg_crack2.webp',
    'assets/web/icon_egg_crack2.webp',
  ],
  TYPES: {
    gold: {
      id: 'gold',
      name: '金蛋',
      unlockShards: 0,
      extraHits: 0,
      orbRate: 0.28,
      goldMult: 1,
      stages: [
        'assets/web/icon_egg_full.webp',
        'assets/web/icon_egg_crack1.webp',
        'assets/web/icon_egg_crack2.webp',
        'assets/web/icon_egg_crack2.webp',
      ],
    },
    bronze: {
      id: 'bronze',
      name: '青铜蛋',
      unlockShards: 50,
      extraHits: 1,
      orbRate: 0.36,
      goldMult: 1.35,
      stages: [
        'assets/web/icon_egg_bronze_full.webp',
        'assets/web/icon_egg_bronze_crack1.webp',
        'assets/web/icon_egg_bronze_crack2.webp',
        'assets/web/icon_egg_bronze_broken.webp',
      ],
    },
    rainbow: {
      id: 'rainbow',
      name: '虹光蛋',
      unlockShards: 120,
      extraHits: 2,
      orbRate: 0.45,
      goldMult: 1.9,
      stages: [
        'assets/web/icon_egg_rainbow_full.webp',
        'assets/web/icon_egg_rainbow_crack1.webp',
        'assets/web/icon_egg_rainbow_crack2.webp',
        'assets/web/icon_egg_rainbow_broken.webp',
      ],
    },
  },
  UNLOCK_ORDER: ['gold', 'bronze', 'rainbow'],
  OFFLINE: {
    MIN_MS: 5 * 60 * 1000,
    MAX_MS: 2 * 60 * 60 * 1000,
    GOLD_PER_MIN: 1.5,
  },
  ORB_PITY_COUNT: 3,
};

export const HAMMER = {
  MAX_LEVEL: 6,
  COSTS: [100, 300, 800, 2000, 5000],
  CLICKS_TO_BREAK: [3, 2, 2, 1, 1, 1],
  GOLD_MULTIPLIER: [1, 1.2, 1.4, 1.8, 2.2, 3],
};

export const ECONOMY = {
  BASE_COIN_PER_EGG: 5,
  SHARD_RATE: 0.22,
  UNLOCK_NEED: 50,
  CRIT_BASE_RATE: 0.05,
  CRIT_BONUS_PER_STACK: 0.15,
  CRIT_COIN_MULTIPLIER: 2,
  RAIN_BONUS_PER_STACK: 5,
  GOLD_PACK_COIN: 20,
};

export const AFFIX = {
  ORB_RATE: 0.28,
  TUNE: {
    AUTO_BASE_MS: 1400,
    AUTO_MIN_MS: 700,
    SPLIT_COIN_PER_STACK: 0.4,
    LUCKY_ORB_PER_STACK: 0.12,
    SLOWMO_SEC_PER_STACK: 2,
    SLOWMO_MAX_RATIO: 1.5,
    RAGE_COMBO_STEP: 10,
    RAGE_COIN_PER_STACK: 15,
  },
  POOL: [
    {
      id: 'chain',
      name: '连环砸',
      desc: '一点多砸，最多叠到 4 连',
      rarity: 'common',
      maxStacks: 3,
      icon: 'assets/web/icon_affix_chain.webp',
    },
    {
      id: 'crit',
      name: '暴击碎裂',
      desc: '概率炸裂，金币 ×2',
      rarity: 'rare',
      maxStacks: 3,
      icon: 'assets/web/icon_affix_crit.webp',
    },
    {
      id: 'rain',
      name: '金币雨',
      desc: '碎蛋时额外天降金币',
      rarity: 'rare',
      maxStacks: 2,
      icon: 'assets/web/icon_affix_coin_rain.webp',
    },
    {
      id: 'auto',
      name: '自动锤',
      desc: '每隔一会自动砸一下',
      rarity: 'common',
      maxStacks: 3,
      icon: 'assets/web/icon_affix_auto.webp',
    },
    {
      id: 'split',
      name: '分裂收益',
      desc: '碎蛋金币 +40%/层',
      rarity: 'common',
      maxStacks: 3,
      icon: 'assets/web/icon_affix_split.webp',
    },
    {
      id: 'lucky',
      name: '幸运连锁',
      desc: '更容易出宝珠',
      rarity: 'rare',
      maxStacks: 2,
      icon: 'assets/web/icon_affix_lucky.webp',
    },
    {
      id: 'slowmo',
      name: '时间减缓',
      desc: '碎蛋时本局 +2 秒',
      rarity: 'rare',
      maxStacks: 2,
      icon: 'assets/web/icon_affix_slowmo.webp',
    },
    {
      id: 'rage',
      name: '狂暴节奏',
      desc: '每 10 连击发一笔横财',
      rarity: 'epic',
      maxStacks: 2,
      icon: 'assets/web/icon_affix_rage.webp',
    },
  ],
  GOLD_PACK_FALLBACK: {
    id: 'gold_pack',
    name: '金币包',
    desc: '立即获得金币',
    rarity: 'common',
    maxStacks: 99,
    icon: 'assets/web/icon_coin.webp',
  },
};

export const VAULT = {
  BRICK_COUNT: 16,
  BRICK_GOLD: 20,
  BOMB_RATE: 0.1,
  HAMMER_ITEM_RATE: 0.04,
  THOR_RATE: 0.015,
  BOMB_POWER: 3,
  HAMMER_POWER: 6,
  THOR_POWER: 10,
  RAINBOW_BRICK_EVERY: 4,
  RAINBOW_BRICK_GOLD: 50,
  WALL_CLEAR_BONUS: 180,
  BLAST_STAGGER_MS: 70,
};

export const AD = {
  MIN_ENABLE_DELAY_MS: 1500,
  SIMULATE_WATCH_MS: 1500,
  TYPES: {
    RESULT_DOUBLE: 'RESULT_DOUBLE',
  },
  REWARD_POLICY: {
    // 无广告填充时：false=只提示；true=仍发基础奖（结算×2不适用）
    FALLBACK_BASIC_REWARD: false,
  },
};

export const UI = {
  PICK_CARDS: 3,
  FLOAT_TEXT_MS: 720,
  TOAST_MS: 1600,
};

export const PERF = {
  MAX_PARTICLES: 48,
  PRELOAD_IMAGES: [
    'assets/web/icon_coin.webp',
    'assets/web/icon_shard.webp',
    'assets/web/icon_egg_full.webp',
    'assets/web/icon_egg_crack1.webp',
    'assets/web/icon_egg_crack2.webp',
    'assets/web/icon_orb.webp',
    'assets/web/icon_affix_chain.webp',
    'assets/web/icon_affix_crit.webp',
    'assets/web/icon_affix_coin_rain.webp',
    'assets/web/icon_ad.webp',
    'assets/web/icon_shell_1.webp',
    'assets/web/icon_vault.webp',
    'assets/web/icon_bomb_small.webp',
    'assets/web/icon_hammer_item.webp',
    'assets/web/icon_brick_gold.webp',
  ],
};

export const LOG = {
  LEVEL: 'info', // debug | info | warn | error
};

export const DEFAULT_META = {
  gold: 0,
  shards: 0,
  hammerLevel: 1,
  vaultBombs: 0,
  vaultHammers: 0,
  vaultBricks: VAULT.BRICK_COUNT,
};
