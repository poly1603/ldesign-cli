import open from 'open'
import { Logger } from '@ldesign/shared'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import type { CAC } from 'cac'
import type { CommandHandler } from '../types/command'

const logger = new Logger('UI')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface UIOptions {
  port?: number
  apiPort?: number
  open?: boolean
}

/**
 * 启动 UI 服务（生产构建）
 */
async function startUI(options: UIOptions) {
  const webPort = options.port || 5173
  const apiPort = options.apiPort || 3000
  const shouldOpen = options.open !== false

  logger.info('🚀 启动 LDesign UI 服务...')
  logger.info('💡 提示：开发阶段请手动启动 server 和 web 项目')

  const processes: any[] = []

  // Cleanup function
  const cleanup = () => {
    logger.info('正在清理资源...')
    processes.forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM')
      }
    })
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    // Calculate paths to bin scripts from node_modules or workspace
    let serverBinPath: string
    let webBinPath: string
    
    try {
      // Try to resolve from node_modules (published scenario)
      const { createRequire } = await import('module')
      const require = createRequire(import.meta.url)
      const serverMainPath = require.resolve('@ldesign/server')
      const webMainPath = require.resolve('@ldesign/web')
      
      // Navigate from main module to bin directory
      serverBinPath = path.resolve(path.dirname(serverMainPath), '../bin/start.mjs')
      webBinPath = path.resolve(path.dirname(webMainPath), '../bin/start.mjs')
    } catch {
      // Fallback to workspace structure (development scenario)
      const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
      serverBinPath = path.resolve(cliRoot, '../server/bin/start.mjs')
      webBinPath = path.resolve(cliRoot, '../web/bin/start.mjs')
    }

    // Start backend API service
    logger.info('🛠️  启动后端 API 服务...')
    const apiProcess = spawn('node', [serverBinPath, apiPort.toString()], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: apiPort.toString(),
        NODE_ENV: 'production',
      },
    })

    apiProcess.on('error', (error) => {
      logger.error('API 服务启动失败:', error.message)
      cleanup()
    })

    processes.push(apiProcess)

    // Wait for API to start
    await new Promise((resolve) => setTimeout(resolve, 2000))
    logger.success('✅ API 服务已启动: http://0.0.0.0:' + apiPort)

    // Start frontend preview server
    logger.info('🛠️  启动前端服务...')
    const webProcess = spawn('node', [webBinPath, webPort.toString()], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: webPort.toString(),
      },
    })

    webProcess.on('error', (error) => {
      logger.error('Web 服务启动失败:', error.message)
      cleanup()
    })

    processes.push(webProcess)

    // Wait for web server to start
    await new Promise((resolve) => setTimeout(resolve, 3000))
    logger.success('✅ Web 服务已启动: http://0.0.0.0:' + webPort)

    logger.success('🎉 服务启动完成！')
    logger.info(`📍 访问地址: http://localhost:${webPort}`)
    logger.info(`📍 API 地址: http://localhost:${apiPort}`)
    logger.info('💡 按 Ctrl+C 停止所有服务')

    // Open browser if requested
    if (shouldOpen) {
      await open(`http://localhost:${webPort}`)
    }

    // Keep process alive
    await new Promise(() => {})
  } catch (error: any) {
    logger.error('启动失败:', error.message)
    cleanup()
    throw error
  }
}

/**
 * UI 命令处理器
 */
export const uiCommandHandler: CommandHandler = {
  name: 'ui',
  description: '启动 LDesign 可视化管理界面（生产构建）',

  setup(cli: CAC) {
    cli
      .command('ui', '启动 LDesign 可视化管理界面（生产构建）')
      .option('-p, --port <port>', '前端端口', { default: 5173 })
      .option('-a, --api-port <port>', '后端 API 端口', { default: 3000 })
      .option('--no-open', '不自动打开浏览器')
      .action(async (options: UIOptions) => {
        try {
          await startUI(options)
        } catch (error: any) {
          logger.error('启动失败:', error.message)
          process.exit(1)
        }
      })
  },

  execute: startUI,
}
