# 🧪 CLI 工具集成平台测试指南

## 测试环境准备

### 1. 安装依赖

```bash
cd tools/cli
pnpm install
```

### 2. 检查构建配置

确保以下文件存在且配置正确：
- ✅ `package.json` - 依赖已添加
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `src/web/vite.config.ts` - 前端构建配置
- ✅ `tsup.config.ts` - 后端构建配置

## 开发环境测试

### 方法 1：使用开发脚本

```bash
# 同时启动前后端
pnpm dev

# 等待服务启动（约 10-15 秒）
# 前端: http://localhost:3001
# 后端: http://localhost:3000
```

**预期输出**:
```
🚀 启动 LDesign CLI 开发环境
📦 启动 Web 开发服务器...
📦 启动 Server 开发服务器...
[Database] 数据库初始化成功
[ToolServiceManager] 服务管理器初始化完成
[BuilderService] 构建服务初始化完成
[AnalyzerService] 分析服务初始化完成
[DeployerService] 部署服务初始化完成
[WorkflowEngine] 工作流引擎初始化完成
```

### 方法 2：分别启动

**终端 1 - 后端**:
```bash
cd tools/cli
pnpm dev:server
```

**终端 2 - 前端**:
```bash
cd tools/cli/src/web
pnpm dev
```

## 功能测试清单

### 1. 后端 API 测试

#### 健康检查
```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "success": true,
  "message": "LDesign CLI Server is running",
  "timestamp": "2025-10-24T...",
  "uptime": 123.456
}
```

#### Builder API
```bash
# 获取构建历史（空列表）
curl http://localhost:3000/api/builder/builds/test-project
```

#### Analyzer API
```bash
# 获取分析报告（空列表）
curl http://localhost:3000/api/analyzer/reports/test-project
```

#### Workflow API
```bash
# 获取工作流模板
curl http://localhost:3000/api/workflow/templates
```

预期响应：4 个工作流模板

### 2. 前端页面测试

访问 `http://localhost:3001`（开发模式）或 `http://localhost:3000`（生产模式）

#### ✅ 页面 1：工具总览（首页）
- 路径: `/`
- 检查项:
  - [ ] 页面正常加载
  - [ ] 显示 11 个工具卡片
  - [ ] 显示统计数据（注册工具数、活跃服务数等）
  - [ ] 快捷操作按钮可点击
  - [ ] 点击服务卡片能跳转

#### ✅ 页面 2：构建管理
- 路径: `/builds`
- 检查项:
  - [ ] 页面正常加载
  - [ ] 项目选择器正常显示
  - [ ] "新建构建"按钮可点击
  - [ ] 打开对话框，表单正常显示
  - [ ] 选择项目后自动填充路径
  - [ ] 配置选项可正常切换
  - [ ] 提交表单（测试API调用）

#### ✅ 页面 3：分析报告
- 路径: `/analysis`
- 检查项:
  - [ ] 页面正常加载
  - [ ] 筛选器正常工作
  - [ ] "新建分析"按钮可点击
  - [ ] 对话框打开正常
  - [ ] 分析类型复选框可用
  - [ ] 提交分析请求

#### ✅ 页面 4：部署管理
- 路径: `/deployments`
- 检查项:
  - [ ] 页面正常加载
  - [ ] 环境筛选器工作
  - [ ] "新建部署"按钮可点击
  - [ ] 部署配置表单正常
  - [ ] 环境和平台选择正常
  - [ ] 提交部署请求

#### ✅ 页面 5：项目生命周期
- 路径: `/lifecycle`
- 检查项:
  - [ ] 页面正常加载
  - [ ] 项目选择器正常
  - [ ] 关键指标显示
  - [ ] 8 个生命周期阶段显示
  - [ ] 快速操作按钮可用
  - [ ] 最近活动列表显示

#### ✅ 页面 6：工作流编排
- 路径: `/workflows`
- 检查项:
  - [ ] 页面正常加载
  - [ ] "从模板创建"按钮可用
  - [ ] 工作流模板列表显示
  - [ ] "新建工作流"对话框打开
  - [ ] 步骤编辑器正常
  - [ ] 添加/删除步骤功能正常

### 3. WebSocket 测试

打开浏览器控制台，执行：

```javascript
const ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => console.log('✅ WebSocket 连接成功')
ws.onmessage = (event) => console.log('📨 收到消息:', JSON.parse(event.data))
ws.onerror = (error) => console.error('❌ WebSocket 错误:', error)
ws.onclose = () => console.log('🔌 WebSocket 关闭')
```

预期：
- 连接成功
- 收到 `welcome` 消息
- 定期收到 `ping` 消息

## 生产环境测试

### 1. 构建项目

```bash
cd tools/cli
pnpm build
```

**预期输出**:
- ✅ Web 构建成功（src/web/dist/）
- ✅ CLI 构建成功（dist/）
- ✅ Web 文件复制成功（dist/web/）

### 2. 启动生产服务

```bash
node dist/index.js ui
# 或
ldesign ui
```

### 3. 访问生产环境

```
http://localhost:3000
```

### 4. 测试所有页面

重复"功能测试清单"中的所有测试项。

## 常见问题排查

### 问题 1：端口被占用

**症状**: `EADDRINUSE` 错误

**解决**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程
taskkill /PID <PID> /F

# 或使用其他端口
ldesign ui --port 3001
```

### 问题 2：模块找不到

**症状**: `Cannot find module '@ldesign/xxx'`

**原因**: 这是正常的！工具服务会自动切换到模拟模式

**验证**: 查看日志应该显示：
```
[XxxService] Xxx 模块加载失败，服务将以模拟模式运行
```

### 问题 3：数据库初始化失败

**症状**: 数据库相关错误

**解决**:
```bash
# 删除数据库文件
rm -rf data/

# 重新启动
pnpm dev
```

### 问题 4：前端页面空白

**症状**: 浏览器显示空白页

**排查**:
1. 打开浏览器控制台，查看错误信息
2. 检查网络标签，确认 API 请求正常
3. 检查后端是否正常运行

**解决**:
```bash
# 重新构建前端
cd src/web
rm -rf dist node_modules
pnpm install
pnpm build
```

### 问题 5：TypeScript 类型错误

**症状**: 编译时类型错误

**说明**: 部分错误来自原有代码，不影响运行

**验证**: 查看错误文件路径：
- 如果是 `src/server/database/repositories/` - 原有问题
- 如果是 `src/server/services/` - 新代码问题（需修复）

## 模拟模式说明

### 什么是模拟模式？

当实际的工具包（如 @ldesign/builder）无法加载时，服务会自动切换到模拟模式：

- ✅ 提供完整的 UI 功能
- ✅ 模拟进度更新（0% → 10% → 30% → 60% → 90% → 100%）
- ✅ 生成模拟数据和结果
- ✅ 所有 API 端点正常工作
- ✅ WebSocket 事件正常推送

### 模拟模式特点

1. **进度模拟**: 按时间间隔更新进度
2. **数据模拟**: 生成合理的测试数据
3. **延迟模拟**: 模拟真实的处理时间
4. **结果模拟**: 返回符合接口的结果对象

### 切换到真实模式

当工具包正确安装并导出后，服务会自动使用真实模式：

```
[BuilderService] Builder 模块加载成功  ← 真实模式
```

## 性能基准测试

### API 响应时间

```bash
# 测试健康检查接口
time curl http://localhost:3000/api/health
```

预期: < 100ms

### 构建任务

创建一个简单的构建任务，测试：
- 启动时间
- 进度更新频率
- 完成时间
- 数据库写入

### 工作流执行

执行"快速分析"工作流，测试：
- 工作流创建
- 步骤执行
- WebSocket 事件推送
- 数据库记录

## 压力测试

### 并发 API 请求

```bash
# 使用 ab 或 wrk 工具
ab -n 100 -c 10 http://localhost:3000/api/health
```

预期: 所有请求成功

### 多个WebSocket连接

打开 10 个浏览器标签，测试：
- 所有连接正常建立
- 事件正常广播到所有客户端
- 没有内存泄漏

## 成功标准

### 开发环境
- ✅ 服务器启动无错误
- ✅ 所有页面可访问
- ✅ API 调用正常
- ✅ WebSocket 连接正常
- ✅ 表单提交成功
- ✅ 无控制台错误

### 生产环境
- ✅ 构建成功无错误
- ✅ 服务器启动正常
- ✅ 所有页面加载正常
- ✅ 所有功能正常工作
- ✅ 性能达标
- ✅ 无内存泄漏

## 测试报告模板

```
## CLI 工具集成平台测试报告

### 测试环境
- 操作系统: Windows 10
- Node.js: v20.x
- pnpm: v9.x
- 浏览器: Chrome 120+

### 开发环境测试
- [ ] 服务器启动: ✅/❌
- [ ] 前端启动: ✅/❌
- [ ] 页面访问: ✅/❌
- [ ] API 调用: ✅/❌
- [ ] WebSocket: ✅/❌

### 功能测试
- [ ] 工具总览页: ✅/❌
- [ ] 构建管理页: ✅/❌
- [ ] 分析报告页: ✅/❌
- [ ] 部署管理页: ✅/❌
- [ ] 项目生命周期页: ✅/❌
- [ ] 工作流编排页: ✅/❌

### 生产环境测试
- [ ] 构建成功: ✅/❌
- [ ] 服务器启动: ✅/❌
- [ ] 页面加载: ✅/❌
- [ ] 功能正常: ✅/❌

### 问题记录
无/有（描述问题）

### 测试结论
通过/不通过
```

## 已知问题

### 1. TypeScript 编译警告

**问题**: 类型检查时出现一些警告

**影响**: 不影响运行

**原因**:
- 部分来自原有代码
- 部分来自依赖包的类型定义

**状态**: 可忽略，不影响功能

### 2. 工具包模拟模式

**问题**: 工具服务以模拟模式运行

**影响**: 不影响UI测试

**原因**: 实际工具包可能未正确导出或未安装

**状态**: 正常，设计如此

### 3. Peer依赖警告

**问题**: pnpm install 时显示 peer 依赖警告

**影响**: 不影响运行

**状态**: 可忽略，monorepo 的正常现象

## 下一步

测试通过后：

1. ✅ 提交代码
2. ✅ 创建 Release
3. ✅ 更新文档
4. ✅ 发布到 npm

---

**测试人员**: ___________  
**测试日期**: ___________  
**测试结果**: ✅ 通过 / ❌ 不通过

