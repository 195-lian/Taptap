/**
 * ui/app.js — Canvas 渲染与命中区域（不使用 document/window 业务逻辑）
 */
import { ScreenId, screenManager } from './screenManager.js';
import {
  buildHomeModel,
  buildRunModel,
  buildPickModel,
  buildResultModel,
  buildVaultModel,
} from './renderModel.js';
import { gameService } from '../systems/gameService.js';
import { events } from '../core/events.js';
import { EGG, UI } from '../data/gameConfig.js';
import { particleSystem } from '../systems/particleSystem.js';

const W = 390;
const H = 844;

function loadImage(src) {
  // 小游戏环境 Image 或 canvas.createImage
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.src = src;
    return img;
  }
  return null;
}

export function createApp(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const images = new Map();
  EGG.CRACK_IMAGES.forEach((src) => images.set(src, loadImage(src)));
  [
    'assets/web/icon_coin.webp',
    'assets/web/icon_shard.webp',
    'assets/web/icon_orb.webp',
    'assets/web/icon_ad.webp',
    'assets/web/icon_vault.webp',
    'assets/web/icon_bomb_small.webp',
    'assets/web/icon_hammer_item.webp',
    'assets/web/icon_brick_gold.webp',
  ].forEach((src) => images.set(src, loadImage(src)));

  let toastText = '';
  let toastUntil = 0;

  function showToast(text, ms = UI.TOAST_MS) {
    toastText = text;
    toastUntil = Date.now() + ms;
  }

  events.on('run:vaultDrop', (drop) => {
    showToast(drop.kind === 'hammer' ? '砸出【黄金锤】→ 金库' : '砸出【小爆弹】→ 金库');
  });
  events.on('ad:failed', () => showToast('广告未完成，可点「收下」'));
  events.on('game:settled', (r) => showToast(`已入账 ${r.goldGain} 金币`));
  events.on('pick:open', () => screenManager.go(ScreenId.PICK));
  events.on('pick:chosen', () => screenManager.go(ScreenId.RUN));
  events.on('run:ended', () => screenManager.go(ScreenId.RESULT));

  function pointerPos(e) {
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    const rect = canvas.getBoundingClientRect?.() || { left: 0, top: 0, width: W, height: H };
    const x = ((touch.clientX ?? touch.x ?? 0) - rect.left) * (W / rect.width);
    const y = ((touch.clientY ?? touch.y ?? 0) - rect.top) * (H / rect.height);
    return { x, y };
  }

  function hit(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
  }

  function onTap(x, y) {
    const screen = screenManager.current;
    if (screen === ScreenId.HOME) {
      if (hit(x, y, 40, 700, 310, 56)) {
        gameService.startRun();
        screenManager.go(ScreenId.RUN);
        return;
      }
      if (hit(x, y, 40, 770, 310, 48)) {
        const res = gameService.upgradeHammer();
        showToast(res.ok ? `锤子 Lv${res.level}` : res.reason === 'not_enough' ? '金币不够' : '无法升级');
        return;
      }
      if (hit(x, y, 270, 520, 100, 80)) {
        screenManager.go(ScreenId.VAULT);
        return;
      }
      return;
    }
    if (screen === ScreenId.RUN) {
      if (hit(x, y, 40, 780, 310, 48)) {
        gameService.endRun();
        return;
      }
      gameService.hitStage();
      return;
    }
    if (screen === ScreenId.PICK) {
      const { options } = gameService.getPickState();
      for (let i = 0; i < options.length; i++) {
        const top = 330 + i * 110;
        if (hit(x, y, 24, top, 342, 100)) {
          gameService.choosePick(options[i]);
          screenManager.go(ScreenId.RUN);
          return;
        }
      }
      return;
    }
    if (screen === ScreenId.RESULT) {
      if (hit(x, y, 40, 640, 310, 56)) {
        gameService.doubleResultReward().then((res) => {
          if (res.ok) screenManager.go(ScreenId.HOME);
        });
        return;
      }
      if (hit(x, y, 40, 720, 310, 48)) {
        gameService.collectBaseReward();
        screenManager.go(ScreenId.HOME);
        return;
      }
      return;
    }
    if (screen === ScreenId.VAULT) {
      if (hit(x, y, 16, 40, 80, 40)) {
        screenManager.go(ScreenId.HOME);
        return;
      }
      if (hit(x, y, 40, 760, 310, 56)) {
        const res = gameService.blastVault();
        showToast(res.ok ? `引爆 +${res.goldGain} 金币` : '没有炸物');
        return;
      }
    }
  }

  const onStart = (e) => {
    e.preventDefault?.();
    const { x, y } = pointerPos(e);
    onTap(x, y);
  };

  if (canvas.addEventListener) {
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('mousedown', onStart);
  } else if (canvas.onTouchStart) {
    canvas.onTouchStart(onStart);
  }

  function fillBg(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  }

  function drawText(text, x, y, size, color, align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function drawImageKey(key, x, y, w, h) {
    const img = images.get(key);
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, x, y, w, h);
    }
  }

  function drawHome() {
    const m = buildHomeModel();
    fillBg('#3a2416');
    drawText('砸蛋肉鸽', W / 2, 90, 28, '#fff8ec', 'center');
    drawText('越砸越爽', W / 2, 120, 14, '#ffe29a', 'center');
    drawImageKey(m.eggImage, W / 2 - 70, 200, 140, 160);
    drawText(`金币 ${m.goldText}`, 24, 40, 16, '#fff8ec');
    drawText(`碎片 ${m.shardText}`, 200, 40, 16, '#fff8ec');
    drawText(`下一蛋种 ${m.unlockText}`, 40, 520, 14, '#fff3dc');
    drawText(m.upgradeText, W / 2, 800, 14, '#fff8ec', 'center');
    // CTA
    ctx.fillStyle = '#ffc53d';
    roundRect(40, 700, 310, 56, 28);
    ctx.fill();
    drawText('开始砸蛋', W / 2, 728, 20, '#4a3222', 'center');
  }

  function drawRun() {
    const m = buildRunModel();
    fillBg('#3a2416');
    if (!m) return;
    drawText(m.goldText, 24, 40, 16, '#fff8ec');
    drawText(m.comboText, W - 24, 40, 16, m.isComboHot ? '#ffc53d' : '#fff8ec', 'right');
    drawText(m.timeText, W / 2, 90, 14, '#fff3dc', 'center');
    drawImageKey(m.eggImage, W / 2 - 75, 240, 150, 170);
    drawText(m.hintText, W / 2, 480, 12, '#fff3dc', 'center');
    let ax = 24;
    m.affixes.forEach((a) => {
      drawImageKey(a.icon, ax, 560, 40, 32);
      ax += 48;
    });
    ctx.fillStyle = '#fff';
    roundRect(40, 780, 310, 48, 24);
    ctx.fill();
    drawText('结束本局', W / 2, 804, 16, '#4a3222', 'center');
  }

  function drawPick() {
    fillBg('rgba(20,12,6,0.85)');
    const { options, leftSec } = gameService.getPickState();
    const model = buildPickModel(options, leftSec);
    drawText(model.title, W / 2, 280, 22, '#fff8ec', 'center');
    drawText(model.subtitle, W / 2, 310, 12, '#ffe29a', 'center');
    model.cards.forEach((c, i) => {
      const top = 330 + i * 110;
      ctx.fillStyle = c.rarity === 'rare' ? '#f5f0ff' : '#fffdf8';
      roundRect(24, top, 342, 100, 16);
      ctx.fill();
      drawText(c.name, 48, top + 36, 18, '#4a3222');
      drawText(c.desc, 48, top + 68, 12, '#8b6f4e');
    });
    drawText(model.countdown, W / 2, 700, 12, '#ffe29a', 'center');
  }

  function drawResult() {
    const m = buildResultModel();
    fillBg('#3a2416');
    drawText('本局结算', W / 2, 140, 16, '#fff3dc', 'center');
    drawText(m?.coinsText || '+0', W / 2, 240, 48, '#fff8ec', 'center');
    drawText(`碎片 ${m?.shardsText || '+0'}  碎蛋 ${m?.eggsText || '0'}`, W / 2, 320, 14, '#ffe29a', 'center');
    ctx.fillStyle = '#ffc53d';
    roundRect(40, 640, 310, 56, 28);
    ctx.fill();
    drawText('×2 看视频', W / 2, 668, 20, '#4a3222', 'center');
    ctx.fillStyle = '#fff';
    roundRect(40, 720, 310, 48, 24);
    ctx.fill();
    drawText('收下', W / 2, 744, 16, '#4a3222', 'center');
  }

  function drawVault() {
    const m = buildVaultModel();
    fillBg('#1a1028');
    drawText('金库爆破', W / 2, 50, 20, '#fff', 'center');
    drawText(m.bombText, 24, 100, 13, '#ffe29a');
    drawText(m.hammerText, 24, 130, 13, '#ffe29a');
    // bricks
    const total = m.brickTotal;
    const cols = 4;
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 40 + col * 80;
      const y = 180 + row * 70;
      if (i < m.bricks) drawImageKey('assets/web/icon_brick_gold.webp', x, y, 64, 48);
    }
    drawText(m.estText, W / 2, 720, 14, '#ffe29a', 'center');
    ctx.fillStyle = m.canBlast ? '#ffc53d' : '#666';
    roundRect(40, 760, 310, 56, 28);
    ctx.fill();
    drawText('引爆全部', W / 2, 788, 20, '#4a3222', 'center');
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawToast() {
    if (!toastText || Date.now() > toastUntil) return;
    ctx.fillStyle = 'rgba(20,12,8,0.88)';
    roundRect(40, 400, 310, 44, 22);
    ctx.fill();
    drawText(toastText, W / 2, 422, 14, '#fff8ec', 'center');
  }

  function drawParticles() {
    const list = particleSystem.getActive();
    list.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      if (p.kind === 'coin') {
        ctx.fillStyle = '#ffc53d';
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'shell') {
        ctx.fillStyle = '#e8a317';
        ctx.fillRect(p.x * W, p.y * H, 14, 10);
      } else {
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  return {
    tick() {},
    render() {
      const screen = screenManager.current;
      if (screen === ScreenId.HOME) drawHome();
      else if (screen === ScreenId.RUN) drawRun();
      else if (screen === ScreenId.PICK) drawPick();
      else if (screen === ScreenId.RESULT) drawResult();
      else if (screen === ScreenId.VAULT) drawVault();
      drawParticles();
      drawToast();
    },
  };
}
