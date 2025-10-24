/**
 * 模拟工具适配器
 * 用于在工具适配器未实现时提供基础功能
 */

import type { IToolAdapter, ToolName, ToolStatus, ToolConfig, ToolExecutionResult, ToolMetadata } from '../../../shared/types'
import { TOOL_METADATA } from '../../../shared/constants'
import { logger } from '../../../shared/utils'

export class MockAdapter implements IToolAdapter {
  protected status: ToolStatus = 'inactive'
  protected config: ToolConfig = { enabled: true }

  constructor(
    public readonly name: ToolName,
    public readonly metadata: ToolMetadata = TOOL_METADATA[name]
  ) { }

  async initialize(): Promise<void> {
    logger.debug(`[MockAdapter] 初始化工具: ${this.name}`)
    this.status = 'active'
  }

  async execute(action: string, params: any): Promise<ToolExecutionResult> {
    logger.debug(`[MockAdapter] 执行操作: ${this.name}.${action}`, params)

    // 模拟执行时间
    await new Promise((resolve) => setTimeout(resolve, 100))

    return {
      success: true,
      data: {
        message: `Mock execution of ${this.name}.${action}`,
        params,
      },
      timestamp: Date.now(),
    }
  }

  getStatus(): ToolStatus {
    return this.status
  }

  async healthCheck(): Promise<boolean> {
    return this.status === 'active'
  }

  async dispose(): Promise<void> {
    logger.debug(`[MockAdapter] 释放工具: ${this.name}`)
    this.status = 'inactive'
  }

  getConfig(): ToolConfig {
    return { ...this.config }
  }

  async updateConfig(config: Partial<ToolConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    logger.debug(`[MockAdapter] 更新配置: ${this.name}`, this.config)
  }
}

/**
 * 创建模拟适配器的工厂函数
 */
export function createMockAdapter(name: ToolName) {
  return class MockAdapterInstance extends MockAdapter {
    public status: ToolStatus = 'inactive'
    public config: ToolConfig = { enabled: true }

    constructor() {
      super(name)
    }
  }
}

