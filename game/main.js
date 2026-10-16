/**
 * main.js — 入口：注入平台 → boot → 主循环
 * 无业务 DOM；绘制由 canvasRenderer 完成
 */
import { gameService } from './systems/gameService.js';
import { storageSystem } from './systems/storageSystem.js';
import { cloudSaveSystem } from './systems/cloudSaveSystem.js';
import { adSystem } from './systems/adSystem.js';
import { loop } from './core/loop.js';
import { logger } from './core/logger.js';
import { RUN } from './data/gameConfig.js';
import {
  createStorageAdapter,
  createCloudAdapter,
  createAdAdapter,
} from './platform/tapAdapter.js';
import { createApp } from './ui/app.js';

export function bootstrap(canvas) {
  storageSystem.injectPlatform(createStorageAdapter());
  cloudSaveSystem.injectCloud(createCloudAdapter());
  adSystem.injectPlatform(createAdAdapter());

  gameService.boot();
  const app = createApp(canvas);

  loop.start(
    (dt) => {
      gameService.tick(dt);
      app.tick(dt);
    },
    (dt) => {
      app.render(dt);
    }
  );

  logger.info('Main', 'game started', { tickMs: RUN.TICK_MS });
  return { app, gameService };
}
