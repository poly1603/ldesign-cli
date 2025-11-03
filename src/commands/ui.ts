/**
 * UI command: start server + web with better UX & robustness
 *
 * 使用可编程接口直接启动服务，而不是通过 pnpm 命令
 */

import type { CAC } from 'cac'
import { existsSync } from 'fs'
import open from 'open'
import { logger } from '@ldesign/shared'
import type { CommandHandler } from '../CommandRegistry'
import { startDevServer, startProdServer, type ServerInstance } from '@ldesign/server'
import { startDevUI, startProdUI, type WebUIInstance } from '@ldesign/web'
import { execa } from 'execa'
import { join } from 'path'
import chalk from 'chalk'

export interface UIOptions {
  host?: string
  open?: boolean
  dev?: boolean
  watch?: boolean // 新增：watch 模式（等同于 dev）
  serverPort?: number
  webPort?: number
  serverOnly?: boolean
  webOnly?: boolean
  noBuild?: boolean
}

const TOOLS_ROOT = join(__dirname, '..', '..', '..')
const SERVER_PATH = join(TOOLS_ROOT, 'server')
const WEB_PATH = join(TOOLS_ROOT, 'web')
const DEFAULT_SERVER_PORT = 3000
const DEFAULT_WEB_PORT = 5173

/**
 * UI 命令主函数
 * 使用可编程接口直接启动服务
 */
export async function uiCommand(options: UIOptions = {}): Promise<void> {
  const uiLogger = logger.withPrefix('UI')
  const host = options.host || '127.0.0.1'
  const serverPort = options.serverPort || DEFAULT_SERVER_PORT
  const webPort = options.webPort || DEFAULT_WEB_PORT
  const isDev = !!options.dev

  let serverInstance: ServerInstance | null = null
  let webInstance: WebUIInstance | null = null

  // 清理函数
  const cleanup = async () => {
    uiLogger.info('正在清理资源...')
    if (webInstance) {
      await webInstance.stop().catch((err) => uiLogger.error('停止 Web 服务失败:', err))
    }
    if (serverInstance) {
      await serverInstance.stop().catch((err) => uiLogger.error('停止 Server 服务失败:', err))
    }
  }

  // 注册清理处理器
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    if (isDev) {
      // ========== 开发模式 ==========
      // 同时启动 server 和 web 的开发服务器
      uiLogger.info('🚀 启动开发模式...')

      // 启动服务器
      if (!options.webOnly) {
        uiLogger.info('🛠️  启动后端API服务...')
        const webUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${webPort}`
        serverInstance = await startDevServer({
          port: serverPort,
          host,
          corsOrigins: [
            webUrl,
            `http://localhost:${webPort}`,
            `http://127.0.0.1:${webPort}`,
          ],
          enableWebSocket: true,
          silent: false,
        })
        uiLogger.success(`✅ API: http://${host}:${serverPort}`)
      }

      // 启动前端
      if (!options.serverOnly) {
        uiLogger.info('🛠️  启动前端开发服务...')
        webInstance = await startDevUI({
          port: webPort,
          host,
          open: false,
          silent: false,
        })
        uiLogger.success(`✅ Web: ${webInstance.getUrl()}`)

        // 打开浏览器
        if (options.open !== false) {
          await open(webInstance.getUrl())
        }
      }

      uiLogger.success('🎉 开发模式启动完成！')
      uiLogger.info('💡 按 Ctrl+C 停止服务')

    } else {
      // ========== 生产模式 ==========
      // 只启动 server，它会自动服务 web 的静态文件
      uiLogger.info('🚀 启动生产模式...')

      // 构建（如果需要）
      if (!options.noBuild) {
        uiLogger.info('📦 正在构建...')
        
        // 1. 构建 web（会自动同步到 server/public）
        uiLogger.info('  → 构建前端...')
        await execa('pnpm', ['build'], {
          cwd: WEB_PATH,
          stdio: 'inherit',
          shell: true,
        })
        
        // 2. 构建 server
        uiLogger.info('  → 构建后端...')
        await execa('pnpm', ['build'], {
          cwd: SERVER_PATH,
          stdio: 'inherit',
          shell: true,
        })
        
        uiLogger.success('✅ 构建完成')
      }

      // 启动 server（包含 web 静态文件服务）
      uiLogger.info('🛠️  启动服务...')
      serverInstance = await startProdServer({
        port: serverPort,
        host,
        corsOrigins: [
          `http://${host === '0.0.0.0' ? 'localhost' : host}:${serverPort}`,
          `http://localhost:${serverPort}`,
          `http://127.0.0.1:${serverPort}`,
        ],
        enableWebSocket: true,
        silent: false,
      })

      const uiUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${serverPort}/ui`
      uiLogger.success(`✅ 服务启动完成`)
      uiLogger.info(`📍 Web UI: ${uiUrl}`)
      uiLogger.info(`📍 API: http://${host === '0.0.0.0' ? 'localhost' : host}:${serverPort}/api`)

      // 打开浏览器
      if (options.open !== false) {
        await open(uiUrl)
      }

      uiLogger.success('🎉 生产模式启动完成！')
      uiLogger.info('💡 按 Ctrl+C 停止服务')
    }

    // 保持进程运行
    await new Promise(() => {}) // 永久等待，直到收到信号

  } catch (error) {
    uiLogger.error('❌ UI 启动失败:', error)
    await cleanup()
    throw error
  }
}

export const uiCommandHandler: CommandHandler = {
  name: 'ui',
  description: '启动可视化管理界面',
  setup(cli: CAC) {
    cli
      .command('ui', '启动可视化管理界面')
      .option('--host <host>', 'Host to bind')
      .option('--server-port <port>', 'Server port', { type: [Number] })
      .option('--web-port <port>', 'Web port', { type: [Number] })
      .option('--server-only', 'Only start server')
      .option('--web-only', 'Only start web')
      .option('--no-build', 'Skip server build step')
      .option('--dev', 'Run in dev mode')
      .option('--no-open', 'Do not open browser')
      .action(async (options) => {
        try {
          await uiCommand(options)
        } catch (error) {
          logger.error('UI command failed:', error)
          process.exit(1)
        }
      })
  },
  async execute(options: UIOptions) {
    return uiCommand(options)
  },
}
