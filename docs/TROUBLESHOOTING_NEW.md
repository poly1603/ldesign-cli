# 故障排除指南

> LDesign CLI 常见问题和解决方案

## 🔧 开发模式问题

### 问题1: API 请求失败 (CORS/代理错误)

**症状:**
- 浏览器控制台显示 CORS 错误
- API 请求返回 404 或超时
- 前端无法连接到后端

**解决方案:**

1. **检查后端服务器是否启动**
   ```bash
   # 访问后端健康检查端点
   curl http://localhost:3000/health
   ```

2. **检查 Vite 代理配置**
   
   确认 `src/web/vite.config.ts` 中的代理配置正确:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://127.0.0.1:3000',
       changeOrigin: true,
       secure: false,
     }
   }
   ```

3. **清除浏览器缓存**
   - 硬刷新: `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
   - 或打开隐身模式测试

4. **重启开发服务器**
   ```bash
   # 停止所有服务 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

### 问题2: 前端/后端端口冲突

**症状:**
- 提示端口已被占用
- 服务器无法启动

**解决方案:**

1. **查找并关闭占用端口的进程**
   
   Windows:
   ```powershell
   # 查找占用端口3000的进程
   netstat -ano | findstr :3000
   # 结束进程 (替换PID)
   taskkill /PID <PID> /F
   
   # 查找占用端口5173的进程
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```
   
   Linux/Mac:
   ```bash
   # 查找并结束占用端口的进程
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

2. **使用不同端口**
   ```bash
   ldesign ui --port 8080
   ```

### 问题3: WebSocket 连接失败

**症状:**
- 实时日志不更新
- 工具状态不同步

**解决方案:**

1. **检查防火墙设置**
   - 确保端口 3000 和 5173 未被防火墙阻止

2. **检查代理设置**
   - 如果使用全局代理，尝试禁用或配置例外

3. **使用正确的 WebSocket URL**
   - 开发模式: `ws://localhost:3000`
   - 生产模式: `ws://${window.location.host}`

### 问题4: 热重载不工作

**症状:**
- 修改代码后页面不自动刷新
- 需要手动刷新浏览器

**解决方案:**

1. **检查文件监听**
   ```bash
   # 在 Windows 上，某些情况下需要使用轮询模式
   # 修改 vite.config.ts:
   server: {
     watch: {
       usePolling: true
     }
   }
   ```

2. **重启开发服务器**

## 📦 生产构建问题

### 问题5: 构建失败

**症状:**
- `npm run build` 报错
- TypeScript 编译错误

**解决方案:**

1. **检查依赖完整性**
   ```bash
   # 清理并重新安装
   npm run clean:all
   npm install
   cd src/web && npm install && cd ../..
   ```

2. **类型检查**
   ```bash
   npm run type-check
   ```

3. **查看详细错误信息**
   ```bash
   npm run build:cli -- --verbose
   ```

### 问题6: 静态资源 404

**症状:**
- 访问 `http://localhost:3000` 显示占位页面
- 前端资源加载失败

**解决方案:**

1. **确认前端已构建**
   ```bash
   # 检查文件是否存在
   ls src/web/dist/index.html
   ```

2. **确认产物已复制**
   ```bash
   # 检查文件是否存在
   ls dist/web/index.html
   ```

3. **重新构建**
   ```bash
   npm run build:web
   npm run copy:web
   ```

4. **验证构建产物**
   ```bash
   node scripts/verify-build.js
   ```

### 问题7: 构建产物不完整

**症状:**
- 启动后功能异常
- 缺少某些文件

**解决方案:**

1. **运行完整构建**
   ```bash
   npm run clean
   npm run build
   ```

2. **验证构建**
   - 构建完成后会自动运行 `verify-build.js`
   - 检查输出，确保所有文件都存在

3. **手动验证关键文件**
   ```bash
   # 必须存在的文件
   dist/cli/index.js
   dist/server/app.js
   dist/web/index.html
   dist/web/assets/
   ```

## 🗄️ 数据库问题

### 问题8: 数据库锁定

**症状:**
- 数据库操作超时
- 提示数据库被锁定

**解决方案:**

1. **关闭所有 CLI 实例**
2. **删除数据库文件**
   ```bash
   rm ldesign-cli.db
   ```
3. **重启 CLI**

### 问题9: 数据丢失

**症状:**
- 项目列表为空
- 历史记录丢失

**解决方案:**

1. **检查数据库文件位置**
   - 默认位置: 当前工作目录
   - 查找: `ldesign-cli.db`

2. **数据库备份**
   ```bash
   # 定期备份数据库
   cp ldesign-cli.db ldesign-cli.db.backup
   ```

## ⚙️ 配置问题

### 问题10: 配置不生效

**症状:**
- 修改配置后没有变化
- 总是使用默认配置

**解决方案:**

1. **检查配置文件位置**
   - 文件名: `.ldesignrc.json`
   - 位置: 当前工作目录

2. **检查配置格式**
   ```json
   {
     "defaultPort": 3000,
     "defaultHost": "0.0.0.0",
     "autoOpen": true,
     "debug": false,
     "logLevel": "info"
   }
   ```

3. **重启 CLI 加载配置**

## 🚀 性能问题

### 问题11: 启动慢

**症状:**
- CLI 启动需要很长时间
- 页面加载缓慢

**解决方案:**

1. **检查依赖安装**
   ```bash
   # 使用离线缓存
   npm install --prefer-offline
   ```

2. **优化构建**
   ```bash
   # 生产模式不包含 source map
   # 已在 vite.config.ts 中配置
   ```

3. **减少工具包加载**
   - 在 `ToolManager.ts` 中按需加载

### 问题12: 内存占用高

**症状:**
- Node 进程占用大量内存
- 系统变慢

**解决方案:**

1. **增加 Node 内存限制**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```

2. **关闭不需要的工具**

3. **重启服务**

## 🔍 调试技巧

### 启用详细日志

```bash
# 开发模式
npm run dev:server -- --debug

# 生产模式
ldesign ui --debug
```

### 查看网络请求

1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 观察 API 请求和响应

### 检查 WebSocket 连接

1. 打开浏览器控制台
2. 观察 WebSocket 消息:
   ```
   ✅ 后端连接成功
   [ApiClient] 响应: /api/health {...}
   ```

### 使用 VSCode 调试器

参考 [DEVELOPMENT.md](./DEVELOPMENT.md) 中的调试配置

## 📞 获取帮助

如果以上解决方案都无法解决问题:

1. **查看日志文件**
   - 检查终端输出
   - 检查浏览器控制台

2. **提供详细信息**
   - Node.js 版本: `node --version`
   - npm 版本: `npm --version`
   - 操作系统信息
   - 错误堆栈信息

3. **提交 Issue**
   - GitHub Issue 地址
   - 包含完整的错误信息和复现步骤

## ✅ 验证清单

在提交 Issue 前，请确认:

- [ ] 使用最新版本
- [ ] 清理并重新安装依赖
- [ ] 尝试重启服务
- [ ] 检查端口是否被占用
- [ ] 查看日志和错误信息
- [ ] 尝试使用 `--debug` 模式
- [ ] 检查防火墙和代理设置

---

**还有问题?** 欢迎提交 Issue 或查看 [开发文档](./DEVELOPMENT.md)


