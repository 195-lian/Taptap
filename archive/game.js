(() => {
  "use strict";

  const SAVE_KEY = "zadan_v1";
  const HAMMER_COSTS = [100, 300, 800, 2000, 5000];
  const HAMMER_CLICKS = [3, 2, 2, 1, 1, 1];
  const HAMMER_GOLD = [1, 1.2, 1.4, 1.8, 2.2, 3];
  const RUN_TIME = 90;
  const PICK_TIMEOUT = 8;
  const AD_MIN_WAIT = 1500;
  const AD_CONTINUE_SEC = 25;
  const AD_CONTINUE_MAX = 1;
  const AD_REFRESH_MAX = 1;
  const AD_FREE_HAMMER_GOLD = 30;
  const AD_FREE_HAMMER_COOLDOWN_MS = 180 * 1000;
  const AD_FREE_HAMMER_DAILY = 6;
  const FRENZY_LEFT_SEC = 20;
  const SHARD_RATE = 0.22;
  const ORB_PITY_COUNT = 3; // 本局第 N 颗宝珠必出稀有

  /** 蛋种：第1档轻长期目标 */
  const EGG_TYPES = {
    gold: {
      id: "gold",
      name: "金蛋",
      unlockShards: 0,
      extraHits: 0,
      orbRate: 0.28,
      goldMult: 1,
      stages: [
        "assets/web/icon_egg_full.webp",
        "assets/web/icon_egg_crack1.webp",
        "assets/web/icon_egg_crack2.webp",
        "assets/web/icon_egg_crack2.webp",
      ],
    },
    bronze: {
      id: "bronze",
      name: "青铜蛋",
      unlockShards: 50,
      extraHits: 1,
      orbRate: 0.36,
      goldMult: 1.35,
      stages: [
        "assets/web/icon_egg_bronze_full.webp",
        "assets/web/icon_egg_bronze_crack1.webp",
        "assets/web/icon_egg_bronze_crack2.webp",
        "assets/web/icon_egg_bronze_broken.webp",
      ],
    },
    rainbow: {
      id: "rainbow",
      name: "虹光蛋",
      unlockShards: 120,
      extraHits: 2,
      orbRate: 0.45,
      goldMult: 1.9,
      stages: [
        "assets/web/icon_egg_rainbow_full.webp",
        "assets/web/icon_egg_rainbow_crack1.webp",
        "assets/web/icon_egg_rainbow_crack2.webp",
        "assets/web/icon_egg_rainbow_broken.webp",
      ],
    },
  };
  const EGG_UNLOCK_ORDER = ["gold", "bronze", "rainbow"];
  const OFFLINE_MIN_MS = 5 * 60 * 1000;
  const OFFLINE_MAX_MS = 2 * 60 * 60 * 1000;
  const OFFLINE_GOLD_PER_MIN = 1.5;
  const BOMB_RATE = 0.1;
  const HAMMER_ITEM_RATE = 0.04;
  const THOR_RATE = 0.015;
  const BRICK_COUNT = 16;
  const BRICK_GOLD = 20;
  const RAINBOW_BRICK_EVERY = 4; // 每第 4 块为彩虹砖
  const RAINBOW_BRICK_GOLD = 50;
  const WALL_CLEAR_BONUS = 180;
  const THOR_POWER = 10;
  const VAULT_BLAST_STAGGER = 70;

  /** 局内消费 / 特殊蛋 / Boss */
  const RUN_SHOP = {
    AFFIX: 50,
    SUPER_SMASH: 80,
    AUTO_HAMMER: 120,
    FIVE_PICK: 200,
  };
  const AUTO_HAMMER_MS = 10000;
  const SPECIAL_EGG_RATE = 0.18;
  const BOSS_TRIGGER_LEFT_SEC = 45;
  const EGG_KIND = {
    NORMAL: "normal",
    BOMB: "bomb",
    CHEST: "chest",
    MAGNET: "magnet",
    BOSS: "boss",
  };

  const AFFIX_POOL = [
    {
      id: "chain",
      name: "连环砸",
      desc: "一点多砸，最多叠到 4 连",
      rarity: "c",
      max: 3,
      icon: "assets/web/icon_affix_chain.webp",
    },
    {
      id: "crit",
      name: "暴击碎裂",
      desc: "概率炸裂，金币 ×2",
      rarity: "r",
      max: 3,
      icon: "assets/web/icon_affix_crit.webp",
    },
    {
      id: "rain",
      name: "金币雨",
      desc: "碎蛋时额外天降金币",
      rarity: "r",
      max: 2,
      icon: "assets/web/icon_affix_coin_rain.webp",
    },
    {
      id: "auto",
      name: "自动锤",
      desc: "每隔一会自动砸一下",
      rarity: "c",
      max: 3,
      icon: "assets/web/icon_affix_auto.webp",
    },
    {
      id: "split",
      name: "分裂收益",
      desc: "碎蛋金币 +40%/层",
      rarity: "c",
      max: 3,
      icon: "assets/web/icon_affix_split.webp",
    },
    {
      id: "lucky",
      name: "幸运连锁",
      desc: "更容易出宝珠",
      rarity: "r",
      max: 2,
      icon: "assets/web/icon_affix_lucky.webp",
    },
    {
      id: "slowmo",
      name: "时间减缓",
      desc: "碎蛋时本局 +2 秒",
      rarity: "r",
      max: 2,
      icon: "assets/web/icon_affix_slowmo.webp",
    },
    {
      id: "rage",
      name: "狂暴节奏",
      desc: "每 10 连击发一笔横财",
      rarity: "e",
      max: 2,
      icon: "assets/web/icon_affix_rage.webp",
    },
  ];

  const AFFIX_TUNE = {
    AUTO_BASE_MS: 1400,
    AUTO_MIN_MS: 700,
    SPLIT_COIN_PER_STACK: 0.4,
    LUCKY_ORB_PER_STACK: 0.12,
    SLOWMO_SEC_PER_STACK: 2,
    SLOWMO_MAX_RATIO: 1.5,
    RAGE_COMBO_STEP: 10,
    RAGE_COIN_PER_STACK: 15,
  };

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("screen-home"),
    run: $("screen-run"),
    pick: $("screen-pick"),
    result: $("screen-result"),
    vault: $("screen-vault"),
  };

  const state = {
    gold: 0,
    shards: 0,
    hammer: 1,
    eggId: "gold",
    unlockedEggs: ["gold"],
    run: null,
    previewCracks: 0,
    pickTimer: null,
    pickLeft: 0,
    vault: { bombs: 0, hammers: 0, thors: 0, bricks: BRICK_COUNT },
    ad: {
      lastFreeHammerAt: 0,
      freeHammerCount: 0,
      freeHammerDay: "",
    },
    lastSeenAt: 0,
  };

  function getNextLockedEgg() {
    for (const id of EGG_UNLOCK_ORDER) {
      if (!state.unlockedEggs.includes(id)) return EGG_TYPES[id];
    }
    return null;
  }

  function getEggType() {
    return EGG_TYPES[state.eggId] || EGG_TYPES.gold;
  }

  function getEggStages() {
    return getEggType().stages;
  }

  /* ---------- save ---------- */
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.gold = Number(data.gold) || 0;
      state.shards = Number(data.shards) || 0;
      state.hammer = Math.max(1, Number(data.hammer) || 1);
      state.eggId = EGG_TYPES[data.eggId] ? data.eggId : "gold";
      if (Array.isArray(data.unlockedEggs) && data.unlockedEggs.length) {
        state.unlockedEggs = data.unlockedEggs.filter((id) => EGG_TYPES[id]);
        if (!state.unlockedEggs.includes("gold")) state.unlockedEggs.unshift("gold");
      }
      if (state.shards >= EGG_TYPES.bronze.unlockShards && !state.unlockedEggs.includes("bronze")) {
        // 旧存档：碎片够则视为可解锁，但需点解锁按钮；不自动塞入
      }
      if (data.vault) {
        state.vault.bombs = Math.max(0, Number(data.vault.bombs) || 0);
        state.vault.hammers = Math.max(0, Number(data.vault.hammers) || 0);
        state.vault.thors = Math.max(0, Number(data.vault.thors) || 0);
        state.vault.bricks = Math.max(
          0,
          Math.min(BRICK_COUNT, Number(data.vault.bricks) || BRICK_COUNT)
        );
      }
      if (data.ad && typeof data.ad === "object") {
        state.ad.lastFreeHammerAt = Number(data.ad.lastFreeHammerAt) || 0;
        state.ad.freeHammerCount = Number(data.ad.freeHammerCount) || 0;
        state.ad.freeHammerDay = String(data.ad.freeHammerDay || "");
      }
      state.lastSeenAt = Number(data.lastSeenAt) || 0;
    } catch (_) {
      /* ignore */
    }
  }

  function grantOfflineReward() {
    const now = Date.now();
    const prev = state.lastSeenAt;
    state.lastSeenAt = now;
    if (!prev) {
      save();
      return;
    }
    const away = now - prev;
    if (away < OFFLINE_MIN_MS) {
      save();
      return;
    }
    const capped = Math.min(away, OFFLINE_MAX_MS);
    const gain = Math.floor((capped / 60000) * OFFLINE_GOLD_PER_MIN);
    if (gain <= 0) {
      save();
      return;
    }
    state.gold += gain;
    save();
    toast("离线收益 +" + gain + " 金币");
  }

  function save() {
    try {
      state.lastSeenAt = Date.now();
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          gold: state.gold,
          shards: state.shards,
          hammer: state.hammer,
          eggId: state.eggId,
          unlockedEggs: state.unlockedEggs,
          vault: state.vault,
          ad: state.ad,
          lastSeenAt: state.lastSeenAt,
        })
      );
    } catch (_) {
      /* ignore */
    }
  }

  /* ---------- audio / haptics ---------- */
  let audioCtx = null;
  function beep(freq, dur, type, gain) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.value = gain || 0.04;
      o.connect(g);
      g.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
      o.stop(t + (dur || 0.08) + 0.02);
    } catch (_) {
      /* ignore */
    }
  }

  function sfx(kind, pitch) {
    if (kind === "hit") {
      const base = 200 + Math.min(40, pitch || 0) * 6;
      beep(base, 0.045, "square", 0.04);
    } else if (kind === "break") {
      beep(180, 0.08, "triangle", 0.05);
      beep(90, 0.12, "sine", 0.04);
    } else if (kind === "crit") {
      beep(520, 0.06, "square", 0.05);
      beep(120, 0.14, "sawtooth", 0.04);
    } else if (kind === "coin") beep(880, 0.05, "sine", 0.03);
    else if (kind === "orb") {
      beep(660, 0.08, "sine", 0.04);
      setTimeout(() => beep(880, 0.1, "sine", 0.04), 80);
    } else if (kind === "pick") beep(520, 0.07, "triangle", 0.04);
    else if (kind === "upgrade") {
      beep(440, 0.08, "triangle", 0.04);
      setTimeout(() => beep(660, 0.1, "triangle", 0.04), 90);
    } else if (kind === "blast") {
      beep(80, 0.2, "sawtooth", 0.06);
      beep(160, 0.12, "triangle", 0.05);
    }
  }

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  /* ---------- ui helpers ---------- */
  function show(name) {
    Object.entries(screens).forEach(([k, el]) => {
      el.classList.toggle("active", k === name);
    });
  }

  function toast(msg, ms = 1600) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
    }, ms);
  }

  function fmt(n) {
    return Math.floor(n).toLocaleString("en-US");
  }

  function shake(hard) {
    const app = $("app");
    const cls = hard ? "shake-hard" : "shake";
    app.classList.remove("shake", "shake-hard");
    void app.offsetWidth;
    app.classList.add(cls);
  }

  function flash() {
    const app = $("app");
    app.classList.remove("flash");
    void app.offsetWidth;
    app.classList.add("flash");
    setTimeout(() => app.classList.remove("flash"), 180);
  }

  function punchGold() {
    const el = $("run-gold");
    if (!el) return;
    el.classList.remove("gold-punch");
    void el.offsetWidth;
    el.classList.add("gold-punch");
  }

  function stageRing() {
    const stage = $("stage");
    const ring = document.createElement("div");
    ring.className = "stage-ring";
    stage.appendChild(ring);
    setTimeout(() => ring.remove(), 400);
  }

  function setComboHot(on) {
    const chip = $("run-combo");
    if (!chip) return;
    chip.classList.toggle("combo-hot", !!on);
  }

  function spawnParticle(kind, xPct, yPct, dx, dy, rot, dur, anim) {
    const layer = $("float-layer");
    const el = document.createElement("div");
    el.className = "particle " + kind;
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";
    el.style.setProperty("--dx", dx + "px");
    el.style.setProperty("--dy", dy + "px");
    el.style.setProperty("--rot", rot + "deg");
    el.style.animation = anim + " " + dur + "ms ease-out forwards";
    layer.appendChild(el);
    setTimeout(() => el.remove(), dur + 40);
  }

  function burstAtBreak(isCrit) {
    const cx = 42 + Math.random() * 16;
    const cy = 38 + Math.random() * 12;
    const shells = isCrit ? 10 : 6;
    const coins = isCrit ? 8 : 4;
    const sparks = isCrit ? 6 : 3;
    for (let i = 0; i < shells; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * (isCrit ? 90 : 55);
      spawnParticle(
        "shell",
        cx,
        cy,
        Math.cos(ang) * dist,
        Math.sin(ang) * dist - 20,
        Math.random() * 360,
        500 + Math.random() * 200,
        "fly-shell"
      );
    }
    for (let i = 0; i < coins; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const dist = 50 + Math.random() * 70;
      spawnParticle(
        "coin-p",
        cx,
        cy,
        Math.cos(ang) * dist,
        Math.sin(ang) * dist,
        0,
        550 + Math.random() * 200,
        "fly-coin-up"
      );
    }
    for (let i = 0; i < sparks; i++) {
      spawnParticle(
        "spark",
        cx + (Math.random() - 0.5) * 10,
        cy + (Math.random() - 0.5) * 10,
        0,
        0,
        0,
        280 + Math.random() * 120,
        "spark-pop"
      );
    }
  }

  function floatText(text, cls) {
    const layer = $("float-layer");
    const el = document.createElement("div");
    el.className = "float-num " + (cls || "");
    el.textContent = text;
    el.style.left = 18 + Math.random() * 64 + "%";
    el.style.top = 28 + Math.random() * 34 + "%";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  /* ---------- home ---------- */
  function hammerIndex() {
    return Math.min(state.hammer - 1, HAMMER_CLICKS.length - 1);
  }

  function eggMaxHits() {
    const base = HAMMER_CLICKS[hammerIndex()] + getEggType().extraHits;
    const kind = state.run && state.run.eggKind;
    if (kind === EGG_KIND.CHEST) return 1;
    if (kind === EGG_KIND.BOSS) return Math.max(8, base * 3);
    if (kind === EGG_KIND.BOMB) return Math.max(2, base);
    return base;
  }

  function vaultGoods() {
    return state.vault.bombs + state.vault.hammers + state.vault.thors;
  }

  function vaultPower() {
    return (
      state.vault.bombs * 3 +
      state.vault.hammers * 6 +
      state.vault.thors * THOR_POWER
    );
  }

  function brickGoldAt(index) {
    // index 0-based among alive wall positions
    return (index + 1) % RAINBOW_BRICK_EVERY === 0
      ? RAINBOW_BRICK_GOLD
      : BRICK_GOLD;
  }

  function refreshHome() {
    $("home-gold").textContent = fmt(state.gold);
    $("home-shard").textContent = fmt(state.shards);
    const cost = HAMMER_COSTS[state.hammer - 1];
    const label = $("upgrade-label");
    const btn = $("btn-upgrade");
    if (cost == null) {
      label.textContent = "锤子 Lv" + state.hammer + " · 已满级";
      btn.disabled = true;
    } else {
      label.textContent = "锤子 Lv" + state.hammer + " · 升级 " + cost;
      btn.disabled = state.gold < cost;
    }

    const nextEgg = getNextLockedEgg();
    const unlockLabel = $("unlock-label");
    const unlockBtn = $("btn-unlock-egg");
    const switchBtn = $("btn-switch-egg");

    if (!nextEgg) {
      unlockLabel.textContent = "蛋种 · " + getEggType().name;
      $("unlock-text").textContent = "全部解锁";
      $("unlock-bar").style.width = "100%";
      if (unlockBtn) unlockBtn.hidden = true;
      if (switchBtn) switchBtn.hidden = state.unlockedEggs.length < 2;
    } else {
      const need = nextEgg.unlockShards;
      const p = Math.min(100, (state.shards / need) * 100);
      $("unlock-bar").style.width = p + "%";
      unlockLabel.textContent = "解锁" + nextEgg.name;
      $("unlock-text").textContent =
        "当前" +
        getEggType().name +
        " · " +
        Math.min(state.shards, need) +
        "/" +
        need;
      if (unlockBtn) {
        unlockBtn.hidden = false;
        unlockBtn.disabled = state.shards < need;
        unlockBtn.textContent =
          state.shards >= need ? "解锁" + nextEgg.name : "碎片不足";
      }
      if (switchBtn) switchBtn.hidden = state.unlockedEggs.length < 2;
    }

    const stages = getEggStages();
    $("home-egg").src = stages[0];

    const goods = vaultGoods();
    $("vault-badge").textContent = String(goods);
    $("btn-vault").style.opacity = goods > 0 || state.vault.bricks > 0 ? "1" : "0.55";
    refreshFreeHammerBtn();
  }

  /* ---------- run ---------- */
  function affixStack(id) {
    const r = state.run;
    if (!r) return 0;
    const a = r.affixes.find((x) => x.id === id);
    return a ? a.stacks : 0;
  }

  function eggImage(hitsLeft, max) {
    const used = max - hitsLeft;
    const idx = Math.max(0, Math.min(used, getEggStages().length - 1));
    return getEggStages()[idx];
  }

  function refreshRunHud() {
    const r = state.run;
    if (!r) return;
    $("run-gold").textContent = fmt(state.gold + r.coins);
    $("run-combo").textContent = "连击 ×" + r.combo;
    $("run-timer").textContent = Math.ceil(Math.max(0, r.left)) + "s";
    $("run-bar").style.width = Math.max(0, (r.left / r.duration) * 100) + "%";
    $("run-hint").textContent =
      "全屏可点 · 本蛋还需 " + Math.max(0, r.hitsLeft) + " 击";
    const special = eggImageForKind(r.eggKind);
    if (special) {
      $("run-egg").src = special;
    } else {
      $("run-egg").src = eggImage(r.hitsLeft, r.maxHits);
    }
    const isFrenzy = r.left <= FRENZY_LEFT_SEC;
    $("screen-run").classList.toggle("frenzy", isFrenzy);
    const kindEl = $("egg-kind");
    if (kindEl) {
      const map = {
        [EGG_KIND.BOSS]: "巨蛋 Boss！砸碎拿大奖",
        [EGG_KIND.BOMB]: "炸弹蛋 · 碎时额外爆金",
        [EGG_KIND.CHEST]: "宝箱蛋 · 1 下必掉炸物",
        [EGG_KIND.MAGNET]: "磁铁蛋 · 掉落更肥",
      };
      const t = map[r.eggKind];
      if (t) {
        kindEl.hidden = false;
        kindEl.textContent = t;
        kindEl.className = "egg-kind " + r.eggKind;
      } else {
        kindEl.hidden = true;
      }
    }
    refreshRunShop();
  }

  function refreshRunShop() {
    const r = state.run;
    if (!r) return;
    const total = r.coins + state.gold;
    ["shop-affix", "shop-smash", "shop-auto", "shop-five"].forEach((id) => {
      const btn = $(id);
      if (!btn) return;
      const cost = Number(btn.dataset.cost) || 0;
      btn.disabled = r.paused || r.ended || total < cost;
    });
  }

  function spendRunGold(cost) {
    const r = state.run;
    if (!r) return false;
    if (r.coins + state.gold < cost) return false;
    let left = cost;
    const fromRun = Math.min(r.coins, left);
    r.coins -= fromRun;
    left -= fromRun;
    if (left > 0) state.gold -= left;
    refreshRunHud();
    return true;
  }

  function renderAffixes() {
    const list = $("affix-list");
    list.innerHTML = "";
    const r = state.run;
    if (!r) return;
    r.affixes.forEach((a) => {
      const def = AFFIX_POOL.find((x) => x.id === a.id);
      if (!def) return;
      const slot = document.createElement("div");
      slot.className =
        "slot" +
        (def.rarity === "r" ? " crit" : def.rarity === "e" ? " epic" : " gold");
      slot.innerHTML =
        '<img src="' + def.icon + '" alt=""/><span class="n">' + a.stacks + "</span>";
      list.appendChild(slot);
    });
  }

  function rollEggKind() {
    if (Math.random() >= SPECIAL_EGG_RATE) return EGG_KIND.NORMAL;
    const roll = Math.random();
    if (roll < 0.4) return EGG_KIND.BOMB;
    if (roll < 0.7) return EGG_KIND.MAGNET;
    return EGG_KIND.CHEST;
  }

  function eggImageForKind(kind) {
    if (kind === EGG_KIND.BOMB) return "assets/web/icon_bomb_thor.webp";
    if (kind === EGG_KIND.CHEST) return "assets/web/icon_vault_chest_open.webp";
    if (kind === EGG_KIND.MAGNET) return "assets/web/icon_coin.webp";
    if (kind === EGG_KIND.BOSS) return "assets/web/icon_egg_bronze_full.webp";
    return null;
  }

  function newEgg(forceKind) {
    const r = state.run;
    if (!r) return;
    setComboHot(false);
    r.eggKind = forceKind || rollEggKind();
    r.maxHits = eggMaxHits();
    r.hitsLeft = r.maxHits;
    const egg = $("run-egg");
    egg.classList.remove("broken");
    const special = eggImageForKind(r.eggKind);
    egg.src = special || getEggStages()[0];
    if (r.eggKind === EGG_KIND.BOSS) {
      egg.classList.add("is-boss");
      shake(true);
      sfx("orb");
      toast("巨蛋 Boss 出现！");
    } else {
      egg.classList.remove("is-boss");
    }
    refreshRunHud();
  }

  function addAffix(id) {
    const r = state.run;
    const def = AFFIX_POOL.find((x) => x.id === id);
    if (!r || !def) return;
    let a = r.affixes.find((x) => x.id === id);
    if (!a) {
      a = { id: id, stacks: 0 };
      r.affixes.push(a);
    }
    a.stacks = Math.min(def.max, a.stacks + 1);
    renderAffixes();
  }

  function maybeDropVaultItem(r) {
    const roll = Math.random();
    if (roll < THOR_RATE) {
      state.vault.thors += 1;
      floatText("雷神蛋!", "crit");
      toast("砸出【雷神蛋】→ 金库");
      save();
      return;
    }
    if (roll < THOR_RATE + HAMMER_ITEM_RATE) {
      state.vault.hammers += 1;
      floatText("黄金锤!", "crit");
      toast("砸出【黄金锤】→ 金库");
      save();
      return;
    }
    if (roll < THOR_RATE + HAMMER_ITEM_RATE + BOMB_RATE) {
      state.vault.bombs += 1;
      floatText("小爆弹!", "coin");
      toast("砸出【小爆弹】→ 金库");
      save();
    }
  }

  function breakEgg() {
    const r = state.run;
    if (!r) return;
    r.eggs += 1;
    const kind = r.eggKind || EGG_KIND.NORMAL;
    let coin = Math.round(
      5 * HAMMER_GOLD[hammerIndex()] * getEggType().goldMult
    );
    if (kind === EGG_KIND.BOMB) coin = Math.round(coin * 2.2);
    if (kind === EGG_KIND.MAGNET) coin = Math.round(coin * 1.8);
    if (kind === EGG_KIND.CHEST) coin = Math.round(coin * 1.5);
    if (kind === EGG_KIND.BOSS) coin = Math.round(coin * 8 + 40);
    const rain = affixStack("rain");
    if (rain > 0) coin += 5 * rain;
    const split = affixStack("split");
    if (split > 0) coin = Math.round(coin * (1 + AFFIX_TUNE.SPLIT_COIN_PER_STACK * split));

    const critRate = 0.05 + 0.15 * affixStack("crit");
    const isCrit = Math.random() < critRate;
    if (isCrit || kind === EGG_KIND.BOSS) {
      if (isCrit) coin *= 2;
      floatText(kind === EGG_KIND.BOSS ? "Boss!" : "暴击!", "crit");
      shake(true);
      flash();
      burstAtBreak(true);
      sfx("crit");
      vibrate(40);
    } else {
      shake(kind === EGG_KIND.BOMB);
      burstAtBreak(kind === EGG_KIND.BOMB);
      sfx("break");
      vibrate(18);
    }

    // 狂暴：每 N 连击横财
    const rage = affixStack("rage");
    if (rage > 0 && r.combo > 0 && r.combo % AFFIX_TUNE.RAGE_COMBO_STEP === 0) {
      const bonus = AFFIX_TUNE.RAGE_COIN_PER_STACK * rage;
      coin += bonus;
      floatText("狂暴 +" + bonus, "crit");
      sfx("crit");
    }

    r.coins += coin;
    floatText("+" + coin, isCrit ? "crit" : "coin");
    sfx("coin");
    punchGold();
    refreshRunHud();

    // 时间减缓
    const slow = affixStack("slowmo");
    if (slow > 0) {
      const add = AFFIX_TUNE.SLOWMO_SEC_PER_STACK * slow;
      const cap = r.duration * AFFIX_TUNE.SLOWMO_MAX_RATIO;
      r.left = Math.min(cap, r.left + add);
      floatText("+" + add + "s", "coin");
    }

    if (Math.random() < SHARD_RATE) {
      r.shards += 1;
      floatText("+1 碎片", "");
    }

    if (kind === EGG_KIND.CHEST || kind === EGG_KIND.BOSS) {
      // 必掉炸物
      if (kind === EGG_KIND.BOSS && Math.random() < 0.5) {
        state.vault.thors += 1;
        toast("Boss 掉出【雷神蛋】");
      } else if (Math.random() < 0.5) {
        state.vault.hammers += 1;
        toast("掉出【黄金锤】→ 金库");
      } else {
        state.vault.bombs += 1;
        toast("掉出【小爆弹】→ 金库");
      }
      save();
    } else {
      maybeDropVaultItem(r);
    }

    if (r.left > 8) {
      const orbRate =
        getEggType().orbRate + AFFIX_TUNE.LUCKY_ORB_PER_STACK * affixStack("lucky");
      const forcedPity = r.orbCount + 1 >= ORB_PITY_COUNT;
      if (forcedPity || Math.random() < orbRate) {
        r.orbCount += 1;
        sfx("orb");
        openPick(forcedPity);
        return;
      }
    }

    newEgg();
  }

  function doHit() {
    const r = state.run;
    if (!r || r.paused || r.ended) return;

    const chain = 1 + affixStack("chain");
    r.combo += 1;
    sfx("hit", r.combo);
    vibrate(8);
    setComboHot(r.combo >= 8);
    stageRing();

    const egg = $("run-egg");
    egg.classList.add("hit", "crack-flash");
    setTimeout(() => egg.classList.remove("hit", "crack-flash"), 100);

    for (let i = 0; i < chain; i++) {
      if (!state.run || state.run.paused) break;
      r.hitsLeft -= 1;
      if (r.hitsLeft <= 0) {
        egg.classList.add("broken", "break-pop");
        setTimeout(() => egg.classList.remove("break-pop"), 320);
        breakEgg();
        break;
      }
    }
    refreshRunHud();
  }

  function clearPickTimer() {
    if (state.pickTimer) {
      clearInterval(state.pickTimer);
      state.pickTimer = null;
    }
  }

  function choosePick(def) {
    const r = state.run;
    if (!r) return;
    clearPickTimer();
    sfx("pick");
    if (def.id === "_gold") {
      r.coins += 20;
      floatText("+20", "coin");
      refreshRunHud();
    } else {
      addAffix(def.id);
      toast("获得【" + def.name + "】");
    }
    r.paused = false;
    newEgg();
    show("run");
  }

  function openPick(forceRare) {
    const r = state.run;
    if (!r) return;
    r.paused = true;

    const pool = AFFIX_POOL.filter((a) => {
      const cur = r.affixes.find((x) => x.id === a.id);
      return !cur || cur.stacks < a.max;
    });
    const bag = pool.slice();
    const picks = [];
    const want = r.fivePick ? 5 : 3;
    r.fivePick = false;
    while (picks.length < want && bag.length) {
      picks.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
    // 软保底：本局第 3 颗必出稀有（至少一张稀有）
    if (forceRare && picks.length && !picks.some((p) => p.rarity === "r" || p.rarity === "e")) {
      const rarePool = pool.filter((p) => p.rarity === "r" || p.rarity === "e");
      if (rarePool.length) {
        const rare = rarePool[Math.floor(Math.random() * rarePool.length)];
        picks[Math.floor(Math.random() * picks.length)] = rare;
      }
    }
    while (picks.length < want) {
      picks.push({
        id: "_gold",
        name: "金币包",
        desc: "立即获得 20 金币",
        rarity: "c",
        max: 99,
        icon: "assets/web/icon_coin.webp",
      });
    }

    const box = $("pick-cards");
    box.innerHTML = "";
    picks.forEach((def) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "pcard" + (def.rarity === "r" || def.rarity === "e" ? " rare" : "");
      btn.innerHTML =
        '<img src="' +
        def.icon +
        '" alt=""/><div class="txt"><b>' +
        def.name +
        '<span class="tag ' +
        def.rarity +
        '">' +
        (def.rarity === "e" ? "史诗" : def.rarity === "r" ? "稀有" : "普通") +
        "</span></b><i>" +
        def.desc +
        "</i></div>";
      btn.addEventListener("click", () => choosePick(def));
      box.appendChild(btn);
    });

    state.pickLeft = PICK_TIMEOUT;
    state._pickPicks = picks;
    state._pickForceRare = !!forceRare;
    const refreshBtn = $("btn-pick-refresh");
    if (refreshBtn) {
      const can =
        state.run && state.run.pickRefreshUsed < AD_REFRESH_MAX;
      refreshBtn.hidden = false;
      refreshBtn.disabled = !can;
      refreshBtn.textContent = can ? "换一批 · 看广告" : "本宝珠已换过";
    }
    $("pick-countdown").textContent = state.pickLeft + " 秒不选将默认中间";
    clearPickTimer();
    state.pickTimer = setInterval(() => {
      state.pickLeft -= 1;
      if (state.pickLeft <= 0) {
        clearPickTimer();
        choosePick(picks[1]);
        return;
      }
      $("pick-countdown").textContent = state.pickLeft + " 秒不选将默认中间";
    }, 1000);

    show("pick");
  }

  function watchAd(type) {
    return new Promise((resolve) => {
      toast(type === "refresh" ? "播放中…（演示）" : "播放激励视频…（演示）");
      setTimeout(() => resolve(true), AD_MIN_WAIT);
    });
  }

  async function refreshPickAd() {
    const r = state.run;
    if (!r || !r.paused) return;
    if (r.pickRefreshUsed >= AD_REFRESH_MAX) {
      toast("本宝珠只能换 1 次");
      return;
    }
    clearPickTimer();
    const ok = await watchAd("refresh");
    if (!ok) {
      toast("广告未完成");
      return;
    }
    r.pickRefreshUsed += 1;
    const forceRare = state._pickForceRare;
    // rebuild options without bumping orbCount
    const pool = AFFIX_POOL.filter((a) => {
      const cur = r.affixes.find((x) => x.id === a.id);
      return !cur || cur.stacks < a.max;
    });
    const bag = pool.slice();
    const picks = [];
    while (picks.length < 3 && bag.length) {
      picks.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
    if (
      forceRare &&
      picks.length &&
      !picks.some((p) => p.rarity === "r" || p.rarity === "e")
    ) {
      const rarePool = pool.filter((p) => p.rarity === "r" || p.rarity === "e");
      if (rarePool.length) {
        picks[Math.floor(Math.random() * picks.length)] =
          rarePool[Math.floor(Math.random() * rarePool.length)];
      }
    }
    while (picks.length < 3) {
      picks.push({
        id: "_gold",
        name: "金币包",
        desc: "立即获得 20 金币",
        rarity: "c",
        max: 99,
        icon: "assets/web/icon_coin.webp",
      });
    }
    // re-render by calling openPick-like UI only
    const box = $("pick-cards");
    box.innerHTML = "";
    picks.forEach((def) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "pcard" + (def.rarity === "r" || def.rarity === "e" ? " rare" : "");
      btn.innerHTML =
        '<img src="' +
        def.icon +
        '" alt=""/><div class="txt"><b>' +
        def.name +
        '<span class="tag ' +
        def.rarity +
        '">' +
        (def.rarity === "e" ? "史诗" : def.rarity === "r" ? "稀有" : "普通") +
        "</span></b><i>" +
        def.desc +
        "</i></div>";
      btn.addEventListener("click", () => choosePick(def));
      box.appendChild(btn);
    });
    state._pickPicks = picks;
    state.pickLeft = PICK_TIMEOUT;
    const refreshBtn = $("btn-pick-refresh");
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "本宝珠已换过";
    }
    clearPickTimer();
    state.pickTimer = setInterval(() => {
      state.pickLeft -= 1;
      if (state.pickLeft <= 0) {
        clearPickTimer();
        choosePick(picks[1]);
        return;
      }
      $("pick-countdown").textContent = state.pickLeft + " 秒不选将默认中间";
    }, 1000);
    $("pick-countdown").textContent = state.pickLeft + " 秒不选将默认中间";
    toast("已换一批词条");
  }

  async function continueRunAd() {
    const r = state.run;
    if (!r || !r.ended || r.settled) return;
    if (r.hasContinued) {
      toast("本局已续过");
      return;
    }
    const btn = $("btn-continue");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "播放中…";
    }
    const ok = await watchAd("continue");
    if (!ok) {
      toast("广告未完成，可直接结算");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "续局 +25s · 看广告";
      }
      return;
    }
    r.hasContinued = true;
    r.ended = false;
    r.paused = false;
    r.left = Math.max(0, r.left) + AD_CONTINUE_SEC;
    r.duration = Math.max(r.duration, r.left);
    refreshRunHud();
    show("run");
    toast("续局成功 · 词条保留 +25s");
    if (btn) btn.hidden = true;
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function freeHammerCooldownLeftMs() {
    return Math.max(0, state.ad.lastFreeHammerAt + AD_FREE_HAMMER_COOLDOWN_MS - Date.now());
  }

  function refreshFreeHammerBtn() {
    const btn = $("btn-free-hammer");
    if (!btn) return;
    const label = $("free-hammer-label") || btn.querySelector("span");
    if (state.ad.freeHammerDay !== todayKey()) {
      state.ad.freeHammerDay = todayKey();
      state.ad.freeHammerCount = 0;
    }
    const cd = freeHammerCooldownLeftMs();
    const overDaily = state.ad.freeHammerCount >= AD_FREE_HAMMER_DAILY;
    if (overDaily) {
      btn.disabled = true;
      if (label) label.textContent = "今日已领完";
      return;
    }
    if (cd > 0) {
      btn.disabled = true;
      const s = Math.ceil(cd / 1000);
      if (label) label.textContent = "金锤冷却 " + s + "s";
      return;
    }
    btn.disabled = false;
    if (label) label.textContent = "免费金锤 +" + AD_FREE_HAMMER_GOLD + " · 看广告";
  }

  async function freeHammerAd() {
    if (state.ad.freeHammerDay !== todayKey()) {
      state.ad.freeHammerDay = todayKey();
      state.ad.freeHammerCount = 0;
    }
    if (freeHammerCooldownLeftMs() > 0) {
      toast("金锤冷却中");
      return;
    }
    if (state.ad.freeHammerCount >= AD_FREE_HAMMER_DAILY) {
      toast("今日已领完");
      return;
    }
    const btn = $("btn-free-hammer");
    if (btn) {
      btn.disabled = true;
      const label = $("free-hammer-label") || btn.querySelector("span");
      if (label) label.textContent = "播放中…";
    }
    const ok = await watchAd("free");
    if (!ok) {
      toast("广告未完成");
      refreshFreeHammerBtn();
      return;
    }
    state.gold += AD_FREE_HAMMER_GOLD;
    state.ad.freeHammerCount += 1;
    state.ad.lastFreeHammerAt = Date.now();
    save();
    refreshHome();
    toast("金锤奖励 +" + AD_FREE_HAMMER_GOLD);
  }

  function startRun() {
    state.run = {
      duration: RUN_TIME,
      left: RUN_TIME,
      coins: 0,
      shards: 0,
      eggs: 0,
      combo: 0,
      orbCount: 0,
      autoAcc: 0,
      eggKind: EGG_KIND.NORMAL,
      bossSpawned: false,
      fivePick: false,
      autoHammerMs: 0,
      affixes: [],
      maxHits: eggMaxHits(),
      hitsLeft: eggMaxHits(),
      paused: false,
      ended: false,
      settled: false,
      doubled: false,
      hasContinued: false,
      pickRefreshUsed: 0,
    };
    renderAffixes();
    newEgg();
    refreshRunHud();
    show("run");
  }

  function endRun() {
    const r = state.run;
    if (!r || r.ended) return;
    r.ended = true;
    r.paused = true;
    clearPickTimer();
    $("screen-run").classList.remove("frenzy");
    $("result-coins").textContent = "+" + fmt(r.coins);
    $("result-shards").textContent = fmt(r.shards);
    $("result-eggs").textContent = fmt(r.eggs);
    $("btn-double").disabled = true;
    $("btn-double").textContent = "×2 看视频";
    $("ad-hint").textContent = "完整看完才发奖 · 约 15–30 秒";
    const cont = $("btn-continue");
    if (cont) {
      const can = !r.hasContinued;
      cont.hidden = !can;
      cont.disabled = !can;
      cont.textContent = can ? "续局 +25s · 看广告" : "本局已续过";
    }
    show("result");
    setTimeout(() => {
      if (state.run && state.run.ended && !state.run.doubled) {
        $("btn-double").disabled = false;
      }
    }, 1500);
  }

  function settle(double) {
    const r = state.run;
    if (!r || r.settled) return;
    r.settled = true;
    const gain = Math.floor(r.coins * (double ? 2 : 1));
    state.gold += gain;
    state.shards += r.shards;
    save();
    state.run = null;
    refreshHome();
    show("home");
    toast("已入账 " + fmt(gain) + " 金币");
  }

  function tick() {
    const r = state.run;
    if (!r || r.paused || r.ended) return;
    r.left -= 0.1;
    if (r.left <= 0) {
      endRun();
      return;
    }

    // 中段 Boss
    if (!r.bossSpawned && r.left <= BOSS_TRIGGER_LEFT_SEC) {
      r.bossSpawned = true;
      newEgg(EGG_KIND.BOSS);
    }

    // 自动锤
    if (r.autoHammerMs > 0) {
      r.autoHammerMs -= 100;
      r.autoAcc = (r.autoAcc || 0) + 100;
      if (r.autoAcc >= 450) {
        r.autoAcc = 0;
        doHit();
      }
    } else {
      const auto = affixStack("auto");
      if (auto > 0) {
        r.autoAcc = (r.autoAcc || 0) + 100;
        const interval = Math.max(
          AFFIX_TUNE.AUTO_MIN_MS,
          AFFIX_TUNE.AUTO_BASE_MS - (auto - 1) * 250
        );
        if (r.autoAcc >= interval) {
          r.autoAcc = 0;
          doHit();
        }
      }
    }

    refreshRunHud();
  }

  /* ---------- vault ---------- */
  function refreshVaultHud() {
    $("bomb-count").textContent = state.vault.bombs;
    $("hammer-item-count").textContent = state.vault.hammers;
    $("thor-count").textContent = state.vault.thors;
    const power = vaultPower();
    const alive = state.vault.bricks;
    const canHit = Math.min(power, alive);
    let est = 0;
    for (let i = 0; i < canHit; i++) est += brickGoldAt(i);
    const willClear = canHit >= alive && alive > 0;
    if (willClear) est += WALL_CLEAR_BONUS;
    $("vault-est").textContent =
      power > 0
        ? "本轮预估 ≈ +" +
          est +
          " 金币" +
          (willClear ? " · 含清墙大奖" : "")
        : "没有炸物，去砸蛋攒一点";
    $("btn-blast").disabled = power <= 0;
  }

  function buildVaultWall() {
    const wall = $("vault-wall");
    wall.innerHTML = "";
    for (let i = 0; i < BRICK_COUNT; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "brick";
      const alive = i < state.vault.bricks;
      btn.dataset.alive = alive ? "1" : "0";
      btn.dataset.gold = String(brickGoldAt(i));
      const isRainbow = (i + 1) % RAINBOW_BRICK_EVERY === 0;
      const src = isRainbow
        ? "assets/web/icon_brick_rainbow.webp"
        : "assets/web/icon_brick_gold.webp";
      btn.innerHTML = '<img src="' + src + '" alt=""/>';
      if (!alive) btn.querySelector("img").style.opacity = "0";
      wall.appendChild(btn);
    }
  }

  function openVault() {
    buildVaultWall();
    refreshVaultHud();
    show("vault");
  }

  function blast() {
    const power = vaultPower();
    if (power <= 0) {
      toast("没有炸物，先去砸蛋");
      return;
    }
    const aliveBtns = Array.prototype.slice
      .call($("vault-wall").querySelectorAll(".brick"))
      .filter((b) => b.dataset.alive === "1")
      .sort(() => Math.random() - 0.5);
    const bricks = aliveBtns.slice(0, power);

    if (!bricks.length) {
      toast("金砖已清空");
      return;
    }

    sfx("blast");
    shake(true);
    flash();
    vibrate(50);

    let hit = 0;
    let gain = 0;
    bricks.forEach((btn, i) => {
      setTimeout(() => {
        btn.classList.add("boom");
        btn.dataset.alive = "0";
        gain += Number(btn.dataset.gold) || BRICK_GOLD;
        hit += 1;
        if (hit === bricks.length) {
          let clearedWall = hit >= aliveBtns.length;
          if (clearedWall) gain += WALL_CLEAR_BONUS;
          state.gold += gain;
          state.vault.bricks = Math.max(0, state.vault.bricks - hit);
          state.vault.bombs = 0;
          state.vault.hammers = 0;
          state.vault.thors = 0;
          if (state.vault.bricks <= 0) {
            clearedWall = true;
            state.vault.bricks = BRICK_COUNT;
          }
          save();
          if (clearedWall) {
            toast("清墙大奖 +" + WALL_CLEAR_BONUS + " · 开出宝箱！");
          } else {
            toast("引爆 +" + gain + " 金币");
          }
          refreshHome();
          buildVaultWall();
          refreshVaultHud();
        }
      }, i * VAULT_BLAST_STAGGER);
    });
  }

  /* ---------- events ---------- */
  $("btn-start").addEventListener("click", startRun);
  $("btn-pick-refresh")?.addEventListener("click", () => {
    refreshPickAd();
  });
  $("btn-continue")?.addEventListener("click", () => {
    continueRunAd();
  });
  $("btn-free-hammer")?.addEventListener("click", () => {
    freeHammerAd();
  });

  $("home-hero").addEventListener("click", () => {
    const img = $("home-egg");
    const stages = getEggStages();
    state.previewCracks = (state.previewCracks + 1) % stages.length;
    img.src = stages[state.previewCracks];
    img.classList.add("hit");
    setTimeout(() => img.classList.remove("hit"), 90);
    sfx("hit");
  });

  $("btn-unlock-egg")?.addEventListener("click", () => {
    const next = getNextLockedEgg();
    if (!next) {
      toast("蛋种已全部解锁");
      return;
    }
    if (state.shards < next.unlockShards) {
      toast("碎片不足 " + next.unlockShards);
      return;
    }
    state.unlockedEggs.push(next.id);
    state.eggId = next.id;
    state.previewCracks = 0;
    save();
    refreshHome();
    sfx("upgrade");
    toast("已解锁并使用【" + next.name + "】");
  });

  $("btn-switch-egg")?.addEventListener("click", () => {
    if (state.unlockedEggs.length < 2) return;
    const order = state.unlockedEggs.filter((id) => EGG_TYPES[id]);
    const idx = order.indexOf(state.eggId);
    state.eggId = order[(idx + 1) % order.length];
    state.previewCracks = 0;
    save();
    refreshHome();
    toast("切换为 " + getEggType().name);
  });

  $("btn-upgrade").addEventListener("click", () => {
    const cost = HAMMER_COSTS[state.hammer - 1];
    if (cost == null) return;
    if (state.gold < cost) {
      toast("金币不够，先去砸几局");
      return;
    }
    state.gold -= cost;
    state.hammer += 1;
    save();
    refreshHome();
    sfx("upgrade");
    toast("锤子升到 Lv" + state.hammer + " · 砸得更快");
  });

  $("btn-vault").addEventListener("click", openVault);
  $("btn-vault-back").addEventListener("click", () => {
    refreshHome();
    show("home");
  });
  $("btn-blast").addEventListener("click", blast);

  $("stage").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    doHit();
  });

  $("btn-end").addEventListener("click", endRun);

  $("btn-double").addEventListener("click", () => {
    const r = state.run;
    if (!r || r.doubled || r.settled) return;
    $("btn-double").disabled = true;
    $("btn-double").textContent = "播放中…";
    $("ad-hint").textContent = "正在播放激励视频…";
    setTimeout(() => {
      if (!state.run || state.run.settled) return;
      r.doubled = true;
      $("ad-hint").textContent = "已看完，奖励 ×2";
      settle(true);
    }, AD_MIN_WAIT);
  });

  $("btn-collect").addEventListener("click", () => settle(false));

  // 局内消费
  $("shop-affix")?.addEventListener("click", () => {
    const r = state.run;
    if (!r || r.paused || r.ended) return;
    const avail = AFFIX_POOL.filter((a) => {
      const cur = r.affixes.find((x) => x.id === a.id);
      return !cur || cur.stacks < a.max;
    });
    if (!avail.length) {
      toast("词条已满");
      return;
    }
    if (!spendRunGold(RUN_SHOP.AFFIX)) {
      toast("金币不够 " + RUN_SHOP.AFFIX);
      return;
    }
    const def = avail[Math.floor(Math.random() * avail.length)];
    addAffix(def.id);
    toast("购买【" + def.name + "】");
    sfx("pick");
  });

  $("shop-smash")?.addEventListener("click", () => {
    const r = state.run;
    if (!r || r.paused || r.ended) return;
    if (r.hitsLeft <= 0) return;
    if (!spendRunGold(RUN_SHOP.SUPER_SMASH)) {
      toast("金币不够 " + RUN_SHOP.SUPER_SMASH);
      return;
    }
    r.hitsLeft = 0;
    const egg = $("run-egg");
    egg.classList.add("broken", "break-pop");
    setTimeout(() => egg.classList.remove("break-pop"), 320);
    shake(true);
    flash();
    breakEgg();
  });

  $("shop-auto")?.addEventListener("click", () => {
    const r = state.run;
    if (!r || r.paused || r.ended) return;
    if (!spendRunGold(RUN_SHOP.AUTO_HAMMER)) {
      toast("金币不够 " + RUN_SHOP.AUTO_HAMMER);
      return;
    }
    r.autoHammerMs = (r.autoHammerMs || 0) + AUTO_HAMMER_MS;
    toast("自动锤 10 秒！");
    sfx("upgrade");
  });

  $("shop-five")?.addEventListener("click", () => {
    const r = state.run;
    if (!r || r.paused || r.ended) return;
    if (!spendRunGold(RUN_SHOP.FIVE_PICK)) {
      toast("金币不够 " + RUN_SHOP.FIVE_PICK);
      return;
    }
    r.fivePick = true;
    toast("下一颗宝珠：五选一");
    sfx("pick");
  });

  /* ---------- boot ---------- */
  loadSave();
  grantOfflineReward();
  refreshHome();
  show("home");
  setInterval(tick, 100);
  setInterval(() => {
    if (screenManagerHome()) refreshFreeHammerBtn();
  }, 1000);

  function screenManagerHome() {
    return $("screen-home").classList.contains("active");
  }
})();
