#!/usr/bin/env node

/**
 * 修复 server 包的导入路径
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const serverDir = join(process.cwd(), 'dist')

console.log('🔧 修复 server 包导入路径...\n')

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false
  
  // 移除重复的 .js.js
  if (content.includes('.js.js')) {
    content = content.replace(/\.js\.js/g, '.js')
    changed = true
  }
  
  // 修复跨包导入 - 不应该有 /core/ 等子路径
  const fixes = [
    { from: /@ldesign\/cli-server\/core\/database\.js/g, to: './core/database/index.js' },
    { from: /@ldesign\/cli-server\/core\/database\/index\.js/g, to: './core/database/index.js' },
    { from: /@ldesign\/cli-server\/core\/database\/ProjectRepository\.js/g, to: './core/database/ProjectRepository.js' },
    { from: /@ldesign\/cli-server\/core\/project\.js/g, to: './core/project/index.js' },
    { from: /@ldesign\/cli-server\/core\/tool-manager\.js/g, to: './core/tool-manager/index.js' },
    { from: /@ldesign\/cli-server\/core\/tool-manager\/index\.js/g, to: './core/tool-manager/index.js' },
  ]
  
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

walkDir(serverDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++
    console.log(`✅ 修复: ${filePath.replace(serverDir, '')}`)
  }
})

console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个文件`)

