#!/usr/bin/env node

/**
 * LDesign CLI 可执行文件
 */

import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 正确的相对路径
const cliPath = resolve(__dirname, '../dist/cli/index.js')
const cliUrl = pathToFileURL(cliPath).href

// ESM 加载器
import(cliUrl)
  .then((module) => {
    const { main } = module
    if (typeof main === 'function') {
      return main()
    }
    // 如果是 default export
    if (module.default && typeof module.default === 'function') {
      return module.default()
    }
  })
  .catch((error) => {
    console.error('CLI 启动失败:', error)
    console.error('尝试加载:', cliPath)
    process.exit(1)
  })
