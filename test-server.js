#!/usr/bin/env node
/**
 * 测试服务器启动脚本
 */

import { spawn } from 'child_process'

console.log('🧪 测试后端服务器启动...\n')

const serverProcess = spawn('tsx', ['src/server/dev.ts'], {
  stdio: 'inherit',
  shell: true
})

// 等待 10 秒
setTimeout(() => {
  console.log('\n✅ 服务器启动测试完成（10秒未崩溃）')
  console.log('手动测试: 访问 http://localhost:3000/api/health')

  // 终止进程
  serverProcess.kill('SIGTERM')

  setTimeout(() => {
    process.exit(0)
  }, 2000)
}, 10000)

serverProcess.on('error', (error) => {
  console.error('❌ 服务器启动失败:', error)
  process.exit(1)
})

serverProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ 服务器异常退出，代码: ${code}`)
    process.exit(1)
  }
})

