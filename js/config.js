/* js/config.js — 别砸我的蛋 全部数值
 * icon/stageIcons 等路径为素材投放约定；assets/ 已清空，文件需按 UI布局说明.md §10.1 放回。
 */
export const GAME_NAME = "别砸我的蛋";
export const SAVE_KEY = "bzwed_v1";
export const SAVE_VERSION = 1;

export const DAILY_TICKET = 10;
export const NEW_PLAYER_GOLD = 60;
export const GOLD_PER_TICKET = 120;
export const TOWER_CARD_BATTLE_MAX = 4;
export const ITEM_BATTLE_MAX = 3;
export const WEAPON_SLOTS = 3;
export const MERGE_MAX_LV = 3;

export const RARITY = {
  WHITE: "white",
  GREEN: "green",
  BLUE: "blue",
  PURPLE: "purple",
  GOLD: "gold",
};
export const RARITY_LABEL = {
  white: "普通",
  green: "稀有",
  blue: "史诗",
  purple: "传说",
  gold: "神话",
};
export const RARITY_COLOR = {
  white: "#E8E0D4",
  green: "#3DDC97",
  blue: "#5B9DFF",
  purple: "#A78BFA",
  gold: "#FFC53D",
};

export const EGGS = {
  wood: {
    id: "wood",
    name: "木蛋",
    ticketCost: 1,
    goldCost: 80,
    unlockStage: 1,
    icon: "assets/web/icon_egg_full.webp",
    stageIcons: [
      "assets/web/icon_egg_full.webp",
      "assets/web/icon_egg_crack1.webp",
      "assets/web/icon_egg_crack2.webp",
      "assets/web/icon_egg_bronze_broken.webp",
    ],
    dropClass: { tower: 0.58, item: 0.3, goldBag: 0.1, long: 0.02 },
    rar: { white: 0.55, green: 0.28, blue: 0.12, purple: 0.04, gold: 0.01 },
    soft: { purple: { step: 0.0035, cap: 0.14 }, gold: { step: 0.0008, cap: 0.04 } },
    hardPity: 35,
  },
  copper: {
    id: "copper",
    name: "铜蛋",
    ticketCost: 1,
    goldCost: 120,
    unlockStage: 1,
    icon: "assets/web/icon_egg_bronze_full.webp",
    stageIcons: [
      "assets/web/icon_egg_bronze_full.webp",
      "assets/web/icon_egg_bronze_crack1.webp",
      "assets/web/icon_egg_bronze_crack2.webp",
      "assets/web/icon_egg_bronze_broken.webp",
    ],
    dropClass: { tower: 0.55, item: 0.3, goldBag: 0.1, long: 0.05 },
    rar: { white: 0.42, green: 0.32, blue: 0.18, purple: 0.06, gold: 0.02 },
    soft: { purple: { step: 0.0045, cap: 0.16 }, gold: { step: 0.001, cap: 0.05 } },
    hardPity: 35,
  },
  goldEgg: {
    id: "goldEgg",
    name: "黄金蛋",
    ticketCost: 2,
    goldCost: 300,
    unlockStage: 2,
    icon: "assets/web/icon_egg_full.webp",
    stageIcons: [
      "assets/web/icon_egg_full.webp",
      "assets/web/icon_egg_crack1.webp",
      "assets/web/icon_egg_crack2.webp",
      "assets/web/icon_egg_bronze_broken.webp",
    ],
    dropClass: { tower: 0.5, item: 0.28, goldBag: 0.1, long: 0.12 },
    rar: { white: 0.28, green: 0.32, blue: 0.24, purple: 0.12, gold: 0.04 },
    soft: { purple: { step: 0.0055, cap: 0.2 }, gold: { step: 0.0014, cap: 0.07 } },
    hardPity: 28,
  },
  rainbow: {
    id: "rainbow",
    name: "虹光蛋",
    ticketCost: 3,
    goldCost: 500,
    unlockStage: 3,
    icon: "assets/web/icon_egg_rainbow_full.webp",
    stageIcons: [
      "assets/web/icon_egg_rainbow_full.webp",
      "assets/web/icon_egg_rainbow_crack1.webp",
      "assets/web/icon_egg_rainbow_crack2.webp",
      "assets/web/icon_egg_rainbow_broken.webp",
    ],
    dropClass: { tower: 0.45, item: 0.28, goldBag: 0.1, long: 0.17 },
    rar: { white: 0.18, green: 0.28, blue: 0.28, purple: 0.18, gold: 0.08 },
    soft: { purple: { step: 0.007, cap: 0.24 }, gold: { step: 0.0018, cap: 0.09 } },
    hardPity: 22,
  },
};

export const TOWER_DROP_WEIGHTS = {
  white: { hammer: 60, coin: 30, bomb: 10, thor: 0 },
  green: { hammer: 40, coin: 30, bomb: 25, thor: 5 },
  blue: { hammer: 25, coin: 30, bomb: 30, thor: 15 },
  purple: { hammer: 10, coin: 20, bomb: 30, thor: 40 },
  gold: { hammer: 0, coin: 10, bomb: 30, thor: 60 },
};

export const ITEM_DROP_WEIGHTS = {
  grenade: 40,
  rage: 35,
  shield: 25,
};

export const GOLD_BAG_BY_RARITY = {
  white: 40,
  green: 55,
  blue: 70,
  purple: 85,
  gold: 100,
};

export const REPEAT_CLEAR_GOLD_MUL = 0.35;

export const TOWERS = {
  hammer: {
    id: "hammer",
    name: "锤炮",
    icon: "assets/web/icon_hammer_wood.webp",
    dmg: 9,
    interval: 0.4,
    range: 0.55,
    splash: 0,
    bossMul: 1,
  },
  coin: {
    id: "coin",
    name: "金币炮",
    icon: "assets/web/icon_coin.webp",
    dmg: 6,
    interval: 0.45,
    range: 0.6,
    splash: 0,
    killGold: 2,
    bossMul: 1,
  },
  bomb: {
    id: "bomb",
    name: "炸弹塔",
    icon: "assets/web/icon_bomb_small.webp",
    dmg: 16,
    interval: 0.95,
    range: 0.5,
    splash: 0.25,
    bossMul: 1,
  },
  thor: {
    id: "thor",
    name: "雷神塔",
    icon: "assets/web/icon_bomb_thor.webp",
    dmg: 36,
    interval: 1.3,
    range: 0.7,
    splash: 0,
    bossMul: 1.5,
  },
};
export const LV_MUL = {
  1: { dmg: 1, iv: 1, range: 1 },
  2: { dmg: 1.75, iv: 0.9, range: 1.1 },
  3: { dmg: 3, iv: 0.8, range: 1.2 },
};

export const ITEMS = {
  grenade: { id: "grenade", name: "手雷", icon: "assets/web/icon_bomb_small.webp" },
  rage: { id: "rage", name: "全塔狂暴", icon: "assets/web/icon_hammer_gold.webp" },
  shield: { id: "shield", name: "金蛋护盾", icon: "assets/web/icon_shard.webp" },
};

export const WEAPONS = {
  wood_hammer: {
    id: "wood_hammer",
    name: "木锤",
    icon: "assets/web/icon_hammer_wood.webp",
    rarity: "white",
    desc: "锤炮伤害 +12%",
    mods: { hammerDmgMul: 0.12 },
  },
  steel_hammer: {
    id: "steel_hammer",
    name: "精钢锤",
    icon: "assets/web/icon_hammer_gold.webp",
    rarity: "green",
    desc: "锤炮/金币炮攻速 +8%",
    mods: { hammerIvMul: 0.08, coinIvMul: 0.08 },
  },
  thunder_hammer: {
    id: "thunder_hammer",
    name: "雷神锤",
    icon: "assets/web/icon_bomb_thor.webp",
    rarity: "purple",
    desc: "锤炮伤害 +10%",
    mods: { hammerDmgMul: 0.1 },
  },
};

// ponytail: one deterministic weapon per egg until the missing per-egg v3.4 weights are restored.
export const WEAPON_DROP_BY_EGG = {
  wood: "wood_hammer",
  copper: "steel_hammer",
  goldEgg: "thunder_hammer",
  rainbow: "thunder_hammer",
};

export const STAGES = [
  {
    id: 1,
    name: "第1关",
    baseHp: 10,
    slots: [
      { x: 0.22, y: 0.28 },
      { x: 0.72, y: 0.28 },
      { x: 0.22, y: 0.48 },
      { x: 0.72, y: 0.48 },
      { x: 0.28, y: 0.68 },
      { x: 0.68, y: 0.68 },
    ],
    path: [
      { x: 0.48, y: 0.02 },
      { x: 0.48, y: 0.22 },
      { x: 0.18, y: 0.38 },
      { x: 0.78, y: 0.55 },
      { x: 0.48, y: 0.78 },
      { x: 0.48, y: 0.88 },
    ],
    waves: [
      { n: 6, hp: 22, spd: 0.055, iv: 1.0, kind: "slime" },
      { n: 8, hp: 24, spd: 0.055, iv: 0.9, kind: "slime" },
      { n: 8, hp: 28, spd: 0.055, iv: 0.9, kind: "slime", elite: 1 },
      { n: 10, hp: 30, spd: 0.06, iv: 0.85, kind: "slime" },
      { n: 6, hp: 30, spd: 0.05, iv: 0.9, kind: "slime", bossHp: 120 },
    ],
    reward: { gold: 120, tickets: 2, eggSmash: { copper: 1 }, firstClearEgg: "copper", unlockStage: 2 },
  },
  {
    id: 2,
    name: "第2关",
    baseHp: 10,
    slots: [
      { x: 0.2, y: 0.3 },
      { x: 0.75, y: 0.3 },
      { x: 0.2, y: 0.5 },
      { x: 0.75, y: 0.5 },
      { x: 0.3, y: 0.68 },
      { x: 0.65, y: 0.68 },
    ],
    path: [
      { x: 0.48, y: 0.02 },
      { x: 0.48, y: 0.2 },
      { x: 0.75, y: 0.35 },
      { x: 0.22, y: 0.52 },
      { x: 0.72, y: 0.66 },
      { x: 0.48, y: 0.88 },
    ],
    waves: [
      { n: 8, hp: 28, spd: 0.055, iv: 0.9, kind: "slime" },
      { n: 9, hp: 30, spd: 0.058, iv: 0.85, kind: "slime" },
      { n: 8, hp: 34, spd: 0.058, iv: 0.85, kind: "slime", elite: 1 },
      { n: 11, hp: 32, spd: 0.065, iv: 0.8, kind: "slime" },
      { n: 7, hp: 36, spd: 0.055, iv: 0.85, kind: "slime", elite: 2 },
      { n: 6, hp: 36, spd: 0.045, iv: 0.9, kind: "slime", bossHp: 160 },
    ],
    reward: { gold: 160, tickets: 2, unlockEgg: "goldEgg", unlockStage: 3 },
  },
  {
    id: 3,
    name: "第3关",
    baseHp: 8,
    slots: [
      { x: 0.22, y: 0.25 },
      { x: 0.72, y: 0.25 },
      { x: 0.22, y: 0.42 },
      { x: 0.72, y: 0.42 },
      { x: 0.22, y: 0.6 },
      { x: 0.72, y: 0.6 },
      { x: 0.35, y: 0.72 },
    ],
    path: [
      { x: 0.48, y: 0.02 },
      { x: 0.25, y: 0.2 },
      { x: 0.75, y: 0.38 },
      { x: 0.22, y: 0.55 },
      { x: 0.78, y: 0.7 },
      { x: 0.48, y: 0.88 },
    ],
    waves: [
      { n: 9, hp: 32, spd: 0.058, iv: 0.85, kind: "slime" },
      { n: 10, hp: 34, spd: 0.06, iv: 0.85, kind: "slime" },
      { n: 9, hp: 38, spd: 0.06, iv: 0.8, kind: "slime", elite: 1 },
      { n: 12, hp: 36, spd: 0.068, iv: 0.75, kind: "slime" },
      { n: 8, hp: 40, spd: 0.06, iv: 0.8, kind: "slime", elite: 2 },
      { n: 12, hp: 42, spd: 0.07, iv: 0.75, kind: "slime" },
      { n: 6, hp: 42, spd: 0.04, iv: 0.9, kind: "slime", bossHp: 220 },
    ],
    reward: { gold: 220, tickets: 3, unlockEgg: "rainbow" },
  },
];

export const ENEMY_GOLD = { slime: 2, elite: 6, boss: 40 };
export const LEAK_HP = { slime: 1, elite: 2, boss: 3 };
export const ENEMY_ELITE_HP_MUL = 2;
export const BATTLE_WAVE_BREAK_SECONDS = 2;
export const BATTLE_PREVIEW_TIME_MUL = 4;
export const ITEM_GRENADE_DAMAGE = 45;
export const ITEM_RAGE_DURATION = 8;
export const ITEM_RAGE_INTERVAL_MUL = 0.65;
export const ITEM_SHIELD_HP = 2;
export const BASE_HP_SOFT_CAP_BONUS = 4;
export const AD_SPEED_LABEL = "广告开启2倍速";
export const AD_SPEED_TYPE = "SPEED_UNLOCK";
