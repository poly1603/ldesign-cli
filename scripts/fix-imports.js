#!/usr/bin/env node

/**
 * 修复所有包的导入路径
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const rootDir = process.cwd()

console.log('🔧 开始修复导入路径...\n')

// 修复规则
const fixes = [
  // shared 包导入
  { from: /from ['"]\.\.\/shared\//g, to: "from '@ldesign/cli-shared/" },
  { from: /from ['"]\.\.\/\.\.\/shared\//g, to: "from '@ldesign/cli-shared/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/shared\//g, to: "from '@ldesign/cli-shared/" },
  
  // server 包导入
  { from: /from ['"]\.\.\/server\//g, to: "from '@ldesign/cli-server/" },
  { from: /from ['"]\.\.\/\.\.\/server\//g, to: "from '@ldesign/cli-server/" },
  { from: /from ['"]\.\.\/core\//g, to: "from '@ldesign/cli-server/core/" },
  { from: /from ['"]\.\.\/\.\.\/core\//g, to: "from '@ldesign/cli-server/core/" },
  
  // 添加 .js 扩展名
  { from: /from ('@ldesign\/cli-[^']+)'/g, to: "from $1.js'" },
  { from: /from ("@ldesign\/cli-[^"]+)"/g, to: 'from $1.js"' },
]

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false
  
  fixes.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to)
      changed = true
    }
  })
  
  if (changed) {
    writeFileSync(filePath, content, 'utf-8')
    return true
  }
  return false
}

function walkDir(dir, callback) {
  const files = readdirSync(dir)
  
  files.forEach((file) => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        walkDir(filePath, callback)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      callback(filePath)
    }
  })
}

let fixedCount = 0

// 修复所有包
const packages = ['shared', 'server', 'web-ui', 'cli']
packages.forEach((pkg) => {
  const pkgDir = join(rootDir, 'packages', pkg, 'src')
  console.log(`📦 修复 ${pkg} 包...`)
  
  walkDir(pkgDir, (filePath) => {
    if (fixFile(filePath)) {
      fixedCount++
    }
  })
})

console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个文件`)

