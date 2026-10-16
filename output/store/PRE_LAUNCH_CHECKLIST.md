# 上架前最终检查清单

> 项目：砸蛋肉鸽：越砸越爽  
> 预览：`index.html` · 商店：`output/store/`

## 玩法闭环
- [x] 主界面 → 砸蛋 → 三选一 → 结算
- [x] 金库爆破第二玩法
- [x] 蛋种：金 / 青铜 / 虹光
- [x] 词条 ≥8（含自动锤/分裂/幸运/减缓/狂暴）
- [x] 宝珠软保底
- [x] 离线小额收益（有上限）

## 变现
- [x] 结算 ×2（看完才发）
- [x] 续局 +25s（每局 1）
- [x] 三选一换一批（每宝珠 1）
- [x] 免费金锤（冷却 + 日上限）
- [ ] 真机替换 `watchAd()` 为 TapTap 激励视频 SDK

## 存档
- [x] 本地 localStorage（预览）
- [ ] 真机改为 `tt.setStorageSync`（见 `game/systems/storageSystem.js`）
- [x] 版本/字段兼容、try/catch

## 商店材料
- [x] 文案 `TAPTAP_STORE.md`
- [x] 5 张截图 shot1–5
- [x] 图标 `app_icon_512.png` / `app_icon_1024.png`
- [ ] 手动填写 TapTap 创作者中心
- [ ] 适龄问卷

## 代码规范
- [x] `CODE_STANDARD.md`
- [x] 数值集中在 `js/game.js` 常量区 / `game/data/gameConfig.js`
- [ ] 将 DOM 原型玩法完整迁到 `game/` 供真机包使用（可后置）

## 质量
- [x] Playwright 回归通过
- [x] 无业务崩溃（仅 favicon 404）
- [ ] 真机 iOS / Android 各测 1 台
- [ ] 低端机碎裂不严重掉帧

## 真机最小接入清单
1. `platform/tapAdapter.js`：存档 + 激励视频
2. 首包资源：`assets/web/*`、`assets/bg_*.jpg`
3. 入口调用 `bootstrap` 或等价启动
4. 隐藏调试、确认无 `console.log` 上线噪音
