/**
 * 性能监控服务
 * 收集和提供系统性能指标
 */

import * as os from 'os'
import { EventEmitter } from 'events'
import { logger } from '../../utils/logger.js'

const monitorLogger = logger.withPrefix('Monitor')

/**
 * 系统指标接口
 */
export interface SystemMetrics {
  cpu: {
    usage: number // 百分比
    count: number
    model: string
  }
  memory: {
    total: number // MB
    used: number // MB
    free: number // MB
    usagePercent: number
  }
  disk: {
    total: number // MB
    free: number // MB
    usagePercent: number
  }
  uptime: number // 秒
}

/**
 * 应用指标接口
 */
export interface AppMetrics {
  process: {
    uptime: number
    pid: number
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
    cpu: {
      user: number
      system: number
    }
  }
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseTime: number
  }
  websocket: {
    connections: number
    messagesReceived: number
    messagesSent: number
  }
}

/**
 * 组合指标接口
 */
export interface Metrics {
  system: SystemMetrics
  app: AppMetrics
  timestamp: number
}

/**
 * 性能监控服务类
 */
export class MonitorService extends EventEmitter {
  private static instance: MonitorService
  private metricsHistory: Metrics[] = []
  private readonly maxHistorySize: number = 1000 // 保留最近1000条记录
  private monitorInterval: NodeJS.Timeout | null = null
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [] as number[]
  }
  private wsStats = {
    connections: 0,
    messagesReceived: 0,
    messagesSent: 0
  }

  private constructor() {
    super()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MonitorService {
    if (!MonitorService.instance) {
      MonitorService.instance = new MonitorService()
    }
    return MonitorService.instance
  }

  /**
   * 获取系统指标
   */
  private getSystemMetrics(): SystemMetrics {
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    // 计算 CPU 使用率
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const cpuUsage = 100 - Math.floor((totalIdle / totalTick) * 100)

    return {
      cpu: {
        usage: cpuUsage,
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown'
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        used: Math.round(usedMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        usagePercent: Math.round((usedMem / totalMem) * 100)
      },
      disk: {
        total: 0, // 需要额外的库来获取磁盘信息
        free: 0,
        usagePercent: 0
      },
      uptime: os.uptime()
    }
  }

  /**
   * 获取应用指标
   */
  private getAppMetrics(): AppMetrics {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    // 计算平均响应时间
    const avgResponseTime = this.requestStats.responseTimes.length > 0
      ? this.requestStats.responseTimes.reduce((a, b) => a + b, 0) / this.requestStats.responseTimes.length
      : 0

    return {
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
          external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000), // 转换为毫秒
          system: Math.round(cpuUsage.system / 1000)
        }
      },
      requests: {
        total: this.requestStats.total,
        successful: this.requestStats.successful,
        failed: this.requestStats.failed,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      },
      websocket: {
        connections: this.wsStats.connections,
        messagesReceived: this.wsStats.messagesReceived,
        messagesSent: this.wsStats.messagesSent
      }
    }
  }

  /**
   * 收集当前指标
   */
  public collectMetrics(): Metrics {
    const metrics: Metrics = {
      system: this.getSystemMetrics(),
      app: this.getAppMetrics(),
      timestamp: Date.now()
    }

    // 添加到历史记录
    this.metricsHistory.push(metrics)

    // 限制历史记录大小
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift()
    }

    // 触发事件
    this.emit('metrics', metrics)

    return metrics
  }

  /**
   * 获取历史指标
   */
  public getHistory(limit?: number): Metrics[] {
    if (limit && limit > 0) {
      return this.metricsHistory.slice(-limit)
    }
    return [...this.metricsHistory]
  }

  /**
   * 清除历史记录
   */
  public clearHistory(): void {
    this.metricsHistory = []
    monitorLogger.debug('指标历史已清除')
  }

  /**
   * 记录请求
   */
  public recordRequest(success: boolean, responseTime: number): void {
    this.requestStats.total++

    if (success) {
      this.requestStats.successful++
    }
    else {
      this.requestStats.failed++
    }

    this.requestStats.responseTimes.push(responseTime)

    // 只保留最近100个响应时间
    if (this.requestStats.responseTimes.length > 100) {
      this.requestStats.responseTimes.shift()
    }
  }

  /**
   * 记录 WebSocket 连接
   */
  public recordWSConnection(count: number): void {
    this.wsStats.connections = count
  }

  /**
   * 记录 WebSocket 消息
   */
  public recordWSMessage(type: 'received' | 'sent'): void {
    if (type === 'received') {
      this.wsStats.messagesReceived++
    }
    else {
      this.wsStats.messagesSent++
    }
  }

  /**
   * 启动实时监控
   */
  public startMonitoring(interval: number = 5000): void {
    if (this.monitorInterval) {
      monitorLogger.warn('监控已经在运行')
      return
    }

    this.monitorInterval = setInterval(() => {
      this.collectMetrics()
    }, interval)

    this.monitorInterval.unref() // 防止阻止进程退出

    monitorLogger.info(`性能监控已启动，采样间隔: ${interval}ms`)
  }

  /**
   * 停止实时监控
   */
  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
      monitorLogger.info('性能监控已停止')
    }
  }

  /**
   * 获取统计摘要
   */
  public getSummary(duration: number = 60000): {
    avgCpuUsage: number
    avgMemoryUsage: number
    maxMemoryUsage: number
    requestRate: number
    errorRate: number
  } {
    const now = Date.now()
    const recentMetrics = this.metricsHistory.filter(
      m => now - m.timestamp <= duration
    )

    if (recentMetrics.length === 0) {
      return {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        maxMemoryUsage: 0,
        requestRate: 0,
        errorRate: 0
      }
    }

    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.system.cpu.usage, 0) / recentMetrics.length
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.system.memory.usagePercent, 0) / recentMetrics.length
    const maxMemoryUsage = Math.max(...recentMetrics.map(m => m.system.memory.usagePercent))

    const requestRate = this.requestStats.total / (duration / 1000) // 每秒请求数
    const errorRate = this.requestStats.total > 0
      ? (this.requestStats.failed / this.requestStats.total) * 100
      : 0

    return {
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      maxMemoryUsage: Math.round(maxMemoryUsage * 100) / 100,
      requestRate: Math.round(requestRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100
    }
  }

  /**
   * 重置统计数据
   */
  public resetStats(): void {
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      responseTimes: []
    }
    this.wsStats = {
      connections: 0,
      messagesReceived: 0,
      messagesSent: 0
    }
    monitorLogger.debug('统计数据已重置')
  }
}

/**
 * 导出单例实例
 */
export const monitorService = MonitorService.getInstance()


