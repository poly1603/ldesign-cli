/**
 * 资源管理器
 * 统一管理数据库、进程、WebSocket等资源，防止内存泄漏
 */

import { EventEmitter } from 'events'
import { logger } from '../../utils/logger.js'

const resourceLogger = logger.withPrefix('ResourceManager')

/**
 * 资源类型
 */
export type ResourceType = 'database' | 'process' | 'websocket' | 'cache' | 'timer' | 'other'

/**
 * 资源接口
 */
export interface Resource {
  id: string
  type: ResourceType
  name: string
  createdAt: number
  cleanup: () => Promise<void> | void
  memoryUsage?: () => number
}

/**
 * 资源管理器类
 */
export class ResourceManager extends EventEmitter {
  private static instance: ResourceManager
  private resources: Map<string, Resource> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  private cleanupInterval: number = 5 * 60 * 1000 // 5分钟

  private constructor() {
    super()
    this.startAutoCleanup()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  /**
   * 注册资源
   */
  public register(resource: Resource): void {
    if (this.resources.has(resource.id)) {
      resourceLogger.warn(`资源 ${resource.id} 已存在，将被覆盖`)
    }

    this.resources.set(resource.id, resource)
    resourceLogger.debug(`资源已注册: ${resource.type}/${resource.name}`)

    this.emit('register', resource)
  }

  /**
   * 注销资源
   */
  public async unregister(id: string): Promise<void> {
    const resource = this.resources.get(id)
    if (!resource) {
      resourceLogger.warn(`资源 ${id} 不存在`)
      return
    }

    try {
      await resource.cleanup()
      this.resources.delete(id)
      resourceLogger.debug(`资源已注销: ${resource.type}/${resource.name}`)
      this.emit('unregister', resource)
    }
    catch (error) {
      resourceLogger.error(`注销资源 ${id} 时出错:`, error)
      throw error
    }
  }

  /**
   * 获取资源
   */
  public get(id: string): Resource | undefined {
    return this.resources.get(id)
  }

  /**
   * 获取所有资源
   */
  public getAll(): Resource[] {
    return Array.from(this.resources.values())
  }

  /**
   * 按类型获取资源
   */
  public getByType(type: ResourceType): Resource[] {
    return Array.from(this.resources.values()).filter(r => r.type === type)
  }

  /**
   * 清理过期资源
   */
  public async cleanupExpired(maxAge: number = 30 * 60 * 1000): Promise<number> {
    const now = Date.now()
    const expired: string[] = []

    this.resources.forEach((resource, id) => {
      if (now - resource.createdAt > maxAge) {
        expired.push(id)
      }
    })

    let cleaned = 0
    for (const id of expired) {
      try {
        await this.unregister(id)
        cleaned++
      }
      catch (error) {
        resourceLogger.error(`清理过期资源 ${id} 失败:`, error)
      }
    }

    if (cleaned > 0) {
      resourceLogger.info(`已清理 ${cleaned} 个过期资源`)
    }

    return cleaned
  }

  /**
   * 清理所有资源
   */
  public async cleanupAll(): Promise<void> {
    resourceLogger.info(`开始清理所有资源，共 ${this.resources.size} 个`)

    const ids = Array.from(this.resources.keys())
    const errors: Error[] = []

    for (const id of ids) {
      try {
        await this.unregister(id)
      }
      catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    if (errors.length > 0) {
      resourceLogger.error(`清理过程中发生 ${errors.length} 个错误`)
      throw new Error(`清理失败: ${errors.map(e => e.message).join(', ')}`)
    }

    resourceLogger.success('所有资源已清理完成')
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpired()
      }
      catch (error) {
        resourceLogger.error('自动清理失败:', error)
      }
    }, this.cleanupInterval)

    // 防止定时器阻止进程退出
    this.cleanupTimer.unref()

    resourceLogger.debug('自动清理已启动')
  }

  /**
   * 停止自动清理
   */
  public stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      resourceLogger.debug('自动清理已停止')
    }
  }

  /**
   * 获取资源统计信息
   */
  public getStats(): {
    total: number
    byType: Record<ResourceType, number>
    memoryUsage: number
    oldestResource: { id: string; age: number } | null
  } {
    const now = Date.now()
    const byType: Record<string, number> = {}
    let memoryUsage = 0
    let oldestAge = 0
    let oldestId = ''

    this.resources.forEach((resource) => {
      // 统计类型
      byType[resource.type] = (byType[resource.type] || 0) + 1

      // 统计内存使用
      if (resource.memoryUsage) {
        memoryUsage += resource.memoryUsage()
      }

      // 找到最老的资源
      const age = now - resource.createdAt
      if (age > oldestAge) {
        oldestAge = age
        oldestId = resource.id
      }
    })

    return {
      total: this.resources.size,
      byType: byType as Record<ResourceType, number>,
      memoryUsage,
      oldestResource: oldestId ? { id: oldestId, age: oldestAge } : null
    }
  }

  /**
   * 强制垃圾回收（需要 --expose-gc 标志）
   */
  public forceGC(): boolean {
    if (global.gc) {
      resourceLogger.debug('执行强制垃圾回收')
      global.gc()
      return true
    }
    else {
      resourceLogger.warn('垃圾回收不可用，需要使用 --expose-gc 标志启动')
      return false
    }
  }

  /**
   * 获取内存使用情况
   */
  public getMemoryUsage(): {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers: number
  } {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100
    }
  }

  /**
   * 监控内存使用
   */
  public startMemoryMonitor(threshold: number = 500): void {
    const checkMemory = () => {
      const usage = this.getMemoryUsage()

      if (usage.heapUsed > threshold) {
        resourceLogger.warn(`内存使用过高: ${usage.heapUsed}MB (阈值: ${threshold}MB)`)
        this.emit('memory-warning', usage)

        // 尝试强制垃圾回收
        this.forceGC()
      }
    }

    // 每30秒检查一次
    const monitorTimer = setInterval(checkMemory, 30000)
    monitorTimer.unref()

    this.register({
      id: 'memory-monitor',
      type: 'timer',
      name: 'Memory Monitor',
      createdAt: Date.now(),
      cleanup: () => {
        clearInterval(monitorTimer)
      }
    })

    resourceLogger.debug('内存监控已启动')
  }
}

/**
 * 导出单例实例
 */
export const resourceManager = ResourceManager.getInstance()

/**
 * 进程退出时清理所有资源
 */
process.on('beforeExit', async () => {
  resourceLogger.info('进程即将退出，清理资源...')
  try {
    await resourceManager.cleanupAll()
  }
  catch (error) {
    resourceLogger.error('清理资源时出错:', error)
  }
})

process.on('SIGINT', async () => {
  resourceLogger.info('收到 SIGINT 信号，清理资源...')
  await resourceManager.cleanupAll()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  resourceLogger.info('收到 SIGTERM 信号，清理资源...')
  await resourceManager.cleanupAll()
  process.exit(0)
})


