# @ldesign/CLI 升级指南

从 v1.0 升级到 v2.0 的完整指南

---

## 🎯 升级前准备

### 1. 备份现有数据

```bash
# 备份配置目录
cp -r ~/.ldesign-cli ~/.ldesign-cli.backup.$(date +%Y%m%d)

# Windows用户
xcopy %USERPROFILE%\.ldesign-cli %USERPROFILE%\.ldesign-cli.backup /E /I
```

### 2. 检查环境

```bash
# 检查Node.js版本（需要 >= 18.0.0）
node --version

# 检查pnpm版本（需要 >= 8.0.0）
pnpm --version
```

---

## 🚀 升级步骤

### 方式一：全局升级（推荐）

```bash
# 1. 卸载旧版本
pnpm remove -g @ldesign/cli

# 2. 安装新版本
pnpm add -g @ldesign/cli@2.0.0

# 3. 安装sql.js（重要！）
pnpm add -g sql.js

# 4. 验证安装
ldesign --version
# 应显示: 2.0.0

# 5. 启动测试
ldesign ui
```

### 方式二：项目内升级

```bash
# 1. 更新package.json
{
  "devDependencies": {
    "@ldesign/cli": "^2.0.0"
  }
}

# 2. 安装依赖
pnpm install

# 3. 添加sql.js
pnpm add -D sql.js

# 4. 启动测试
pnpm ldesign ui
```

---

## 🔄 数据迁移

### 自动迁移（推荐）

v2.0 会自动检测并迁移 v1.0 的数据：

```
第一次启动时:
✓ 检测到旧版本数据
✓ 自动备份数据文件
✓ 执行数据库迁移
✓ 验证数据完整性
✓ 迁移完成！
```

### 手动迁移（备选）

如果自动迁移失败：

```bash
# 1. 导出v1.0数据（在升级前）
ldesign ui
# 访问设置 → 导出配置 → 保存JSON文件

# 2. 升级到v2.0

# 3. 导入数据
ldesign ui
# 访问设置 → 导入配置 → 选择JSON文件
```

---

## 🆕 新功能使用

### 1. 使用项目模板

```bash
# 启动UI
ldesign ui

# 在浏览器中:
1. 访问 http://localhost:3000/templates
2. 浏览8个内置模板
3. 选择合适的模板
4. 填写项目信息
5. 点击"创建项目"
6. 完成！
```

### 2. 进行安全扫描

```bash
# 在UI中:
1. 访问 http://localhost:3000/security
2. 选择要扫描的项目
3. 点击"刷新扫描"
4. 查看漏洞报告和许可证信息
5. 点击"自动修复"修复漏洞
```

### 3. 使用Git功能

```typescript
// 通过API使用
// 获取Git状态
const status = await api.get('/api/git/status', {
  params: { projectPath: '/path/to/project' }
})

// 智能提交
const msg = await api.get('/api/git/generate-commit-message', {
  params: { projectPath: '/path/to/project' }
})

await api.post('/api/git/commit', {
  projectPath: '/path/to/project',
  message: msg.data.message
})
```

### 4. 查看性能监控

```bash
# 在UI中:
1. 访问 http://localhost:3000/monitor
2. 查看实时系统指标
3. 查看应用性能数据
4. 分析历史趋势图表
```

---

## ⚙️ 配置调整

### package.json 更新

**新增依赖:**
```json
{
  "devDependencies": {
    "sql.js": "^1.10.3",
    "prettier": "^3.1.0",
    "@vitest/ui": "^1.0.0",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2"
  }
}
```

**新增脚本:**
```json
{
  "scripts": {
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "format": "prettier --write \"src/**/*.{ts,vue,js,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,vue,js,json,md}\"",
    "quality": "pnpm run lint:check && pnpm run format:check && pnpm run type-check",
    "quality:fix": "pnpm run lint:fix && pnpm run format"
  }
}
```

---

## 🔧 代码调整

### 使用新的性能工具

**之前:**
```typescript
// 普通搜索
function handleSearch(keyword: string) {
  searchAPI(keyword)
}
```

**现在:**
```typescript
import { debounce } from '@/utils/performance'

// 防抖搜索（性能提升）
const handleSearch = debounce((keyword: string) => {
  searchAPI(keyword)
}, 300)
```

### 使用新的错误处理

**之前:**
```typescript
try {
  await operation()
} catch (error) {
  console.error(error)
}
```

**现在:**
```typescript
import { ErrorHandler, ValidationError } from '@/utils/errors'

const result = await ErrorHandler.wrap(async () => {
  return await operation()
})

if (!result.success) {
  logger.error(result.error.message)
}
```

---

## 🎨 UI 变化

### 新增页面
- `/templates` - 模板市场
- `/security` - 安全报告
- `/monitor` - 性能监控

### 菜单更新
```
新增3个菜单项:
├── 📦 模板市场
├── 🛡️ 安全报告
└── 📊 性能监控
```

---

## ⚠️ 重大变更（Breaking Changes）

### 1. 数据库优化
- 添加了新的PRAGMA配置
- 可能需要重新索引
- 首次启动会执行优化

### 2. 依赖要求
- **新增必需依赖**: sql.js
- 建议安装: prettier, @vitest/ui

### 3. API变化
- 所有新增API端点（59个总计）
- GET请求自动缓存
- 请求去重机制

---

## ✅ 验证升级

### 功能验证清单

- [ ] UI能正常启动
- [ ] 原有项目列表正常显示
- [ ] 新建项目功能正常
- [ ] 模板市场可以访问
- [ ] 安全扫描功能可用
- [ ] 性能监控显示数据
- [ ] 所有菜单项正常工作

### 性能验证

```bash
# 运行性能测试
pnpm test:run

# 检查内存使用
# 访问 /monitor 查看实时内存数据

# 验证数据库性能
# 打开项目列表，应该很快加载完成
```

---

## 🐛 常见问题

### Q1: 启动失败，提示 sql.js 未找到
```bash
# 解决方案
pnpm add sql.js
# 或在项目目录
cd tools/cli && pnpm add sql.js
```

### Q2: 数据库初始化失败
```bash
# 解决方案1: 删除旧数据库
rm ~/.ldesign-cli/data/speed-tool.db

# 解决方案2: 从备份恢复
cp ~/.ldesign-cli.backup/data/speed-tool.db ~/.ldesign-cli/data/
```

### Q3: UI界面无法访问新功能
```bash
# 清除浏览器缓存
# 或使用无痕模式访问
# 或强制刷新（Ctrl+Shift+R）
```

### Q4: 性能没有提升
```bash
# 1. 确认新版本
ldesign --version

# 2. 检查数据库优化
# 访问 /monitor 查看性能指标

# 3. 清除缓存重启
ldesign ui
```

---

## 📞 获取帮助

### 升级遇到问题？

1. **查看文档**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **检查日志**: 启用 `--debug` 模式
3. **提交Issue**: GitHub Issues
4. **社区讨论**: 开发者社区

### 调试模式

```bash
# 启用详细日志
ldesign ui --debug

# 查看所有日志信息
# 帮助定位问题
```

---

## 🎉 升级完成！

恭喜！您已成功升级到 v2.0，现在可以享受所有新功能和性能提升！

### 推荐首先体验:
1. 🎨 **模板市场** - 快速创建新项目
2. 🔒 **安全扫描** - 检查项目安全性
3. 📊 **性能监控** - 实时查看系统状态

---

**祝您使用愉快！** 🎊

---

**文档版本**: v1.0  
**更新日期**: 2025-10-22  
**适用版本**: v1.0 → v2.0

