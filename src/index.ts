/**
 * CLI 入口文件
 */

import { cac } from 'cac'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { uiCommandHandler } from './commands/ui'
import { buildCommandHandler } from './commands/build'
import { devCommandHandler } from './commands/dev'
import { deployCommandHandler } from './commands/deploy'
import { testCommandHandler } from './commands/test'
import { generateCommandHandler } from './commands/generate'
import { logger } from '@ldesign/shared/utils.js'
import { APP_NAME, APP_DISPLAY_NAME } from '@ldesign/shared/constants.js'
import { getCommandRegistry } from './CommandRegistry'
import { getConfigManager } from '@ldesign/server'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 获取包版本号
 */
function getVersion(): string {
  try {
    const packagePath = resolve(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version || '1.0.0'
  } catch (error) {
    logger.warn('无法读取版本信息，使用默认版�?)
    return '1.0.0'
  }
}

/**
 * 创建 CLI 应用
 */
function createCLI() {
  const cli = cac(APP_NAME)

  // 设置版本
  cli.version(getVersion())

  // 全局选项
  cli
    .option('--debug', '启用调试模式')
    .option('--silent', '静默模式')
    .option('--verbose', '详细输出')

  // 注册命令
  const registry = getCommandRegistry()

  // 注册 UI 命令
  registry.register(uiCommandHandler)

  // TODO: 注册其他命令
  // registry.register(initCommandHandler)
  // registry.register(createCommandHandler)
  // registry.register(buildCommandHandler)
  // registry.register(testCommandHandler)

  // 设置所有命�?
  registry.setupCLI(cli)

  // 帮助信息
  cli.help()

  return cli
}

/**
 * 显示欢迎信息
 */
function showWelcome(): void {
  const version = getVersion()

  console.log('')
  console.log('  ╭────────────────────────────────────�?)
  console.log('  �?                                   �?)
  console.log(`  �?    🎨 ${APP_DISPLAY_NAME} v${version.padEnd(14)}│`)
  console.log('  �?                                   �?)
  console.log('  �?    现代化的设计系统 CLI 工具      �?)
  console.log('  �?                                   �?)
  console.log('  ╰────────────────────────────────────�?)
  console.log('')
}

/**
 * 主函�?
 */
export async function main(): Promise<void> {
  try {
    // 加载配置
    const configManager = getConfigManager()
    configManager.loadConfig()

    // 应用配置到日�?
    const config = configManager.getConfig()
    if (config.logLevel) {
      logger.setLevel(config.logLevel)
    }

    // 创建 CLI
    const cli = createCLI()

    // 如果没有参数，显示帮�?
    if (process.argv.length <= 2) {
      showWelcome()
      cli.help()
      return
    }

    // 解析命令行参�?
    cli.parse(process.argv)
  } catch (error) {
    logger.error('CLI 启动失败:', error)
    process.exit(1)
  }
}

// 默认导出（用于构建后的版本）
export default main

// 如果直接运行此文件，执行 main 函数
const currentFile = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] === currentFile ||
  process.argv[1]?.endsWith('src/cli/index.ts') ||
  process.argv[1]?.includes('tsx')

if (isMainModule) {
  main().catch((error) => {
    logger.error('CLI 执行失败:', error)
    process.exit(1)
  })
}


