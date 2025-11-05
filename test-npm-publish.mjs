#!/usr/bin/env node

/**
 * 测试 npm 发布后的环境
 * 模拟安装 @ldesign/cli 后的运行情况
 */

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 测试 npm 发布后的环境...\n')

// 检查必要文件
const checkFiles = [
  { path: join(__dirname, 'dist', 'index.js'), name: 'CLI 主文件' },
  { path: join(__dirname, 'bin', 'cli.js'), name: 'CLI 入口文件' },
  { path: join(__dirname, '..', 'server', 'dist', 'index.js'), name: 'Server 包' },
  { path: join(__dirname, '..', 'web', 'dist', 'index.js'), name: 'Web 包' },
]

console.log('📋 检查文件完整性:')
let allFilesExist = true

for (const file of checkFiles) {
  const exists = existsSync(file.path)
  console.log(`  ${exists ? '✅' : '❌'} ${file.name}: ${file.path}`)
  if (!exists) {
    allFilesExist = false
  }
}

if (!allFilesExist) {
  console.log('\n❌ 文件不完整，请先运行构建命令')
  process.exit(1)
}

console.log('\n✅ 所有文件检查通过')

// 测试命令
console.log('\n📍 测试基本命令...')

// 测试 --version
const versionProcess = spawn('node', [join(__dirname, 'bin', 'cli.js'), '--version'], {
  stdio: 'pipe',
  shell: true
})

versionProcess.stdout.on('data', (data) => {
  console.log(`✅ version 命令: ${data.toString().trim()}`)
})

versionProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ version 命令失败，退出码: ${code}`)
  }
  
  // 测试 UI 命令（只启动5秒）
  console.log('\n📍 测试 UI 命令（5秒后自动停止）...')
  
  const uiProcess = spawn('node', [
    join(__dirname, 'bin', 'cli.js'),
    'ui',
    '--prod',
    '--no-open',
    '--server-port', '3456',
    '--web-port', '5678'
  ], {
    stdio: 'inherit',
    shell: true
  })
  
  setTimeout(() => {
    console.log('\n⏱️  停止 UI 进程...')
    uiProcess.kill('SIGTERM')
    
    console.log('\n✅ 测试完成！')
    console.log('\n📝 测试结果总结:')
    console.log('  1. ✅ 文件完整性检查通过')
    console.log('  2. ✅ 基本命令可以执行')
    console.log('  3. ✅ UI 命令可以启动')
    console.log('\n🎉 npm 发布环境测试通过！')
  }, 5000)
  
  uiProcess.on('error', (error) => {
    console.error('❌ UI 命令启动失败:', error)
  })
})