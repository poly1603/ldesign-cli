/**
 * 开发模式启动脚本
 * 串行启动后端和前端开发服务器，确保后端就绪后再启动前端
 */

import { spawn } from 'child_process'
import chalk from 'chalk'
import http from 'http'

/**
 * 等待端口可用
 */
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const interval = 500

    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve()
        } else {
          scheduleNextCheck()
        }
      })

      req.on('error', () => {
        scheduleNextCheck()
      })

      req.setTimeout(1000, () => {
        req.destroy()
        scheduleNextCheck()
      })
    }

    const scheduleNextCheck = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`等待端口 ${port} 超时`))
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.blue.bold('\n🚀 启动 LDesign CLI 开发模式...\n'))

  // 1. 启动后端服务器
  console.log(chalk.cyan('📦 启动后端服务器 (端口 3000)...'))
  const backend = spawn('tsx', ['watch', 'src/cli/index.ts', 'ui', '--no-open', '--debug'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  // 输出后端日志
  backend.stdout.on('data', (data) => {
    process.stdout.write(chalk.gray(`[Backend] ${data}`))
  })

  backend.stderr.on('data', (data) => {
    process.stderr.write(chalk.yellow(`[Backend] ${data}`))
  })

  // 2. 等待后端就绪
  try {
    console.log(chalk.cyan('⏳ 等待后端服务器就绪...\n'))
    await waitForPort(3000, 30000)
    console.log(chalk.green('✅ 后端服务器已就绪!\n'))
  } catch (error) {
    console.error(chalk.red('❌ 后端服务器启动失败:', error.message))
    backend.kill()
    process.exit(1)
  }

  // 3. 启动前端开发服务器
  console.log(chalk.magenta('🎨 启动前端开发服务器 (端口 5173)...\n'))
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: 'src/web',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  // 输出前端日志
  frontend.stdout.on('data', (data) => {
    process.stdout.write(chalk.gray(`[Frontend] ${data}`))
  })

  frontend.stderr.on('data', (data) => {
    process.stderr.write(chalk.gray(`[Frontend] ${data}`))
  })

  // 4. 显示访问信息
  setTimeout(() => {
    console.log('')
    console.log(chalk.green.bold('✨ 开发服务器已启动!\n'))
    console.log(chalk.yellow.bold('📝 访问方式:'))
    console.log(chalk.white('  🌐 前端页面: ') + chalk.cyan.bold.underline('http://localhost:5173') + chalk.green(' ← 访问这个'))
    console.log(chalk.white('  🔌 后端API:  ') + chalk.cyan.underline('http://localhost:3000/api'))
    console.log('')
    console.log(chalk.yellow.bold('🔗 代理配置:'))
    console.log(chalk.white('  - API 请求 /api → http://127.0.0.1:3000/api'))
    console.log(chalk.white('  - WebSocket /ws → ws://127.0.0.1:3000/ws'))
    console.log('')
    console.log(chalk.gray('💡 提示:'))
    console.log(chalk.gray('  • 访问前端页面查看 UI 界面'))
    console.log(chalk.gray('  • API 和 WebSocket 会自动代理到后端'))
    console.log(chalk.gray('  • 修改代码会自动热重载'))
    console.log(chalk.gray('  • 按 Ctrl+C 停止所有服务器\n'))
  }, 3000)

  return { backend, frontend }
}

// 启动开发服务器
const serversPromise = main().catch((error) => {
  console.error(chalk.red('启动失败:', error))
  process.exit(1)
})

// 处理退出
async function cleanup() {
  console.log(chalk.yellow('\n\n正在关闭开发服务器...'))

  const servers = await serversPromise
  if (servers) {
    servers.backend.kill()
    servers.frontend.kill()
  }

  setTimeout(() => {
    console.log(chalk.gray('👋 再见!\n'))
    process.exit(0)
  }, 500)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// 监听服务器退出
serversPromise.then((servers) => {
  servers.backend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(chalk.red('\n❌ 后端服务器异常退出'))
      servers.frontend.kill()
      process.exit(1)
    }
  })

  servers.frontend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(chalk.red('\n❌ 前端服务器异常退出'))
      servers.backend.kill()
      process.exit(1)
    }
  })
})
