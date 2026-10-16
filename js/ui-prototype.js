import {
  AD_SPEED_TYPE,
  BATTLE_PREVIEW_TIME_MUL,
  BATTLE_WAVE_BREAK_SECONDS,
  EGGS,
  ENEMY_ELITE_HP_MUL,
  ENEMY_GOLD,
  GOLD_BAG_BY_RARITY,
  ITEM_DROP_WEIGHTS,
  ITEM_GRENADE_DAMAGE,
  ITEM_RAGE_DURATION,
  ITEM_RAGE_INTERVAL_MUL,
  ITEM_SHIELD_HP,
  ITEMS,
  LEAK_HP,
  LV_MUL,
  RARITY_LABEL,
  REPEAT_CLEAR_GOLD_MUL,
  STAGES,
  TOWER_DROP_WEIGHTS,
  TOWERS,
  WEAPON_DROP_BY_EGG,
  WEAPONS,
} from "./config.js";
import { canClaimTicket, claimTicket, saveApi } from "./save.js";
import { adSystem } from "../game/systems/adSystem.js";

const screens = Array.from(document.querySelectorAll("[data-screen]"));
const toast = document.getElementById("toast");
const stateSave = saveApi.load();
const placedTowers = [null, null, null, null];
let current = "cover";
let selectedEgg = stateSave.unlockedEggs.includes("wood") ? "wood" : stateSave.unlockedEggs[0];
let selectedStageId = 1;
let selectedTower = "hammer";
let battleRun = null;
let battleTimer = 0;
let speedAdBusy = false;
let toastTimer = 0;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 1600);
}

function stopBattleLoop() {
  if (!battleTimer) return;
  window.clearInterval(battleTimer);
  battleTimer = 0;
}

function show(name) {
  const next = document.querySelector("[data-screen='" + name + "']");
  if (!next) return;
  if (current === "battle" && name !== "battle") stopBattleLoop();
  current = name;
  screens.forEach(function (screen) {
    screen.classList.toggle("is-active", screen === next);
  });
  render();
}

function sumWeights(weights) {
  return Object.values(weights).reduce(function (sum, value) {
    return sum + value;
  }, 0);
}

function pickWeighted(weights) {
  const total = sumWeights(weights);
  let cursor = Math.random() * total;
  for (const [id, weight] of Object.entries(weights)) {
    cursor -= weight;
    if (cursor <= 0) return id;
  }
  return Object.keys(weights)[0];
}

function rollRarity(eggId) {
  const egg = EGGS[eggId];
  const count = Number(stateSave.eggCounts[eggId]) || 0;
  const weights = { ...egg.rar };
  weights.purple = Math.min(egg.soft.purple.cap, weights.purple + count * egg.soft.purple.step);
  weights.gold = Math.min(egg.soft.gold.cap, weights.gold + count * egg.soft.gold.step);

  if (count + 1 >= egg.hardPity) {
    return pickWeighted({
      purple: Math.max(weights.purple, egg.soft.purple.cap),
      gold: Math.max(weights.gold, egg.soft.gold.cap),
    });
  }
  return pickWeighted(weights);
}

function awardSmashDrop(eggId) {
  const egg = EGGS[eggId];
  const dropClass = pickWeighted(egg.dropClass);
  if (dropClass === "tower") {
    const rarity = rollRarity(eggId);
    const towerId = pickWeighted(TOWER_DROP_WEIGHTS[rarity]);
    stateSave.invTowers[towerId] += 1;
    return { kind: "tower", name: TOWERS[towerId].name, rarity: RARITY_LABEL[rarity], detail: "塔卡 ×1" };
  }
  if (dropClass === "item") {
    const itemId = pickWeighted(ITEM_DROP_WEIGHTS);
    stateSave.invItems[itemId] += 1;
    return { kind: "item", name: ITEMS[itemId].name, detail: "道具 ×1" };
  }
  if (dropClass === "goldBag") {
    const rarity = rollRarity(eggId);
    const gold = GOLD_BAG_BY_RARITY[rarity];
    stateSave.gold += gold;
    return { kind: "gold", name: "金币袋", rarity: RARITY_LABEL[rarity], detail: "金币 +" + gold };
  }
  const weaponId = WEAPON_DROP_BY_EGG[eggId] || Object.keys(WEAPONS)[0];
  if (!stateSave.weapons.includes(weaponId)) stateSave.weapons.push(weaponId);
  return { kind: "weapon", name: WEAPONS[weaponId].name, detail: "武器 ×1" };
}

function getSmashPayment(eggId) {
  const egg = EGGS[eggId];
  if ((stateSave.eggSmashLeft[eggId] || 0) > 0) return { type: "egg", label: "免费次数" };
  if (stateSave.adSmashLeft > 0) return { type: "ad", label: "广告次数" };
  if (stateSave.tickets >= egg.ticketCost) return { type: "ticket", label: egg.ticketCost + "券" };
  if (stateSave.gold >= egg.goldCost) return { type: "gold", label: egg.goldCost + "金" };
  return null;
}

function spendSmashPayment(eggId, payment) {
  const egg = EGGS[eggId];
  if (payment.type === "egg") stateSave.eggSmashLeft[eggId] -= 1;
  if (payment.type === "ad") stateSave.adSmashLeft -= 1;
  if (payment.type === "ticket") stateSave.tickets -= egg.ticketCost;
  if (payment.type === "gold") stateSave.gold -= egg.goldCost;
}

function smashEgg() {
  const payment = getSmashPayment(selectedEgg);
  if (!payment) {
    notify("券和金币都不够，先去主页领券");
    return;
  }
  spendSmashPayment(selectedEgg, payment);
  stateSave.eggCounts[selectedEgg] = (stateSave.eggCounts[selectedEgg] || 0) + 1;
  const drop = awardSmashDrop(selectedEgg);
  if (drop.kind === "tower" || drop.kind === "item" || drop.kind === "weapon") {
    const rareDrop = drop.rarity ? "（" + drop.rarity + "）" : "";
    if (drop.kind === "tower" || drop.kind === "item") stateSave.eggCounts[selectedEgg] = 0;
    notify("获得 " + drop.name + rareDrop + " · " + drop.detail);
  } else {
    notify("获得 " + drop.name + "（" + drop.rarity + "） · " + drop.detail);
  }
  saveApi.write(stateSave);
  render();
}

function renderHome() {
  const goldNodes = document.querySelectorAll("#gold-value, .js-gold-value");
  const ticketNodes = document.querySelectorAll("#ticket-value, .js-ticket-value");
  goldNodes.forEach(function (node) { node.textContent = stateSave.gold; });
  ticketNodes.forEach(function (node) { node.textContent = stateSave.tickets; });
  document.querySelectorAll("[data-action='claim-ticket']").forEach(function (claim) {
    claim.disabled = !canClaimTicket(stateSave);
    claim.setAttribute("aria-label", claim.disabled ? "今日券已领取" : "领取每日券");
  });
  const soundButton = document.getElementById("home-sound-button");
  if (soundButton) {
    const soundImage = soundButton.querySelector("img");
    if (soundImage) {
      soundImage.src = stateSave.soundOn
        ? "assets/home/navigation/sound/home_sound_on_b.png"
        : "assets/home/navigation/sound/home_sound_off_b.png";
    }
    soundButton.setAttribute("aria-label", stateSave.soundOn ? "声音：开启" : "声音：关闭");
  }
  const stageLabel = document.getElementById("home-stage-label");
  const stage = STAGES.find(function (item) {
    return item.id === selectedStageId;
  });
  const homeStageNames = {
    1: "青苔小径",
    2: "溪涧营地",
    3: "幽影深处",
  };
  if (stageLabel && stage) stageLabel.textContent = "第" + stage.id + "关 · " + (homeStageNames[stage.id] || stage.name);
  const homeClaim = document.querySelector(".home-claim");
  if (homeClaim) {
    const canClaim = canClaimTicket(stateSave);
    homeClaim.classList.toggle("is-ready", canClaim);
    homeClaim.setAttribute("aria-label", canClaim ? "领取每日券" : "今日券已领取");
  }
}

function isStageUnlocked(stageId) {
  return stageId === 1 || stateSave.unlockedStages.includes(stageId);
}

function renderStage() {
  document.querySelectorAll("[data-action='select-stage']").forEach(function (node) {
    const stageId = Number(node.dataset.stage);
    const unlocked = isStageUnlocked(stageId);
    node.classList.toggle("is-locked", !unlocked);
    node.classList.toggle("is-unlocked", unlocked);
    node.classList.toggle("is-selected", stageId === selectedStageId);
    node.setAttribute("aria-label", unlocked ? "第" + stageId + "关，点击备战" : "第" + stageId + "关，通关前置关卡后解锁");
    const icon = node.querySelector(".stage-node-icon");
    if (icon) icon.textContent = unlocked ? "✓" : "🔒";
  });
}

function renderSmash() {
  const egg = EGGS[selectedEgg];
  const count = Number(stateSave.eggCounts[selectedEgg]) || 0;
  const pity = document.getElementById("pity-value");
  const progress = document.getElementById("pity-progress");
  const label = document.getElementById("smash-label");
  const free = document.getElementById("smash-free");
  const ad = document.getElementById("smash-ad");
  const eggArt = document.getElementById("smash-egg-art");
  if (pity) pity.textContent = count + "/" + egg.hardPity;
  if (progress) progress.style.width = Math.min(100, (count / egg.hardPity) * 100) + "%";
  if (free) free.textContent = stateSave.eggSmashLeft[selectedEgg] || 0;
  if (ad) ad.textContent = stateSave.adSmashLeft || 0;
  if (eggArt) {
    eggArt.classList.remove("is-wood", "is-copper", "is-goldEgg", "is-rainbow");
    eggArt.classList.add("is-" + selectedEgg);
  }
  document.querySelectorAll(".egg-option[data-action='select-egg'][data-egg]").forEach(function (option) {
    const id = option.dataset.egg;
    const unlocked = stateSave.unlockedEggs.includes(id);
    option.disabled = false;
    option.classList.toggle("is-selected", id === selectedEgg);
    option.classList.toggle("is-locked", !unlocked);
  });
  const payment = getSmashPayment(selectedEgg);
  document.querySelectorAll(".actual-smash-button[data-action='smash']").forEach(function (smashButton) {
    smashButton.disabled = false;
    smashButton.classList.toggle("is-disabled", !payment);
  });
  if (label) label.textContent = payment ? "砸一下" : "需要领券";
}

function placedCount(towerId) {
  return placedTowers.filter(function (id) {
    return id === towerId;
  }).length;
}

function renderPrep() {
  const stage = STAGES.find(function (item) {
    return item.id === selectedStageId;
  }) || STAGES[0];
  const stageMeta = document.getElementById("prep-stage-meta");
  if (stageMeta) stageMeta.textContent = stage.name + " · HP " + stage.baseHp + " · " + stage.waves.length + " 波";
  document.querySelectorAll("[data-stock]").forEach(function (label) {
    label.textContent = "×" + (stateSave.invTowers[label.dataset.stock] || 0);
  });
  document.querySelectorAll(".tower-options [data-action='select-tower'][data-tower]").forEach(function (option) {
    const towerId = option.dataset.tower;
    const count = stateSave.invTowers[towerId] || 0;
    option.classList.toggle("is-selected", towerId === selectedTower);
    option.classList.toggle("is-empty", count === 0);
  });
  document.querySelectorAll(".prep-slot[data-slot]").forEach(function (slot) {
    const towerId = placedTowers[Number(slot.dataset.slot)];
    slot.classList.toggle("is-active", Boolean(towerId));
    slot.setAttribute("aria-label", towerId ? TOWERS[towerId].name + " Lv.1" : "空塔位");
    slot.innerHTML = towerId
      ? '<span class="sprite slot-tower tower-mark tower-' + towerId + '"></span><small class="slot-level">Lv.1</small>'
      : '<span class="slot-plus">＋</span>';
  });
}

function weaponSpriteClass(weaponId) {
  if (weaponId === "thunder_hammer") return "item-thor";
  return "item-hammer";
}

function renderWeapons() {
  const slots = document.getElementById("weapon-slots");
  const list = document.getElementById("weapon-list");
  const count = document.getElementById("weapon-owned-count");
  if (!slots || !list || !count) return;
  const owned = stateSave.weapons.filter(function (weaponId) {
    return WEAPONS[weaponId];
  });
  count.textContent = "拥有 " + owned.length + " 件";
  slots.innerHTML = stateSave.weaponSlots.map(function (weaponId, index) {
    if (!WEAPONS[weaponId]) {
      return '<button class="weapon-slot" type="button" disabled aria-label="空装备槽">空槽</button>';
    }
    return '<button class="weapon-slot is-filled" type="button" data-action="unequip-weapon" data-slot="' + index + '" aria-label="卸下' + WEAPONS[weaponId].name + '"><span class="sprite ' + weaponSpriteClass(weaponId) + '"></span><small>' + WEAPONS[weaponId].name + '</small></button>';
  }).join("");
  list.innerHTML = owned.length
    ? owned.map(function (weaponId) {
      const weapon = WEAPONS[weaponId];
      const equipped = stateSave.weaponSlots.includes(weaponId);
      return '<button class="weapon-card' + (equipped ? " is-equipped" : "") + '" type="button" data-action="equip-weapon" data-weapon="' + weaponId + '" aria-label="' + (equipped ? "卸下" : "装备") + weapon.name + '"><span class="sprite ' + weaponSpriteClass(weaponId) + '"></span><strong>' + weapon.name + '</strong><small>' + weapon.desc + '</small></button>';
    }).join("")
    : '<div class="weapon-card is-empty">暂无武器，去捣蛋台获取</div>';
  document.querySelectorAll(".weapon-manager [data-action='equip-weapon'][data-weapon]").forEach(function (button) {
    button.disabled = !stateSave.weapons.includes(button.dataset.weapon);
  });
  document.querySelectorAll(".weapon-manager [data-action='unequip-weapon'][data-slot]").forEach(function (button) {
    button.disabled = !stateSave.weaponSlots[Number(button.dataset.slot)];
  });
  document.querySelectorAll(".actual-weapons .weapon-catalog-card[data-weapon]").forEach(function (button) {
    const weaponId = button.dataset.weapon;
    const weapon = WEAPONS[weaponId];
    const ownedWeapon = Boolean(weapon && stateSave.weapons.includes(weaponId));
    const equipped = ownedWeapon && stateSave.weaponSlots.includes(weaponId);
    button.classList.toggle("is-equipped", equipped);
    button.classList.toggle("is-unowned", !ownedWeapon);
    if (weapon) {
      button.setAttribute("aria-label", ownedWeapon
        ? (equipped ? "卸下" : "装备") + weapon.name
        : "未拥有" + weapon.name);
    }
  });
}

function renderPause() {
  const label = document.getElementById("pause-sound-label");
  if (label) label.textContent = "声音：" + (stateSave.soundOn ? "开启" : "关闭");
}

function getWeaponMods() {
  return stateSave.weaponSlots.reduce(function (mods, weaponId) {
    const weapon = WEAPONS[weaponId];
    if (!weapon) return mods;
    Object.entries(weapon.mods).forEach(function ([key, value]) {
      mods[key] = (mods[key] || 0) + value;
    });
    return mods;
  }, {});
}

function pathPoint(stage, progress) {
  const path = stage.path;
  const bounded = Math.max(0, Math.min(0.999, progress));
  const segment = bounded * (path.length - 1);
  const index = Math.floor(segment);
  const ratio = segment - index;
  const from = path[index];
  const to = path[index + 1] || from;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function mergePlacedTowers(selected) {
  const merged = selected.map(function (towerId, slot) {
    return { id: towerId, level: 1, slot };
  });
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i += 1) {
      for (let j = i + 1; j < merged.length; j += 1) {
        if (merged[i].id === merged[j].id && merged[i].level === merged[j].level && merged[i].level < 3) {
          merged[i].level += 1;
          merged.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return merged;
}

function takeBattleItems() {
  const items = [];
  for (const itemId of Object.keys(ITEMS)) {
    while (stateSave.invItems[itemId] > 0 && items.length < 3) {
      stateSave.invItems[itemId] -= 1;
      items.push(itemId);
    }
    if (items.length >= 3) break;
  }
  return items;
}

function returnUnusedItems() {
  if (!battleRun || battleRun.itemsReturned) return;
  battleRun.items.forEach(function (itemId) {
    stateSave.invItems[itemId] += 1;
  });
  battleRun.itemsReturned = true;
  saveApi.write(stateSave);
}

function spawnEnemy(wave, isBoss) {
  const elite = !isBoss && battleRun.spawned < (wave.elite || 0);
  const kind = isBoss ? "boss" : elite ? "elite" : "slime";
  const hp = isBoss ? wave.bossHp : wave.hp * (elite ? ENEMY_ELITE_HP_MUL : 1);
  battleRun.enemies.push({
    id: battleRun.nextEnemyId,
    kind,
    hp,
    maxHp: hp,
    progress: 0,
    speed: isBoss ? wave.spd * 0.72 : wave.spd,
  });
  battleRun.nextEnemyId += 1;
  if (!isBoss) battleRun.spawned += 1;
  if (isBoss) battleRun.bossSpawned = true;
}

function enemyPosition(stage, enemy) {
  return pathPoint(stage, enemy.progress);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function selectTarget(stage, tower) {
  const towerPosition = stage.slots[tower.slot] || stage.slots[0];
  return battleRun.enemies
    .filter(function (enemy) {
      return enemy.hp > 0 && distance(towerPosition, enemyPosition(stage, enemy)) <= TOWERS[tower.id].range;
    })
    .sort(function (a, b) {
      return b.progress - a.progress;
    })[0];
}

function renderBattleItems() {
  const container = document.getElementById("battle-items");
  if (!container) return;
  const spriteClass = { grenade: "item-grenade", rage: "item-rage", shield: "item-shield" };
  const itemIds = battleRun ? battleRun.items : [];
  container.innerHTML = [0, 1, 2].map(function (index) {
    const itemId = itemIds[index];
    if (!itemId) return '<button class="battle-item is-empty" type="button" disabled aria-label="空道具位"></button>';
    return '<button class="battle-item" type="button" data-action="use-item" data-item="' + itemId + '" aria-label="' + ITEMS[itemId].name + '"><span class="sprite ' + spriteClass[itemId] + '"></span><b>×1</b></button>';
  }).join("");
}

function renderBattle() {
  const healthBar = document.getElementById("battle-health-bar");
  const healthText = document.getElementById("battle-health-text");
  const waveLabel = document.getElementById("battle-wave-label");
  const speedBadge = document.querySelector(".battle-speed-badge");
  const speedLabel = document.getElementById("battle-speed-label");
  const towerLayer = document.getElementById("battle-towers");
  const actorLayer = document.getElementById("battle-actors");
  if (!battleRun) {
    if (towerLayer) towerLayer.innerHTML = "";
    if (actorLayer) actorLayer.innerHTML = "";
    renderBattleItems();
    return;
  }
  const stage = STAGES.find(function (item) {
    return item.id === battleRun.stageId;
  }) || STAGES[0];
  if (healthBar) healthBar.style.width = Math.max(0, (battleRun.baseHp / battleRun.maxHp) * 100) + "%";
  if (healthText) healthText.textContent = Math.max(0, battleRun.baseHp) + "/" + battleRun.maxHp;
  if (waveLabel) waveLabel.textContent = "第 " + Math.min(battleRun.waveIndex + 1, stage.waves.length) + "/" + stage.waves.length + " 波";
  if (speedBadge) {
    if (speedLabel) speedLabel.textContent = "×" + (stateSave.speedUnlocked ? battleRun.speed : 1);
    speedBadge.disabled = speedAdBusy;
    speedBadge.setAttribute("aria-label", stateSave.speedUnlocked ? "切换2倍速" : "看广告解锁2倍速");
  }
  if (towerLayer) {
    towerLayer.innerHTML = battleRun.towers.map(function (tower) {
      const position = stage.slots[tower.slot] || stage.slots[0];
      return '<div class="battle-tower tower-mark tower-' + tower.id + '" style="left:' + (position.x * 100) + '%;top:' + (position.y * 100) + '%"><small class="tower-level">Lv.' + tower.level + "</small></div>";
    }).join("");
  }
  if (actorLayer) {
    actorLayer.innerHTML = battleRun.enemies.map(function (enemy) {
      const position = enemyPosition(stage, enemy);
      const hp = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
      return '<div class="battle-enemy is-' + enemy.kind + '" style="left:' + (position.x * 100) + '%;top:' + (position.y * 100) + '%"><i class="battle-unit-hp"><em style="width:' + hp + '%"></em></i><span class="battle-unit-sprite"></span></div>';
    }).join("");
  }
  renderBattleItems();
}

function renderResult() {
  const resultScreen = document.querySelector("[data-screen='result']");
  const outcome = document.getElementById("result-outcome");
  const stageLabel = document.getElementById("result-stage-label");
  const reward = document.getElementById("result-reward");
  if (!resultScreen || !outcome || !stageLabel || !reward) return;
  const stage = battleRun && STAGES.find(function (item) {
    return item.id === battleRun.stageId;
  });
  const isSuccess = !battleRun || battleRun.outcome !== "failure";
  resultScreen.classList.toggle("is-failure", !isSuccess);
  outcome.textContent = isSuccess ? "守护成功" : "守护失败";
  stageLabel.textContent = stage ? stage.name : "本局";
  reward.textContent = isSuccess
    ? (battleRun && battleRun.reward ? formatReward(battleRun.reward) : "奖励结算中")
    : "本局无通关奖励，已消耗的塔卡不退回";
  const resultReward = isSuccess && battleRun ? battleRun.reward : null;
  const eggReward = resultReward && resultReward.eggSmash
    ? Object.values(resultReward.eggSmash).reduce(function (sum, value) {
      return sum + value;
    }, 0)
    : 0;
  const resultGold = document.getElementById("result-gold-value");
  const resultTickets = document.getElementById("result-ticket-value");
  const resultEgg = document.getElementById("result-egg-value");
  if (resultGold) resultGold.textContent = "x" + ((resultReward && resultReward.gold) || 0);
  if (resultTickets) resultTickets.textContent = "x" + ((resultReward && resultReward.tickets) || 0);
  if (resultEgg) resultEgg.textContent = "x" + eggReward;
}

function applyStageReward() {
  if (!battleRun || battleRun.rewardGranted) return;
  const stage = STAGES.find(function (item) {
    return item.id === battleRun.stageId;
  }) || STAGES[0];
  const isFirstClear = !stateSave.firstClear[stage.id];
  const baseReward = isFirstClear
    ? stage.reward
    : { gold: Math.floor(stage.reward.gold * REPEAT_CLEAR_GOLD_MUL), tickets: 1 };
  const reward = { ...baseReward, gold: (baseReward.gold || 0) + battleRun.gold };
  stateSave.gold += reward.gold || 0;
  stateSave.tickets += reward.tickets || 0;
  if (reward.eggSmash) {
    Object.entries(reward.eggSmash).forEach(function ([eggId, count]) {
      stateSave.eggSmashLeft[eggId] += count;
    });
  }
  if (reward.unlockEgg && !stateSave.unlockedEggs.includes(reward.unlockEgg)) {
    stateSave.unlockedEggs.push(reward.unlockEgg);
  }
  if (reward.unlockStage && !stateSave.unlockedStages.includes(reward.unlockStage)) {
    stateSave.unlockedStages.push(reward.unlockStage);
  }
  const nextStageId = stage.id + 1;
  if (nextStageId <= STAGES.length && !stateSave.unlockedStages.includes(nextStageId)) {
    stateSave.unlockedStages.push(nextStageId);
  }
  stateSave.stageClear[stage.id] = true;
  stateSave.firstClear[stage.id] = true;
  battleRun.rewardGranted = true;
  battleRun.reward = reward;
  battleRun.outcome = "success";
  returnUnusedItems();
  saveApi.write(stateSave);
}

function formatReward(reward) {
  if (!reward) return "";
  const parts = [];
  if (reward.gold) parts.push("金币 +" + reward.gold);
  if (reward.tickets) parts.push("券 +" + reward.tickets);
  if (reward.eggSmash) {
    Object.entries(reward.eggSmash).forEach(function ([eggId, count]) {
      parts.push(EGGS[eggId].name + "次数 +" + count);
    });
  }
  return parts.join("，");
}

function completeBattle() {
  stopBattleLoop();
  applyStageReward();
  show("result");
  notify("守护成功，进入结算");
}

function failBattle() {
  stopBattleLoop();
  returnUnusedItems();
  placedTowers.fill(null);
  if (battleRun) {
    battleRun.status = "failed";
    battleRun.outcome = "failure";
    battleRun.reward = null;
  }
  show("result");
  notify("金蛋被击破，已扣塔卡不退回");
}

function advanceWave() {
  const stage = STAGES.find(function (item) {
    return item.id === battleRun.stageId;
  }) || STAGES[0];
  battleRun.waveIndex += 1;
  if (battleRun.waveIndex >= stage.waves.length) {
    completeBattle();
    return;
  }
  battleRun.spawned = 0;
  battleRun.bossSpawned = false;
  battleRun.spawnTimer = 0;
  battleRun.breakLeft = null;
  notify("第 " + (battleRun.waveIndex + 1) + " 波开始");
}

function tickBattle() {
  if (!battleRun || battleRun.status !== "running") return;
  const stage = STAGES.find(function (item) {
    return item.id === battleRun.stageId;
  }) || STAGES[0];
  const wave = stage.waves[battleRun.waveIndex];
  const dt = 0.1 * battleRun.speed * BATTLE_PREVIEW_TIME_MUL;
  battleRun.rageLeft = Math.max(0, battleRun.rageLeft - dt);

  if (battleRun.spawned < wave.n) {
    battleRun.spawnTimer -= dt;
    if (battleRun.spawnTimer <= 0) {
      spawnEnemy(wave, false);
      battleRun.spawnTimer += wave.iv;
    }
  }

  battleRun.enemies.forEach(function (enemy) {
    enemy.progress += enemy.speed * dt;
    if (enemy.progress >= 1) {
      battleRun.baseHp -= LEAK_HP[enemy.kind];
      enemy.hp = 0;
    }
  });

  battleRun.towers.forEach(function (tower) {
    const towerConfig = TOWERS[tower.id];
    tower.cooldown -= dt;
    if (tower.cooldown > 0) return;
    const target = selectTarget(stage, tower);
    if (!target) return;
    const level = LV_MUL[tower.level];
    let damage = towerConfig.dmg * level.dmg;
    const weaponMods = getWeaponMods();
    if (tower.id === "hammer") damage *= 1 + (weaponMods.hammerDmgMul || 0);
    if (target.kind === "boss") damage *= towerConfig.bossMul;
    target.hp -= damage;
    let interval = towerConfig.interval * level.iv;
    if (tower.id === "hammer") interval *= 1 - (weaponMods.hammerIvMul || 0);
    if (tower.id === "coin") interval *= 1 - (weaponMods.coinIvMul || 0);
    tower.cooldown = interval * (battleRun.rageLeft > 0 ? ITEM_RAGE_INTERVAL_MUL : 1);
  });

  battleRun.enemies = battleRun.enemies.filter(function (enemy) {
    if (enemy.hp > 0) return true;
    if (enemy.progress < 1) battleRun.gold += ENEMY_GOLD[enemy.kind];
    return false;
  });

  if (battleRun.baseHp <= 0) {
    failBattle();
    return;
  }

  if (battleRun.spawned >= wave.n && battleRun.enemies.length === 0 && wave.bossHp && !battleRun.bossSpawned) {
    spawnEnemy(wave, true);
  }
  if (battleRun.spawned >= wave.n && battleRun.enemies.length === 0 && (!wave.bossHp || battleRun.bossSpawned)) {
    if (battleRun.breakLeft === null) battleRun.breakLeft = BATTLE_WAVE_BREAK_SECONDS;
  }
  if (battleRun.breakLeft !== null) {
    battleRun.breakLeft -= dt;
    if (battleRun.breakLeft <= 0) advanceWave();
  }
  renderBattle();
}

function startBattleLoop() {
  stopBattleLoop();
  battleTimer = window.setInterval(tickBattle, 100);
}

function startWave() {
  const selected = placedTowers.filter(Boolean);
  const counts = selected.reduce(function (result, towerId) {
    result[towerId] = (result[towerId] || 0) + 1;
    return result;
  }, {});
  for (const [towerId, count] of Object.entries(counts)) {
    if ((stateSave.invTowers[towerId] || 0) < count) {
      notify("塔卡数量不足，请重新布置");
      return;
    }
  }
  Object.entries(counts).forEach(function ([towerId, count]) {
    stateSave.invTowers[towerId] -= count;
  });
  const stage = STAGES.find(function (item) {
    return item.id === selectedStageId;
  }) || STAGES[0];
  const selectedTowers = selected.length ? selected : ["hammer"];
  battleRun = {
    stageId: stage.id,
    waveIndex: 0,
    spawned: 0,
    bossSpawned: false,
    spawnTimer: 0,
    breakLeft: null,
    nextEnemyId: 1,
    enemies: [],
    towers: mergePlacedTowers(selectedTowers),
    items: takeBattleItems(),
    itemsReturned: false,
    baseHp: stage.baseHp,
    maxHp: stage.baseHp,
    gold: 0,
    rageLeft: 0,
    speed: stateSave.speedUnlocked ? 2 : 1,
    status: "running",
    rewardGranted: false,
    temporaryHammer: selected.length === 0,
  };
  battleRun.towers.forEach(function (tower) {
    tower.cooldown = 0;
  });
  placedTowers.fill(null);
  saveApi.write(stateSave);
  show("battle");
  startBattleLoop();
  notify(selected.length ? "已扣塔卡，自动守护开始" : "暂无塔卡，临时白锤炮已就位");
}

function useItem(itemId) {
  if (!battleRun || battleRun.status !== "running") return;
  const index = battleRun.items.indexOf(itemId);
  if (index < 0) return;
  battleRun.items.splice(index, 1);
  if (itemId === "grenade") {
    battleRun.enemies.forEach(function (enemy) {
      enemy.hp -= ITEM_GRENADE_DAMAGE;
    });
    notify("手雷命中所有敌人");
  }
  if (itemId === "rage") {
    battleRun.rageLeft = ITEM_RAGE_DURATION;
    notify("全塔狂暴已开启");
  }
  if (itemId === "shield") {
    battleRun.baseHp = Math.min(battleRun.maxHp, battleRun.baseHp + ITEM_SHIELD_HP);
    notify("金蛋护盾恢复 " + ITEM_SHIELD_HP + " 点生命");
  }
  saveApi.write(stateSave);
  renderBattle();
}

async function handleSpeed() {
  if (!battleRun || battleRun.status !== "running" || speedAdBusy) return;
  if (stateSave.speedUnlocked) {
    battleRun.speed = battleRun.speed === 2 ? 1 : 2;
    renderBattle();
    notify(battleRun.speed === 2 ? "2倍速：开启" : "2倍速：关闭");
    return;
  }
  speedAdBusy = true;
  renderBattle();
  notify("广告加载中，完成后永久解锁2倍速");
  const result = await adSystem.showRewarded(AD_SPEED_TYPE, {
    onRewarded: function () {
      stateSave.speedUnlocked = true;
      if (battleRun) battleRun.speed = 2;
      saveApi.write(stateSave);
      renderBattle();
      notify("广告完成，2倍速已永久解锁");
    },
    onFailed: function () {
      notify("广告未完成，暂未解锁2倍速");
    },
  });
  speedAdBusy = false;
  renderBattle();
  if (!result.ok && result.reason === "busy") notify("广告正在处理中");
}

function action(name, eventTarget) {
  if (name === "enter-game") {
    show("home");
    return;
  }
  if (name === "claim-ticket") {
    if (claimTicket(stateSave)) {
      render();
      notify("每日券 +10");
    } else {
      notify("今日券已领取");
    }
    return;
  }
  if (name === "smash-help") {
    notify("扣费顺序：免费次数 → 广告次数 → 券 → 金币");
    return;
  }
  if (name === "smash-ad") {
    notify("草图示意：看广告可免费砸一次（COMPLETED 后发奖）");
    return;
  }
  if (name === "smash-skip") {
    notify("已开启跳过动画");
    return;
  }
  if (name === "select-egg") {
    if (!stateSave.unlockedEggs.includes(eventTarget.dataset.egg)) {
      notify("通关后解锁这个蛋");
      return;
    }
    selectedEgg = eventTarget.dataset.egg;
    render();
    notify("已选择" + EGGS[selectedEgg].name);
    return;
  }
  if (name === "select-stage") {
    const stageId = Number(eventTarget.dataset.stage);
    selectedStageId = stageId;
    if (!isStageUnlocked(stageId)) {
      renderStage();
      notify("先通关前置关卡");
      return;
    }
    show("prep");
    return;
  }
  if (name === "smash") {
    smashEgg();
    return;
  }
  if (name === "select-tower") {
    const towerId = eventTarget.dataset.tower;
    if (!stateSave.invTowers[towerId]) {
      notify("还没有" + TOWERS[towerId].name + "，先去捣蛋");
      return;
    }
    selectedTower = towerId;
    renderPrep();
    notify("已选择" + TOWERS[towerId].name);
    return;
  }
  if (name === "equip-weapon") {
    const weaponId = eventTarget.dataset.weapon;
    if (!WEAPONS[weaponId] || !stateSave.weapons.includes(weaponId)) {
      notify("还没有这件武器，先去捣蛋台获取");
      return;
    }
    const existingSlot = stateSave.weaponSlots.indexOf(weaponId);
    if (existingSlot >= 0) {
      stateSave.weaponSlots[existingSlot] = "";
      notify("已卸下" + WEAPONS[weaponId].name);
    } else {
      const emptySlot = stateSave.weaponSlots.indexOf("");
      if (emptySlot < 0) {
        notify("装备槽已满");
        return;
      }
      stateSave.weaponSlots[emptySlot] = weaponId;
      notify("已装备" + WEAPONS[weaponId].name);
    }
    saveApi.write(stateSave);
    renderWeapons();
    return;
  }
  if (name === "weapon-tab") {
    document.querySelectorAll(".weapon-tabs [data-action='weapon-tab']").forEach(function (button) {
      button.classList.toggle("is-active", button === eventTarget);
    });
    notify("已切换到" + eventTarget.dataset.tab + "分类");
    return;
  }
  if (name === "weapon-card-info") {
    notify("已查看" + eventTarget.dataset.label);
    return;
  }
  if (name === "weapon-badge") {
    notify("已查看" + eventTarget.dataset.label);
    return;
  }
  if (name === "unequip-weapon") {
    const slot = Number(eventTarget.dataset.slot);
    if (!stateSave.weaponSlots[slot]) {
      notify("这个装备槽还是空的");
      return;
    }
    notify("已卸下" + WEAPONS[stateSave.weaponSlots[slot]].name);
    stateSave.weaponSlots[slot] = "";
    saveApi.write(stateSave);
    renderWeapons();
    return;
  }
  if (name === "add-tower") {
    const index = Number(eventTarget.dataset.slot);
    if (placedTowers[index]) {
      placedTowers[index] = null;
      renderPrep();
      notify("已收回塔位，存货未扣");
      return;
    }
    const available = (stateSave.invTowers[selectedTower] || 0) - placedCount(selectedTower);
    if (available <= 0) {
      notify("没有可放置的" + TOWERS[selectedTower].name);
      return;
    }
    placedTowers[index] = selectedTower;
    renderPrep();
    notify("已放置" + TOWERS[selectedTower].name + "，开波时扣除");
    return;
  }
  if (name === "start-wave") {
    startWave();
    return;
  }
  if (name === "use-item") {
    const slot = Number(eventTarget.dataset.slot);
    const itemId = eventTarget.dataset.item || (battleRun && battleRun.items[slot]);
    if (!itemId) {
      notify("这个道具位是空的");
      return;
    }
    useItem(itemId);
    return;
  }
  if (name === "speed") {
    handleSpeed();
    return;
  }
  if (name === "pause") {
    if (battleRun) battleRun.status = "paused";
    show("pause");
    return;
  }
  if (name === "resume") {
    if (battleRun) battleRun.status = "running";
    show("battle");
    startBattleLoop();
    return;
  }
  if (name === "exit-battle") {
    stopBattleLoop();
    returnUnusedItems();
    battleRun = null;
    show("home");
    notify("已退出关卡，已扣塔卡不退回");
    return;
  }
  if (name === "sound-panel") {
    stateSave.soundOn = !stateSave.soundOn;
    saveApi.write(stateSave);
    renderHome();
    renderPause();
    notify(stateSave.soundOn ? "声音：开启" : "声音：关闭");
    return;
  }
  if (name === "home-shop") {
    notify("商城页面待生成");
    return;
  }
  if (name === "collect") {
    const reward = battleRun && battleRun.reward;
    const failed = battleRun && battleRun.outcome === "failure";
    battleRun = null;
    placedTowers.fill(null);
    show(failed ? "prep" : "home");
    notify(failed ? "重新备战" : reward ? "奖励已收下：" + formatReward(reward) : "奖励已收下");
  }
}

function render() {
  renderHome();
  renderStage();
  renderSmash();
  renderPrep();
  renderWeapons();
  renderBattle();
  renderResult();
  renderPause();
}

function flashControl(control) {
  if (!control || control.disabled) return;
  control.classList.remove("is-pressed");
  window.clearTimeout(control.feedbackTimer);
  window.requestAnimationFrame(function () {
    control.classList.add("is-pressed");
  });
  control.feedbackTimer = window.setTimeout(function () {
    control.classList.remove("is-pressed");
  }, 240);
}

document.addEventListener("pointerdown", function (event) {
  const control = event.target.closest("[data-nav],[data-action]");
  if (control) flashControl(control);
});

document.addEventListener("click", function (event) {
  const control = event.target.closest("[data-nav],[data-action]");
  if (!control) return;
  flashControl(control);
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    show(nav.dataset.nav);
    return;
  }
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) action(actionTarget.dataset.action, actionTarget);
});

render();
show("cover");
