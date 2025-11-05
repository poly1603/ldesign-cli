#!/usr/bin/env node

/**
 * 简化的npm发布环境测试
 */

import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 测试 npm 发布后的环境...\n')

// 检查关键文件
const files = [
  join(__dirname, 'dist', 'index.js'),
  join(__dirname, 'bin', 'cli.js'),
  join(__dirname, '..', 'server', 'dist', 'index.js'),
  join(__dirname, '..', 'web', 'dist', 'index.js'),
]

console.log('📋 文件检查:')
let allOk = true
for (const file of files) {
  const exists = existsSync(file)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) allOk = false
}

if (!allOk) {
  console.log('\n❌ 文件不完整')
  process.exit(1)
}

// 测试基本命令
console.log('\n📍 测试命令:')

try {
  // 测试 version
  const version = execSync('node bin/cli.js --version', { encoding: 'utf-8' }).trim()
  console.log(`  ✅ version: ${version}`)
  
  // 测试 help
  execSync('node bin/cli.js --help', { stdio: 'ignore' })
  console.log('  ✅ help 命令正常')
  
  // 测试 ui help
  execSync('node bin/cli.js ui --help', { stdio: 'ignore' })
  console.log('  ✅ ui --help 命令正常')
  
  console.log('\n🎉 所有测试通过！')
} catch (error) {
  console.error('\n❌ 测试失败:', error.message)
  process.exit(1)
}