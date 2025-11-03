# LDesign CLI 快速开始指南

## 🚀 快速运行

### 方式一:开发模式(推荐)

```bash
# 在 tools/cli 目录下
npm run dev
```

这将直接启动CLI并打开UI界面(不需要构建)

### 方式二:构建后运行

```bash
# 1. 构建CLI
npm run build:cli

# 2. 运行
node dist/cli/index.js ui
```

## 📦 完整构建流程

### 前提条件

由于workspace的pnpm依赖问题,前端暂时需要单独处理:

```bash
# 方法1: 手动安装前端依赖
cd src/web
# 如果npm有问题,可以尝试:
# - 清除npm缓存: npm cache clean --force
# - 或使用yarn: yarn install
npm install
npm run build
cd ../..

# 方法2: 暂时跳过前端,使用占位页面
# CLI已包含占位页面,可以直接运行
```

### 构建所有

```bash
# 如果前端已构建
npm run build

# 只构建CLI(后端)
npm run build:cli
```

## 🎯 当前可用功能

### CLI命令

```bash
# 查看帮助
node dist/cli/index.js --help

# 启动UI
node dist/cli/index.js ui

# 指定端口
node dist/cli/index.js ui --port 8080

# 调试模式
node dist/cli/index.js ui --debug

# 不自动打开浏览器
node dist/cli/index.js ui --no-open
```

### API 端点

服务器启动后可以访问:

```bash
# 项目管理
curl http://localhost:3000/api/projects
curl -X POST http://localhost:3000/api/projects/import -H "Content-Type: application/json" -d "{\"path\":\"D:/some/project\"}"

# 工具管理
curl http://localhost:3000/api/tools
curl http://localhost:3000/api/tools/builder/status
```

## 🏗️ 项目结构

```
tools/cli/
├── src/
│   ├── cli/              # CLI 命令层 ✅
│   ├── core/             # 核心业务层 ✅
│   │   ├── database/     # 数据库 ✅
│   │   ├── project/      # 项目管理 ✅
│   │   ├── tool-manager/ # 工具管理器 ✅
│   │   ├── workflow/     # 工作流引擎 ✅
│   │   └── plugin/       # 插件系统 ✅
│   ├── server/           # Express 后端 ✅
│   ├── shared/           # 共享模块 ✅
│   └── web/              # Vue3 前端 ✅
├── dist/                 # 构建输出 ✅
├── bin/cli.js            # CLI 入口 ✅
└── package.json          ✅
```

## ✅ 已实现的功能

### 后端 (100%)
- ✅ Express 服务器
- ✅ 项目管理 API (9个端点)
- ✅ 工具管理 API (6个端点)
- ✅ WebSocket 实时通信
- ✅ better-sqlite3 数据库
- ✅ 11个工具适配器
- ✅ 工作流引擎
- ✅ 插件系统

### 前端 (基础版)
- ✅ Vue3 + Vite 配置
- ✅ Naive UI 集成
- ✅ 项目管理页面
- ✅ 工具状态显示
- ✅ API 客户端
- ✅ Pinia 状态管理
- ✅ WebSocket客户端

### CLI (100%)
- ✅ UI 命令
- ✅ 端口自动检测
- ✅ 浏览器自动打开
- ✅ 调试模式

## 🔧 开发指南

### 修改后端代码

```bash
# 修改后重新构建
npm run build:cli

# 或使用watch模式
npx tsup --watch
```

### 修改前端代码

```bash
cd src/web
npm run dev  # 启动前端开发服务器(端口5173)

# 在另一个终端
cd ../..
npm run dev  # 启动后端(端口3000)

# 前端会自动代理API请求到后端
```

## 🐛 常见问题

### Q: npm install 失败?

A: 尝试以下方法:
```bash
# 方法1: 清除缓存
npm cache clean --force
npm install

# 方法2: 使用yarn
yarn install

# 方法3: 跳过前端,直接运行后端
npm run build:cli
node dist/cli/index.js ui
# 会显示占位页面,但API正常工作
```

### Q: 如何测试API?

A: 启动服务器后:
```bash
# 使用curl
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/tools

# 或在浏览器中直接访问
http://localhost:3000/api/projects
```

### Q: 数据存储在哪里?

A: SQLite 数据库文件在:
```
tools/cli/data/ldesign-cli.db
```

## 🎉 下一步

1. ✅ CLI后端已完全可用
2. 🔧 前端需要安装依赖并构建
3. 🚀 可以开始添加具体的工具功能了!

---

**当前状态**: 核心架构完成,可以开始开发具体业务功能!


