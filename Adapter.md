# NoolingoAdapter 实现要点

宿主应用通过 `new Noolingo(adapter)` 注入 **`NoolingoAdapter`**。类型以源码为准：

- 聚合类型：`src/types/adapter.ts` 中的 `NoolingoAdapter`
- 本地数据库：`delta-sync` 的 `DatabaseAdapter`（`node_modules/delta-sync/dist/core/types.d.ts` 或包导出）

以下按子适配器列出**实现时建议对齐的语义与注意点**；方法名与参数以接口定义为准。

---

## 总览：`NoolingoAdapter`

| 字段 | 接口 | 在 core 中的典型用途 |
|------|------|----------------------|
| `audio` | `AudioAdapter` | 朗读、音效、振动、TTS；`init` 与事件订阅 |
| `file` | `FileAdapter` | 缓存/文档目录、文件读写与目录操作 |
| `config` | `ConfigAdapter` | 与 `configManager` 对应的键值持久化 |
| `notification` | `NotificationAdapter` | 渠道配置、权限、即时与定时通知 |
| `localDatabase` | `DatabaseAdapter` | 本地同步存储；`syncManager` / `SyncEngine` |
| `device` | `DeviceAdapter` | 系统语言、分发平台标识、剪贴板 |
| `appConfig` | `AppConfigAdapter` | 版本、API/OSS 基址、业务常量等 |

**七项均为必填。** 最小可运行 stub 可参考仓库 [`example/stubAdapters.ts`](./example/stubAdapters.ts)。

---

## `AudioAdapter`

- **`init`**：完成音频子系统初始化；返回值表示是否成功，失败时上层可能降级或跳过部分能力。
- **`getCurrentLanguage`**：返回当前用于朗读/TTS 的语言标识字符串（与业务 `Language` 枚举配合时由宿主约定格式）。
- **`on` / `off`**：按事件名注册/移除回调（具体事件名由宿主与音频实现约定）；`off` 按事件维度取消订阅即可。
- **`vibrate`**：按 `VibrationType` 映射到系统振动 API；无需振动时可空实现。
- **`playSound`**：`SoundType` 仅 `correct` / `wrong`；返回是否实际播放成功。
- **`speak`**：TTS 播放文本；**必须在结束时调用 `onDone`**（成功或失败都应结束回调，避免 UI 永久等待）。
- **`setTextSpeechRate`**：语速系数由业务传入，映射到平台 TTS 速率。
- **`pause` / `stop`**：暂停与停止当前朗读/播放；多次调用应幂等或安全 no-op。

---

## `FileAdapter`

- **`getCacheDirectory` / `getDocumentDirectory`**：返回本应用可写的根路径字符串（平台相关：沙箱目录、file:// URI 等需与 `readAsString` / `writeAsString` 的路径规则一致）。
- **`getInfo`**：对给定路径返回是否存在、`uri`、大小、是否目录、修改时间等；不存在时 `exists: false` 即可。
- **`makeDirectory`**：`intermediates` 为 true 时应支持递归创建父目录。
- **`readAsString` / `writeAsString`**：支持 `utf8` 与 `base64`；路径与编码约定需在全应用统一。
- **`delete`**：`idempotent: true` 时，目标不存在不应抛错。
- **`readDirectory`**：返回目录下子项名称列表（不含 `.` / `..` 由宿主约定）。

---

## `ConfigAdapter`

- **同步 API**：`set` / `get` / `delete` 在类型上为同步；实现通常对应 MMKV、AsyncStorage 的同步封装，或内存 + 异步落盘（若底层仅异步，宿主需在封装内保证 `get` 读到已提交的值或接受最终一致性）。
- **键空间**：与 `ConfigKey` 等枚举键名一致；`value` 为可序列化数据（`get` 返回 `any`，宿主应保证类型与反序列化安全）。
- **`delete`**：删除指定键；不存在时可 no-op。

---

## `NotificationAdapter`

- **`configureNotifications`**：应用启动或首次需要通知时配置渠道、类别等（各平台一次或按需）。
- **`checkNotificationPermission` / `requestNotificationPermission`**：查询与申请权限；返回值表示是否已授权（具体语义与系统对话框结果对齐）。
- **`showInstantNotification`**：展示即时通知；`data` 供点击跳转或透传业务字段。
- **`scheduleNotification`**：在 `date` 触发；需处理时区与后台限制；返回是否调度成功。
- **`cancelAllScheduledNotifications`**：清除已调度任务；登出或「关闭所有提醒」等场景会用到。

---

## `DeviceAdapter`

- **`getDeviceLanguage`**：返回 `Language` 枚举值（见 `src/locales/languages`），用于与产品支持语言列表对齐，**不是**直接把系统 locale 原样字符串塞给 UI。
- **`getPlatform`**：返回 `NoolingoPlatform`（`win` / `mac` / `ios` / `android` / `web` 等），表示**分发/产品渠道**，与 React Native 的 `Platform.OS` 概念不同，按上架与更新策略映射。
- **`copyToClipboard`**：将文本写入系统剪贴板；失败时可吞掉或打日志，避免阻塞业务。

---

## `AppConfigAdapter`

- **构建期/环境常量**：多为只读配置对象，在构造 `Noolingo` 时注入即可。
- **`appVersion` / `appName` / `appPlatform`**：展示、埋点、更新检查等。
- **`ossOriginUrl` / `ossCdnUrl`**：对象存储直链与 CDN 基址；空字符串表示未使用或占位。
- **`apiBaseUrl`**：主 API 根地址。
- **`apiBaseUrlCandidates` / `apiProbePath`（可选）**：多线路或健康探测时使用；无多线路可不实现或留空。
- **`dailyTarget`**：业务侧每日目标数值（与学习计划等相关）。

---

## `localDatabase`（`DatabaseAdapter`，来自 `delta-sync`）

本地侧实现须满足 **`delta-sync` 同步引擎**对存储的读写约定，核心能力如下（与 stub 及 `CloudBaseAdapter` 对齐）：

| 方法 | 要点 |
|------|------|
| **`listStoreItems`** | 按 `storeName` 分页/增量列出 `SyncViewItem`（支持 `offset`、`since`、`before` 等）；返回 `items`、`hasMore`、`offset`。 |
| **`readStore`** | 读取某 store 的全量或分页实体，`items` 带 `id`，`hasMore` 表示是否还有下一页。 |
| **`readBulk`** | 按 `ids` 批量读取，用于补全或合并。 |
| **`putBulk`** | 批量写入/更新；返回值一般为已持久化的项（与 `delta-sync` 调用方约定一致）。 |
| **`deleteBulk`** | 按 id 批量删除（含逻辑删除/墓碑策略时由实现与 schema 配合）。 |
| **`clearStore`** | 清空指定 store；返回是否成功。 |

实现可选用嵌入式 DB、文件队列 + SQLite，或对接宿主已有存储；**但必须完整实现上述方法且语义与 `delta-sync` 一致**，否则同步与 `syncManager` 会异常。

---

## 与文档的关系

- 架构与导入边界见 [`Agents.MD`](./Agents.MD)。
- 接入步骤见 [`README.md`](./README.md)。
