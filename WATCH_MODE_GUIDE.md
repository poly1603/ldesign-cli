# Watch 模式使用指南

## 📋 概述

现在 CLI 的 `ui` 命令支持两种模式：

1. **生产模式（默认）**：先构建再启动，使用打包后的优化代码
2. **Watch 模式**：启用热更新，代码修改后自动重新编译/热重载

## 🚀 快速开始

### 生产模式（默认）

```bash
ldesign ui
```

**特点：**
- ✅ 先构建 web 和 server
- ✅ 使用打包后的优化代码
- ✅ 性能更好，适合生产环境
- ✅ 浏览器打开 `http://localhost:3000/ui`

### Watch 模式（开发推荐）

```bash
ldesign ui --watch
# 或
ldesign ui --dev
```

**特点：**
- ✅ **后端热更新**：NestJS watch 模式，代码修改自动重启
- ✅ **前端热更新**：Vite HMR，代码修改自动热重载（无需刷新页面）
- ✅ **实时反馈**：修改代码立即看到效果
- ✅ 浏览器打开 `http://localhost:5173`（前端开发服务器）

## 📖 详细说明

### 后端 Watch 模式

使用 NestJS 的 `start:dev` 命令，具备以下特性：

- 🔄 **自动重新编译**：TypeScript 文件修改后自动重新编译
- 🔄 **自动重启服务**：编译完成后自动重启服务器
- 📝 **输出日志**：显示编译和重启信息
- ⚡ **快速响应**：通常在 1-2 秒内完成重启

**监控的文件：**
- `tools/server/src/**/*.ts` - 所有 TypeScript 源文件
- `tools/server/src/**/*.json` - 配置文件

### 前端 Watch 模式

使用 Vite 开发服务器，具备以下特性：

- 🔥 **HMR（热模块替换）**：组件修改后无需刷新页面，立即更新
- ⚡ **快速编译**：使用 esbuild，编译速度极快
- 🔍 **Source Maps**：便于调试
- 📦 **按需编译**：只编译修改的文件

**监控的文件：**
- `tools/web/src/**/*.vue` - Vue 组件
- `tools/web/src/**/*.ts` - TypeScript 文件
- `tools/web/src/**/*.css` - 样式文件

## 🎯 使用场景

### 生产模式适用于：
- ✅ 最终测试和演示
- ✅ 性能测试
- ✅ 部署准备
- ✅ 不需要频繁修改代码的场景

### Watch 模式适用于：
- ✅ 日常开发
- ✅ UI 调试
- ✅ API 开发
- ✅ 功能迭代
- ✅ 需要频繁修改代码的场景

## 🔧 命令行选项

```bash
# 基本用法
ldesign ui                    # 生产模式（默认）
ldesign ui --watch            # Watch 模式
ldesign ui --dev              # Watch 模式（等同于 --watch）

# 指定端口
ldesign ui --server-port 3000 --web-port 5173

# 指定主机
ldesign ui --host 0.0.0.0

# 只启动 Server（不启动 Web）
ldesign ui --server-only

# 只启动 Web（不启动 Server）
ldesign ui --web-only

# 跳过构建步骤（生产模式）
ldesign ui --no-build

# 不自动打开浏览器
ldesign ui --no-open
```

## 💡 开发工作流建议

### 推荐工作流

1. **启动 Watch 模式**：
   ```bash
   ldesign ui --watch
   ```

2. **在编辑器中修改代码**：
   - 修改 `tools/server/src/**/*.ts` → 后端自动重启
   - 修改 `tools/web/src/**/*.vue` → 前端自动热更新

3. **查看效果**：
   - 前端修改：浏览器自动更新，无需刷新
   - 后端修改：等待 1-2 秒自动重启后刷新页面

4. **停止服务**：
   - 按 `Ctrl+C` 停止所有服务

### 配合 Nexus 使用

Nexus 桌面应用也支持 Watch 模式：

```bash
cd tools/nexus

# Windows PowerShell
.\scripts\watch.ps1

# Linux/macOS
./scripts/watch.sh

# 或直接使用
flutter run -d windows --hot
```

**Nexus Watch 模式特性：**
- ✅ 代码修改后自动热重载
- ✅ 支持按 `r` 键手动刷新
- ✅ 支持按 `R` 键完全重启应用
- ✅ 按 `q` 键退出

## ⚠️ 注意事项

1. **端口冲突**：
   - 确保端口 3000（Server）和 5173（Web）未被占用
   - 可以使用 `--server-port` 和 `--web-port` 指定其他端口

2. **构建产物**：
   - Watch 模式不生成构建产物
   - 需要构建产物时使用生产模式

3. **性能差异**：
   - Watch 模式：开发友好，编译速度快
   - 生产模式：代码优化，性能更好

4. **浏览器缓存**：
   - Watch 模式：Vite 自动处理缓存
   - 生产模式：可能需要清除浏览器缓存

## 🐛 故障排除

### 后端无法启动

```bash
# 检查端口是否被占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# 手动启动 Server 查看错误
cd tools/server
pnpm start:dev
```

### 前端无法启动

```bash
# 检查端口是否被占用
netstat -ano | findstr :5173  # Windows
lsof -i :5173                 # Linux/macOS

# 手动启动 Web 查看错误
cd tools/web
pnpm dev
```

### 热更新不工作

1. **检查文件是否被监控**：
   - 确保文件在 `src` 目录下
   - 确保文件扩展名正确（`.ts`, `.vue`, `.css`）

2. **清除缓存**：
   ```bash
   cd tools/web
   rm -rf node_modules/.vite
   ```

3. **重启服务**：
   - 按 `Ctrl+C` 停止
   - 重新运行 `ldesign ui --watch`

## 📚 相关文档

- [CLI README](./README.md)
- [Nexus README](../nexus/README.md)
- [Server README](../server/README.md)
- [Web README](../web/README.md)

















