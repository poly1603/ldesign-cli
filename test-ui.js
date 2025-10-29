import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import open from 'open'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SERVER_PATH = join(__dirname, '..', 'server')
const PORT = 3000

console.log('\n🚀 启动 LDesign UI 管理界面...\n')
console.log(`📂 Server路径: ${SERVER_PATH}`)

// 启动server
const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: SERVER_PATH,
  stdio: 'inherit',
  shell: true,
})

serverProcess.on('error', (error) => {
  console.error(`❌ Server启动失败: ${error.message}`)
  process.exit(1)
})

// 等待3秒后打开浏览器
setTimeout(async () => {
  const url = `http://localhost:${PORT}`
  console.log(`\n✨ 服务器运行中！`)
  console.log(`📍 访问地址: ${url}\n`)
  console.log(`🌐 正在打开浏览器...\n`)
  
  try {
    await open(url)
    console.log(`✅ 浏览器已打开`)
    console.log(`\n💡 按 Ctrl+C 停止服务\n`)
  } catch (error) {
    console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`)
  }
}, 3000)

// 处理退出
const cleanup = () => {
  console.log('\n🔄 正在停止服务器...')
  serverProcess.kill()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
