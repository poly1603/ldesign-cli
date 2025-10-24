/**
 * 插件管理器
 */

import { EventEmitter } from 'events'
import type {
  IPlugin,
  PluginInfo,
  PluginStatus,
  PluginContext,
  PluginMetadata,
  PluginConfig,
} from '../../shared/types'
import { logger } from '../../shared/utils'

export class PluginManager extends EventEmitter {
  private plugins: Map<string, IPlugin> = new Map()
  private pluginInfo: Map<string, PluginInfo> = new Map()

  /**
   * 安装插件
   */
  async installPlugin(plugin: IPlugin): Promise<void> {
    const { id } = plugin.metadata

    if (this.plugins.has(id)) {
      throw new Error(`插件已存在: ${id}`)
    }

    logger.info(`[PluginManager] 安装插件: ${plugin.metadata.name}`)

    this.plugins.set(id, plugin)

    const info: PluginInfo = {
      metadata: plugin.metadata,
      status: 'installed',
      config: { enabled: true },
      installedAt: Date.now(),
    }

    this.pluginInfo.set(id, info)

    // 调用插件的 install 钩子
    if (plugin.install) {
      const context = this.createPluginContext(id)
      await plugin.install(context)
    }

    this.emit('plugin-installed', { pluginId: id })
  }

  /**
   * 激活插件
   */
  async activatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    const info = this.pluginInfo.get(id)

    if (!plugin || !info) {
      throw new Error(`插件未找到: ${id}`)
    }

    if (info.status === 'active') {
      logger.warn(`[PluginManager] 插件已激活: ${id}`)
      return
    }

    logger.info(`[PluginManager] 激活插件: ${plugin.metadata.name}`)

    try {
      const context = this.createPluginContext(id)
      await plugin.activate(context)

      info.status = 'active'
      info.activatedAt = Date.now()

      this.emit('plugin-activated', { pluginId: id })

      logger.success(`[PluginManager] 插件激活成功: ${plugin.metadata.name}`)
    } catch (error) {
      info.status = 'error'
      info.error = error instanceof Error ? error.message : String(error)

      logger.error(`[PluginManager] 插件激活失败: ${plugin.metadata.name}`, error)
      throw error
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    const info = this.pluginInfo.get(id)

    if (!plugin || !info) {
      throw new Error(`插件未找到: ${id}`)
    }

    if (info.status !== 'active') {
      return
    }

    logger.info(`[PluginManager] 停用插件: ${plugin.metadata.name}`)

    if (plugin.deactivate) {
      const context = this.createPluginContext(id)
      await plugin.deactivate(context)
    }

    info.status = 'inactive'
    info.activatedAt = undefined

    this.emit('plugin-deactivated', { pluginId: id })
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    const info = this.pluginInfo.get(id)

    if (!plugin || !info) {
      throw new Error(`插件未找到: ${id}`)
    }

    // 先停用
    if (info.status === 'active') {
      await this.deactivatePlugin(id)
    }

    // 调用卸载钩子
    if (plugin.uninstall) {
      const context = this.createPluginContext(id)
      await plugin.uninstall(context)
    }

    this.plugins.delete(id)
    this.pluginInfo.delete(id)

    this.emit('plugin-uninstalled', { pluginId: id })

    logger.info(`[PluginManager] 插件已卸载: ${plugin.metadata.name}`)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.pluginInfo.values())
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(pluginId: string): PluginContext {
    // TODO: 实现完整的插件上下文
    return {
      logger: logger.withPrefix(`Plugin:${pluginId}`),
      storage: {} as any,
      events: this,
      http: {} as any,
      cli: {} as any,
      ui: {} as any,
    }
  }
}

// 导出单例
let instance: PluginManager | null = null

export function getPluginManager(): PluginManager {
  if (!instance) {
    instance = new PluginManager()
  }
  return instance
}


