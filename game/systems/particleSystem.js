/**
 * systems/particleSystem.js — 对象池粒子（表现层数据，不直接画 DOM）
 */
import { PERF } from '../data/gameConfig.js';
import { createPool } from '../utils/pool.js';

function factory() {
  return {
    kind: 'shell',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: 0,
    life: 0,
    maxLife: 0,
    isAlive: false,
  };
}

function reset(p) {
  p.isAlive = false;
  p.life = 0;
}

const pool = createPool(factory, reset, PERF.MAX_PARTICLES);
const active = [];

export const particleSystem = {
  spawn(kind, x, y, vx, vy, rot, lifeMs) {
    if (active.length >= PERF.MAX_PARTICLES) {
      const oldest = active.shift();
      pool.release(oldest);
    }
    const p = pool.obtain();
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.rot = rot;
    p.life = lifeMs;
    p.maxLife = lifeMs;
    p.isAlive = true;
    active.push(p);
    return p;
  },

  burstAt(x, y, { isCrit }) {
    const shells = isCrit ? 10 : 6;
    const coins = isCrit ? 8 : 4;
    const sparks = isCrit ? 6 : 3;
    for (let i = 0; i < shells; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 0.08 + Math.random() * (isCrit ? 0.22 : 0.14);
      this.spawn(
        'shell',
        x,
        y,
        Math.cos(ang) * dist,
        Math.sin(ang) * dist - 0.04,
        Math.random() * 360,
        500 + Math.random() * 200
      );
    }
    for (let i = 0; i < coins; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const dist = 0.1 + Math.random() * 0.16;
      this.spawn('coin', x, y, Math.cos(ang) * dist, Math.sin(ang) * dist, 0, 550 + Math.random() * 200);
    }
    for (let i = 0; i < sparks; i++) {
      this.spawn('spark', x, y, 0, 0, 0, 280 + Math.random() * 120);
    }
  },

  update(dtMs) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.life -= dtMs;
      p.x += p.vx * (dtMs / 1000);
      p.y += p.vy * (dtMs / 1000);
      p.vy += 0.0008 * dtMs; // 重力
      if (p.life <= 0) {
        active.splice(i, 1);
        pool.release(p);
      }
    }
  },

  getActive() {
    return active;
  },

  clear() {
    while (active.length) pool.release(active.pop());
  },
};
