/**
 * 工具管理器
 * 负责管理和协调所有工具
 */

import { EventEmitter } from 'events'
import type {
  ToolName,
  IToolAdapter,
  ToolStatus,
  ToolConfig,
  ToolExecutionResult,
  ToolProgressEvent,
  ToolLogEvent,
  ToolStatusChangeEvent,
} from '@ldesign/cli-shared/types.js'
import { logger } from '@ldesign/cli-shared/utils.js'
import { ToolNotFoundError, ToolExecutionError } from '@ldesign/cli-shared/utils/errors.js'
import { TOOL_METADATA } from '@ldesign/cli-shared/constants.js'

export interface ToolManagerOptions {
  autoLoad?: boolean
  healthCheckInterval?: number
}

export class ToolManager extends EventEmitter {
  private tools: Map<ToolName, IToolAdapter> = new Map()
  private toolStatus: Map<ToolName, ToolStatus> = new Map()
  private healthCheckTimers: Map<ToolName, NodeJS.Timeout> = new Map()
  private options: Required<ToolManagerOptions>

  constructor(options: ToolManagerOptions = {}) {
    super()
    this.options = {
      autoLoad: options.autoLoad ?? false,
      healthCheckInterval: options.healthCheckInterval ?? 60000, // 1分钟
    }
  }

  /**
   * 初始化工具管理器
   */
  async initialize(): Promise<void> {
    logger.info('[ToolManager] 初始化工具管理器...')

    // 初始化所有工具的状态
    const toolNames: ToolName[] = [
      'builder',
      'launcher',
      'tester',
      'analyzer',
      'deployer',
      'docs-generator',
      'generator',
      'git',
      'monitor',
      'security',
      'deps',
    ]

    for (const name of toolNames) {
      this.toolStatus.set(name, 'inactive')
    }

    // 如果启用自动加载，加载所有工具
    if (this.options.autoLoad) {
      await this.loadAllTools()
    }

    logger.info('[ToolManager] 工具管理器初始化完成')
  }

  /**
   * 注册工具适配器
   */
  async registerTool(adapter: IToolAdapter): Promise<void> {
    const { name } = adapter

    logger.info(`[ToolManager] 注册工具: ${name}`)

    if (this.tools.has(name)) {
      logger.warn(`[ToolManager] 工具 ${name} 已存在，将被覆盖`)
    }

    this.tools.set(name, adapter)
    this.updateToolStatus(name, 'inactive')

    // 初始化工具
    try {
      this.updateToolStatus(name, 'initializing')
      await adapter.initialize()
      this.updateToolStatus(name, 'active')

      // 启动健康检查
      this.startHealthCheck(name)

      this.emit('tool-registered', { tool: name, timestamp: Date.now() })
      logger.success(`[ToolManager] 工具 ${name} 注册成功`)
    } catch (error) {
      this.updateToolStatus(name, 'error')
      logger.error(`[ToolManager] 工具 ${name} 初始化失败:`, error)
      throw error
    }
  }

  /**
   * 加载所有工具
   */
  private async loadAllTools(): Promise<void> {
    logger.info('[ToolManager] 开始加载所有工具...')

    const toolNames: ToolName[] = [
      'builder',
      'launcher',
      'tester',
      'analyzer',
      'deployer',
      'docs-generator',
      'generator',
      'git',
      'monitor',
      'security',
      'deps',
    ]

    const results = await Promise.allSettled(
      toolNames.map((name) => this.loadTool(name))
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    logger.info(
      `[ToolManager] 工具加载完成: 成功 ${succeeded}/${toolNames.length}, 失败 ${failed}`
    )
  }

  /**
   * 动态加载工具
   */
  async loadTool(name: ToolName): Promise<void> {
    if (this.tools.has(name)) {
      logger.debug(`[ToolManager] 工具 ${name} 已加载`)
      return
    }

    logger.debug(`[ToolManager] 开始加载工具: ${name}`)

    try {
      // 动态导入工具适配器
      const { default: AdapterClass } = await this.importToolAdapter(name)
      const adapter = new AdapterClass()

      await this.registerTool(adapter)
    } catch (error) {
      logger.error(`[ToolManager] 加载工具 ${name} 失败:`, error)
      throw error
    }
  }

  /**
   * 动态导入工具适配器
   */
  private async importToolAdapter(name: ToolName): Promise<any> {
    try {
      // 尝试加载实际的适配器
      switch (name) {
        case 'builder': {
          const { BuilderAdapter } = await import('./adapters/BuilderAdapter.js')
          return { default: BuilderAdapter }
        }
        case 'launcher': {
          const { LauncherAdapter } = await import('./adapters/LauncherAdapter.js')
          return { default: LauncherAdapter }
        }
        case 'tester': {
          const { TesterAdapter } = await import('./adapters/TesterAdapter.js')
          return { default: TesterAdapter }
        }
        case 'analyzer': {
          const { AnalyzerAdapter } = await import('./adapters/AnalyzerAdapter.js')
          return { default: AnalyzerAdapter }
        }
        case 'deployer': {
          const { DeployerAdapter } = await import('./adapters/DeployerAdapter.js')
          return { default: DeployerAdapter }
        }
        case 'docs-generator': {
          const { DocsGeneratorAdapter } = await import('./adapters/DocsGeneratorAdapter.js')
          return { default: DocsGeneratorAdapter }
        }
        case 'generator': {
          const { GeneratorAdapter } = await import('./adapters/GeneratorAdapter.js')
          return { default: GeneratorAdapter }
        }
        case 'git': {
          const { GitAdapter } = await import('./adapters/GitAdapter.js')
          return { default: GitAdapter }
        }
        case 'monitor': {
          const { MonitorAdapter } = await import('./adapters/MonitorAdapter.js')
          return { default: MonitorAdapter }
        }
        case 'security': {
          const { SecurityAdapter } = await import('./adapters/SecurityAdapter.js')
          return { default: SecurityAdapter }
        }
        case 'deps': {
          const { DepsAdapter } = await import('./adapters/DepsAdapter.js')
          return { default: DepsAdapter }
        }
        default: {
          // 回退到 MockAdapter
          const { createMockAdapter } = await import('./adapters/MockAdapter.js')
          return { default: createMockAdapter(name) }
        }
      }
    } catch (error) {
      // 如果加载失败，回退到 MockAdapter
      logger.warn(`[ToolManager] 加载工具 ${name} 失败，使用 MockAdapter`)
      const { createMockAdapter } = await import('./adapters/MockAdapter.js')
      return { default: createMockAdapter(name) }
    }
  }

  /**
   * 执行工具操作
   */
  async executeTool(
    name: ToolName,
    action: string,
    params: any = {}
  ): Promise<ToolExecutionResult> {
    const adapter = this.getTool(name)

    logger.info(`[ToolManager] 执行工具操作: ${name}.${action}`)

    // 更新状态为忙碌
    const previousStatus = this.getToolStatus(name)
    this.updateToolStatus(name, 'busy')

    // 发送开始事件
    this.emit('tool-start', {
      tool: name,
      action,
      params,
      timestamp: Date.now(),
    })

    try {
      const result = await adapter.execute(action, params)

      // 发送完成事件
      this.emit('tool-complete', {
        tool: name,
        action,
        result,
        timestamp: Date.now(),
      })

      // 恢复之前的状态
      this.updateToolStatus(name, previousStatus === 'busy' ? 'active' : previousStatus)

      logger.success(`[ToolManager] 工具操作完成: ${name}.${action}`)

      return result
    } catch (error) {
      // 发送错误事件
      this.emit('tool-error', {
        tool: name,
        action,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      })

      // 更新状态为错误
      this.updateToolStatus(name, 'error')

      logger.error(`[ToolManager] 工具操作失败: ${name}.${action}`, error)

      throw new ToolExecutionError(name, action, error as Error)
    }
  }

  /**
   * 获取工具适配器
   */
  getTool(name: ToolName): IToolAdapter {
    const adapter = this.tools.get(name)
    if (!adapter) {
      throw new ToolNotFoundError(name)
    }
    return adapter
  }

  /**
   * 检查工具是否已加载
   */
  hasTool(name: ToolName): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取工具状态
   */
  getToolStatus(name: ToolName): ToolStatus {
    return this.toolStatus.get(name) || 'inactive'
  }

  /**
   * 获取所有工具状态
   */
  getAllToolStatus(): Array<{ name: ToolName; status: ToolStatus }> {
    const result: Array<{ name: ToolName; status: ToolStatus }> = []

    this.toolStatus.forEach((status, name) => {
      result.push({ name, status })
    })

    return result
  }

  /**
   * 获取工具配置
   */
  getToolConfig(name: ToolName): ToolConfig {
    const adapter = this.getTool(name)
    return adapter.getConfig()
  }

  /**
   * 更新工具配置
   */
  async updateToolConfig(name: ToolName, config: Partial<ToolConfig>): Promise<void> {
    const adapter = this.getTool(name)
    await adapter.updateConfig(config)

    this.emit('tool-config-updated', {
      tool: name,
      config,
      timestamp: Date.now(),
    })
  }

  /**
   * 获取工具元数据
   */
  getToolMetadata(name: ToolName) {
    return TOOL_METADATA[name]
  }

  /**
   * 获取所有工具元数据
   */
  getAllToolMetadata() {
    return TOOL_METADATA
  }

  /**
   * 更新工具状态
   */
  private updateToolStatus(name: ToolName, status: ToolStatus): void {
    const oldStatus = this.toolStatus.get(name) || 'inactive'
    this.toolStatus.set(name, status)

    if (oldStatus !== status) {
      const event: ToolStatusChangeEvent = {
        tool: name,
        oldStatus,
        newStatus: status,
        timestamp: Date.now(),
      }

      this.emit('tool-status-change', event)

      logger.debug(`[ToolManager] 工具状态变更: ${name} ${oldStatus} -> ${status}`)
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(name: ToolName): void {
    // 清除现有的定时器
    this.stopHealthCheck(name)

    const timer = setInterval(async () => {
      try {
        const adapter = this.tools.get(name)
        if (!adapter) return

        const isHealthy = await adapter.healthCheck()
        const currentStatus = this.getToolStatus(name)

        if (!isHealthy && currentStatus === 'active') {
          logger.warn(`[ToolManager] 工具 ${name} 健康检查失败`)
          this.updateToolStatus(name, 'error')
        } else if (isHealthy && currentStatus === 'error') {
          logger.info(`[ToolManager] 工具 ${name} 恢复正常`)
          this.updateToolStatus(name, 'active')
        }
      } catch (error) {
        logger.error(`[ToolManager] 工具 ${name} 健康检查异常:`, error)
      }
    }, this.options.healthCheckInterval)

    this.healthCheckTimers.set(name, timer)
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(name: ToolName): void {
    const timer = this.healthCheckTimers.get(name)
    if (timer) {
      clearInterval(timer)
      this.healthCheckTimers.delete(name)
    }
  }

  /**
   * 发送进度事件
   */
  emitProgress(event: ToolProgressEvent): void {
    this.emit('tool-progress', event)
  }

  /**
   * 发送日志事件
   */
  emitLog(event: ToolLogEvent): void {
    this.emit('tool-log', event)
  }

  /**
   * 关闭工具管理器
   */
  async dispose(): Promise<void> {
    logger.info('[ToolManager] 关闭工具管理器...')

    // 停止所有健康检查
    for (const name of this.tools.keys()) {
      this.stopHealthCheck(name)
    }

    // 释放所有工具
    const disposePromises = Array.from(this.tools.values()).map((adapter) =>
      adapter.dispose().catch((error) => {
        logger.error(`[ToolManager] 释放工具 ${adapter.name} 失败:`, error)
      })
    )

    await Promise.all(disposePromises)

    // 清理资源
    this.tools.clear()
    this.toolStatus.clear()
    this.healthCheckTimers.clear()

    logger.info('[ToolManager] 工具管理器已关闭')
  }
}

// 导出单例
let instance: ToolManager | null = null

export function getToolManager(options?: ToolManagerOptions): ToolManager {
  if (!instance) {
    instance = new ToolManager(options)
  }
  return instance
}

export function resetToolManager(): void {
  if (instance) {
    instance.dispose().catch((error) => {
      logger.error('[ToolManager] 关闭工具管理器失败:', error)
    })
    instance = null
  }
}

