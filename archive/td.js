(() => {
  "use strict";

  /* ===== 配置 ===== */
  const CFG = {
    BOARD_W: 390,
    BOARD_H: 520,
    BASE_HP: 10,
    PATH: [
      { x: 0.04, y: 0.18 },
      { x: 0.78, y: 0.18 },
      { x: 0.78, y: 0.42 },
      { x: 0.22, y: 0.42 },
      { x: 0.22, y: 0.68 },
      { x: 0.86, y: 0.68 },
    ],
    SLOTS: [
      { x: 0.18, y: 0.32 },
      { x: 0.45, y: 0.32 },
      { x: 0.62, y: 0.55 },
      { x: 0.12, y: 0.55 },
      { x: 0.38, y: 0.55 },
      { x: 0.28, y: 0.82 },
      { x: 0.52, y: 0.82 },
      { x: 0.68, y: 0.32 },
    ],
    WAVES: [
      { count: 8, hp: 28, speed: 0.055, interval: 550, kind: "slime" },
      { count: 10, hp: 40, speed: 0.06, interval: 500, kind: "slime" },
      { count: 8, hp: 65, speed: 0.065, interval: 480, kind: "beetle" },
      { count: 12, hp: 50, speed: 0.085, interval: 400, kind: "slime" },
      { count: 1, hp: 380, speed: 0.04, interval: 0, kind: "boss" },
    ],
    TOWERS: {
      hammer: { name: "锤塔", icon: "assets/web/icon_hammer_wood.webp", dmg: 16, rate: 650, range: 0.24, bullet: "" },
      gold: { name: "金币炮", icon: "assets/web/icon_coin.webp", dmg: 11, rate: 400, range: 0.22, bullet: "" },
      bomb: { name: "爆弹塔", icon: "assets/web/icon_bomb_small.webp", dmg: 24, rate: 1000, range: 0.28, bullet: "bomb", splash: 0.07 },
      thor: { name: "雷神塔", icon: "assets/web/icon_bomb_thor.webp", dmg: 36, rate: 1300, range: 0.34, bullet: "thor" },
    },
  };

  const state = {
    baseHp: CFG.BASE_HP,
    gold: 0,
    waveIndex: 0,
    slots: [],
    eggs: [],
    units: [],
    phase: "prepare", // prepare | battle | clear | fail | win
    spawnTimer: 0,
    spawned: 0,
    waveDef: null,
    lastTs: 0,
  };

  const $ = (id) => document.getElementById(id);
  const board = () => $("board");

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 1400);
  }

  function log(msg) {
    $("log").textContent = msg;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function lerpPath(t) {
    const pts = CFG.PATH;
    if (t <= 0) return { ...pts[0] };
    if (t >= 1) return { ...pts[pts.length - 1] };
    const n = pts.length - 1;
    const s = t * n;
    const i = Math.floor(s);
    const f = s - i;
    return {
      x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
      y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
    };
  }

  function toPx(pt) {
    const w = board().clientWidth || CFG.BOARD_W;
    const h = board().clientHeight || CFG.BOARD_H;
    return { x: pt.x * w, y: pt.y * h };
  }

  function drawPath() {
    const layer = $("path-layer");
    layer.innerHTML = "";
    const w = board().clientWidth || CFG.BOARD_W;
    const h = board().clientHeight || CFG.BOARD_H;
    for (let i = 0; i < CFG.PATH.length - 1; i++) {
      const a = CFG.PATH[i];
      const b = CFG.PATH[i + 1];
      const x1 = a.x * w, y1 = a.y * h, x2 = b.x * w, y2 = b.y * h;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      const seg = document.createElement("div");
      seg.className = "path-seg";
      seg.style.left = x1 + "px";
      seg.style.top = y1 - 18 + "px";
      seg.style.width = len + "px";
      seg.style.height = "36px";
      seg.style.transformOrigin = "0 18px";
      seg.style.transform = `rotate(${ang}deg)`;
      layer.appendChild(seg);
    }
  }

  function drawSlots() {
    const layer = $("slot-layer");
    layer.innerHTML = "";
    state.slots.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "slot" + (s.tower ? " filled" : "");
      el.dataset.i = String(i);
      const p = toPx(s);
      el.style.left = p.x - 30 + "px";
      el.style.top = p.y - 30 + "px";
      if (s.tower) {
        const t = CFG.TOWERS[s.tower];
        el.innerHTML = `<img src="${t.icon}" alt=""/><span class="lv">Lv${s.level}</span>`;
      } else {
        el.innerHTML = `<span class="path">＋</span>`;
      }
      el.addEventListener("click", () => onSlotClick(i));
      layer.appendChild(el);
    });
  }

  function unitIcon(u) {
    if (u.kind === "boss") return "assets/web/icon_bomb_thor.webp";
    if (u.kind === "beetle") return "assets/web/icon_brick_gold.webp";
    // 用更醒目的球/蛋壳
    return "assets/web/icon_orb.webp";
  }

  function drawUnits() {
    const layer = $("unit-layer");
    layer.innerHTML = "";
    state.units.forEach((u) => {
      if (u.hp <= 0) return;
      const p = toPx(u);
      const el = document.createElement("div");
      el.className = "unit" + (u.kind === "boss" ? " boss" : "");
      el.style.left = p.x + "px";
      el.style.top = p.y + "px";
      const ratio = Math.max(0, u.hp / u.maxHp);
      el.innerHTML = `<img src="${unitIcon(u)}" alt=""/><div class="hpbar"><i style="width:${(ratio * 100) | 0}%"></i></div>`;
      layer.appendChild(el);
    });
  }

  function fxText(text, x, y, crit) {
    const el = document.createElement("div");
    el.className = "dmg" + (crit ? " crit" : "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    $("fx-layer").appendChild(el);
    setTimeout(() => el.remove(), 450);
  }

  function fxBullet(x1, y1, x2, y2, kind) {
    const el = document.createElement("div");
    el.className = "bullet" + (kind ? " " + kind : "");
    el.style.left = x1 + "px";
    el.style.top = y1 + "px";
    $("fx-layer").appendChild(el);
    const start = performance.now();
    const dur = 160;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      el.style.left = x1 + (x2 - x1) * t + "px";
      el.style.top = y1 + (y2 - y1) * t + "px";
      if (t < 1) requestAnimationFrame(step);
      else el.remove();
    }
    requestAnimationFrame(step);
  }

  function refreshHud() {
    $("base-hp").textContent = state.baseHp;
    $("gold").textContent = state.gold;
    $("wave").textContent = Math.min(state.waveIndex + 1, CFG.WAVES.length);
  }

  function eggPool() {
    return [
      { id: "hammer", label: "锤塔", icon: CFG.TOWERS.hammer.icon, w: 28 },
      { id: "gold", label: "金币炮", icon: CFG.TOWERS.gold.icon, w: 22 },
      { id: "bomb", label: "爆弹塔", icon: CFG.TOWERS.bomb.icon, w: 16 },
      { id: "thor", label: "雷神塔", icon: CFG.TOWERS.thor.icon, w: 8 },
      { id: "upgrade", label: "升级×1", icon: "assets/web/icon_hammer_gold.webp", w: 16 },
      { id: "gold_bag", label: "金币袋", icon: "assets/web/icon_coin.webp", w: 10 },
    ];
  }

  function rollEgg() {
    const pool = eggPool();
    const sum = pool.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * sum;
    for (const p of pool) {
      r -= p.w;
      if (r <= 0) return p;
    }
    return pool[0];
  }

  function giveEggs(n) {
    state.eggs = [];
    for (let i = 0; i < n; i++) {
      state.eggs.push({ ...rollEgg(), opened: false });
    }
    renderEggs();
  }

  function giveEggsSilent(n) {
    state.eggs = [];
    for (let i = 0; i < n; i++) {
      state.eggs.push({ ...rollEgg(), opened: false });
    }
    renderEggs();
  }

  function renderEggs() {
    const row = $("egg-row");
    row.innerHTML = "";
    state.eggs.forEach((e, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "egg-card" + (e.opened ? " done" : "");
      el.innerHTML = e.opened
        ? `<img src="${e.icon}" alt=""/><span>${e.label}</span>`
        : `<img src="assets/web/icon_egg_full.webp" alt=""/><span>砸开</span>`;
      el.addEventListener("click", () => openEgg(i));
      row.appendChild(el);
    });
    const left = state.eggs.filter((e) => !e.opened).length;
    $("btn-open-all").disabled = left === 0 || state.phase !== "prepare";
  }

  function openEgg(i) {
    if (state.phase !== "prepare") {
      toast("波次结束后再砸蛋");
      return;
    }
    const e = state.eggs[i];
    if (!e || e.opened) return;
    e.opened = true;

    if (e.id === "gold_bag") {
      const g = 30 + Math.floor(Math.random() * 40);
      state.gold += g;
      toast(`金币袋 +${g}`);
    } else if (e.id === "upgrade") {
      const filled = state.slots.map((s, idx) => (s.tower ? idx : -1)).filter((x) => x >= 0);
      if (!filled.length) {
        state.gold += 25;
        toast("无塔可升，折算 25 金");
      } else {
        const idx = filled[Math.floor(Math.random() * filled.length)];
        state.slots[idx].level += 1;
        toast(`随机塔 Lv${state.slots[idx].level}`);
      }
    } else {
      const empty = state.slots.map((s, idx) => (!s.tower ? idx : -1)).filter((x) => x >= 0);
      if (!empty.length) {
        // upgrade same type instead
        const same = state.slots.findIndex((s) => s.tower === e.id);
        if (same >= 0) {
          state.slots[same].level += 1;
          toast(`${CFG.TOWERS[e.id].name} 升级`);
        } else {
          state.gold += 20;
          toast("无空位，折算 20 金");
        }
      } else {
        const idx = empty[Math.floor(Math.random() * empty.length)];
        state.slots[idx] = { tower: e.id, level: 1 };
        toast(`获得 ${CFG.TOWERS[e.id].name}！点空位查看`);
      }
    }
    renderEggs();
    drawSlots();
    refreshHud();
  }

  function onSlotClick(i) {
    const s = state.slots[i];
    if (!s.tower) {
      toast("先砸出炮台，再会自动放置");
      return;
    }
    if (state.phase !== "prepare") {
      toast(CFG.TOWERS[s.tower].name + " Lv" + s.level);
      return;
    }
    // 手动升级：金币
    const cost = 40 * s.level;
    if (state.gold < cost) {
      toast(`升级需 ${cost} 金`);
      return;
    }
    state.gold -= cost;
    s.level += 1;
    drawSlots();
    refreshHud();
    toast(`${CFG.TOWERS[s.tower].name} → Lv${s.level}`);
  }

  function startWave() {
    if (state.phase === "battle") return;
    if (state.waveIndex >= CFG.WAVES.length) return;
    // 未砸完的蛋自动开
    state.eggs.forEach((e, i) => {
      if (!e.opened) openEggSilent(i);
    });
    renderEggs();
    state.phase = "battle";
    state.waveDef = CFG.WAVES[state.waveIndex];
    state.spawned = 0;
    state.spawnTimer = 0;
    state.units = [];
    log(`第 ${state.waveIndex + 1} 波！` + (state.waveDef.kind === "boss" ? " Boss 来了！" : ""));
    $("btn-start-wave").disabled = true;
    $("btn-start-wave").textContent = "战斗中…";
  }

  function openEggSilent(i) {
    const e = state.eggs[i];
    if (!e || e.opened) return;
    e.opened = true;
    if (e.id === "gold_bag") state.gold += 35;
    else if (e.id === "upgrade") {
      const filled = state.slots.map((s, idx) => (s.tower ? idx : -1)).filter((x) => x >= 0);
      if (filled.length) state.slots[Math.floor(Math.random() * filled.length)].level += 1;
      else state.gold += 20;
    } else {
      const empty = state.slots.map((s, idx) => (!s.tower ? idx : -1)).filter((x) => x >= 0);
      if (empty.length) {
        const idx = empty[Math.floor(Math.random() * empty.length)];
        state.slots[idx] = { tower: e.id, level: 1 };
      } else {
        const same = state.slots.findIndex((s) => s.tower === e.id);
        if (same >= 0) state.slots[same].level += 1;
        else state.gold += 20;
      }
    }
    drawSlots();
  }

  function spawnUnit() {
    const w = state.waveDef;
    const u = {
      id: Math.random().toString(36).slice(2),
      kind: w.kind,
      hp: w.hp,
      maxHp: w.hp,
      speed: w.speed,
      t: 0,
      pos: lerpPath(0),
    };
    state.units.push(u);
  }

  function nearestTarget(fromPt, range) {
    let best = null;
    let bestD = range;
    state.units.forEach((u) => {
      if (u.hp <= 0) return;
      const d = dist(fromPt, u.pos);
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    });
    return best;
  }

  function towerShot(s, slotPt, dt) {
    if (s.cool == null) s.cool = 0;
    s.cool -= dt;
    if (s.cool > 0) return;
    const def = CFG.TOWERS[s.tower];
    const range = def.range * (1 + 0.05 * (s.level - 1));
    const target = nearestTarget(slotPt, range);
    if (!target) return;
    s.cool = def.rate / (1 + 0.08 * (s.level - 1));
    const sp = toPx(slotPt);
    const tp = toPx(target.pos);
    fxBullet(sp.x, sp.y, tp.x, tp.y, def.bullet);
    const dmg = Math.round(def.dmg * (1 + 0.35 * (s.level - 1)) * (def.bullet === "thor" && Math.random() < 0.2 ? 2 : 1));
    target.hp -= dmg;
    fxText(String(dmg), tp.x, tp.y, def.bullet === "thor");
    if (def.splash) {
      const splash = def.splash;
      state.units.forEach((u) => {
        if (u.hp <= 0 || u.id === target.id) return;
        if (dist(target.pos, u.pos) <= splash) {
          u.hp -= Math.round(dmg * 0.45);
        }
      });
    }
    if (target.hp <= 0) {
      const bounty = target.kind === "boss" ? 80 : 8;
      state.gold += bounty;
      fxText("+" + bounty, tp.x, tp.y - 20, true);
      refreshHud();
    }
  }

  function updateBattle(dt) {
    const w = state.waveDef;
    if (!w) return;
    // spawn
    if (state.spawned < w.count) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnUnit();
        state.spawned += 1;
        state.spawnTimer = w.interval;
      }
    }
    // move
    state.units.forEach((u) => {
      if (u.hp <= 0) return;
      u.t += u.speed * (dt / 1000);
      u.pos = lerpPath(u.t);
      if (u.t >= 1) {
        u.hp = 0;
        state.baseHp -= u.kind === "boss" ? 3 : 1;
        log(`漏怪！基地 HP ${state.baseHp}`);
        refreshHud();
        if (state.baseHp <= 0) {
          failRun();
        }
      }
    });
    // towers
    state.slots.forEach((s) => {
      if (!s.tower) return;
      towerShot(s, s, dt);
    });
    // clear?
    const alive = state.units.some((u) => u.hp > 0);
    if (!alive && state.spawned >= w.count) {
      clearWave();
    }
    drawUnits();
  }

  function clearWave() {
    state.phase = "prepare";
    state.waveIndex += 1;
    const bonus = 40 + state.waveIndex * 15;
    state.gold += bonus;
    if (state.waveIndex >= CFG.WAVES.length) {
      showPanel(
        "胜利！",
        `你守住了大金蛋！<br/>剩余 HP：${state.baseHp}<br/>奖励金币：${bonus}`,
        () => resetAll(true)
      );
      state.phase = "win";
    } else {
      giveEggs(3);
      $("btn-start-wave").disabled = false;
      $("btn-start-wave").textContent = `开始第 ${state.waveIndex + 1} 波`;
      log(`波次清空 +${bonus}金 · 砸蛋强化后开下一波`);
      // 不弹全屏框，避免挡视线；用 toast
      toast(`第 ${state.waveIndex} 波通过 +${bonus}金 · 新蛋×3`);
    }
    drawSlots();
    refreshHud();
  }

  function failRun() {
    if (state.phase === "fail" || state.phase === "win") return;
    state.phase = "fail";
    $("btn-start-wave").disabled = true;
    showPanel(
      "基地被攻破",
      `坚持到第 ${state.waveIndex + 1} 波<br/>大金蛋 HP 归零<br/>下次优先升塔或多爆弹`,
      () => resetAll(false)
    );
  }

  function showPanel(title, bodyHtml, onClose) {
    $("panel-title").textContent = title;
    $("panel-body").innerHTML = `<p>${bodyHtml}</p>`;
    $("panel").hidden = false;
    $("panel-ok").onclick = () => {
      $("panel").hidden = true;
      onClose && onClose();
    };
  }

  function resetAll(isWin) {
    state.baseHp = CFG.BASE_HP;
    state.gold = isWin ? 150 : 80;
    state.waveIndex = 0;
    state.phase = "prepare";
    state.units = [];
    state.slots = CFG.SLOTS.map((p) => ({ tower: null, level: 1, x: p.x, y: p.y }));
    giveEggs(4);
    // 开局保底 1 塔，避免空场
    state.slots[0] = { tower: "gold", level: 1, x: CFG.SLOTS[0].x, y: CFG.SLOTS[0].y };
    $("btn-start-wave").disabled = false;
    $("btn-start-wave").textContent = "开始波次";
    $("panel").hidden = true;
    log("砸蛋出炮台 → 开波打怪");
    drawSlots();
    refreshHud();
  }

  function loop(ts) {
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(50, ts - state.lastTs);
    state.lastTs = ts;
    if (state.phase === "battle") updateBattle(dt);
    requestAnimationFrame(loop);
  }

  // events
  $("btn-start-wave").addEventListener("click", startWave);
  $("btn-open-all").addEventListener("click", () => {
    state.eggs.forEach((e, i) => {
      if (!e.opened) openEgg(i);
    });
  });

  // boot
  function boot() {
    drawPath();
    resetAll(false);
    requestAnimationFrame(loop);
    log("准备阶段：先砸蛋拿炮台");
  }

  // resize redraw
  window.addEventListener("resize", () => {
    drawPath();
    drawSlots();
    drawUnits();
  });

  boot();
})();
