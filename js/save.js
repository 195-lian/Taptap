/* js/save.js — 别砸我的蛋 存档 */
import { DAILY_TICKET, SAVE_KEY, SAVE_VERSION, NEW_PLAYER_GOLD } from "./config.js";

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function defaults() {
  return {
    version: SAVE_VERSION,
    updatedAt: 0,
    gold: NEW_PLAYER_GOLD,
    tickets: 0,
    ticketClaimDate: "",
    lastTicketClaimTs: 0,
    adSmashLeft: 0,
    lastAdSmashAt: 0,
    eggCrystal: 0,
    eggCounts: { wood: 0, copper: 0, goldEgg: 0, rainbow: 0 },
    eggSmashLeft: { wood: 0, copper: 0, goldEgg: 0, rainbow: 0 },
    invTowers: { hammer: 0, coin: 0, bomb: 0, thor: 0 },
    invItems: { grenade: 0, rage: 0, shield: 0 },
    weapons: [],
    weaponSlots: ["", "", ""],
    unlockedEggs: ["wood", "copper"],
    unlockedStages: [1],
    stageClear: {},
    firstClear: {},
    soundOn: true,
    speedUnlocked: false,
    lastSaveAt: 0,
  };
}

function merge(a, b) {
  const d = defaults();
  const o = { ...d, ...a };
  o.eggCounts = { ...d.eggCounts, ...(a.eggCounts || {}) };
  o.eggSmashLeft = { ...d.eggSmashLeft, ...(a.eggSmashLeft || {}) };
  o.invTowers = { ...d.invTowers, ...(a.invTowers || {}) };
  o.invItems = { ...d.invItems, ...(a.invItems || {}) };
  o.weapons = Array.isArray(a.weapons) ? a.weapons : [];
  o.weaponSlots = Array.isArray(a.weaponSlots)
    ? [0, 1, 2].map((i) => a.weaponSlots[i] || "")
    : ["", "", ""];
  o.unlockedEggs = Array.isArray(a.unlockedEggs) && a.unlockedEggs.length ? a.unlockedEggs : ["wood", "copper"];
  o.unlockedStages = Array.isArray(a.unlockedStages) && a.unlockedStages.length ? a.unlockedStages : [1];
  o.stageClear = a.stageClear || {};
  o.firstClear = a.firstClear || {};
  o.soundOn = a.soundOn !== false;
  o.updatedAt = Number(a.updatedAt) || 0;
  o.lastTicketClaimTs = Number(a.lastTicketClaimTs) || 0;
  o.adSmashLeft = Math.max(0, Number(a.adSmashLeft) || 0);
  o.lastAdSmashAt = Number(a.lastAdSmashAt) || 0;
  o.speedUnlocked = a.speedUnlocked === true;
  return o;
}

export const saveApi = {
  todayKey,
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaults();
      return merge(JSON.parse(raw), {});
    } catch (_) {
      return defaults();
    }
  },
  write(s) {
    try {
      const now = Date.now();
      s.lastSaveAt = now;
      s.updatedAt = now;
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (_) {}
  },
  defaults,
};

export function canClaimTicket(s, now = Date.now()) {
  if (s.ticketClaimDate === todayKey()) return false;
  return !s.lastTicketClaimTs || now >= s.lastTicketClaimTs;
}

export function claimTicket(s, now = Date.now()) {
  if (!canClaimTicket(s, now)) return false;
  s.tickets += DAILY_TICKET;
  s.ticketClaimDate = todayKey();
  s.lastTicketClaimTs = now;
  saveApi.write(s);
  return true;
}

export function isStageUnlocked(s, id) {
  return s.unlockedStages.includes(id) || id === 1;
}

export function unlockStage(s, id) {
  if (!s.unlockedStages.includes(id)) {
    s.unlockedStages.push(id);
    saveApi.write(s);
  }
}

export function eggUnlocked(s, eggId) {
  return s.unlockedEggs.includes(eggId);
}

export function unlockEgg(s, eggId) {
  if (!s.unlockedEggs.includes(eggId)) {
    s.unlockedEggs.push(eggId);
  }
  if (!s.eggSmashLeft[eggId]) s.eggSmashLeft[eggId] = 0;
  saveApi.write(s);
}

export function towerCardTotal(s) {
  return Object.values(s.invTowers).reduce((a, b) => a + b, 0);
}

export function itemTotal(s) {
  return Object.values(s.invItems).reduce((a, b) => a + b, 0);
}
