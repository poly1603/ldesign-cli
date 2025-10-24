# LDesign CLI 快速开始指南

> 5 分钟快速上手 LDesign CLI 工具

## 📦 安装

### 方式 1: 全局安装 (推荐给用户)

```bash
npm install -g @ldesign/cli

# 或使用 pnpm
pnpm add -g @ldesign/cli
```

### 方式 2: 本地开发 (推荐给开发者)

```bash
# 克隆项目
cd tools/cli

# 安装依赖
npm install

# 安装前端依赖
cd src/web && npm install && cd ../..
```

## 🚀 启动

### 用户模式 (全局安装后)

```bash
# 启动可视化界面
ldesign ui

# 指定端口
ldesign ui --port 8080

# 不自动打开浏览器
ldesign ui --no-open

# 调试模式
ldesign ui --debug
```

### 开发模式 (本地开发)

```bash
# 一键启动 (推荐)
npm run dev
```

这会自动启动：
- 🔌 后端服务器: `http://localhost:3000`
- 🌐 前端开发服务器: `http://localhost:5173`

**访问**: 打开浏览器访问 http://localhost:5173

### 生产模式 (测试打包后的版本)

```bash
# 1. 构建
npm run build

# 2. 启动
npm start

# 或直接运行
node dist/cli/index.js ui
```

**访问**: 打开浏览器访问 http://localhost:3000

## 🎯 主要功能

### 1. 项目管理

- **导入项目**: 从现有目录导入项目
- **创建项目**: 从模板创建新项目
- **项目列表**: 查看和管理所有项目
- **项目详情**: 查看项目统计和操作历史

### 2. 工具集成

内置 11 个专业工具:
- 🔨 **Builder** - 智能构建工具
- 🚀 **Launcher** - 项目启动器
- 🧪 **Tester** - 测试工具集
- 📊 **Analyzer** - 代码分析
- 🌐 **Deployer** - 部署工具
- 📚 **Docs Generator** - 文档生成
- ⚡ **Generator** - 代码生成器
- 📦 **Git** - Git 操作
- 📈 **Monitor** - 性能监控
- 🔒 **Security** - 安全扫描
- 📦 **Deps** - 依赖管理

### 3. 实时通信

- WebSocket 实时推送工具执行状态
- 实时日志输出
- 进度条显示

## ⚙️ 配置

### 创建配置文件

在项目根目录创建 `.ldesignrc.json`:

```json
{
  "defaultPort": 3000,
  "defaultHost": "0.0.0.0",
  "autoOpen": true,
  "debug": false,
  "logLevel": "info",
  "recentProjectsLimit": 10
}
```

### 配置说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `defaultPort` | number | 3000 | 默认端口 |
| `defaultHost` | string | "0.0.0.0" | 默认主机 |
| `autoOpen` | boolean | true | 自动打开浏览器 |
| `debug` | boolean | false | 调试模式 |
| `logLevel` | string | "info" | 日志级别 |
| `recentProjectsLimit` | number | 10 | 最近项目数量 |

## 🐛 常见问题

### 问题 1: 端口被占用

```bash
# 使用其他端口
ldesign ui --port 8080
```

### 问题 2: API 请求失败

**开发模式:**
1. 确认后端服务器已启动 (端口 3000)
2. 检查浏览器控制台错误
3. 启用调试模式: `npm run dev:server -- --debug`

**生产模式:**
1. 确认构建成功: `npm run build`
2. 验证构建产物: 会自动运行验证
3. 重新启动: `npm start`

### 问题 3: 页面空白

1. 清除浏览器缓存 (Ctrl+Shift+R)
2. 检查控制台错误
3. 确认静态资源已构建: `ls dist/web/index.html`

### 问题 4: WebSocket 连接失败

1. 检查防火墙设置
2. 禁用全局代理或添加例外
3. 查看浏览器控制台 WebSocket 错误

## 📚 更多文档

- [完整开发文档](./docs/DEVELOPMENT.md)
- [故障排除指南](./docs/TROUBLESHOOTING_NEW.md)
- [实施完成报告](./IMPLEMENTATION_COMPLETE.md)
- [README](./README.md)

## 💡 开发技巧

### 调试模式

```bash
# 启用详细日志
ldesign ui --debug

# 开发模式调试
npm run dev:server -- --debug
```

### 查看版本

```bash
ldesign --version
```

### 查看帮助

```bash
ldesign --help
ldesign ui --help
```

### 热重载

开发模式下，修改代码会自动重载：
- **前端**: Vite HMR，无需刷新
- **后端**: tsx watch，自动重启

## 🔧 开发者模式

### 目录结构

```
tools/cli/
├── src/
│   ├── cli/          # CLI 命令
│   ├── core/         # 核心业务
│   ├── server/       # 后端服务
│   ├── web/          # 前端应用
│   └── shared/       # 共享代码
├── scripts/          # 构建脚本
└── dist/            # 构建产物
```

### 添加新命令

1. 创建命令文件 `src/cli/commands/your-command.ts`
2. 实现 `CommandHandler` 接口
3. 在 `src/cli/index.ts` 注册命令

参考 [开发文档](./docs/DEVELOPMENT.md#添加新命令)

### 构建脚本

```bash
# 清理
npm run clean

# 构建前端
npm run build:web

# 构建 CLI
npm run build:cli

# 复制前端产物
npm run copy:web

# 完整构建 (包含以上所有步骤)
npm run build

# 验证构建
node scripts/verify-build.js
```

## ✅ 检查清单

启动前确认:

- [ ] Node.js >= 18.0.0
- [ ] npm >= 8.0.0 或 pnpm >= 8.0.0
- [ ] 端口 3000 和 5173 未被占用
- [ ] 依赖已安装完成
- [ ] (生产模式) 已构建产物

## 🎉 开始使用

现在你已经准备好开始使用 LDesign CLI 了！

```bash
# 启动开发模式
npm run dev

# 或全局模式
ldesign ui
```

打开浏览器，享受可视化的项目管理体验！

---

**需要帮助?** 查看 [故障排除指南](./docs/TROUBLESHOOTING_NEW.md)  
**想要贡献?** 查看 [开发文档](./docs/DEVELOPMENT.md)


