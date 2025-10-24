# 🔧 LDesign CLI 调试指南

## 问题: http://localhost:3000 无法访问

### 可能的原因

1. **服务器未启动成功**
2. **异步初始化错误**
3. **依赖包缺失**
4. **端口被占用**

## 🔍 诊断步骤

### 1. 检查端口

```powershell
# 检查3000端口
netstat -ano | findstr :3000

# 检查监听状态
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

### 2. 检查Node进程

```powershell
# 查看node进程
Get-Process -Name node

# 停止所有node进程
Get-Process -Name node | Stop-Process -Force
```

### 3. 手动启动并查看日志

```bash
cd D:\WorkBench\ldesign\tools\cli

# 方式1: 使用tsx直接运行源码
tsx src/cli/index.ts ui --debug

# 方式2: 使用构建后的代码
node dist/cli/index.js ui --debug

# 方式3: 简单测试服务器
node start-simple.js
```

## 🐛 已知问题和解决方案

### 问题1: 数据库初始化失败

**症状**: 服务器启动后立即崩溃

**解决**:
```bash
# 删除数据库文件重新创建
Remove-Item data\ldesign-cli.db -Force
```

### 问题2: 依赖包缺失

**症状**: Cannot find module错误

**解决**:
```bash
# 重新安装依赖
npm install

# 如果是工具包缺失
cd ../../
pnpm install
```

### 问题3: ESM导入路径问题

**症状**: ERR_MODULE_NOT_FOUND

**解决**: 确保所有import路径包含.js扩展名

### 问题4: 异步初始化超时

**症状**: 服务器启动但无响应

**当前代码可能的问题**:
```typescript
// src/server/app.ts
export async function createExpressServer(options: ServerOptions) {
  // 初始化数据库 - 可能失败
  await dbManager.initialize()
  
  // 初始化工具管理器 - 可能失败
  await toolManager.initialize()
  
  // 如果这些失败,服务器不会启动
}
```

**临时解决方案**: 使用简化版服务器

## ✅ 推荐的测试流程

### 步骤1: 测试简单服务器

```bash
cd tools/cli

# 启动简单服务器(端口3001)
node test-direct.js

# 在另一个终端测试
curl http://localhost:3001/health
```

如果简单服务器能正常工作,说明Express和网络没问题。

### 步骤2: 测试数据库初始化

```bash
# 创建测试脚本
node -e "
import('./dist/core/database/index.js').then(async ({ getDatabaseManager }) => {
  const db = getDatabaseManager()
  await db.initialize()
  console.log('✅ 数据库初始化成功')
  db.close()
}).catch(err => console.error('❌ 数据库错误:', err))
"
```

### 步骤3: 分步启动完整服务器

创建测试文件 `test-server-full.js`:

```javascript
import { createExpressServer } from './dist/server/app.js'

console.log('🚀 启动完整服务器...')

createExpressServer({
  port: 3000,
  host: 'localhost',
  debug: true
}).then(({ server }) => {
  server.listen(3000, 'localhost', () => {
    console.log('✅ 服务器已启动: http://localhost:3000')
  })
}).catch(error => {
  console.error('❌ 启动失败:', error)
  process.exit(1)
})
```

## 🔨 快速修复方案

### 方案A: 使用测试服务器

```bash
# 使用已创建的简单测试服务器
node test-direct.js

# 访问 http://localhost:3001
```

### 方案B: 修复完整服务器

1. 添加详细的错误日志
2. 捕获所有异步错误
3. 添加try-catch包裹初始化代码

### 方案C: 暂时禁用数据库和工具初始化

修改`src/server/app.ts`:

```typescript
export async function createExpressServer(options: ServerOptions) {
  // 暂时注释掉这些初始化
  // await dbManager.initialize()
  // await toolManager.initialize()
  
  // 直接创建Express应用
  const app = express()
  // ...
}
```

## 📝 建议的调试代码

在 `src/server/app.ts` 开头添加:

```typescript
export async function createExpressServer(options: ServerOptions) {
  console.log('[DEBUG] 开始创建服务器...')
  
  try {
    console.log('[DEBUG] 初始化数据库...')
    await dbManager.initialize()
    console.log('[DEBUG] 数据库初始化成功')
  } catch (error) {
    console.error('[DEBUG] 数据库初始化失败:', error)
    throw error
  }
  
  // ... 其他代码
}
```

## 🎯 最简启动方案

如果遇到问题,使用这个最简版本:

```javascript
// minimal-server.js
import express from 'express'

const app = express()
app.use(express.json())

app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: [] })
})

app.get('*', (req, res) => {
  res.send('<h1>LDesign CLI</h1>')
})

app.listen(3000, () => {
  console.log('Server: http://localhost:3000')
})
```

然后逐步添加功能,每次测试:
1. ✅ 基本Express
2. ✅ API路由
3. ✅ 数据库
4. ✅ 工具管理器
5. ✅ WebSocket

## 💡 提示

当前系统代码是完整的,如果无法运行,很可能是:
- 环境问题(Node版本、依赖安装)
- 异步初始化错误未捕获
- 日志被抑制看不到错误

建议使用 `--debug` 模式启动查看详细日志。

---

**下一步**: 如果还有问题,请检查新打开的PowerShell窗口中的错误信息,或使用上述调试方法逐步排查。


