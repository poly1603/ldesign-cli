# @ldesign/cli

> 功能强大的前端项目管理工具，集成了11个专业工具包，提供可视化UI界面

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Tests](https://img.shields.io/badge/Tests-41%2F41%20Passing-brightgreen)
![Coverage](https://img.shields.io/badge/Type%20Coverage-95%25-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

📊 [**Project Status Dashboard**](./PROJECT_STATUS.md) | 📚 [**Documentation**](./docs/INDEX.md) | ⚡ [**CLI Reference**](./docs/CLI_REFERENCE.md)

## ✨ 特性

- 🎨 **可视化管理界面** - 基于 Vue 3 + Naive UI 的现代化界面
- 🔧 **11个集成工具** - Builder、Launcher、Tester、Analyzer 等
- 📦 **项目管理** - 导入、创建、检测项目类型
- 🚀 **实时反馈** - WebSocket 实时推送工具执行状态
- 🔌 **插件化设计** - 支持动态扩展新命令和工具
- 💾 **本地数据库** - SQLite 本地存储，数据永久保存
- ⚙️ **配置管理** - 灵活的配置系统，支持自定义
- 🏗️ **架构优秀** - 命令注册器、配置管理器、工具管理器

## 🚀 快速开始

### 安装

```bash
npm install -g @ldesign/cli
# 或
pnpm add -g @ldesign/cli
```

### 启动 UI 界面

```bash
ldesign ui
```

浏览器会自动打开 `http://localhost:3000`

### 命令行选项

```bash
# 指定端口
ldesign ui --port 8080

# 指定主机
ldesign ui --host 0.0.0.0

# 不自动打开浏览器
ldesign ui --no-open

# 调试模式
ldesign ui --debug
```

## 📖 文档

完整文档请查看 **[Documentation Index](./docs/INDEX.md)**

### 快速链接

- [优化总结](./OPTIMIZATION_SUMMARY.md) - 最新优化改进
- [开发指南](./docs/DEVELOPMENT.md) - 贡献代码
- [故障排除](./docs/archive/TROUBLESHOOTING.md) - 常见问题
- [Changelog](./CHANGELOG.md) - 版本历史

## 📖 使用指南

### 命令行

```bash
# 启动可视化界面
ldesign ui

# 指定端口
ldesign ui --port 8080

# 调试模式
ldesign ui --debug

# 不自动打开浏览器
ldesign ui --no-open
```

## 📖 开发模式

详细开发文档请参考 [DEVELOPMENT.md](./docs/DEVELOPMENT.md)

### 快速开始开发

```bash
# 进入项目目录
cd tools/cli

# 安装依赖
npm install

# 安装前端依赖
cd src/web && npm install && cd ../..

# 启动开发服务器（一键启动前后端）
npm run dev
```

开发服务器会自动启动：
- 🔌 后端 API 服务器: `http://localhost:3000`
- 🌐 前端开发服务器: `http://localhost:5173` (推荐访问)

前端会自动代理 API 请求到后端，支持热重载。

### 构建和部署

```bash
# 完整构建（推荐）
npm run build

# 验证构建产物
# 构建完成后会自动验证

# 启动生产服务器
npm start

# 或使用 node 直接启动
node dist/cli/index.js ui
```

### 构建流程说明

1. **清理旧产物**: `npm run clean`
2. **构建前端**: `cd src/web && npm run build`
3. **构建 CLI**: `tsup` (TypeScript 打包)
4. **复制前端产物**: 将 `src/web/dist` 复制到 `dist/web`
5. **验证完整性**: 检查所有必需文件是否存在

### 本地测试

```bash
# 方式1: 使用 npm start
npm run build
npm start

# 方式2: 全局链接测试
npm run build
npm link
ldesign ui

# 方式3: 直接运行
node dist/cli/index.js ui --debug
```

## 🏗️ 架构设计

```
@ldesign/cli/
├── src/
│   ├── cli/              # CLI 命令层
│   ├── core/             # 核心业务层
│   │   ├── database/     # 数据库管理
│   │   ├── project/      # 项目管理
│   │   └── tool-manager/ # 工具管理器
│   ├── server/           # Express 后端服务
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   └── websocket/    # WebSocket
│   ├── web/              # Vue3 前端项目
│   └── shared/           # 共享类型和工具
└── dist/                 # 构建输出
```

## 🔧 集成的工具

1. **@ldesign/builder** - 智能构建工具
2. **@ldesign/launcher** - 项目启动器
3. **@ldesign/tester** - 测试工具集
4. **@ldesign/analyzer** - 代码分析
5. **@ldesign/deployer** - 部署工具
6. **@ldesign/docs-generator** - 文档生成
7. **@ldesign/generator** - 代码生成器
8. **@ldesign/git** - Git 操作
9. **@ldesign/monitor** - 性能监控
10. **@ldesign/security** - 安全扫描
11. **@ldesign/deps** - 依赖管理

## 📊 功能特性

### 项目管理
- ✅ 从目录导入现有项目
- ✅ 基于模板创建新项目
- ✅ 自动检测项目类型/框架
- ✅ 项目操作历史记录
- ✅ 项目统计分析

### 可视化界面
- ✅ 仪表板概览
- ✅ 项目列表管理
- ✅ 项目详情页
- ✅ 工具状态监控
- ✅ 实时日志输出
- ✅ 深色/浅色主题

### 工具集成
- ✅ 统一的工具管理接口
- ✅ 工具状态健康检查
- ✅ 配置统一管理
- ✅ 事件驱动架构
- ✅ WebSocket 实时通信

## 🔌 API 文档

### REST API

```
GET    /api/projects           # 获取项目列表
POST   /api/projects/import    # 导入项目
POST   /api/projects/create    # 创建项目
GET    /api/projects/:id       # 获取项目详情
PUT    /api/projects/:id       # 更新项目
DELETE /api/projects/:id       # 删除项目

GET    /api/tools              # 获取工具列表
GET    /api/tools/:name/status # 获取工具状态
POST   /api/tools/:name/execute # 执行工具操作
```

### WebSocket

```javascript
// 连接
const ws = new WebSocket('ws://localhost:3000')

// 监听消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log(message.type, message.data)
}

// 消息类型
// - tool-progress: 工具执行进度
// - tool-log: 工具日志
// - tool-status: 工具状态变更
// - server-status: 服务器状态
```

## 🛠️ 开发指南

### 技术栈

**后端:**
- Node.js + TypeScript
- Express.js
- better-sqlite3
- WebSocket (ws)

**前端:**
- Vue 3 + TypeScript
- Vite
- Naive UI
- Pinia
- Vue Router

### 项目结构

详见 [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

## 📝 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📮 联系方式

- 项目地址: https://github.com/your-org/ldesign
- 问题反馈: https://github.com/your-org/ldesign/issues

---

Made with ❤️ by LDesign Team
