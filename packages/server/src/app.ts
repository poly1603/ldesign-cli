/**
 * Express 服务器应用
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'
import { logger } from '@ldesign/cli-shared/utils/index.js'
import { errorHandler, requestLogger } from './middleware/index.js'
import { setupWebSocket, getConnectionManager } from './websocket/index.js'
import { getDatabaseManager } from './core/database/index.js'
import { getToolManager } from './core/tool-manager/index.js'
import { projectsRouter } from './routes/projects.js'
import { toolsRouter } from './routes/tools.js'

// ESM __dirname 处理
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface ServerOptions {
  port: number
  host: string
  debug?: boolean
}

export interface ServerInstance {
  server: ReturnType<typeof createServer>
  wss: WebSocketServer
}

/**
 * 创建 Express 服务器
 */
export async function createExpressServer(options: ServerOptions): Promise<ServerInstance> {
  const { port, host, debug = false } = options

  logger.info('[Server] 正在创建服务器...')

  // 初始化数据库
  const dbManager = getDatabaseManager()
  await dbManager.initialize()

  // 初始化工具管理器
  const toolManager = getToolManager({ autoLoad: false })
  await toolManager.initialize()

  // 创建 Express 应用
  const app = express()

  // 基础中间件
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  )

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // 请求日志
  if (debug) {
    app.use(requestLogger)
  }

  // API 路由 - 必须在静态文件和通配符路由之前
  app.use('/api/projects', projectsRouter)
  app.use('/api/tools', toolsRouter)

  // 健康检查端点
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      mode: process.env.NODE_ENV || 'development',
      timestamp: Date.now(),
    })
  })

  // API 健康检查端点
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        mode: process.env.NODE_ENV || 'development',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    })
  })

  // 静态文件服务
  const possibleWebPaths = [
    resolve(__dirname, '../web'), // 打包后: dist/web (复制后的位置)
    resolve(__dirname, '../../web-ui/dist'), // Monorepo: packages/web-ui/dist
    resolve(__dirname, '../../../web-ui/dist'), // Monorepo 从 server/dist: packages/web-ui/dist
    resolve(__dirname, '../../src/web/dist'), // 开发模式: src/web/dist
  ]

  logger.info('[Server] 尝试查找静态资源...')
  let webPath: string | null = null
  for (const path of possibleWebPaths) {
    if (debug) {
      logger.debug(`[Server] 检查路径: ${path}`)
    }
    if (existsSync(path)) {
      webPath = path
      logger.success(`[Server] 找到静态资源: ${path}`)
      break
    }
  }

  if (webPath) {
    app.use(express.static(webPath))
    logger.info(`[Server] 静态文件服务已启动`)
  } else {
    // 开发模式下，前端由 Vite 开发服务器单独提供，这是正常的
    logger.info('[Server] 开发模式: 前端由 Vite 开发服务器提供')
    logger.info('[Server] 前端访问地址: http://localhost:5173')
    logger.info('[Server] 后端只提供 API 服务')
  }

  // SPA 路由支持 - 必须放在最后，且不能拦截API路由
  app.get('*', (req, res) => {
    // 如果是API请求但没有匹配到路由，返回404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: `API路由未找到: ${req.path}`,
        timestamp: Date.now(),
      })
    }

    // 其他请求返回前端页面
    if (webPath) {
      const indexPath = resolve(webPath, 'index.html')
      if (existsSync(indexPath)) {
        res.sendFile(indexPath)
      } else {
        res.send(createPlaceholderHtml())
      }
    } else {
      res.send(createPlaceholderHtml())
    }
  })

  // 错误处理 - 必须放在所有路由之后
  app.use(errorHandler)

  // 创建 HTTP 服务器
  const server = createServer(app)

  // 创建 WebSocket 服务器
  const wss = new WebSocketServer({ server })
  setupWebSocket(wss)

  // 连接工具管理器和 WebSocket
  const wsManager = getConnectionManager()

  // 转发工具事件到 WebSocket
  toolManager.on('tool-progress', (event) => {
    wsManager.broadcast({ type: 'tool-progress', data: event, timestamp: Date.now() })
  })

  toolManager.on('tool-log', (event) => {
    wsManager.broadcast({ type: 'tool-log', data: event, timestamp: Date.now() })
  })

  toolManager.on('tool-status-change', (event) => {
    wsManager.broadcast({ type: 'tool-status', data: event, timestamp: Date.now() })
  })

  toolManager.on('tool-start', (event) => {
    wsManager.broadcast({ type: 'tool-start', data: event, timestamp: Date.now() })
  })

  toolManager.on('tool-complete', (event) => {
    wsManager.broadcast({ type: 'tool-complete', data: event, timestamp: Date.now() })
  })

  toolManager.on('tool-error', (event) => {
    wsManager.broadcast({ type: 'tool-error', data: event, timestamp: Date.now() })
  })

  // 优雅关闭
  const shutdown = async () => {
    logger.info('[Server] 正在关闭服务器...')

    wsManager.broadcast({
      type: 'server-status',
      data: { status: 'shutting-down' },
      timestamp: Date.now(),
    })

    await new Promise((resolve) => setTimeout(resolve, 500))

    wss.close()
    await toolManager.dispose()
    dbManager.close()

    server.close(() => {
      logger.info('[Server] 服务器已关闭')
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  logger.success('[Server] 服务器创建成功')

  return { server, wss }
}

/**
 * 创建占位 HTML
 */
function createPlaceholderHtml(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LDesign CLI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .logo {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 1rem;
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .title {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.2rem;
            opacity: 0.9;
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎨</div>
        <div class="title">LDesign CLI</div>
        <div class="message">
            <p>✅ 服务器运行中</p>
            <p style="margin-top: 0.5rem;">⚠️ 前端资源未构建</p>
            <p style="margin-top: 1rem; font-size: 0.9rem;">请运行 <code>npm run build:web</code></p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

