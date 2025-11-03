/**
 * Lazy Command Registry
 * Improves startup performance by loading commands on-demand
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared/utils.js'
import type { CommandHandler } from './CommandRegistry'

/**
 * Command loader function type
 */
type CommandLoader = () => Promise<{ [key: string]: CommandHandler }>

/**
 * Lazy command definition
 */
interface LazyCommandDefinition {
  name: string
  description: string
  loader: CommandLoader
  loaded?: CommandHandler
}

/**
 * Lazy Command Registry
 * Only loads command modules when they are executed
 */
export class LazyCommandRegistry {
  private commands = new Map<string, LazyCommandDefinition>()

  /**
   * Register a lazy command
   */
  registerLazy(
    name: string,
    description: string,
    loader: CommandLoader
  ): void {
    if (this.commands.has(name)) {
      logger.warn(`[LazyCommandRegistry] Command "${name}" already exists, will be overwritten`)
    }

    this.commands.set(name, {
      name,
      description,
      loader
    })
    
    logger.debug(`[LazyCommandRegistry] Registered lazy command: ${name}`)
  }

  /**
   * Load a command on-demand
   */
  private async loadCommand(name: string): Promise<CommandHandler | null> {
    const def = this.commands.get(name)
    if (!def) {
      return null
    }

    // Return cached handler if already loaded
    if (def.loaded) {
      return def.loaded
    }

    try {
      logger.debug(`[LazyCommandRegistry] Loading command: ${name}`)
      const module = await def.loader()
      
      // Find the command handler export
      const handler = module[`${name}CommandHandler`] || 
                     module.default || 
                     module[name]
      
      if (!handler) {
        logger.error(`[LazyCommandRegistry] No handler found for command: ${name}`)
        return null
      }

      // Cache the loaded handler
      def.loaded = handler
      logger.debug(`[LazyCommandRegistry] Command loaded: ${name}`)
      
      return handler
    } catch (error) {
      logger.error(`[LazyCommandRegistry] Failed to load command "${name}":`, error)
      return null
    }
  }

  /**
   * Setup all commands to CLI (lazy loading)
   */
  setupCLI(cli: CAC): void {
    logger.debug(`[LazyCommandRegistry] Setting up ${this.commands.size} lazy commands`)

    for (const [name, def] of this.commands) {
      try {
        // Register command with lazy loading
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
              logger.warn(`[LazyCommandRegistry] Command "${name}" has no execute method`)
            }
          })

        logger.debug(`[LazyCommandRegistry] Command "${name}" registered (lazy)`)
      } catch (error) {
        logger.error(`[LazyCommandRegistry] Command "${name}" registration failed:`, error)
      }
    }

    logger.debug(`[LazyCommandRegistry] All lazy commands registered`)
  }

  /**
   * Get all command names
   */
  getCommandNames(): string[] {
    return Array.from(this.commands.keys())
  }

  /**
   * Check if command exists
   */
  has(name: string): boolean {
    return this.commands.has(name)
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear()
    logger.debug('[LazyCommandRegistry] Cleared all commands')
  }

  /**
   * Preload specific commands (useful for testing or warm-up)
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
      if (def.loaded) {
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
}

// Singleton
let instance: LazyCommandRegistry | null = null

/**
 * Get lazy command registry instance
 */
export function getLazyCommandRegistry(): LazyCommandRegistry {
  if (!instance) {
    instance = new LazyCommandRegistry()
  }
  return instance
}
