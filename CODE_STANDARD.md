# CODE_STANDARD — 砸蛋肉鸽：越砸越爽

> 平台：TapTap 小游戏 · 竖屏 2D · 单机  
> 语言：JavaScript（ES2020+，模块化）  
> 原则：配置与逻辑分离 · 模块清晰 · 状态可控 · 存档可靠 · 广告安全 · AI 能续写 · 我能验收

---

## 1. 技术红线

| 禁止 | 原因 |
|------|------|
| `document` / `window` / DOM / BOM | 小游戏环境无浏览器 DOM |
| `localStorage` / `sessionStorage` | 用 TapTap 同步存储封装 |
| 业务里写死数值 | 全部进 `data/gameConfig.js` |
| `console.log` 上线包 | 用 `logger`，发布构建剥离 debug |
| 广告回调里直接改余额 | 必须经 `AdSystem` 确认后发奖 |
| 未 try/catch 的存档/广告/云备份 | 必须捕获并分级日志 |

---

## 2. 目录结构

```
game/
  main.js                 # 入口：预加载 → 启动
  core/
    game.js               # 生命周期
    loop.js               # 主循环 / 帧
    state.js              # 全局状态 + 唯一修改入口
    logger.js             # 分级日志
    events.js             # 轻量事件总线
  data/
    gameConfig.js         # 全部数值与文案键
  systems/
    storageSystem.js      # 本地存档
    cloudSaveSystem.js    # 云存档
    adSystem.js           # 激励视频状态机
    smashSystem.js        # 砸蛋
    affixSystem.js        # 肉鸽词条
    vaultSystem.js        # 金库
    particleSystem.js     # 粒子对象池
    audioSystem.js        # 音效（可选）
  ui/
    screenManager.js
    homeView.js
    runView.js
    pickView.js
    resultView.js
    vaultView.js
  utils/
    safe.js               # try/catch 工具
    random.js
    format.js
    pool.js               # 通用对象池
  platform/
    tapAdapter.js         # TapTap tt.* / 预览适配注入
  assets/                 # 若与工程 assets 分离可并列
```

根目录另有：
- `index.html` + `css/` + `js/game.js`：**可玩预览壳（DOM）**，仅用于桌面/浏览器验收；TapTap 上架以 `game/` 为准
- `CODE_STANDARD.md`：本规范

**预览壳约定：** 可临时用 DOM 做验收 UI，但上线逻辑必须迁到 `game/`，且不得在预览壳里新增未进 `gameConfig` 的数值。

---

## 3. 命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 变量/函数/方法 | 小驼峰 | `startRun`, `hitCount` |
| 类/构造器 | PascalCase | `AdSystem`, `ParticleSystem` |
| 常量/配置键 | UPPER_SNAKE_CASE | `RUN_DURATION`, `ORB_RATE` |
| 布尔 | `is` / `has` / `can` 前缀 | `isPaused`, `hasOrb`, `canUpgrade` |
| 回调/事件处理 | `on` 开头 | `onRewarded`, `onAdError` |
| 私有约定 | `_` 前缀或模块内闭包 | `_timer` |

文件名：小驼峰 + 后缀，如 `adSystem.js`、`gameConfig.js`。

---

## 4. 配置（data/gameConfig.js）

- 一切时长、概率、价格、上限、文案模板进配置。
- 分组：`RUN`, `EGG`, `HAMMER`, `AFFIX`, `VAULT`, `AD`, `SAVE`, `PERF`, `UI`。
- 运行时只读；禁止在 systems 里写魔法数字。
- 新增玩法先改 config，再写逻辑。

```js
// 示例结构（详见文件）
export const RUN = { DURATION_MS: 90000, PICK_TIMEOUT_MS: 8000 };
export const AFFIX = { POOL: [/* ... */], ORB_RATE: 0.28 };
```

---

## 5. 状态（core/state.js）

- 唯一状态树：`meta`（金币/碎片/锤子/金库库存）与 `run`（局内）。
- **只通过导出的 mutator 修改**，禁止外部 `state.xxx =`。
- 局内状态在开局创建、结算清空；词条不进存档。
- 关键 mutator 后可 `events.emit('state:changed', key)`。

---

## 6. 存档

### 本地 StorageSystem
- 键：`SAVE_KEY`（含版本前缀）。
- 结构：`{ version, updatedAt, meta: {...} }`。
- 读：`try/catch`，版本迁移函数表，缺字段用 `gameConfig` 默认值补全。
- 写：节流（默认 ≥ 2s 合并一次），关键节点（结算/升级/金库引爆）强制落盘。
- 禁止每帧 `setStorageSync`。

### 云存档 CloudSaveSystem
- 与本地同 schema + `version` + `updatedAt`。
- 触发：结算入账后、锤子升级后、金库大额入账后、从后台回前台可选。
- 失败不阻断玩法；成功后合并策略：`updatedAt` 较新者优先（meta 金币取 max 可配）。
- 全程 try/catch + 日志。

---

## 7. 广告 AdSystem

- 统一入口，业务不直接调平台 SDK。
- 状态机：`IDLE → LOADING → READY → SHOWING → COMPLETED | FAILED | SKIPPED`。
- **奖励仅在 `COMPLETED` 且平台成功回调后发放**。
- 防连点：`SHOWING` 忽略请求；按钮层 `canShowAd`。
- 防重复发奖：每 `adType` 一次 `rewardToken`，用后作废。
- 失败/无填充：Toast 兜底，可按配置「仍发基础奖」或「仅提示」。
- 广告类型见 `gameConfig.AD.TYPES`（如 `RESULT_DOUBLE`）。

---

## 8. 错误与日志

```js
logger.debug / info / warn / error(tag, msg, data?)
```

| 级别 | 用途 |
|------|------|
| debug | 开发细节，发布关闭 |
| info | 启动、结算、广告完成 |
| warn | 可恢复：云备份失败、配置缺省 |
| error | 存档损坏、广告状态异常 |

存储/广告/云存档必须包 `safe.run(fn, fallback)` 或 try/catch。

---

## 9. 性能

- 粒子：`ParticleSystem` + 对象池（`utils/pool.js`），禁止碎裂时大量 `new`。
- 资源：启动预加载图标/背景；首屏可交互目标 ≤ 3s（低端机）。
- 避免：每帧字符串拼大对象、每帧存档、无上限粒子。
- 主循环固定逻辑步进可配置（如 100ms 计时与表现分离）。

---

## 10. Git

- 小步提交；信息：`feat: ...` / `fix: ...` / `refactor: ...` / `docs: ...` / `chore: ...`
- 一次提交只做一件事；重构不夹带新玩法。

---

## 11. AI 生成代码规则

每次生成必须明确：

1. **文件路径**（只允许改列出的文件）  
2. **导出接口**（函数/类签名）  
3. **输入输出与副作用**  
4. **从 `gameConfig` 读哪些键**  
5. **错误处理点**  

生成后人工检查：

- [ ] 无 DOM/BOM/localStorage  
- [ ] 无魔法数字  
- [ ] 无事件/定时器泄漏  
- [ ] 状态只经 `state` mutator  
- [ ] 广告奖励只在回调后  

---

## 12. 上架前检查清单

- [ ] 所有数值在 `gameConfig.js`  
- [ ] 本地存档：杀进程重进金币/锤子正确  
- [ ] 云存档：断网失败不崩、恢复后可合并  
- [ ] 广告：看完才发奖、连点不双发、失败有提示  
- [ ] 无 `console.log` / 调试 UI  
- [ ] 首屏 3s 内可点  
- [ ] 低端机碎裂不掉帧到不可玩  
- [ ] 无背包/图鉴/任务/排行/联网对战等越界系统  

---

## 13. 核心原则（验收用）

1. 配置与逻辑分离  
2. 模块清晰（core / systems / ui / data / utils）  
3. 状态可控（仅 state mutator）  
4. 存档可靠（版本 + 时间戳 + try/catch + 默认值）  
5. 广告安全（状态机 + 回调发奖 + 防重）  
6. AI 能续写（接口与 config 可发现）  
7. 我能验收（清单 + 日志级别）
