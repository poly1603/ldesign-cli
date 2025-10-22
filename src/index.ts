/**
 * LDesign CLI 主入口文件
 * 提供命令行工具的核心功能
 */

import { cac } from 'cac'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { uiCommand } from './commands/ui.js'
import { logger } from './utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 获取包版本号
 */
function getVersion(): string {
  try {
    const packagePath = resolve(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version || '1.0.0'
  } catch (error) {
    logger.warn('无法读取版本信息，使用默认版本')
    return '1.0.0'
  }
}

/**
 * 创建 CLI 应用
 */
function createCLI() {
  const cli = cac('ldesign')

  // 设置版本
  cli.version(getVersion())

  // 全局选项
  cli
    .option('--debug', '启用调试模式')
    .option('--silent', '静默模式')
    .option('--verbose', '详细输出')

  // 注册 UI 命令
  cli
    .command('ui', '打开 LDesign UI 管理界面')
    .option('-p, --port <port>', '指定端口号', { default: 3000 })
    .option('-H, --host <host>', '指定主机地址', { default: 'localhost' })
    .option('--no-open', '不自动打开浏览器')
    .action(async (options) => {
      try {
        await uiCommand(options)
      } catch (error) {
        logger.error('UI 命令执行失败:', error)
        process.exit(1)
      }
    })

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
  console.log('  ╭────────────────────────────────────╮')
  console.log('  │                                    │')
  console.log('  │     🎨 LDesign CLI v' + version.padEnd(14) + '│')
  console.log('  │                                    │')
  console.log('  │     现代化的设计系统 CLI 工具      │')
  console.log('  │                                    │')
  console.log('  ╰────────────────────────────────────╯')
  console.log('')
}

/**
 * 主函数 - 供开发模式调用
 */
export async function main(): Promise<void> {
  try {
    const cli = createCLI()

    // 如果没有参数，显示帮助
    if (process.argv.length <= 2) {
      showWelcome()
      cli.help()
      return
    }

    // 解析命令行参数
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
const isMainModule = process.argv[1] === currentFile ||
  process.argv[1]?.endsWith('src/index.ts') ||
  process.argv[1]?.includes('tsx')

if (isMainModule) {
  main().catch((error) => {
    logger.error('CLI 执行失败:', error)
    process.exit(1)
  })
}
