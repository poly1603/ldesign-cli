/**
 * 同步服务
 * 提供配置共享和项目同步功能
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { logger } from '../../utils/logger.js'

const syncLogger = logger.withPrefix('SyncService')

/**
 * 配置导出接口
 */
export interface ConfigExport {
  version: string
  exportedAt: number
  projects: any[]
  npmSources: any[]
  settings: Record<string, any>
  metadata: {
    exportedBy: string
    platform: string
  }
}

/**
 * 同步服务类
 */
export class SyncService {
  private static instance: SyncService
  private readonly syncDir: string

  private constructor() {
    this.syncDir = join(homedir(), '.ldesign-cli', 'sync')
    this.ensureSyncDir()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  /**
   * 确保同步目录存在
   */
  private ensureSyncDir(): void {
    if (!existsSync(this.syncDir)) {
      mkdirSync(this.syncDir, { recursive: true })
    }
  }

  /**
   * 导出配置
   */
  public async exportConfig(
    projects: any[],
    npmSources: any[],
    settings: Record<string, any>
  ): Promise<ConfigExport> {
    syncLogger.info('导出配置...')

    const config: ConfigExport = {
      version: '1.0.0',
      exportedAt: Date.now(),
      projects,
      npmSources,
      settings,
      metadata: {
        exportedBy: process.env.USER || process.env.USERNAME || 'unknown',
        platform: process.platform
      }
    }

    const exportPath = join(this.syncDir, `config-export-${Date.now()}.json`)
    writeFileSync(exportPath, JSON.stringify(config, null, 2), 'utf-8')

    syncLogger.success(`配置已导出到: ${exportPath}`)
    return config
  }

  /**
   * 导入配置
   */
  public async importConfig(filePath: string): Promise<ConfigExport> {
    syncLogger.info(`导入配置: ${filePath}`)

    if (!existsSync(filePath)) {
      throw new Error('配置文件不存在')
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const config: ConfigExport = JSON.parse(content)

      // 验证配置格式
      if (!config.version || !config.exportedAt) {
        throw new Error('配置文件格式无效')
      }

      syncLogger.success('配置导入成功')
      return config
    }
    catch (error) {
      syncLogger.error('导入配置失败:', error)
      throw error
    }
  }

  /**
   * 生成分享链接（二维码数据）
   */
  public generateShareLink(configExport: ConfigExport): string {
    // 将配置编码为Base64
    const configStr = JSON.stringify(configExport)
    const base64 = Buffer.from(configStr).toString('base64')

    // 生成分享链接
    const shareLink = `ldesign://import?config=${base64}`

    syncLogger.info('生成分享链接')
    return shareLink
  }

  /**
   * 解析分享链接
   */
  public parseShareLink(shareLink: string): ConfigExport {
    syncLogger.info('解析分享链接')

    try {
      // 提取Base64配置
      const match = shareLink.match(/config=([A-Za-z0-9+/=]+)/)
      if (!match) {
        throw new Error('分享链接格式无效')
      }

      const base64 = match[1]
      const configStr = Buffer.from(base64, 'base64').toString('utf-8')
      const config: ConfigExport = JSON.parse(configStr)

      return config
    }
    catch (error) {
      syncLogger.error('解析分享链接失败:', error)
      throw error
    }
  }

  /**
   * 创建配置快照
   */
  public async createSnapshot(
    name: string,
    config: ConfigExport
  ): Promise<string> {
    const snapshotPath = join(this.syncDir, 'snapshots', `${name}-${Date.now()}.json`)
    const snapshotDir = join(this.syncDir, 'snapshots')

    if (!existsSync(snapshotDir)) {
      mkdirSync(snapshotDir, { recursive: true })
    }

    writeFileSync(snapshotPath, JSON.stringify(config, null, 2), 'utf-8')

    syncLogger.success(`配置快照已创建: ${snapshotPath}`)
    return snapshotPath
  }

  /**
   * 列出所有快照
   */
  public listSnapshots(): Array<{ name: string; path: string; createdAt: number }> {
    const snapshotDir = join(this.syncDir, 'snapshots')

    if (!existsSync(snapshotDir)) {
      return []
    }

    try {
      const fs = require('fs')
      const files = fs.readdirSync(snapshotDir)

      return files
        .filter((f: string) => f.endsWith('.json'))
        .map((f: string) => {
          const filePath = join(snapshotDir, f)
          const stats = fs.statSync(filePath)

          return {
            name: f.replace('.json', ''),
            path: filePath,
            createdAt: stats.ctimeMs
          }
        })
        .sort((a: any, b: any) => b.createdAt - a.createdAt)
    }
    catch (error) {
      syncLogger.error('列出快照失败:', error)
      return []
    }
  }

  /**
   * 比较配置差异
   */
  public compareConfigs(config1: ConfigExport, config2: ConfigExport): {
    projects: { added: any[]; removed: any[]; modified: any[] }
    npmSources: { added: any[]; removed: any[]; modified: any[] }
    settings: { added: string[]; removed: string[]; modified: string[] }
  } {
    // 简化实现，实际应该更复杂
    return {
      projects: {
        added: [],
        removed: [],
        modified: []
      },
      npmSources: {
        added: [],
        removed: [],
        modified: []
      },
      settings: {
        added: [],
        removed: [],
        modified: []
      }
    }
  }
}

/**
 * 导出单例实例
 */
export const syncService = SyncService.getInstance()

