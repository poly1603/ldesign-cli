#!/usr/bin/env node

/**
 * 快速设置 Monorepo 结构
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🚀 开始设置 Monorepo 结构...\n')

// 创建 packages 目录
const packagesDir = join(rootDir, 'packages')
if (!existsSync(packagesDir)) {
  mkdirSync(packagesDir, { recursive: true })
  console.log('✅ 创建 packages 目录')
}

// 定义包结构
const packages = [
  {
    name: '@ldesign/cli-shared',
    dir: 'shared',
    description: '共享代码、类型定义和工具函数',
  },
  {
    name: '@ldesign/cli-server',
    dir: 'server',
    description: '后端 API 服务',
  },
  {
    name: '@ldesign/cli-web-ui',
    dir: 'web-ui',
    description: 'Web UI 管理界面',
  },
  {
    name: '@ldesign/cli',
    dir: 'cli',
    description: 'CLI 命令行工具',
  },
]

// 创建每个包
packages.forEach((pkg) => {
  const pkgDir = join(packagesDir, pkg.dir)
  const srcDir = join(pkgDir, 'src')

  // 创建目录
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true })
  }

  // 创建 package.json
  const packageJson = {
    name: pkg.name,
    version: '1.0.0',
    type: 'module',
    description: pkg.description,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    },
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      clean: 'rimraf dist',
      test: 'vitest',
    },
    dependencies: {},
    devDependencies: {
      tsup: '^8.0.0',
      typescript: '^5.7.3',
    },
  }

  // CLI 包需要 bin 配置
  if (pkg.dir === 'cli') {
    packageJson.bin = {
      ldesign: './bin/cli.js',
      ld: './bin/cli.js',
    }
    packageJson.dependencies = {
      '@ldesign/cli-shared': 'workspace:*',
      '@ldesign/cli-server': 'workspace:*',
      cac: '^6.7.14',
      open: '^10.0.3',
      portfinder: '^1.0.32',
    }
  }

  // Server 包依赖
  if (pkg.dir === 'server') {
    packageJson.dependencies = {
      '@ldesign/cli-shared': 'workspace:*',
      express: '^4.18.2',
      cors: '^2.8.5',
      ws: '^8.16.0',
      'better-sqlite3': '^11.7.0',
      chalk: '^5.3.0',
      chokidar: '^3.5.3',
    }
    packageJson.devDependencies['@types/express'] = '^4.17.21'
    packageJson.devDependencies['@types/cors'] = '^2.8.17'
    packageJson.devDependencies['@types/ws'] = '^8.5.10'
    packageJson.devDependencies['@types/better-sqlite3'] = '^7.6.12'
  }

  // Web UI 包依赖
  if (pkg.dir === 'web-ui') {
    packageJson.dependencies = {
      '@ldesign/cli-shared': 'workspace:*',
      vue: '^3.5.13',
      'naive-ui': '^2.40.1',
    }
    packageJson.devDependencies['@vitejs/plugin-vue'] = '^5.2.1'
    packageJson.devDependencies.vite = '^6.0.7'
    packageJson.scripts.build = 'vite build'
    packageJson.scripts.dev = 'vite'
  }

  writeFileSync(
    join(pkgDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  )

  // 创建 tsconfig.json
  const tsconfig = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
  }

  writeFileSync(
    join(pkgDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n'
  )

  // 创建 tsup.config.ts (除了 web-ui)
  if (pkg.dir !== 'web-ui') {
    const tsupConfig = `import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
  format: ['esm'],
  outDir: 'dist',
  dts: ${pkg.dir === 'shared'},
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  platform: 'node',
  keepNames: true,
  onSuccess: async () => {
    console.log('✅ ${pkg.name} 构建完成')
  },
})
`
    writeFileSync(join(pkgDir, 'tsup.config.ts'), tsupConfig)
  }

  // 创建 src/index.ts
  const indexContent = `/**
 * ${pkg.description}
 */

export {}
`
  writeFileSync(join(srcDir, 'index.ts'), indexContent)

  console.log(`✅ 创建包: ${pkg.name}`)
})

console.log('\n🎉 Monorepo 结构设置完成！')
console.log('\n下一步:')
console.log('1. 运行 pnpm install 安装依赖')
console.log('2. 迁移代码到各个包')
console.log('3. 运行 pnpm build 构建所有包')

