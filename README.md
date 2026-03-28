# noolingo-core

Noolingo 共享业务内核：通过 `Noolingo` 聚合服务、stores、配置与访问统计；宿主应用注入 `NoolingoAdapter` 完成平台能力解耦。

## 安装

```bash
npm install noolingo-core
```

## 发布到 npm 时打进包里的内容

在 `package.json` 里用 **`"files": ["dist", "README.md", "LICENSE"]`** 声明：发布 tarball **只包含编译产物 `dist/`**，以及 **`README.md` / `LICENSE` / `package.json`**（后三者中 README、LICENSE 也会被 npm 默认带上，这里写进 `files` 仅为明示）。

**不会**发布：`src/`、`example/`、`scripts/`、配置文件等（见 `.npmignore`）。发布前 `prepublishOnly` 会执行 `npm run build`，请先保证能成功构建。

## 使用概要

```ts
import Noolingo from 'noolingo-core';
import type { NoolingoAdapter } from 'noolingo-core/types';

const adapter: NoolingoAdapter = {
  // audio, file, config, notification, localDatabase, device, appConfig — 见类型定义
};

const noolingo = new Noolingo(adapter);
await noolingo.init();
// noolingo.service / noolingo.stores / noolingo.config / noolingo.visit
```

子路径导出（与 `package.json` 的 `exports` 一致），例如：

- `noolingo-core/convert`
- `noolingo-core/deck`
- `noolingo-core/services`
- `noolingo-core/stores`
- `noolingo-core/types`
- 等

## 本地开发

```bash
npm install
npm run build
npm run typecheck
```

## 协议

MIT，见 [LICENSE](./LICENSE)。
