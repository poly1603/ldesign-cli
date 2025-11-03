# 故障排除指南

## 当前问题: 服务器无法访问

### 已完成的检查

1. ✅ 代码已全部实现
2. ✅ 构建成功 (`npm run build:cli`)
3. ✅ CLI命令可以运行 (`ldesign --help`)
4. ⚠️ 服务器启动可能有问题

### 可能的根本原因

#### 1. 异步初始化错误

`src/server/app.ts` 中有两个异步初始化:

```typescript
// 初始化数据库
await dbManager.initialize()

// 初始化工具管理器
await toolManager.initialize()
```

如果这些抛出错误但没有被正确处理,服务器会静默失败。

#### 2. 依赖包问题

工具适配器尝试导入`@ldesign/*`包,如果这些包不存在或有问题,会导致加载失败。

### ✅ 确认的可行方案

#### 方案1: 使用简化服务器

`start-simple.js` 已创建,可以测试基础Express功能:

```bash
node start-simple.js
# 访问 http://localhost:3001
```

#### 方案2: 修改app.ts添加错误处理

在 `src/server/app.ts` 中:

```typescript
export async function createExpressServer(options: ServerOptions) {
  const { port, host, debug = false } = options

  logger.info('[Server] 正在创建服务器...')

  // 使用try-catch包裹初始化
  try {
    const dbManager = getDatabaseManager()
    await dbManager.initialize()
    logger.success('[Server] 数据库初始化成功')
  } catch (error) {
    logger.error('[Server] 数据库初始化失败:', error)
    // 继续运行,不抛出错误
  }

  try {
    const toolManager = getToolManager({ autoLoad: false })
    await toolManager.initialize()
    logger.success('[Server] 工具管理器初始化成功')
  } catch (error) {
    logger.error('[Server] 工具管理器初始化失败:', error)
    // 继续运行
  }

  // 继续创建Express应用...
}
```

#### 方案3: 禁用工具自动加载

修改 `src/core/tool-manager/ToolManager.ts`:

```typescript
constructor(options: ToolManagerOptions = {}) {
  super()
  this.options = {
    autoLoad: false,  // 改为false
    healthCheckInterval: options.healthCheckInterval ?? 60000,
  }
}
```

## 📋 推荐的修复步骤

### 1. 快速验证

```bash
# 停止所有node进程
Get-Process -Name node | Stop-Process -Force

# 启动简单测试
node test-direct.js

# 打开浏览器访问
http://localhost:3001
```

如果能访问,说明网络和Express没问题。

### 2. 添加调试日志

修改 `src/cli/commands/ui.ts`,在try块开始处添加:

```typescript
export async function uiCommand(options: UICommandOptions = {}): Promise<void> {
  console.log('[DEBUG] UI命令开始执行...')
  console.log('[DEBUG] 选项:', options)
  
  try {
    console.log('[DEBUG] 开始创建服务器...')
    const { server } = await createExpressServer({...})
    console.log('[DEBUG] 服务器创建成功')
    
    console.log('[DEBUG] 开始监听端口...')
    await new Promise((resolve, reject) => {
      server.listen(port, host, () => {
        console.log('[DEBUG] 监听成功!')
        resolve()
      })
    })
    
    console.log('[DEBUG] 服务器启动完成!')
  } catch (error) {
    console.error('[DEBUG] 错误:', error)
    throw error
  }
}
```

### 3. 简化数据库初始化

修改 `src/core/database/DatabaseManager.ts`,在创建表之前先测试基本连接:

```typescript
async initialize(): Promise<void> {
  try {
    console.log('[DB] 开始初始化...')
    
    this.db = new Database(this.dbPath, {
      verbose: this.config.verbose ? ((msg) => console.log('[DB SQL]', msg)) : undefined,
      readonly: this.config.readonly,
      fileMustExist: this.config.fileMustExist,
    })
    
    console.log('[DB] 数据库文件已打开')
    
    // 测试连接
    this.db.pragma('journal_mode = WAL')
    console.log('[DB] Pragma设置成功')
    
    await this.createTables()
    console.log('[DB] 表创建成功')
    
    logger.info('数据库初始化成功')
  } catch (error) {
    console.error('[DB] 初始化错误:', error)
    throw error
  }
}
```

## 🚀 临时工作方案

如果急需使用,可以:

### 选项1: 直接使用API测试脚本

创建 `manual-test.js`:

```javascript
// 手动测试各功能
import { getDatabaseManager } from './dist/core/database/index.js'
import { getToolManager } from './dist/core/tool-manager/index.js'

async function test() {
  try {
    // 测试数据库
    const db = getDatabaseManager()
    await db.initialize()
    console.log('✅ 数据库 OK')
    
    // 测试工具管理器
    const tm = getToolManager()
    await tm.initialize()
    console.log('✅ 工具管理器 OK')
    
    // 获取工具列表
    const tools = tm.getAllToolStatus()
    console.log('✅ 工具列表:', tools)
    
  } catch (error) {
    console.error('❌ 错误:', error)
  }
}

test()
```

### 选项2: 使用简化的Express服务器

```bash
# 直接使用 test-direct.js
node test-direct.js

# 这个服务器简单但可用,可以先用它测试前端
```

### 选项3: 修改构建产物

直接编辑 `dist/server/app.js`,注释掉可能有问题的初始化代码。

## 📊 预期的正常启动日志

```
[2025-10-24 10:00:00] [INFO] [UI] 正在启动 LDesign UI 管理界面...
[2025-10-24 10:00:00] [INFO] [Server] 正在创建服务器...
[2025-10-24 10:00:00] [INFO] 数据库初始化成功
[2025-10-24 10:00:00] [INFO] [ToolManager] 初始化工具管理器...
[2025-10-24 10:00:00] [INFO] [ToolManager] 工具管理器初始化完成
[2025-10-24 10:00:00] [INFO] [Server] 静态文件目录: D:\...\dist\web
[2025-10-24 10:00:00] [INFO] [Server] 服务器创建成功
[2025-10-24 10:00:00] [INFO] [WebSocket] 初始化 WebSocket 服务器
[2025-10-24 10:00:00] [INFO] [WebSocket] WebSocket 服务器已启动
[2025-10-24 10:00:01] [INFO] [UI] LDesign UI 管理界面已启动
[2025-10-24 10:00:01] [INFO] [UI] 本地访问: http://localhost:3000
```

如果看不到这些日志,说明某个步骤失败了。

## 🎯 下一步行动

1. **查看PowerShell窗口的错误信息** (如果有)
2. **使用简单服务器验证Express基础功能**
3. **逐步添加功能测试每个模块**
4. **在源码中添加console.log调试**

## 💡 快速绕过方案

如果想快速看到效果,可以创建一个完全独立的测试服务器:

```javascript
// quick-server.js
import express from 'express'

const app = express()
app.use(express.json())

// 模拟项目API
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Demo Project 1', path: 'D:/demo1', type: 'vue' },
      { id: '2', name: 'Demo Project 2', path: 'D:/demo2', type: 'react' }
    ]
  })
})

// 模拟工具API
app.get('/api/tools', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'builder', status: 'active', metadata: { displayName: '构建工具' } },
      { name: 'launcher', status: 'active', metadata: { displayName: '启动器' } }
    ]
  })
})

app.get('*', (req, res) => {
  res.send('<h1>LDesign CLI Mock Server</h1><p>API Ready for Frontend Testing</p>')
})

app.listen(3000, () => console.log('Mock Server: http://localhost:3000'))
```

这个可以让前端先开发起来!

---

**建议**: 先使用简化服务器确认网络正常,然后逐步调试完整版本。


