#!/usr/bin/env node

/**
 * 手动测试UI命令启动和功能
 */

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 测试 UI 命令启动...\n')

const uiProcess = spawn('node', [
  join(__dirname, 'bin', 'cli.js'),
  'ui',
  '--dev',
  '--no-open'
], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
})

console.log('✅ UI 进程已启动，PID:', uiProcess.pid)
console.log('💡 等待30秒后自动停止...')
console.log('💡 请在浏览器中访问:')
console.log('   - 前端: http://localhost:5173')
console.log('   - 后端: http://localhost:3000/api/health')
console.log('')

// 30秒后自动停止
setTimeout(() => {
  console.log('\n⏱️  时间到，停止进程...')
  uiProcess.kill('SIGTERM')
  
  setTimeout(() => {
    console.log('✅ 测试完成')
    process.exit(0)
  }, 2000)
}, 30000)

uiProcess.on('error', (error) => {
  console.error('❌ 启动失败:', error)
  process.exit(1)
})

uiProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\n⚠️  进程退出，代码: ${code}`)
  }
})