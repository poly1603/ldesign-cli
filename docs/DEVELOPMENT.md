# LDesign CLI 开发指南

> 面向 CLI 工具开发者和贡献者的完整开发文档

## 🏗️ 项目架构

### 目录结构

```
tools/cli/
├── bin/                    # CLI 可执行文件
│   └── cli.js             # 入口脚本
├── src/
│   ├── cli/               # CLI 命令层
│   │   ├── CommandRegistry.ts   # 命令注册器
│   │   ├── commands/      # 命令实现
│   │   │   └── ui.ts     # UI 命令
│   │   └── index.ts      # CLI 入口
│   ├── core/             # 核心业务层
│   │   ├── config/       # 配置管理
│   │   ├── database/     # 数据库管理
│   │   ├── project/      # 项目管理
│   │   ├── tool-manager/ # 工具管理器
│   │   └── workflow/     # 工作流引擎
│   ├── server/           # Express 后端服务
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   └── websocket/    # WebSocket
│   ├── web/              # Vue3 前端项目
│   │   ├── src/
│   │   │   ├── api/      # API 客户端
│   │   │   ├── components/ # Vue 组件
│   │   │   ├── config/   # 环境配置
│   │   │   ├── router/   # 路由
│   │   │   ├── store/    # 状态管理
│   │   │   └── views/    # 页面
│   │   └── vite.config.ts
│   └── shared/           # 共享代码
│       ├── constants/    # 常量
│       ├── types/        # 类型定义
│       └── utils/        # 工具函数
├── scripts/              # 构建脚本
│   ├── dev.js           # 开发模式启动
│   ├── copy-web-dist.js # 复制前端构建产物
│   └── verify-build.js  # 验证构建完整性
└── dist/                 # 构建输出
    ├── cli/             # CLI 代码
    ├── server/          # 服务器代码
    ├── core/            # 核心代码
    └── web/             # 前端资源
```

### 技术栈

**后端:**
- **Node.js 18+** - 运行时环境
- **TypeScript** - 类型安全
- **Express.js** - Web 服务器
- **better-sqlite3** - 本地数据库
- **ws** - WebSocket 通信
- **cac** - CLI 参数解析
- **chalk** - 终端样式
- **tsup** - TypeScript 打包工具

**前端:**
- **Vue 3** - 渐进式框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Naive UI** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端

## 🚀 快速开始

### 1. 安装依赖

```bash
# 根目录安装 CLI 依赖
cd tools/cli
npm install

# 安装前端依赖
cd src/web
npm install
cd ../..
```

### 2. 开发模式

```bash
# 一键启动开发环境（推荐）
npm run dev

# 或分别启动
npm run dev:server  # 仅后端
npm run dev:web     # 仅前端
```

开发模式会启动：
- 后端服务器: `http://localhost:3000`
- 前端开发服务器: `http://localhost:5173`

前端会自动代理 `/api` 请求到后端。

### 3. 构建

```bash
# 完整构建（推荐）
npm run build

# 分步构建
npm run build:web   # 构建前端
npm run build:cli   # 构建 CLI
npm run copy:web    # 复制前端产物
```

构建完成后，产物在 `dist/` 目录。

### 4. 测试构建产物

```bash
# 启动生产模式
npm start

# 或
node dist/cli/index.js ui
```

访问 `http://localhost:3000`

## 🔧 开发指南

### 添加新命令

1. **创建命令文件** `src/cli/commands/your-command.ts`:

```typescript
import type { CAC } from 'cac'
import type { CommandHandler } from '../CommandRegistry'
import { logger } from '../../shared/utils'

export interface YourCommandOptions {
  // 定义选项
  option1?: string
  option2?: boolean
}

export async function yourCommand(options: YourCommandOptions = {}): Promise<void> {
  // 实现命令逻辑
  logger.info('执行你的命令...')
}

export const yourCommandHandler: CommandHandler = {
  name: 'your-command',
  description: '你的命令描述',

  setup(cli: CAC) {
    cli
      .command('your-command', '你的命令描述')
      .option('--option1 <value>', '选项1说明')
      .option('--option2', '选项2说明')
      .action(async (options) => {
        try {
          await yourCommand(options)
        } catch (error) {
          logger.error('命令执行失败:', error)
          process.exit(1)
        }
      })
  },

  async execute(options: YourCommandOptions) {
    return yourCommand(options)
  },
}
```

2. **注册命令** `src/cli/index.ts`:

```typescript
import { yourCommandHandler } from './commands/your-command'

// 在 createCLI 函数中
registry.register(yourCommandHandler)
```

### 添加 API 路由

1. **创建路由文件** `src/server/routes/your-route.ts`:

```typescript
import { Router } from 'express'
import type { Request, Response } from 'express'
import type { ApiResponse } from '../../shared/types'

export const yourRouter = Router()

yourRouter.get('/endpoint', async (req: Request, res: Response) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: { /* your data */ },
      timestamp: Date.now(),
    }
    res.json(response)
  } catch (error) {
    throw error
  }
})
```

2. **注册路由** `src/server/app.ts`:

```typescript
import { yourRouter } from './routes/your-route'

// 在 createExpressServer 函数中
app.use('/api/your-route', yourRouter)
```

### 添加前端页面

1. **创建页面** `src/web/src/views/YourPage.vue`:

```vue
<template>
  <div>
    <h1>Your Page</h1>
  </div>
</template>

<script setup lang="ts">
// Your logic
</script>
```

2. **添加路由** `src/web/src/router/index.ts`:

```typescript
const routes: RouteRecordRaw[] = [
  // ...
  {
    path: '/your-page',
    name: 'YourPage',
    component: () => import('../views/YourPage.vue'),
  },
]
```

### 配置管理

使用配置管理器读取/保存配置：

```typescript
import { getConfigManager } from '../core/config'

const configManager = getConfigManager()

// 加载配置
const config = configManager.loadConfig()

// 读取配置项
const port = configManager.get('defaultPort')

// 更新配置
configManager.update({ defaultPort: 8080 })

// 保存配置
configManager.saveConfig()
```

配置文件位置: `.ldesignrc.json`

## 🐛 调试技巧

### 1. 启用调试模式

```bash
# 开发模式
npm run dev:server -- --debug

# 生产模式
node dist/cli/index.js ui --debug
```

### 2. 查看日志

前端调试（浏览器控制台）:
```javascript
// 自动输出详细日志
[ApiClient] 请求: GET /api/projects
[ApiClient] 响应: /api/projects {...}
```

后端调试:
```bash
[Server] 尝试查找静态资源...
[Server] 检查路径: /path/to/dist/web
[Server] 找到静态资源: /path/to/dist/web
```

### 3. 使用 TypeScript 类型检查

```bash
npm run type-check
```

### 4. VSCode 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "runtimeExecutable": "tsx",
      "runtimeArgs": ["src/cli/index.ts", "ui", "--debug"],
      "cwd": "${workspaceFolder}/tools/cli",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## 📝 代码规范

### TypeScript 规范

- 使用严格模式
- 导出类型使用 `export type`
- 接口命名使用 PascalCase
- 函数使用 camelCase

### 提交规范

遵循 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

示例:
```
feat(cli): 添加 create 命令

添加从模板创建项目的功能

Closes #123
```

## 🧪 测试

```bash
# 运行测试
npm test

# 类型检查
npm run type-check
```

## 📦 发布

1. 更新版本号

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

2. 构建

```bash
npm run build
```

3. 发布

```bash
npm publish
```

## 🔗 相关资源

- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vue 3 文档](https://vuejs.org/)
- [Express 文档](https://expressjs.com/)
- [Vite 文档](https://vitejs.dev/)
- [Naive UI 文档](https://www.naiveui.com/)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## ❓ 常见问题

### Q: 开发模式下 API 请求失败？

A: 确保后端服务器已启动并监听 3000 端口。检查 Vite 代理配置。

### Q: 构建后静态资源 404？

A: 运行 `npm run verify-build` 检查构建产物完整性。

### Q: 如何添加新的工具包？

A: 在 `src/core/tool-manager/adapters/` 创建新的适配器，并在 `ToolManager.ts` 中注册。

### Q: WebSocket 连接失败？

A: 检查防火墙设置和代理配置。开发模式下确保前端直连 `ws://localhost:3000`。

---

**Happy Coding!** 🎉


