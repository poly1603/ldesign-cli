# 🚀 CLI 工具集成快速入门

## 简介

LDesign CLI 现已集成工具服务平台，提供统一的可视化界面管理构建、分析、部署等开发工具。

## 快速开始

### 1. 安装依赖

```bash
cd tools/cli
pnpm install
```

### 2. 启动服务

```bash
# 开发模式（推荐）
pnpm dev

# 访问地址会自动显示在终端
# 默认: http://localhost:3000
```

### 3. 访问界面

打开浏览器访问 `http://localhost:3000`，导航到：

- **构建管理**: `/builds` - 管理项目构建任务

## 功能演示

### Builder（构建工具）✅

#### 通过 UI 创建构建

1. 访问 `http://localhost:3000/builds`
2. 点击"新建构建"按钮
3. 填写表单：
   - 选择项目
   - 输入项目路径（例如：`/path/to/your/project`）
   - 配置构建选项：
     - 输出目录：`dist`
     - 构建模式：生产模式
     - 输出格式：ESM + CJS
     - 启用选项：Sourcemap、压缩、类型声明
4. 点击"开始构建"
5. 实时查看构建进度和结果

#### 通过 API 创建构建

```bash
curl -X POST http://localhost:3000/api/builder/build \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-project-id",
    "config": {
      "projectPath": "/path/to/project",
      "outDir": "dist",
      "mode": "production",
      "formats": ["esm", "cjs"],
      "sourcemap": true,
      "minify": true,
      "dts": true
    }
  }'
```

#### 查看构建历史

```bash
# 获取所有构建记录
curl http://localhost:3000/api/builder/builds/my-project-id

# 查看特定构建详情
curl http://localhost:3000/api/builder/build/build-xxx
```

## API 端点

### Builder API

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/builder/build` | 启动构建任务 |
| GET | `/api/builder/builds/:projectId` | 获取项目构建历史 |
| GET | `/api/builder/build/:buildId` | 获取构建详情 |
| DELETE | `/api/builder/build/:buildId` | 删除构建记录 |

## 项目结构

```
tools/cli/
├── src/
│   ├── server/              # 后端服务
│   │   ├── database/        # 数据库管理
│   │   ├── services/        # 工具服务
│   │   │   ├── types.ts            # 类型定义
│   │   │   ├── tool-service-manager.ts  # 服务管理器
│   │   │   └── builder-service.ts       # Builder服务
│   │   └── routes/          # API 路由
│   │       └── builder.ts           # Builder API
│   └── web/                 # 前端界面
│       └── src/
│           └── views/
│               └── BuildManager.vue  # 构建管理页
├── package.json             # 已添加11个工具包依赖
└── INTEGRATION_PROGRESS.md  # 详细进度报告
```

## 核心特性

### 1. 服务化架构
- 每个工具作为独立服务
- 统一的服务管理器
- 健康检查机制（60秒间隔）

### 2. 数据持久化
- SQLite 数据库存储
- 完整的构建历史
- 构建配置和日志

### 3. 实时进度
- WebSocket 事件推送
- 构建进度实时更新
- 状态自动同步

### 4. 模拟模式
- 支持在没有实际工具包时运行
- 模拟构建过程
- 用于开发和测试

## 开发模式

### 前端开发

```bash
cd src/web
pnpm dev
```

前端开发服务器：`http://localhost:5173`

### 后端开发

```bash
pnpm dev:server
```

后端服务器：`http://localhost:3000`

### 同时开发

```bash
pnpm dev
```

同时启动前后端，前端代理 API 请求到后端。

## 配置选项

### 构建配置示例

```typescript
{
  projectPath: '/path/to/project',  // 项目路径（必需）
  outDir: 'dist',                   // 输出目录（可选，默认 dist）
  mode: 'production',               // 构建模式（development|production）
  formats: ['esm', 'cjs', 'umd'],   // 输出格式
  sourcemap: true,                  // 生成 sourcemap
  minify: true,                     // 代码压缩
  dts: true,                        // 生成类型声明
  clean: true,                      // 清理输出目录
  external: ['vue', 'react']        // 外部依赖
}
```

## 状态说明

### 构建状态

- `pending` - 等待中
- `running` - 构建中
- `success` - 成功
- `failed` - 失败
- `cancelled` - 已取消

### 服务状态

- `active` - 活跃
- `inactive` - 未激活
- `error` - 错误
- `initializing` - 初始化中

## 故障排查

### 问题 1: 端口被占用

```bash
# 使用其他端口
ldesign ui --port 3001
```

### 问题 2: 数据库初始化失败

删除数据库文件重试：

```bash
rm -rf data/
pnpm dev
```

### 问题 3: 前端构建失败

```bash
cd src/web
rm -rf node_modules dist
pnpm install
pnpm build
```

### 问题 4: Builder 模块加载失败

这是正常的！Builder 服务会自动切换到模拟模式：

```
[BuilderService] Builder 模块加载失败，服务将以模拟模式运行
```

模拟模式提供完整的 UI 功能和 API，只是使用模拟的构建过程。

## 下一步

### 即将推出 🚧

1. **Analyzer** - 代码分析工具
   - Bundle 分析
   - 依赖关系图
   - 代码质量报告

2. **Deployer** - 部署工具
   - 多环境部署
   - 蓝绿/金丝雀发布
   - 回滚管理

3. **Workflow** - 工作流引擎
   - 可视化流程编排
   - 一键式 CI/CD
   - 自定义工作流

### 贡献指南

欢迎贡献！添加新服务的步骤：

1. 创建服务适配器（`src/server/services/xxx-service.ts`）
2. 实现 `IToolService` 接口
3. 创建 API 路由（`src/server/routes/xxx.ts`）
4. 创建 UI 界面（`src/web/src/views/XxxManager.vue`）
5. 注册服务和路由

详细说明请参考 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 相关文档

- [完整实施计划](./cli----.plan.md)
- [实施总结](./IMPLEMENTATION_SUMMARY.md)
- [进度报告](./INTEGRATION_PROGRESS.md)
- [CLI 文档](./README.md)

## 技术支持

- 查看日志：服务器启动时会显示详细日志
- 调试模式：`ldesign ui --debug`
- 问题反馈：创建 GitHub Issue

## 版本信息

- **当前版本**: v0.1.0-alpha
- **已集成工具**: Builder ✅
- **待集成工具**: Analyzer, Deployer, Tester, Docs-generator, Generator, Deps, Launcher, Monitor, Security
- **完成度**: 24% (5/21 tasks)

---

**Happy Building! 🎉**


