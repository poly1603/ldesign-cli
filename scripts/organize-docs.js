/**
 * Documentation Organization Script
 * Moves and consolidates documentation files
 */

import { existsSync, mkdirSync, copyFileSync, unlinkSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const docsDir = join(rootDir, 'docs')

// Files to keep in root
const KEEP_IN_ROOT = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'tsup.config.ts',
  'vitest.config.ts',
  'eslint.config.js',
  'ldesign.config.ts',
  '.gitignore',
  '.npmignore',
  'OPTIMIZATION_SUMMARY.md'
]

// Pattern for files to move
const MOVE_TO_DOCS_PATTERNS = [
  /\.md$/i,  // All markdown files except those in KEEP_IN_ROOT
]

// Files to delete (duplicates or outdated)
const DELETE_PATTERNS = [
  /^QUICK_START\d*\.md$/i,
  /^使用说明.*\.md$/i,
  /^启动说明.*\.md$/i,
  /^开发模式说明.*\.md$/i,
  /^实施总结.*\.md$/i,
  /^当前状态.*\.md$/i,
  /^项目完成.*\.md$/i,
  /^前端依赖.*\.md$/i,
]

/**
 * Ensure docs directory exists
 */
function ensureDocsDir() {
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true })
    console.log('✅ Created docs/ directory')
  }
  
  // Create subdirectories
  const subdirs = ['commands', 'api', 'guides', 'archive']
  for (const subdir of subdirs) {
    const path = join(docsDir, subdir)
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
      console.log(`✅ Created docs/${subdir}/ directory`)
    }
  }
}

/**
 * Check if file should be kept in root
 */
function shouldKeepInRoot(filename) {
  return KEEP_IN_ROOT.includes(filename)
}

/**
 * Check if file should be deleted
 */
function shouldDelete(filename) {
  return DELETE_PATTERNS.some(pattern => pattern.test(filename))
}

/**
 * Check if file should be moved to docs
 */
function shouldMoveToDocs(filename) {
  if (shouldKeepInRoot(filename) || shouldDelete(filename)) {
    return false
  }
  return MOVE_TO_DOCS_PATTERNS.some(pattern => pattern.test(filename))
}

/**
 * Get destination path for a file
 */
function getDestinationPath(filename) {
  // Archive files with emoji prefixes or Chinese characters
  if (/^[✅🎉🎊🎯🏆📚📦]/.test(filename) || /[\u4e00-\u9fa5]/.test(filename)) {
    return join(docsDir, 'archive', filename)
  }
  
  // Legacy files
  if (filename.startsWith('QUICK_START') || 
      filename.startsWith('README_') ||
      filename.startsWith('DELIVERY_') ||
      filename.startsWith('TESTING_') ||
      filename.startsWith('VERSION_')) {
    return join(docsDir, 'archive', filename)
  }
  
  // Move to docs root
  return join(docsDir, filename)
}

/**
 * Organize documentation files
 */
function organizeDocs() {
  console.log('📚 Starting documentation organization...\n')
  
  ensureDocsDir()
  
  const files = readdirSync(rootDir)
  let moved = 0
  let deleted = 0
  let kept = 0
  
  for (const file of files) {
    const filePath = join(rootDir, file)
    
    // Skip directories
    if (!existsSync(filePath) || readdirSync(rootDir, { withFileTypes: true })
        .find(f => f.name === file)?.isDirectory()) {
      continue
    }
    
    // Delete duplicates
    if (shouldDelete(file)) {
      try {
        unlinkSync(filePath)
        console.log(`🗑️  Deleted: ${file}`)
        deleted++
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error.message)
      }
      continue
    }
    
    // Keep in root
    if (shouldKeepInRoot(file)) {
      console.log(`✓  Kept in root: ${file}`)
      kept++
      continue
    }
    
    // Move to docs
    if (shouldMoveToDocs(file)) {
      const destPath = getDestinationPath(file)
      try {
        copyFileSync(filePath, destPath)
        unlinkSync(filePath)
        console.log(`📦 Moved: ${file} -> ${destPath.replace(rootDir, '.')}`)
        moved++
      } catch (error) {
        console.error(`❌ Failed to move ${file}:`, error.message)
      }
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   - ${moved} files moved to docs/`)
  console.log(`   - ${deleted} files deleted`)
  console.log(`   - ${kept} files kept in root`)
  console.log('\n✅ Documentation organization complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Review moved files in docs/ and docs/archive/')
  console.log('   2. Update internal links in documentation')
  console.log('   3. Update README.md to reference docs/INDEX.md')
  console.log('   4. Commit the organized structure')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    organizeDocs()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

export { organizeDocs }
