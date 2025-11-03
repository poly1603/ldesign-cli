/**
 * Command Registry
 * Provides plugin-based command management for easy extension
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared/utils.js'
import type { CommandOptions } from './types/options'

/**
 * Command Handler Interface
 */
export interface CommandHandler {
  /**
   * Command name
   */
  name: string

  /**
   * Command description
   */
  description: string

  /**
   * Setup command to CLI
   */
  setup(cli: CAC): void

  /**
   * Execute command (optional, may already be configured in setup)
   */
  execute?(options: CommandOptions): Promise<void>
}

/**
 * Command Registry
 */
export class CommandRegistry {
  private commands = new Map<string, CommandHandler>()

  /**
   * Register command
   */
  register(handler: CommandHandler): void {
    if (this.commands.has(handler.name)) {
      logger.warn(`[CommandRegistry] Command "${handler.name}" already exists, will be overwritten`)
    }

    this.commands.set(handler.name, handler)
    logger.debug(`[CommandRegistry] Registered command: ${handler.name}`)
  }

  /**
   * Unregister command
   */
  unregister(name: string): boolean {
    const deleted = this.commands.delete(name)
    if (deleted) {
      logger.debug(`[CommandRegistry] Unregistered command: ${name}`)
    }
    return deleted
  }

  /**
   * Get command
   */
  get(name: string): CommandHandler | undefined {
    return this.commands.get(name)
  }

  /**
   * Get all commands
   */
  getAll(): CommandHandler[] {
    return Array.from(this.commands.values())
  }

  /**
   * Check if command exists
   */
  has(name: string): boolean {
    return this.commands.has(name)
  }

  /**
   * Setup all commands to CLI
   */
  setupCLI(cli: CAC): void {
    logger.debug(`[CommandRegistry] Starting to register ${this.commands.size} commands`)

    for (const [name, handler] of this.commands) {
      try {
        handler.setup(cli)
        logger.debug(`[CommandRegistry] Command "${name}" registered successfully`)
      } catch (error) {
        logger.error(`[CommandRegistry] Command "${name}" registration failed:`, error)
      }
    }

    logger.debug(`[CommandRegistry] All commands registered`)
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear()
    logger.debug('[CommandRegistry] Cleared all commands')
  }
}

// Singleton
let instance: CommandRegistry | null = null

/**
 * Get command registry instance
 */
export function getCommandRegistry(): CommandRegistry {
  if (!instance) {
    instance = new CommandRegistry()
  }
  return instance
}
