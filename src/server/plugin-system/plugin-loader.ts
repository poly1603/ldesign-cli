/**
 * 插件加载器
 * 负责从文件系统加载和发现插件
 */

import { readdir, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { logger } from '../../utils/logger.js'
import { pluginManager } from './plugin-manager.js'
import type { Plugin, PluginLoaderOptions } from './types.js'

const loaderLogger = logger.withPrefix('PluginLoader')

/**
 * 插件加载器类
 */
export class PluginLoader {
  private options: PluginLoaderOptions

  constructor(options: PluginLoaderOptions) {
    this.options = options
  }

  /**
   * 加载所有插件
   */
  public async loadAll(): Promise<void> {
    const { pluginsDir, autoActivate = true } = this.options

    if (!existsSync(pluginsDir)) {
      loaderLogger.warn(`插件目录不存在: ${pluginsDir}`)
      return
    }

    loaderLogger.info(`扫描插件目录: ${pluginsDir}`)

    try {
      const entries = await readdir(pluginsDir, { withFileTypes: true })
      const pluginDirs = entries.filter(e => e.isDirectory())

      loaderLogger.info(`发现 ${pluginDirs.length} 个插件目录`)

      for (const dir of pluginDirs) {
        try {
          await this.loadPlugin(join(pluginsDir, dir.name), autoActivate)
        }
        catch (error) {
          loaderLogger.error(`加载插件 ${dir.name} 失败:`, error)
        }
      }
    }
    catch (error) {
      loaderLogger.error('扫描插件目录失败:', error)
      throw error
    }
  }

  /**
   * 加载单个插件
   */
  public async loadPlugin(pluginPath: string, autoActivate: boolean = true): Promise<void> {
    loaderLogger.debug(`加载插件: ${pluginPath}`)

    try {
      // 读取 package.json
      const packageJsonPath = join(pluginPath, 'package.json')
      if (!existsSync(packageJsonPath)) {
        throw new Error('插件目录中未找到 package.json')
      }

      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

      // 验证必需字段
      if (!packageJson.name || !packageJson.version) {
        throw new Error('package.json 缺少必需字段：name 或 version')
      }

      // 查找入口文件
      const entryFile = packageJson.main || 'index.js'
      const entryPath = join(pluginPath, entryFile)

      if (!existsSync(entryPath)) {
        throw new Error(`入口文件不存在: ${entryFile}`)
      }

      // 动态导入插件
      const fileUrl = pathToFileURL(entryPath).href
      const pluginModule = await import(fileUrl)
      const plugin: Plugin = pluginModule.default || pluginModule

      // 验证插件接口
      if (!plugin.metadata || !plugin.activate) {
        throw new Error('插件必须提供 metadata 和 activate 方法')
      }

      // 注册插件
      await pluginManager.registerPlugin(plugin, {
        enabled: autoActivate,
        options: {}
      })

      loaderLogger.success(`插件 ${plugin.metadata.name} 加载成功`)
    }
    catch (error) {
      loaderLogger.error('加载插件失败:', error)
      throw error
    }
  }

  /**
   * 重新加载插件
   */
  public async reloadPlugin(pluginId: string, pluginPath: string): Promise<void> {
    loaderLogger.info(`重新加载插件: ${pluginId}`)

    try {
      // 先卸载
      await pluginManager.uninstallPlugin(pluginId)

      // 清除模块缓存（如果是 CJS）
      if (require.cache) {
        Object.keys(require.cache).forEach(key => {
          if (key.includes(pluginPath)) {
            delete require.cache[key]
          }
        })
      }

      // 重新加载
      await this.loadPlugin(pluginPath, true)

      loaderLogger.success(`插件 ${pluginId} 重新加载成功`)
    }
    catch (error) {
      loaderLogger.error('重新加载插件失败:', error)
      throw error
    }
  }

  /**
   * 验证插件依赖
   */
  private async validateDependencies(plugin: Plugin): Promise<boolean> {
    const { dependencies, peerDependencies } = plugin.metadata

    // TODO: 实现依赖验证逻辑
    // 检查所需的依赖是否已安装
    // 检查版本是否兼容

    return true
  }

  /**
   * 扫描可用插件（不加载）
   */
  public async scanPlugins(): Promise<Array<{ name: string; version: string; description?: string }>> {
    const { pluginsDir } = this.options
    const plugins: Array<{ name: string; version: string; description?: string }> = []

    if (!existsSync(pluginsDir)) {
      return plugins
    }

    try {
      const entries = await readdir(pluginsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(pluginsDir, entry.name, 'package.json')

          if (existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
              plugins.push({
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description
              })
            }
            catch {
              // 忽略解析错误
            }
          }
        }
      }

      return plugins
    }
    catch (error) {
      loaderLogger.error('扫描插件失败:', error)
      return plugins
    }
  }
}

