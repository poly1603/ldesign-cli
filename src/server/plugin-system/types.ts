/**
 * 插件系统类型定义
 */

import type { Router } from 'express'

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/**
 * 插件配置
 */
export interface PluginConfig {
  enabled: boolean
  options?: Record<string, any>
}

/**
 * 插件状态
 */
export type PluginStatus = 'installed' | 'active' | 'inactive' | 'error'

/**
 * 插件信息
 */
export interface PluginInfo {
  metadata: PluginMetadata
  status: PluginStatus
  config: PluginConfig
  installedAt: number
  activatedAt?: number
  error?: string
}

/**
 * 插件 API 上下文
 */
export interface PluginContext {
  // 日志
  logger: {
    debug: (message: string, ...args: any[]) => void
    info: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
  }

  // 存储
  storage: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
  }

  // 事件
  events: {
    on: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
    emit: (event: string, ...args: any[]) => void
  }

  // HTTP
  http: {
    registerRoute: (path: string, router: Router) => void
    unregisterRoute: (path: string) => void
  }

  // CLI
  cli: {
    registerCommand: (name: string, handler: (args: any) => Promise<void>) => void
    unregisterCommand: (name: string) => void
  }

  // UI
  ui: {
    registerMenuItem: (item: MenuItem) => void
    unregisterMenuItem: (id: string) => void
    registerView: (view: ViewConfig) => void
    unregisterView: (id: string) => void
  }
}

/**
 * 菜单项配置
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  path: string
  order?: number
}

/**
 * 视图配置
 */
export interface ViewConfig {
  id: string
  path: string
  component: string
  title: string
}

/**
 * 插件接口
 */
export interface Plugin {
  /**
   * 插件元数据
   */
  metadata: PluginMetadata

  /**
   * 安装插件
   */
  install?(context: PluginContext): Promise<void>

  /**
   * 激活插件
   */
  activate(context: PluginContext): Promise<void>

  /**
   * 停用插件
   */
  deactivate?(context: PluginContext): Promise<void>

  /**
   * 卸载插件
   */
  uninstall?(context: PluginContext): Promise<void>

  /**
   * 配置变更回调
   */
  onConfigChange?(config: PluginConfig, context: PluginContext): Promise<void>
}

/**
 * 插件钩子
 */
export interface PluginHooks {
  // 项目生命周期
  onProjectCreated?: (projectPath: string) => Promise<void>
  onProjectOpened?: (projectPath: string) => Promise<void>
  onProjectClosed?: (projectPath: string) => Promise<void>
  onProjectDeleted?: (projectPath: string) => Promise<void>

  // 构建生命周期
  onBuildStart?: (projectPath: string) => Promise<void>
  onBuildEnd?: (projectPath: string, success: boolean) => Promise<void>

  // 依赖变更
  onDependencyInstalled?: (packageName: string, version: string) => Promise<void>
  onDependencyUpdated?: (packageName: string, oldVersion: string, newVersion: string) => Promise<void>
  onDependencyRemoved?: (packageName: string) => Promise<void>
}

/**
 * 插件加载器选项
 */
export interface PluginLoaderOptions {
  pluginsDir: string
  autoActivate?: boolean
  verbose?: boolean
}

