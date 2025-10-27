#!/usr/bin/env node

/**
 * LDesign CLI 入口脚本
 */

import('../dist/index.js')
  .then((module) => {
    const main = module.main || module.default
    if (typeof main === 'function') {
      return main()
    } else {
      console.error('错误: 无法找到主函数')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('CLI 启动失败:', error)
    process.exit(1)
  })

