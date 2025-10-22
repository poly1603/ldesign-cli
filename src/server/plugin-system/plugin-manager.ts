/**
 * 插件管理器
 * 管理插件的生命周期和状态
 */

import { EventEmitter } from 'events'
import type { Router } from 'express'
import { logger } from '../../utils/logger.js'
import type {
  Plugin,
  PluginInfo,
  PluginMetadata,
  PluginConfig,
  PluginContext,
  PluginStatus,
  MenuItem,
  ViewConfig
} from './types.js'

const pluginLogger = logger.withPrefix('PluginManager')

/**
 * 插件管理器类
 */
export class PluginManager extends EventEmitter {
  private static instance: PluginManager
  private plugins: Map<string, PluginInfo> = new Map()
  private activePlugins: Map<string, Plugin> = new Map()
  private contexts: Map<string, PluginContext> = new Map()

  private constructor() {
    super()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager()
    }
    return PluginManager.instance
  }

  /**
   * 注册插件
   */
  public async registerPlugin(plugin: Plugin, config: PluginConfig = { enabled: true }): Promise<void> {
    const { metadata } = plugin
    const pluginId = metadata.id

    if (this.plugins.has(pluginId)) {
      throw new Error(`插件 ${pluginId} 已注册`)
    }

    pluginLogger.info(`注册插件: ${metadata.name} (${metadata.version})`)

    // 创建插件信息
    const info: PluginInfo = {
      metadata,
      status: 'installed',
      config,
      installedAt: Date.now()
    }

    this.plugins.set(pluginId, info)

    // 如果启用，立即激活
    if (config.enabled) {
      await this.activatePlugin(pluginId, plugin)
    }

    this.emit('plugin-registered', info)
  }

  /**
   * 激活插件
   */
  public async activatePlugin(pluginId: string, plugin?: Plugin): Promise<void> {
    const info = this.plugins.get(pluginId)
    if (!info) {
      throw new Error(`插件 ${pluginId} 未注册`)
    }

    if (info.status === 'active') {
      pluginLogger.warn(`插件 ${pluginId} 已经激活`)
      return
    }

    pluginLogger.info(`激活插件: ${info.metadata.name}`)

    try {
      // 创建插件上下文
      const context = this.createContext(pluginId)
      this.contexts.set(pluginId, context)

      // 如果提供了插件实例，保存并激活
      if (plugin) {
        this.activePlugins.set(pluginId, plugin)

        // 调用安装钩子（首次激活）
        if (plugin.install && info.activatedAt === undefined) {
          await plugin.install(context)
        }

        // 调用激活钩子
        await plugin.activate(context)
      }

      // 更新状态
      info.status = 'active'
      info.activatedAt = Date.now()
      delete info.error

      pluginLogger.success(`插件 ${info.metadata.name} 激活成功`)
      this.emit('plugin-activated', info)
    }
    catch (error) {
      info.status = 'error'
      info.error = error instanceof Error ? error.message : String(error)

      pluginLogger.error(`激活插件 ${info.metadata.name} 失败:`, error)
      this.emit('plugin-error', info, error)

      throw error
    }
  }

  /**
   * 停用插件
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const info = this.plugins.get(pluginId)
    if (!info) {
      throw new Error(`插件 ${pluginId} 未注册`)
    }

    if (info.status !== 'active') {
      pluginLogger.warn(`插件 ${pluginId} 未激活`)
      return
    }

    pluginLogger.info(`停用插件: ${info.metadata.name}`)

    try {
      const plugin = this.activePlugins.get(pluginId)
      const context = this.contexts.get(pluginId)

      if (plugin && context && plugin.deactivate) {
        await plugin.deactivate(context)
      }

      // 清理上下文
      this.contexts.delete(pluginId)
      this.activePlugins.delete(pluginId)

      // 更新状态
      info.status = 'inactive'

      pluginLogger.success(`插件 ${info.metadata.name} 已停用`)
      this.emit('plugin-deactivated', info)
    }
    catch (error) {
      pluginLogger.error(`停用插件 ${info.metadata.name} 失败:`, error)
      throw error
    }
  }

  /**
   * 卸载插件
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    const info = this.plugins.get(pluginId)
    if (!info) {
      throw new Error(`插件 ${pluginId} 未注册`)
    }

    pluginLogger.info(`卸载插件: ${info.metadata.name}`)

    try {
      // 如果插件已激活，先停用
      if (info.status === 'active') {
        await this.deactivatePlugin(pluginId)
      }

      const plugin = this.activePlugins.get(pluginId)
      const context = this.contexts.get(pluginId)

      if (plugin && context && plugin.uninstall) {
        await plugin.uninstall(context)
      }

      // 移除插件
      this.plugins.delete(pluginId)
      this.activePlugins.delete(pluginId)
      this.contexts.delete(pluginId)

      pluginLogger.success(`插件 ${info.metadata.name} 已卸载`)
      this.emit('plugin-uninstalled', info)
    }
    catch (error) {
      pluginLogger.error(`卸载插件 ${info.metadata.name} 失败:`, error)
      throw error
    }
  }

  /**
   * 更新插件配置
   */
  public async updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void> {
    const info = this.plugins.get(pluginId)
    if (!info) {
      throw new Error(`插件 ${pluginId} 未注册`)
    }

    pluginLogger.info(`更新插件配置: ${info.metadata.name}`)

    const oldConfig = { ...info.config }
    info.config = { ...info.config, ...config }

    // 如果启用状态改变
    if (oldConfig.enabled !== info.config.enabled) {
      const plugin = this.activePlugins.get(pluginId)

      if (info.config.enabled && plugin) {
        await this.activatePlugin(pluginId, plugin)
      }
      else if (!info.config.enabled) {
        await this.deactivatePlugin(pluginId)
      }
    }

    // 调用配置变更钩子
    const plugin = this.activePlugins.get(pluginId)
    const context = this.contexts.get(pluginId)

    if (plugin && context && plugin.onConfigChange) {
      await plugin.onConfigChange(info.config, context)
    }

    this.emit('plugin-config-updated', info)
  }

  /**
   * 获取插件信息
   */
  public getPlugin(pluginId: string): PluginInfo | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  public getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取激活的插件
   */
  public getActivePlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).filter(p => p.status === 'active')
  }

  /**
   * 创建插件上下文
   */
  private createContext(pluginId: string): PluginContext {
    const pluginInfo = this.plugins.get(pluginId)!

    return {
      // 日志
      logger: {
        debug: (msg: string, ...args: any[]) =>
          logger.debug(`[Plugin:${pluginInfo.metadata.name}] ${msg}`, ...args),
        info: (msg: string, ...args: any[]) =>
          logger.info(`[Plugin:${pluginInfo.metadata.name}] ${msg}`, ...args),
        warn: (msg: string, ...args: any[]) =>
          logger.warn(`[Plugin:${pluginInfo.metadata.name}] ${msg}`, ...args),
        error: (msg: string, ...args: any[]) =>
          logger.error(`[Plugin:${pluginInfo.metadata.name}] ${msg}`, ...args)
      },

      // 存储
      storage: {
        get: async (key: string) => {
          // TODO: 实现插件专属存储
          return null
        },
        set: async (key: string, value: any) => {
          // TODO: 实现插件专属存储
        },
        delete: async (key: string) => {
          // TODO: 实现插件专属存储
        },
        clear: async () => {
          // TODO: 实现插件专属存储
        }
      },

      // 事件
      events: {
        on: (event: string, handler: (...args: any[]) => void) => {
          this.on(event, handler)
        },
        off: (event: string, handler: (...args: any[]) => void) => {
          this.off(event, handler)
        },
        emit: (event: string, ...args: any[]) => {
          this.emit(event, ...args)
        }
      },

      // HTTP
      http: {
        registerRoute: (path: string, router: Router) => {
          // TODO: 动态注册路由
          pluginLogger.debug(`插件 ${pluginId} 注册路由: ${path}`)
        },
        unregisterRoute: (path: string) => {
          // TODO: 动态注销路由
          pluginLogger.debug(`插件 ${pluginId} 注销路由: ${path}`)
        }
      },

      // CLI
      cli: {
        registerCommand: (name: string, handler: (args: any) => Promise<void>) => {
          // TODO: 动态注册CLI命令
          pluginLogger.debug(`插件 ${pluginId} 注册命令: ${name}`)
        },
        unregisterCommand: (name: string) => {
          // TODO: 动态注销CLI命令
          pluginLogger.debug(`插件 ${pluginId} 注销命令: ${name}`)
        }
      },

      // UI
      ui: {
        registerMenuItem: (item: MenuItem) => {
          // TODO: 动态注册菜单项
          pluginLogger.debug(`插件 ${pluginId} 注册菜单: ${item.label}`)
        },
        unregisterMenuItem: (id: string) => {
          // TODO: 动态注销菜单项
          pluginLogger.debug(`插件 ${pluginId} 注销菜单: ${id}`)
        },
        registerView: (view: ViewConfig) => {
          // TODO: 动态注册视图
          pluginLogger.debug(`插件 ${pluginId} 注册视图: ${view.title}`)
        },
        unregisterView: (id: string) => {
          // TODO: 动态注销视图
          pluginLogger.debug(`插件 ${pluginId} 注销视图: ${id}`)
        }
      }
    }
  }

  /**
   * 获取插件统计
   */
  public getStats(): {
    total: number
    active: number
    inactive: number
    error: number
  } {
    const plugins = Array.from(this.plugins.values())

    return {
      total: plugins.length,
      active: plugins.filter(p => p.status === 'active').length,
      inactive: plugins.filter(p => p.status === 'inactive').length,
      error: plugins.filter(p => p.status === 'error').length
    }
  }
}

/**
 * 导出单例实例
 */
export const pluginManager = PluginManager.getInstance()

