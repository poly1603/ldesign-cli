/**
 * 配置管理器
 * 统一管理 CLI 配置
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { logger } from '../../shared/utils'
import { CONFIG_FILE_NAME } from '../../shared/constants'

/**
 * CLI 配置接口
 */
export interface CLIConfig {
  /**
   * 默认端口
   */
  defaultPort?: number

  /**
   * 默认主机
   */
  defaultHost?: string

  /**
   * 自动打开浏览器
   */
  autoOpen?: boolean

  /**
   * 调试模式
   */
  debug?: boolean

  /**
   * 日志级别
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'

  /**
   * 数据库路径
   */
  databasePath?: string

  /**
   * 最近打开的项目数量
   */
  recentProjectsLimit?: number

  /**
   * 工具配置
   */
  tools?: Record<string, any>

  /**
   * 自定义配置
   */
  [key: string]: any
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: CLIConfig = {
  defaultPort: 3000,
  defaultHost: '0.0.0.0',
  autoOpen: true,
  debug: false,
  logLevel: 'info',
  recentProjectsLimit: 10,
  tools: {},
}

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: CLIConfig = { ...DEFAULT_CONFIG }
  private configPath: string | null = null

  /**
   * 加载配置
   */
  loadConfig(cwd: string = process.cwd()): CLIConfig {
    const configPath = resolve(cwd, CONFIG_FILE_NAME)
    this.configPath = configPath

    if (!existsSync(configPath)) {
      logger.debug(`[ConfigManager] 配置文件不存在: ${configPath}`)
      logger.debug('[ConfigManager] 使用默认配置')
      return this.config
    }

    try {
      const content = readFileSync(configPath, 'utf-8')
      const userConfig = JSON.parse(content)

      // 合并配置
      this.config = this.mergeConfig(userConfig)

      logger.debug(`[ConfigManager] 已加载配置: ${configPath}`)
      return this.config
    } catch (error) {
      logger.error(`[ConfigManager] 加载配置失败: ${configPath}`, error)
      logger.warn('[ConfigManager] 使用默认配置')
      return this.config
    }
  }

  /**
   * 保存配置
   */
  saveConfig(config?: CLIConfig): void {
    const configToSave = config || this.config
    const targetPath = this.configPath || resolve(process.cwd(), CONFIG_FILE_NAME)

    try {
      // 确保目录存在
      const dir = dirname(targetPath)
      if (!existsSync(dir)) {
        logger.warn(`[ConfigManager] 目录不存在: ${dir}`)
        return
      }

      // 写入配置
      writeFileSync(targetPath, JSON.stringify(configToSave, null, 2), 'utf-8')

      logger.debug(`[ConfigManager] 配置已保存: ${targetPath}`)
    } catch (error) {
      logger.error(`[ConfigManager] 保存配置失败: ${targetPath}`, error)
    }
  }

  /**
   * 合并配置
   */
  mergeConfig(customConfig: Partial<CLIConfig>): CLIConfig {
    return {
      ...DEFAULT_CONFIG,
      ...this.config,
      ...customConfig,
      // 深度合并 tools 配置
      tools: {
        ...DEFAULT_CONFIG.tools,
        ...this.config.tools,
        ...customConfig.tools,
      },
    }
  }

  /**
   * 获取配置
   */
  getConfig(): CLIConfig {
    return { ...this.config }
  }

  /**
   * 获取配置项
   */
  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return this.config[key]
  }

  /**
   * 设置配置项
   */
  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    this.config[key] = value
  }

  /**
   * 更新配置
   */
  update(updates: Partial<CLIConfig>): void {
    this.config = this.mergeConfig(updates)
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG }
    logger.debug('[ConfigManager] 配置已重置为默认值')
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): CLIConfig {
    return { ...DEFAULT_CONFIG }
  }
}

// 单例
let instance: ConfigManager | null = null

/**
 * 获取配置管理器实例
 */
export function getConfigManager(): ConfigManager {
  if (!instance) {
    instance = new ConfigManager()
  }
  return instance
}


