/**
 * Command Registry - Simplified version
 */
import type { CAC } from 'cac'

export interface CommandHandler {
  name: string
  description: string
  aliases?: string[]
  setup(cli: CAC): void
  execute(options: any): Promise<void>
}

class CommandRegistry {
  private commands: CommandHandler[] = []

  register(command: CommandHandler): void {
    this.commands.push(command)
  }

  setupCLI(cli: CAC): void {
    for (const command of this.commands) {
      command.setup(cli)
    }
  }

  getCommands(): CommandHandler[] {
    return [...this.commands]
  }

  clear(): void {
    this.commands = []
  }
}

let registry: CommandRegistry | null = null

export function getCommandRegistry(): CommandRegistry {
  if (!registry) {
    registry = new CommandRegistry()
  }
  return registry
}
