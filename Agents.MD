# Core — Agent 指南（适配器）

## `NoolingoAdapter`（经 `new Noolingo(adapter)` 注入）

以下 **7 项均为必填**，类型见 `core/types/adapter.ts` 中的 `NoolingoAdapter`。缺任一项则无法在注入后正常使用依赖该能力的 core 代码。

| 字段 | 接口类型 | 用途（core 内） |
|------|-----------|-----------------|
| `audio` | `AudioAdapter` | 朗读、音效、振动、TTS 等（如 `audio.service`） |
| `file` | `FileAdapter` | 缓存目录、读写文件（如 `cacheManager`） |
| `config` | `ConfigAdapter` | 键值配置持久化（如 `configManager`） |
| `notification` | `NotificationAdapter` | 本地通知配置与展示（如 `notification.service`） |
| `localDatabase` | `delta-sync` 的 `DatabaseAdapter` | 本地同步存储 / `SyncDbClient`（如 `syncManager`） |
| `device` | `DeviceAdapter` | 设备能力：`getDeviceLanguage`、`getPlatform`、`copyToClipboard` 等 |
| `appConfig` | `AppConfigAdapter` | 版本号、API/OSS 基址、`dailyTarget` 等（原 `src/config` 中注入） |

Expo 侧默认实现由 `src/adapters/noolingoAdapter.ts` 组装（含 `@/config` 常量与 `src/adapters/*` 实现），在根目录 `index.ts` 中于 `expo-router` 之前 import 的 bootstrap 里执行 `new Noolingo(noolingoAdapter)`。

---

## core 与 `src/adapters/`、`src/config`

`core` **不**再 `import` `@/` 或 `../../src/config`；平台能力与构建期常量均经上表 `device`、`appConfig` 注入。

---

## 启动顺序（摘要）

1. 先执行 bootstrap：`new Noolingo(adapter)`（注入上表 7 项）。  
2. 再按需调用 `initServices()`（或 `noolingo.init`），初始化各 service。

若仅 `import` 与 `Noolingo` / `service` 相关的模块，须避免在 **`setAdapter` 之前**于模块顶层访问 `adapter`（已针对如 `AudioService` 等做延迟访问处理）。

---

## Service 从哪导入（`noolingo.service` vs `core/services/*`）

**推荐（Expo App 层：`app/`、`src/`）**  
在已执行 bootstrap 的前提下，用 **`noolingo.service.<键>`** 访问与 `core/service.ts` 里 `export const service` 相同的单例，入口统一、与 `Noolingo` 模型一致：

```ts
import { noolingo } from '@/bootstrap/noolingoApp';

await noolingo.service.note.someMethod();
noolingo.service.auth.isAuthenticated();
```

键名与 `service` 对象一致（**不是** `noteService` 这种后缀），例如：`ai`、`auth`、`audio`、`chat`、`curate`、`deck`、`file`（对应 import 业务）、`image`、`indices`、`note`、`notification`、`payment`、`public`、`quiz`、`stats`、`study`、`sync`、`update`。

**仍推荐（`core/` 包内部）**  
继续 **`import xxx from 'core/services/xxx.service'`** 或 **`import { service } from 'core/service'`**，**不要** 从 `@/bootstrap/noolingoApp` 引 `noolingo`，以免 **bootstrap → core → bootstrap** 循环依赖。

**初始化**  
全量初始化仍用 **`initServices()`**（或 **`await noolingo.init()`**，二者等价），在适当时机（如 `InitializationWrapper`）调用一次即可。

---

## Store（`noolingo.stores`）

`core/stores/index.ts` 聚合各 Zustand **`use*Store`** 为 **`stores`**，并挂在 **`noolingo.stores`** 上；与分别 `import { useNoteStore } from 'core/stores/noteStore'` 为**同一引用**。

| 键 | hook |
|----|------|
| `auth` | `useAuthStore` |
| `note` | `useNoteStore` |
| `study` | `useStudyStore` |
| `sync` | `useSyncStore` |
| `stats` | `useStatsStore` |
| `quiz` | `useQuizStore` |
| `selection` | `useSelectionStore` |
| `setting` | `useSettingStore` |
| `importStore` | `useImportStore` |
| `message` | `useMessageStore`（聊天消息） |
| `contextMenu` | `useContextMenuStore` |
| `update` | `useUpdateStore` |
| `ai` | `useAIStore` |
| `audio` | `useAudioStore` |

**组件内**：`noolingo.stores.note(s => s.noteList)`，或先 `const useNoteStore = noolingo.stores.note` 再按原习惯使用。

**非 React 订阅**：`noolingo.stores.note.getState()`、`noolingo.stores.note.subscribe((state, prev) => { ... })`。

**`core/` 内部**仍建议直接 `import … from './stores/xxxStore'`，避免经 bootstrap 循环依赖。

---

## 配置（`noolingo.config`）

**`noolingo.config`** 与 **`configManager`**（`core/storage/configManager.ts`）为**同一实例**，API：`getConfig`、`saveConfig`、`removeConfig`、`clearAllConfig`；键名用 **`ConfigKey`**（可从 `core/storage/configManager` 按需 import 枚举）。


## 访问记录（`noolingo.visit`）

**`noolingo.visit`** 与 **`visitManager`**（`core/storage/visitManager.ts` 导出的便捷对象）为**同一引用**，方法包括：`markVisited`、`isFirstVisit`、`isVisitedToday`、`getVisitCount`、`isVisitCount`、`isBeforeVisitCount`、`reset`、`resetAll`。

**App / `src/`** 推荐：`noolingo.visit.markVisited('some_key')`。

**`core/` 内部**可继续 `import { visitManager } from './storage/visitManager'`。
