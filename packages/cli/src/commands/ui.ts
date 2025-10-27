/**
 * UI 命令实现
 * 启动 Web UI 管理界面
 */

import open from 'open'
import portfinder from 'portfinder'
import type { CAC } from 'cac'
import { logger, getAccessUrls } from '@ldesign/cli-shared/utils.js'
import { createExpressServer, getConfigManager } from '@ldesign/cli-server'
import { DEFAULT_PORT } from '@ldesign/cli-shared/constants.js'
import type { CommandHandler } from '../CommandRegistry'

export interface UICommandOptions {
  port?: number
  host?: string
  open?: boolean
  debug?: boolean
  silent?: boolean
}

/**
 * UI 命令处理器
 */
export async function uiCommand(options: UICommandOptions = {}): Promise<void> {
  // 加载配置
  const configManager = getConfigManager()
  const config = configManager.getConfig()

  // 合并配置：命令行参数 > 配置文件 > 默认值
  // 确保端口是有效的数字
  let preferredPort = DEFAULT_PORT
  if (typeof options.port === 'number' && !isNaN(options.port)) {
    preferredPort = options.port
  } else if (typeof config.defaultPort === 'number' && !isNaN(config.defaultPort)) {
    preferredPort = config.defaultPort
  }

  const host = options.host || config.defaultHost || '0.0.0.0'
  const shouldOpen = options.open !== false && (config.autoOpen !== false)
  const debug = options.debug || config.debug || false
  const silent = options.silent || false

  // 设置日志级别
  if (silent) {
    logger.setLevel('silent')
  } else if (debug) {
    logger.setLevel('debug')
  }

  const uiLogger = logger.withPrefix('UI')

  try {
    uiLogger.info('正在启动 LDesign UI 管理界面...')

    // 获取可用端口
    portfinder.basePort = preferredPort
    const availablePort = await portfinder.getPortPromise()

    if (availablePort !== preferredPort) {
      uiLogger.warn(`端口 ${preferredPort} 已被占用，使用端口 ${availablePort}`)
    }

    // 创建服务器
    uiLogger.info('正在初始化服务器...')
    const { server } = await createExpressServer({
      port: availablePort,
      host,
      debug,
    })

    // 启动服务器
    await new Promise<void>((resolve, reject) => {
      server.listen(availablePort, host, () => {
        resolve()
      })

      server.on('error', (error) => {
        reject(error)
      })
    })

    // 获取访问URL
    const urls = getAccessUrls(host, availablePort)

    // 显示启动信息
    console.log('')
    console.log('  ╭────────────────────────────────────╮')
    console.log('  │                                    │')
    console.log('  │   🎨 LDesign UI 已启动!            │')
    console.log('  │                                    │')
    console.log('  ╰────────────────────────────────────╯')
    console.log('')
    uiLogger.success('LDesign UI 管理界面已启动')
    console.log('')
    uiLogger.info(`本地访问: ${urls.local}`)

    if (urls.network) {
      uiLogger.info(`网络访问: ${urls.network}`)
      console.log('')
      uiLogger.info(`💡 提示: 如果使用了全局代理,请使用网络IP访问`)
    }

    console.log('')
    uiLogger.info('按 Ctrl+C 退出')
    console.log('')

    // 自动打开浏览器 - 如果有网络IP,优先使用网络IP
    if (shouldOpen) {
      const openUrl = urls.network || urls.local
      try {
        await open(openUrl)
        uiLogger.info(`已在默认浏览器中打开: ${openUrl}`)
      } catch (error) {
        uiLogger.warn('无法自动打开浏览器，请手动访问上述地址')
      }
    }
  } catch (error) {
    uiLogger.error('启动 UI 管理界面失败:', error)
    throw error
  }
}

/**
 * UI 命令处理器 (CommandHandler 实现)
 */
export const uiCommandHandler: CommandHandler = {
  name: 'ui',
  description: '打开可视化管理界面',

  setup(cli: CAC) {
    cli
      .command('ui', '打开可视化管理界面')
      .option('-p, --port <port>', '指定端口号', { type: [Number] })
      .option('-H, --host <host>', '指定主机地址')
      .option('--no-open', '不自动打开浏览器')
      .action(async (options) => {
        try {
          await uiCommand(options)
        } catch (error) {
          logger.error('UI 命令执行失败:', error)
          process.exit(1)
        }
      })
  },

  async execute(options: UICommandOptions) {
    return uiCommand(options)
  },
}


