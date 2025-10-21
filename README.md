# @ldesign/cli

LDesign 设计系统命令行工具 - 提供强大的 UI 管理界面和开发工具

## 🌟 功能特性

- 🚀 **UI 管理界面** - 基于 Vue 3 的现代化管理界面
- 📦 **项目管理** - 项目创建、配置和监控
- 🔧 **开发工具** - 构建工具、测试工具集成
- 📊 **实时监控** - WebSocket 实时状态更新
- 🎨 **组件库** - 组件预览和管理
- ⚙️ **系统设置** - 灵活的配置管理

## 📦 安装

### 全局安装（推荐）

```bash
# 使用 pnpm
pnpm add -g @ldesign/cli

# 使用 npm
npm install -g @ldesign/cli

# 使用 yarn
yarn global add @ldesign/cli
```

### 项目内安装

```bash
# 使用 pnpm
pnpm add -D @ldesign/cli

# 使用 npm
npm install -D @ldesign/cli
```

## 🚀 快速开始

### 启动 UI 管理界面

```bash
# 基本用法
ldesign ui

# 指定端口和主机
ldesign ui --port 3000 --host localhost

# 调试模式
ldesign ui --debug

# 静默模式
ldesign ui --silent

# 不自动打开浏览器
ldesign ui --no-open
```

### 命令选项

| 选项 | 简写 | 默认值 | 描述 |
|------|------|--------|------|
| `--port` | `-p` | `3000` | 指定服务器端口 |
| `--host` | `-h` | `localhost` | 指定服务器主机 |
| `--debug` | - | `false` | 启用调试模式 |
| `--silent` | - | `false` | 静默模式（不输出日志） |
| `--no-open` | - | `false` | 不自动打开浏览器 |

## 🏗️ 架构设计

### 技术栈

- **后端**: Express.js + WebSocket
- **前端**: Vue 3 + TypeScript + Vue Router
- **构建**: Vite + @ldesign/builder
- **测试**: Vitest
- **样式**: Less + LDesign 设计系统

## 🏗️ 项目结构

```
packages/cli/
├── src/
│   ├── commands/          # CLI 命令实现
│   │   ├── ui.ts         # UI 命令
│   │   └── index.ts      # 命令导出
│   ├── server/           # Express 服务器
│   │   ├── app.ts        # 服务器主文件
│   │   └── routes/       # API 路由
│   ├── web/              # Vue 前端项目
│   │   ├── src/          # Vue 源码
│   │   ├── public/       # 静态资源
│   │   └── index.html    # 入口页面
│   ├── utils/            # 工具函数
│   └── index.ts          # 主入口
├── bin/
│   └── cli.js            # 可执行文件
├── dist/                 # 构建输出
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 开发

### 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm type-check
```

### 调试

在 `app` 目录中使用开发脚本可以直接调试 CLI 源码：

```bash
# 使用源码启动 UI
pnpm ui:dev
```

## 📚 API 文档

### CLI 命令

- `ldesign ui` - 打开 UI 管理界面
- `ldesign --help` - 显示帮助信息
- `ldesign --version` - 显示版本信息

### 服务器 API

- `GET /api/health` - 健康检查
- `GET /api/info` - 获取系统信息
- `POST /api/projects` - 创建项目

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行单次测试
pnpm test:run
```

## 📄 许可证

MIT License
