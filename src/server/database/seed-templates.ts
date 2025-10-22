/**
 * 模板数据种子
 * 初始化一些内置的官方模板
 */

import { addTemplate } from './templates.js'
import { logger } from '../../utils/logger.js'

const seedLogger = logger.withPrefix('TemplateSeed')

/**
 * 官方模板列表
 */
const officialTemplates = [
  {
    name: 'Vue 3 + TypeScript',
    description: 'Vue 3 + TypeScript + Vite 快速开始模板，包含路由、状态管理和常用工具',
    category: 'vue',
    tags: ['vue3', 'typescript', 'vite', 'pinia', 'vue-router'],
    gitUrl: 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vue-ts',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '🎨',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '项目描述',
        type: 'string',
        defaultValue: 'A Vue 3 + TypeScript project',
        required: false
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      }
    ]
  },
  {
    name: 'React + TypeScript',
    description: 'React + TypeScript + Vite 现代化模板，配置完善，开箱即用',
    category: 'react',
    tags: ['react', 'typescript', 'vite', 'react-router'],
    gitUrl: 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '⚛️',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '项目描述',
        type: 'string',
        defaultValue: 'A React + TypeScript project',
        required: false
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      }
    ]
  },
  {
    name: 'Node.js API Server',
    description: 'Node.js + Express + TypeScript API 服务器模板，包含认证、数据库等',
    category: 'node',
    tags: ['nodejs', 'express', 'typescript', 'api'],
    gitUrl: 'https://github.com/microsoft/TypeScript-Node-Starter',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '🟢',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '项目描述',
        type: 'string',
        defaultValue: 'A Node.js API server',
        required: false
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      },
      {
        name: 'port',
        label: '端口号',
        type: 'number',
        defaultValue: 3000,
        required: false
      }
    ]
  },
  {
    name: 'TypeScript Library',
    description: 'TypeScript 库模板，配置完善的构建工具链，支持发布到 NPM',
    category: 'library',
    tags: ['typescript', 'library', 'npm'],
    gitUrl: 'https://github.com/alexjoverm/typescript-library-starter',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '📚',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '库描述',
        type: 'string',
        required: true
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: true
      },
      {
        name: 'license',
        label: '许可证',
        type: 'select',
        options: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'],
        defaultValue: 'MIT',
        required: true
      }
    ]
  },
  {
    name: 'Vue 3 全栈应用',
    description: 'Vue 3 + Node.js 全栈应用模板，前后端分离，包含认证和数据库',
    category: 'fullstack',
    tags: ['vue3', 'nodejs', 'fullstack', 'mongodb'],
    gitUrl: 'https://github.com/sahat/hackathon-starter',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '🚀',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '项目描述',
        type: 'string',
        defaultValue: 'A fullstack application',
        required: false
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      },
      {
        name: 'database',
        label: '数据库',
        type: 'select',
        options: ['mongodb', 'postgresql', 'mysql', 'sqlite'],
        defaultValue: 'mongodb',
        required: true
      }
    ]
  },
  {
    name: 'Electron 桌面应用',
    description: 'Electron + Vue 3 桌面应用模板，支持 Windows、macOS 和 Linux',
    category: 'desktop',
    tags: ['electron', 'vue3', 'desktop'],
    gitUrl: 'https://github.com/electron-vite/electron-vite-vue',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '💻',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '应用描述',
        type: 'string',
        defaultValue: 'An Electron desktop application',
        required: false
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      }
    ]
  },
  {
    name: 'Chrome 扩展',
    description: 'Chrome 扩展模板，使用 Vue 3 + TypeScript，包含完整的配置',
    category: 'other',
    tags: ['chrome', 'extension', 'vue3'],
    gitUrl: 'https://github.com/antfu/vitesse-webext',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '🔌',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '扩展描述',
        type: 'string',
        required: true
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      }
    ]
  },
  {
    name: '微信小程序',
    description: '微信小程序模板，使用 TypeScript，包含常用组件和工具',
    category: 'mobile',
    tags: ['wechat', 'miniprogram', 'typescript'],
    gitUrl: 'https://github.com/wechat-miniprogram/miniprogram-demo',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: '📱',
    isOfficial: true,
    variables: [
      {
        name: 'description',
        label: '小程序描述',
        type: 'string',
        required: true
      },
      {
        name: 'author',
        label: '作者',
        type: 'string',
        required: false
      },
      {
        name: 'appid',
        label: '小程序 AppID',
        type: 'string',
        required: false,
        description: '可以稍后在 project.config.json 中配置'
      }
    ]
  }
]

/**
 * 种子化模板数据
 */
export async function seedTemplates(): Promise<void> {
  try {
    seedLogger.info('正在初始化官方模板...')

    let count = 0
    for (const template of officialTemplates) {
      try {
        addTemplate(template)
        count++
      }
      catch (error) {
        // 可能模板已存在，忽略错误
        seedLogger.warn(`模板 "${template.name}" 可能已存在`)
      }
    }

    seedLogger.success(`成功初始化 ${count} 个官方模板`)
  }
  catch (error) {
    seedLogger.error('初始化官方模板失败:', error)
  }
}


