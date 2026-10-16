# AGENTS.md — 别砸我的蛋（TapTap 小游戏）

## 项目是什么
- **当前玩法真源**：`核心玩法设计定稿_v3.md`（v3.5）。游戏名 **《别砸我的蛋》**。
- **目标**：TapTap 小游戏上架，**激励视频变现**（无内购主线）。
- **最新玩法一句话**：局外砸蛋出炮台/道具/武器 → 备战放塔 → **自动塔防**守住下方大金蛋；2 倍速**首次看广告后永久免费**。
- 旧方案《砸蛋肉鸽》（局内砸蛋 + 词条/金库）**已废弃**；只看 `archive/` 与 `砸蛋肉鸽_*.md`、`玩法拓展路线.md` 会误导。

## 先读这些（顺序）
1. `核心玩法设计定稿_v3.md` — **唯一玩法/数值/广告/存档规则**
2. `UI布局说明.md`（**v3**）+ `DESIGN.md` — **现行 UI 真源**。主页无标题无中央蛋；入口词仅「捣蛋/关卡/武器」（禁闯关/出征）。线框 `ui_wireframes/`
3. `CODE_STANDARD.md` — 命名、config/state/广告/存档红线（玩法章节已过时）
4. `js/config.js`、`js/save.js` — 新玩法半成品配置/存档（以设计稿为准，可重写）
5. `game/` — TapTap **分层与广告/存档适配**参考，**系统名（词条/金库）不是当前玩法**

## 工程现状（容易踩坑）
| 路径 | 状态 |
|------|------|
| `index.html` | 当前为 **UI 方案预览**（`css/design.css` + `js/design-bg.js`）；游戏逻辑壳未就绪。图缺失时布局仍可看，图标位会空 |
| `DESIGN.md` `UI布局说明.md` | **现行 UI 文档**；实现布局以二者为准 |
| `UI设计规格.md` | **已过时**（旧《砸蛋肉鸽》5 屏；`ui/*.svg` 线框已删） |
| `js/config.js` `js/save.js` `css/game.css` | 新玩法半成品，**未完成可玩闭环**；config 内 `assets/web/*` 为**目标路径**，文件尚未放回 |
| `assets/` `ui/` | **已删除**（2026-09-18，无 git 可恢复）。需按 `UI布局说明.md` §0.5/§10 重新投放素材 |
| `archive/` | 旧 DOM/塔防草稿，**勿当现行逻辑**；其中图片引用同样已失效 |
| `game/` | 旧砸蛋肉鸽模块 + TapTap 适配；实现新玩法时**参考规范，不要照搬 affix/vault 玩法** |
| `output/store/` | 旧名与旧商店文案；上架前按《别砸我的蛋》重做 |
| 无 `package.json` / 测试框架 | 验证靠浏览器 + Playwright CLI |

## 本地预览
```bash
cd /Users/lian/Projects/Taptap
python3 -m http.server 8765
# 浏览器打开 http://127.0.0.1:8765/index.html
```
ES Module 必须用 http，不要用 `file://`。

## 玩法硬规则（实现必须遵守）
- **砸蛋仅局外**；**局内禁止砸蛋**、无经验三选一、无教学、无背包页（存货只在**备战页**看）。
- **扣费顺序**：`eggSmashLeft[eggId]` → `adSmashLeft` → **券** → **金币**（120 金=1 券）。
- **每日券 10**：手动领取，不领不叠到次日；判重用本地日期 + `lastTicketClaimTs`（防回拨）。
- **塔卡**：消耗品；**点「开始波次」才按已放置扣**；未开波退出不扣；失败不退已扣卡。0 卡送 1 临时白锤炮 Lv1。
- **道具**：带入 ≤3，开波预扣；**未用完结算/退出退回存货**。
- **稀有度只定塔种**，进场一律 **Lv1**，靠 **自动合成**（同型同级，Lv≤3）升级。
- **战斗**：怪**上→下**；塔自动索敌（射程内 **t 最大**）；自动合成；玩家只点**道具栏**；波间 **自动衔接**（约 2s）。
- **精英含在波次 `n` 内**；**Boss 在本波杂兵刷完后再刷**。
- **2 倍速**：存档字段 `speedUnlocked`；**仅首次**需广告，之后永久开/关、不再弹广告。
- 新号：金币 60、券 0；数值/概率/波次**禁止硬编码**，一律进配置（对齐 `js/config.js` + 设计稿 §4–§6）。

## 广告与变现
- 上架形态：TapTap 小游戏 + **激励视频**；设计点见设计稿 §6/§10。
  - **MVP 主广告**：2 倍速首次解锁（永久）。
  - 后置：免费砸蛋（`adSmashLeft+1`，冷却 180s）、失败续守、结算双倍。
- **必须走 AdSystem 状态机**（见 `CODE_STANDARD.md` §7、`game/systems/adSystem.js`）：奖励**仅 COMPLETED 回调后发放**；防连点、防重复 token；失败 Toast 兜底，**禁止在广告回调外直接改余额**。
- 真机：`platform/tapAdapter.js` 注入 `tt` 激励视频；预览可 mock。

## 存档（TapTap）
- **上架路径**：小游戏 `tap` + `tapfile://`；云存档需登录，**≤10MB**、上传约 **1 次/分钟**；浏览器预览可用 `localStorage`（`js/save.js`）。
- 结构含：`gold, tickets, ticketClaimDate, lastTicketClaimTs, adSmashLeft, lastAdSmashAt, eggCrystal, eggCounts, eggSmashLeft, invTowers, invItems, weapons, weaponSlots, unlockedEggs, unlockedStages, stageClear, firstClear, soundOn, speedUnlocked, lastSaveAt`（详见设计稿 §8）。
- 读写 **try/catch** + 默认值合并；结算/领券/解锁等关键节点写档；云失败不阻断。

## 代码约定（摘 CODE_STANDARD）
- 数值只进 config；`game/` **禁 DOM/BOM**；上线不用 `console.log`（用 logger）。
- 状态只经 mutator；命名：变量小驼峰、常量 UPPER_SNAKE、布尔 `is/has/can`、回调 `on*`。
- Git：`feat:/fix:/refactor:` 小步提交。

## 不要做
- 恢复局内砸蛋、词条肉鸽、金库、任务/图鉴/排行/教学页。
- 把 `archive/` 或旧商店文案当现行玩法。
- 广告未完成就发奖；每帧写存档；业务里散落魔法数字。

## 可玩预览实现顺序（设计稿 §11）
1. 存档 + 主页领券 + 捣蛋台（扣费/保底/跳过动画）  
2. 备战存货 + 关 1–3 自动塔防（开波扣卡、自动合成、道具栏）  
3. 2 倍速首广告后永久 + 音效开关  
4. 武器 3 槽  
5. 回归（浏览器）→ 再迁 `game/` / 接 `tt` 广告与云存档  

## 工具
- 静态服务：`python3 -m http.server`（见上）。
- 浏览器自动化：Playwright CLI（会话 skill）；产物可放 `output/playwright/`。
- 素材：**目录已清空**。投放路径见 `UI布局说明.md` §0.5/§10（`assets/bg_home_user.jpg`、`assets/web/*` 等）；生成提示词见 `素材提示词_塔防.md`。放回前 config/预览中的图片 URL 会 404，属预期。
