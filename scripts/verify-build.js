/**
 * 验证构建产物完整性
 * 确保所有必需文件都存在
 */

import { existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = join(__dirname, '..')

/**
 * 验证规则
 */
const verifyRules = [
  // CLI 核心文件
  { path: 'dist/cli/index.js', type: 'file', description: 'CLI 入口文件' },
  { path: 'dist/cli/commands/ui.js', type: 'file', description: 'UI 命令' },

  // Server 文件
  { path: 'dist/server/app.js', type: 'file', description: 'Express 服务器' },
  { path: 'dist/server/routes/projects.js', type: 'file', description: '项目路由' },
  { path: 'dist/server/routes/tools.js', type: 'file', description: '工具路由' },

  // Core 文件
  { path: 'dist/core/database/DatabaseManager.js', type: 'file', description: '数据库管理器' },
  { path: 'dist/core/project/ProjectManager.js', type: 'file', description: '项目管理器' },
  { path: 'dist/core/tool-manager/ToolManager.js', type: 'file', description: '工具管理器' },

  // Web 前端资源
  { path: 'dist/web/index.html', type: 'file', description: 'Web 入口页面' },
  { path: 'dist/web/assets', type: 'directory', description: 'Web 静态资源' },

  // Bin 文件
  { path: 'bin/cli.js', type: 'file', description: 'CLI 可执行文件' },
]

/**
 * 验证单个路径
 */
function verifyPath(rule) {
  const fullPath = join(rootDir, rule.path)

  if (!existsSync(fullPath)) {
    return {
      success: false,
      rule,
      message: `不存在: ${rule.path}`,
    }
  }

  const stat = statSync(fullPath)

  if (rule.type === 'file' && !stat.isFile()) {
    return {
      success: false,
      rule,
      message: `应为文件但是目录: ${rule.path}`,
    }
  }

  if (rule.type === 'directory' && !stat.isDirectory()) {
    return {
      success: false,
      rule,
      message: `应为目录但是文件: ${rule.path}`,
    }
  }

  return {
    success: true,
    rule,
    message: `✓ ${rule.description}`,
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 验证构建产物...\n')

  const results = verifyRules.map(verifyPath)
  const failures = results.filter((r) => !r.success)
  const successes = results.filter((r) => r.success)

  // 显示成功的验证
  if (successes.length > 0) {
    console.log('✅ 验证通过:')
    successes.forEach((r) => {
      console.log(`   ${r.message}`)
    })
    console.log('')
  }

  // 显示失败的验证
  if (failures.length > 0) {
    console.log('❌ 验证失败:')
    failures.forEach((r) => {
      console.log(`   ${r.message}`)
      console.log(`      说明: ${r.rule.description}`)
    })
    console.log('')
    console.log(`总计: ${failures.length} 个问题`)
    process.exit(1)
  }

  console.log(`✅ 所有验证通过! (${successes.length}/${results.length})`)
  console.log('')
  console.log('🎉 构建产物完整，可以发布或使用')
}

// 执行主函数
main()


