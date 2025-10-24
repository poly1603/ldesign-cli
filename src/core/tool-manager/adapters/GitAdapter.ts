/**
 * Git 工具适配器
 */

import type { IToolAdapter, ToolStatus, ToolConfig, ToolExecutionResult } from '../../../shared/types'
import { TOOL_METADATA } from '../../../shared/constants'
import { logger } from '../../../shared/utils'

export class GitAdapter implements IToolAdapter {
  readonly name = 'git' as const
  readonly metadata = TOOL_METADATA.git
  private status: ToolStatus = 'inactive'
  private config: ToolConfig = { enabled: true, options: {} }
  private git: any = null

  async initialize(): Promise<void> {
    try {
      this.status = 'initializing'
      const module = await import('@ldesign/git')
      this.git = module
      this.status = 'active'
    } catch (error) {
      this.status = 'error'
      throw error
    }
  }

  async execute(action: string, params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    try {
      let result: any = { success: true }
      return { success: true, data: result, duration: Date.now() - startTime, timestamp: Date.now() }
    } catch (error) {
      return { success: false, error: String(error), duration: Date.now() - startTime, timestamp: Date.now() }
    }
  }

  getStatus(): ToolStatus { return this.status }
  async healthCheck(): Promise<boolean> { return this.status === 'active' }
  async dispose(): Promise<void> { this.git = null; this.status = 'inactive' }
  getConfig(): ToolConfig { return { ...this.config } }
  async updateConfig(config: Partial<ToolConfig>): Promise<void> { this.config = { ...this.config, ...config } }
}


