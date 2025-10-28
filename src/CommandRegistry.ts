/**
 * 命令注册�?
 * 提供插件化的命令管理，方便扩展新命令
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared/utils.js'

/**
 * 命令处理器接�?
 */
export interface CommandHandler {
  /**
   * 命令名称
   */
  name: string

  /**
   * 命令描述
   */
  description: string

  /**
   * 设置命令�?CLI
   */
  setup(cli: CAC): void

  /**
   * 执行命令 (可选，setup时可能已经配置了action)
   */
  execute?(options: any): Promise<void>
}

/**
 * 命令注册�?
 */
export class CommandRegistry {
  private commands = new Map<string, CommandHandler>()

  /**
   * 注册命令
   */
  register(handler: CommandHandler): void {
    if (this.commands.has(handler.name)) {
      logger.warn(`[CommandRegistry] 命令 "${handler.name}" 已存在，将被覆盖`)
    }

    this.commands.set(handler.name, handler)
    logger.debug(`[CommandRegistry] 已注册命�? ${handler.name}`)
  }

  /**
   * 注销命令
   */
  unregister(name: string): boolean {
    const deleted = this.commands.delete(name)
    if (deleted) {
      logger.debug(`[CommandRegistry] 已注销命令: ${name}`)
    }
    return deleted
  }

  /**
   * 获取命令
   */
  get(name: string): CommandHandler | undefined {
    return this.commands.get(name)
  }

  /**
   * 获取所有命�?
   */
  getAll(): CommandHandler[] {
    return Array.from(this.commands.values())
  }

  /**
   * 检查命令是否存�?
   */
  has(name: string): boolean {
    return this.commands.has(name)
  }

  /**
   * 设置所有命令到 CLI
   */
  setupCLI(cli: CAC): void {
    logger.debug(`[CommandRegistry] 开始注�?${this.commands.size} 个命令`)

    for (const [name, handler] of this.commands) {
      try {
        handler.setup(cli)
        logger.debug(`[CommandRegistry] 命令 "${name}" 注册成功`)
      } catch (error) {
        logger.error(`[CommandRegistry] 命令 "${name}" 注册失败:`, error)
      }
    }

    logger.debug(`[CommandRegistry] 所有命令注册完成`)
  }

  /**
   * 清空所有命�?
   */
  clear(): void {
    this.commands.clear()
    logger.debug('[CommandRegistry] 已清空所有命�?)
  }
}

// 单例
let instance: CommandRegistry | null = null

/**
 * 获取命令注册器实�?
 */
export function getCommandRegistry(): CommandRegistry {
  if (!instance) {
    instance = new CommandRegistry()
  }
  return instance
}


