/**
 * 示例插件
 * 演示如何创建一个 LDesign CLI 插件
 */

import type { Plugin, PluginContext } from './types.js'

/**
 * ESLint 集成插件
 */
export const eslintPlugin: Plugin = {
  metadata: {
    id: 'eslint-integration',
    name: 'ESLint 集成',
    version: '1.0.0',
    description: '集成 ESLint 代码检查功能',
    author: 'LDesign Team',
    keywords: ['eslint', 'lint', 'code-quality']
  },

  async activate(context: PluginContext) {
    context.logger.info('ESLint 插件已激活')

    // 注册 CLI 命令
    context.cli.registerCommand('lint', async (args) => {
      context.logger.info('执行 ESLint 检查...')
      // TODO: 实现 ESLint 检查逻辑
    })

    // 注册菜单项
    context.ui.registerMenuItem({
      id: 'eslint-check',
      label: '代码检查',
      icon: '✓',
      path: '/eslint',
      order: 100
    })

    // 监听项目事件
    context.events.on('project-opened', (projectPath: string) => {
      context.logger.debug(`项目已打开: ${projectPath}`)
      // 可以自动运行 ESLint 检查
    })
  },

  async deactivate(context: PluginContext) {
    context.logger.info('ESLint 插件已停用')

    // 注销命令和菜单
    context.cli.unregisterCommand('lint')
    context.ui.unregisterMenuItem('eslint-check')
  }
}

/**
 * 自动部署插件
 */
export const deployPlugin: Plugin = {
  metadata: {
    id: 'auto-deploy',
    name: '自动部署',
    version: '1.0.0',
    description: '自动化部署到各种平台',
    author: 'LDesign Team',
    keywords: ['deploy', 'ci/cd', 'automation']
  },

  async install(context: PluginContext) {
    context.logger.info('初始化部署配置...')
    // 初始化配置文件
  },

  async activate(context: PluginContext) {
    context.logger.info('自动部署插件已激活')

    // 注册 CLI 命令
    context.cli.registerCommand('deploy', async (args) => {
      context.logger.info('开始部署...')
      // TODO: 实现部署逻辑
    })

    // 监听构建成功事件
    context.events.on('build-success', async (projectPath: string) => {
      context.logger.info(`构建成功，准备部署: ${projectPath}`)
      // 自动部署逻辑
    })
  },

  async deactivate(context: PluginContext) {
    context.logger.info('自动部署插件已停用')
  }
}

/**
 * 文档生成插件
 */
export const docsPlugin: Plugin = {
  metadata: {
    id: 'docs-generator',
    name: '文档生成',
    version: '1.0.0',
    description: '自动生成项目文档',
    author: 'LDesign Team',
    keywords: ['docs', 'documentation', 'typedoc']
  },

  async activate(context: PluginContext) {
    context.logger.info('文档生成插件已激活')

    context.cli.registerCommand('docs', async (args) => {
      context.logger.info('生成文档...')
      // TODO: 使用 TypeDoc 或其他工具生成文档
    })

    context.ui.registerMenuItem({
      id: 'generate-docs',
      label: '生成文档',
      icon: '📚',
      path: '/docs',
      order: 90
    })
  },

  async deactivate(context: PluginContext) {
    context.logger.info('文档生成插件已停用')
    context.cli.unregisterCommand('docs')
    context.ui.unregisterMenuItem('generate-docs')
  },

  async onConfigChange(config, context) {
    context.logger.info('配置已更新:', config)
    // 响应配置变更
  }
}

/**
 * 导出所有示例插件
 */
export const examplePlugins = [
  eslintPlugin,
  deployPlugin,
  docsPlugin
]

