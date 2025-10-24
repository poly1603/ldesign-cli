#!/usr/bin/env node
/**
 * 验证 CLI 工具集成平台的设置和配置
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('🔍 验证 CLI 工具集成平台设置...\n')

const checks = []

// 1. 检查核心文件
console.log('📁 检查核心文件...')

const coreFiles = [
  'src/server/services/types.ts',
  'src/server/services/tool-service-manager.ts',
  'src/server/services/service-registry.ts',
  'src/server/services/builder-service.ts',
  'src/server/services/analyzer-service.ts',
  'src/server/services/deployer-service.ts',
  'src/server/workflow/workflow-engine.ts',
  'src/server/routes/builder.ts',
  'src/server/routes/analyzer.ts',
  'src/server/routes/deployer.ts',
  'src/server/routes/workflow.ts',
  'src/web/src/views/ToolsOverview.vue',
  'src/web/src/views/BuildManager.vue',
  'src/web/src/views/ProjectLifecycle.vue',
  'src/web/src/views/WorkflowBuilder.vue'
]

let filesOK = true
for (const file of coreFiles) {
  const filePath = resolve(projectRoot, file)
  const exists = existsSync(filePath)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) filesOK = false
}

checks.push({ name: '核心文件', passed: filesOK })

// 2. 检查配置文件
console.log('\n⚙️  检查配置文件...')

const configFiles = [
  'package.json',
  'tsconfig.json',
  'tsup.config.ts',
  'src/web/vite.config.ts'
]

let configOK = true
for (const file of configFiles) {
  const filePath = resolve(projectRoot, file)
  const exists = existsSync(filePath)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) configOK = false
}

checks.push({ name: '配置文件', passed: configOK })

// 3. 检查文档
console.log('\n📚 检查文档文件...')

const docFiles = [
  'README_INTEGRATION.md',
  'QUICK_START_INTEGRATION.md',
  'IMPLEMENTATION_SUMMARY.md',
  '🎊_PROJECT_COMPLETE_🎊.md',
  'TESTING_GUIDE.md'
]

let docsOK = true
for (const file of docFiles) {
  const filePath = resolve(projectRoot, file)
  const exists = existsSync(filePath)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) docsOK = false
}

checks.push({ name: '文档文件', passed: docsOK })

// 4. 检查 node_modules
console.log('\n📦 检查依赖安装...')

const nodeModulesExists = existsSync(resolve(projectRoot, 'node_modules'))
console.log(`  ${nodeModulesExists ? '✅' : '❌'} node_modules`)

if (!nodeModulesExists) {
  console.log('  ⚠️  请运行: pnpm install')
}

checks.push({ name: '依赖安装', passed: nodeModulesExists })

// 5. 检查数据目录
console.log('\n💾 检查数据目录...')

const dataDir = resolve(projectRoot, 'data')
const dataDirExists = existsSync(dataDir)
console.log(`  ${dataDirExists ? '✅' : '📝'} data/ ${dataDirExists ? '(已存在)' : '(首次运行时自动创建)'}`)

checks.push({ name: '数据目录', passed: true }) // 可选，首次运行时创建

// 总结
console.log('\n' + '='.repeat(60))
console.log('\n📊 验证结果:')

const allPassed = checks.every(check => check.passed)

for (const check of checks) {
  console.log(`  ${check.passed ? '✅' : '❌'} ${check.name}`)
}

console.log('\n' + '='.repeat(60))

if (allPassed) {
  console.log('\n🎉 验证通过！所有检查项都OK')
  console.log('\n📝 下一步:')
  console.log('   1. 运行 pnpm dev 启动开发服务器')
  console.log('   2. 访问 http://localhost:3000')
  console.log('   3. 查看 QUICK_START_INTEGRATION.md 了解使用方法\n')
  process.exit(0)
} else {
  console.log('\n❌ 验证失败！请检查上述标记为❌的项目')
  console.log('\n💡 提示:')
  if (!nodeModulesExists) {
    console.log('   - 运行 pnpm install 安装依赖')
  }
  if (!filesOK || !configOK) {
    console.log('   - 确认所有文件已正确创建')
  }
  console.log('')
  process.exit(1)
}

