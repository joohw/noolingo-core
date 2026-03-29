# noolingo-core

Noolingo 共享业务内核：通过 `Noolingo` 聚合服务（Service）、状态（Zustand stores）、键值配置与访问统计；宿主应用实现并注入 `NoolingoAdapter`，将音频、文件、数据库、通知等平台能力与业务逻辑解耦。

---

## 文档分工

| 文档 | 读者 | 内容侧重 |
|------|------|----------|
| **本 README** | 接入本包的开发者 | 安装、启动顺序、门面 API、子路径导出、本地构建与发布 |
| **[Agents.MD](./Agents.MD)** | 代码智能体与深度参与本仓库的贡献者 | 适配器字段规范、Repo / Service / Store 分层、`noolingo` 与 `core` 内部导入边界、循环依赖规避等架构约定 |

若在仓库内写业务或与 AI 结对改 core，请让智能体优先阅读 `Agents.MD`。

---

## 安装

```bash
npm install noolingo-core
```

发布包仅包含编译产物（见下文「发布到 npm」）。使用前请先在本包执行 `npm run build`，或安装已发布的版本（自带 `dist/`）。

---

## 使用指南

### 1. 实现适配器

宿主需提供完整的 `NoolingoAdapter`（音频、文件、配置、通知、本地数据库、设备信息、应用配置等）。类型定义见：

```ts
import type { NoolingoAdapter } from 'noolingo-core/types';
```

各字段职责与命名约定见 [Agents.MD](./Agents.MD) 中的适配器表；实现时可对照本仓库 [`example/stubAdapters.ts`](./example/stubAdapters.ts) 或宿主应用内的 `noolingoAdapter` 组装方式。

### 2. 构造门面并初始化

在应用**尽可能早**的 bootstrap 中构造 `Noolingo`（构造函数内会注册适配器并初始化与配置相关的 store），再在合适时机（如根布局、启动屏之后）调用一次 `init` 完成各 Service 的异步初始化：

```ts
import Noolingo from 'noolingo-core';
import type { NoolingoAdapter } from 'noolingo-core/types';

const adapter: NoolingoAdapter = {
  // 按类型实现全部必填字段
};

const noolingo = new Noolingo(adapter);
await noolingo.init();
```

初始化完成后，通过同一实例访问：

- **`noolingo.service`** — 业务服务单例（如 `note`、`auth`、`sync` 等，键名与内部 `service` 导出一致）
- **`noolingo.stores`** — 与各 `use*Store` 相同的 Zustand store 引用，供 React 组件订阅或非 React 代码 `getState` / `subscribe`
- **`noolingo.config`** — 键值配置（与 `configManager` 同源 API：`getConfig`、`saveConfig` 等）
- **`noolingo.visit`** — 访问/首次进入等打点（与 `visitManager` 同源）

宿主侧若使用统一的 `noolingo` 单例（例如从 `@/bootstrap/noolingoApp` 导出），请保证**先**执行 `new Noolingo(adapter)`，**再**在其它模块顶层导入依赖适配器的逻辑；否则可能出现适配器未就绪就读取平台能力的问题。细则见 `Agents.MD`「启动顺序」。

### 3. 仅使用子集能力（子路径导出）

不必总是从根入口拉取全部符号。`package.json` 的 `exports` 提供多个子路径，便于按领域引用（例如牌组、笔记、测验、FSRS、类型、服务聚合、stores 聚合等）：

| 示例路径 | 典型用途 |
|----------|----------|
| `noolingo-core/convert` | 格式转换 |
| `noolingo-core/deck`、`noolingo-core/note`、`noolingo-core/quiz` | 领域模型与逻辑 |
| `noolingo-core/fsrs` | 调度算法 |
| `noolingo-core/services`、`noolingo-core/stores` | 服务与 store 的聚合导出 |
| `noolingo-core/types` | 适配器与公共类型 |

完整列表以 `package.json` 中 `exports` 为准。

### 4. 本地跑通最小示例

仓库内可用 stub 适配器验证注入与 `init` 流程（具体路径以仓库为准）：

```bash
npm install
npm run build
npm run example
```

Stub 未实现真实网络/后端时，`init` 可能抛错或告警，属预期；重点是确认**先注入适配器、再加载门面**的顺序。

---

## 发布到 npm 时打进包里的内容

在 `package.json` 里用 **`"files": ["dist", "README.md", "LICENSE"]`** 声明：发布 tarball **只包含编译产物 `dist/`**，以及 **`README.md` / `LICENSE` / `package.json`**（后三者中 README、LICENSE 也会被 npm 默认带上，这里写进 `files` 仅为明示）。

**不会**发布：`src/`、`example/`、`scripts/`、配置文件等（见 `.npmignore`）。发布前 `prepublishOnly` 会执行 `npm run build`，请先保证能成功构建。

---

## 本地开发

```bash
npm install
npm run build
npm run typecheck
```

---

## 协议

MIT，见 [LICENSE](./LICENSE)。
