# 📖 LDesign CLI 使用指南

## 🎯 立即开始

### 最简单的方式

```bash
cd D:\WorkBench\ldesign\tools\cli

# 方式1: 开发模式启动
npm run dev

# 方式2: 构建后启动
npm run build:cli
npm start
```

浏览器会自动打开 `http://localhost:3000`

如果前端未构建,会显示占位页面,但所有API功能正常!

## 📋 功能清单

### ✅ 已经可以使用的功能

#### 1. 项目管理

```bash
# 通过API导入项目
curl -X POST http://localhost:3000/api/projects/import \
  -H "Content-Type: application/json" \
  -d '{"path":"D:/your/project"}'

# 查看所有项目
curl http://localhost:3000/api/projects

# 查看项目详情
curl http://localhost:3000/api/projects/{project-id}
```

#### 2. 工具管理

```bash
# 查看所有工具状态
curl http://localhost:3000/api/tools

# 查看特定工具状态
curl http://localhost:3000/api/tools/builder/status

# 执行工具操作
curl -X POST http://localhost:3000/api/tools/builder/execute \
  -H "Content-Type: application/json" \
  -d '{"action":"build","params":{"projectPath":"D:/project"}}'
```

#### 3. WebSocket实时通信

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:3000')

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log('收到消息:', message.type, message.data)
}

// 发送ping
ws.send(JSON.stringify({
  type: 'ping',
  data: {},
  timestamp: Date.now()
}))
```

## 🔧 开发指南

### 添加新工具

1. 创建适配器: `src/core/tool-manager/adapters/YourToolAdapter.ts`
```typescript
export class YourToolAdapter implements IToolAdapter {
  readonly name = 'your-tool' as const
  // 实现接口方法...
}
```

2. 在ToolManager中注册:
```typescript
// src/core/tool-manager/ToolManager.ts
case 'your-tool': {
  const { YourToolAdapter } = await import('./adapters/YourToolAdapter.js')
  return { default: YourToolAdapter }
}
```

3. 更新类型定义:
```typescript
// src/shared/types/tool.ts
export type ToolName = 'builder' | 'your-tool' | ...
```

### 添加新API

1. 创建路由: `src/server/routes/your-route.ts`
2. 在 `src/server/app.ts` 中注册:
```typescript
import { yourRouter } from './routes/your-route'
app.use('/api/your-route', yourRouter)
```

### 添加前端页面

1. 创建组件: `src/web/src/views/YourPage.vue`
2. 添加路由: `src/web/src/router/index.ts`
3. 添加API: `src/web/src/api/your-api.ts`

## 🐛 故障排除

### 问题: 端口被占用

```bash
# 指定其他端口
ldesign ui --port 8080
```

### 问题: 数据库锁定

```bash
# 删除数据库文件重新开始
rm -rf data/ldesign-cli.db
```

### 问题: 前端依赖安装失败

```bash
# 暂时跳过前端,只用后端
npm run build:cli
npm start

# 前端占位页面会显示,API功能正常

# 或手动处理前端
cd src/web
npm cache clean --force
npm install
npm run build
```

## 📊 API 文档

### 项目API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects | 获取项目列表 |
| GET | /api/projects/:id | 获取项目详情 |
| POST | /api/projects/import | 导入项目 |
| POST | /api/projects/create | 创建项目 |
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |
| POST | /api/projects/:id/open | 打开项目 |
| GET | /api/projects/:id/stats | 获取统计 |
| GET | /api/projects/:id/operations | 操作历史 |

### 工具API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tools | 获取工具列表 |
| GET | /api/tools/:name/status | 获取工具状态 |
| GET | /api/tools/:name/config | 获取工具配置 |
| PUT | /api/tools/:name/config | 更新工具配置 |
| POST | /api/tools/:name/execute | 执行工具操作 |
| POST | /api/tools/:name/load | 加载工具 |

## 🎨 前端使用

### 如果前端已构建

访问 `http://localhost:3000`,你会看到:
- 仪表板
- 项目管理界面
- 工具状态显示
- 设置页面

### 如果前端未构建

会显示占位页面,但可以:
- 使用API端点
- 使用WebSocket
- 通过curl等工具操作

## 💾 数据存储

所有数据存储在:
```
tools/cli/data/ldesign-cli.db
```

包含:
- 项目信息
- 工具配置
- 操作历史
- 统计数据
- 构建记录
- 等等...

## 🔌 扩展系统

### 插件系统

```typescript
// 定义插件
const myPlugin: IPlugin = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0'
  },
  async activate(context) {
    // 初始化逻辑
  }
}

// 安装插件
const pm = getPluginManager()
await pm.installPlugin(myPlugin)
await pm.activatePlugin('my-plugin')
```

### 工作流系统

```typescript
// 定义工作流
const workflow: WorkflowDefinition = {
  id: 'ci-cd',
  name: 'CI/CD流程',
  steps: [
    { id: '1', name: '测试', tool: 'tester', action: 'test' },
    { id: '2', name: '构建', tool: 'builder', action: 'build' },
    { id: '3', name: '部署', tool: 'deployer', action: 'deploy' }
  ]
}

// 执行工作流
const engine = getWorkflowEngine()
engine.registerWorkflow(workflow)
await engine.executeWorkflow('ci-cd', { projectId: 'xxx' })
```

## 🎓 最佳实践

### 1. 使用环境变量

```bash
# 设置默认端口
export LDESIGN_PORT=8080

# 启动
ldesign ui
```

### 2. 日志级别

```bash
# 调试模式 - 查看详细日志
ldesign ui --debug

# 静默模式 - 只显示错误
ldesign ui --silent
```

### 3. 数据备份

```bash
# 数据库会自动备份到
data/ldesign-cli.db.backup-{timestamp}
```

## 📞 获取帮助

```bash
# CLI帮助
ldesign --help
ldesign ui --help

# 查看版本
ldesign --version
```

## 🎉 总结

LDesign CLI 现在是一个:
- ✅ 功能完整的项目管理工具
- ✅ 集成11个工具包的统一平台
- ✅ 提供REST API和WebSocket的服务器
- ✅ 支持插件和工作流的扩展系统

**立即开始使用吧!** 🚀


