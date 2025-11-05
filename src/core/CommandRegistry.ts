/**
 * Command Registry
 * Unified command registry with support for both eager and lazy loading
 * @module core/CommandRegistry
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared/utils.js'
import type { CommandOptions } from '../types/options'

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
 * Command loader function type (for lazy loading)
 */
type CommandLoader = () => Promise<{ [key: string]: CommandHandler }>

/**
 * Command definition (supports both eager and lazy loading)
 */
interface CommandDefinition {
  name: string
  description: string
  handler?: CommandHandler
  loader?: CommandLoader
  loaded?: boolean
}

/**
 * Command Registry
 * Supports both eager registration and lazy loading
 */
export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>()

  /**
   * Register a command handler (eager loading)
   */
  register(handler: CommandHandler): void {
    if (this.commands.has(handler.name)) {
      logger.warn(`[CommandRegistry] Command "${handler.name}" already exists, will be overwritten`)
    }

    this.commands.set(handler.name, {
      name: handler.name,
      description: handler.description,
      handler,
      loaded: true,
    })
    
    logger.debug(`[CommandRegistry] Registered command: ${handler.name}`)
  }

  /**
   * Register a lazy command (on-demand loading)
   */
  registerLazy(
    name: string,
    description: string,
    loader: CommandLoader
  ): void {
    if (this.commands.has(name)) {
      logger.warn(`[CommandRegistry] Command "${name}" already exists, will be overwritten`)
    }

    this.commands.set(name, {
      name,
      description,
      loader,
      loaded: false,
    })
    
    logger.debug(`[CommandRegistry] Registered lazy command: ${name}`)
  }

  /**
   * Load a lazy command on-demand
   */
  private async loadCommand(name: string): Promise<CommandHandler | null> {
    const def = this.commands.get(name)
    if (!def) {
      return null
    }

    // Return cached handler if already loaded
    if (def.handler && def.loaded) {
      return def.handler
    }

    // Load lazy command
    if (def.loader) {
      try {
        logger.debug(`[CommandRegistry] Loading lazy command: ${name}`)
        const module = await def.loader()
        
        // Find the command handler export
        const handler = module[`${name}CommandHandler`] || 
                       module.default || 
                       module[name]
        
        if (!handler) {
          logger.error(`[CommandRegistry] No handler found for command: ${name}`)
          return null
        }

        // Cache the loaded handler
        def.handler = handler
        def.loaded = true
        logger.debug(`[CommandRegistry] Command loaded: ${name}`)
        
        return handler
      } catch (error) {
        logger.error(`[CommandRegistry] Failed to load command "${name}":`, error)
        return null
      }
    }

    return def.handler || null
  }

  /**
   * Get command handler
   */
  get(name: string): CommandHandler | undefined {
    const def = this.commands.get(name)
    return def?.handler
  }

  /**
   * Get all command handlers (only loaded ones)
   */
  getAll(): CommandHandler[] {
    const handlers: CommandHandler[] = []
    for (const def of this.commands.values()) {
      if (def.handler) {
        handlers.push(def.handler)
      }
    }
    return handlers
  }

  /**
   * Check if command exists
   */
  has(name: string): boolean {
    return this.commands.has(name)
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
   * Setup all commands to CLI
   * Lazy commands will be loaded on-demand when executed
   */
  setupCLI(cli: CAC): void {
    logger.debug(`[CommandRegistry] Setting up ${this.commands.size} commands`)

    for (const [name, def] of this.commands) {
      try {
        if (def.handler) {
          // Eager loaded command - setup directly
          def.handler.setup(cli)
          logger.debug(`[CommandRegistry] Command "${name}" registered (eager)`)
        } else if (def.loader) {
          // Lazy loaded command - setup with lazy loading
          cli
            .command(name, def.description)
            .action(async (...args: any[]) => {
              // Load command on execution
              const handler = await this.loadCommand(name)
              if (!handler) {
                throw new Error(`Failed to load command: ${name}`)
              }

              // Execute the command
              const options = args[args.length - 1] || {}
              if (handler.execute) {
                await handler.execute(options)
              } else {
                logger.warn(`[CommandRegistry] Command "${name}" has no execute method`)
              }
            })
          logger.debug(`[CommandRegistry] Command "${name}" registered (lazy)`)
        }
      } catch (error) {
        logger.error(`[CommandRegistry] Command "${name}" registration failed:`, error)
      }
    }

    logger.debug(`[CommandRegistry] All commands registered`)
  }

  /**
   * Preload specific lazy commands (useful for testing or warm-up)
   */
  async preload(...names: string[]): Promise<void> {
    const promises = names.map(name => this.loadCommand(name))
    await Promise.all(promises)
  }

  /**
   * Get load statistics
   */
  getStats(): { total: number; loaded: number; pending: number } {
    let loaded = 0
    let pending = 0

    for (const def of this.commands.values()) {
      if (def.loaded && def.handler) {
        loaded++
      } else {
        pending++
      }
    }

    return {
      total: this.commands.size,
      loaded,
      pending
    }
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

















