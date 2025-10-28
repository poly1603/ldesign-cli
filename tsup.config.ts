import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index-simple.ts'],

  // 输出格式 - 使用 ESM
  format: ['esm'],

  // 输出目录
  outDir: 'dist',

  // 生成类型定义文件 - 暂时禁用以避免工具包类型检查问题
  dts: false,

  // 清理输出目录
  clean: true,

  // 分包策略 - 保持目录结构
  splitting: false,

  // 源码映射
  sourcemap: true,

  // 不压缩
  minify: false,

  // 目标环境
  target: 'node18',

  // 平台
  platform: 'node',

  // 外部依赖 - 不打包这些包
  external: [
    // Node.js 内置模块
    'fs',
    'path',
    'url',
    'events',
    'stream',
    'buffer',
    'util',
    'crypto',
    'http',
    'https',

    // 第三方依赖
    'better-sqlite3',
    'express',
    'cors',
    'ws',
    'chalk',
    'cac',
    'open',
    'portfinder',
    'axios',

    // LDesign 工具包
    '@ldesign/builder',
    '@ldesign/launcher',
    '@ldesign/tester',
    '@ldesign/analyzer',
    '@ldesign/deployer',
    '@ldesign/docs-generator',
    '@ldesign/generator',
    '@ldesign/git',
    '@ldesign/monitor',
    '@ldesign/security',
    '@ldesign/deps',
  ],

  // 保持目录结构
  keepNames: true,

  // 环境变量
  env: {
    NODE_ENV: 'production',
  },

  // 构建完成后的钩子
  onSuccess: async () => {
    console.log('✅ CLI 构建完成')
  },
})
