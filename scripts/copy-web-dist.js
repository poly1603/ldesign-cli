/**
 * 复制 Web 构建产物到 dist 目录
 * 确保生产环境能正确找到静态资源
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 源目录: src/web/dist (Vite构建输出)
const sourceDir = join(__dirname, '../src/web/dist')
// 目标目录: dist/web (CLI包中的位置，对应server/app.ts中的 __dirname/../web)
const targetDir = join(__dirname, '../dist/web')

/**
 * 递归复制目录
 */
function copyDirectory(src, dest) {
  // 确保目标目录存在
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }

  // 读取源目录内容
  const items = readdirSync(src)
  let fileCount = 0
  let dirCount = 0

  for (const item of items) {
    const srcPath = join(src, item)
    const destPath = join(dest, item)
    const stat = statSync(srcPath)

    if (stat.isDirectory()) {
      // 递归复制子目录
      dirCount++
      const result = copyDirectory(srcPath, destPath)
      fileCount += result.fileCount
      dirCount += result.dirCount
    } else {
      // 复制文件
      fileCount++
      copyFileSync(srcPath, destPath)
      if (fileCount % 10 === 0) {
        process.stdout.write(`\r📦 已复制 ${fileCount} 个文件...`)
      }
    }
  }

  return { fileCount, dirCount }
}

/**
 * 验证必需文件
 */
function verifyRequiredFiles() {
  const requiredFiles = ['index.html']
  const requiredDirs = ['assets']

  for (const file of requiredFiles) {
    const filePath = join(targetDir, file)
    if (!existsSync(filePath)) {
      throw new Error(`缺少必需文件: ${file}`)
    }
  }

  for (const dir of requiredDirs) {
    const dirPath = join(targetDir, dir)
    if (!existsSync(dirPath)) {
      throw new Error(`缺少必需目录: ${dir}`)
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始复制 Web 构建产物...')
  console.log(`📂 源目录: ${sourceDir}`)
  console.log(`📂 目标目录: ${targetDir}`)
  console.log('')

  // 检查源目录是否存在
  if (!existsSync(sourceDir)) {
    console.error('❌ Web 构建产物不存在')
    console.error('   源目录:', sourceDir)
    console.error('   请先运行: cd src/web && npm install && npm run build')
    process.exit(1)
  }

  // 检查index.html是否存在
  const indexPath = join(sourceDir, 'index.html')
  if (!existsSync(indexPath)) {
    console.error('❌ 未找到 index.html，Web 应用可能未正确构建')
    console.error('   请检查: cd src/web && npm run build')
    process.exit(1)
  }

  try {
    // 清理目标目录
    if (existsSync(targetDir)) {
      console.log('🧹 清理旧的构建产物...')
      rmSync(targetDir, { recursive: true, force: true })
    }

    // 复制整个 dist 目录
    console.log('📦 开始复制文件...')
    const { fileCount, dirCount } = copyDirectory(sourceDir, targetDir)

    // 换行
    console.log('')

    // 验证必需文件
    console.log('🔍 验证构建产物...')
    verifyRequiredFiles()

    console.log('')
    console.log('✅ Web 构建产物复制完成')
    console.log(`📊 统计: ${fileCount} 个文件, ${dirCount} 个目录`)
    console.log(`📁 目标目录: ${targetDir}`)
  } catch (error) {
    console.error('')
    console.error('❌ 复制失败:', error.message)
    process.exit(1)
  }
}

// 执行主函数
main()


