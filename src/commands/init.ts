/**
 * Init command: Initialize LDesign configuration
 */

import type { CAC } from 'cac'
import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { logger } from '@ldesign/shared'
import type { CommandHandler } from '../core/CommandRegistry'
import type { CommandOptions } from '../types/options'
import { FileSystemError } from '../utils/errors.js'

export interface InitCommandOptions extends CommandOptions {
  /** Force overwrite existing config */
  force?: boolean
  /** Config file type */
  type?: 'ts' | 'js' | 'json'
  /** Skip interactive prompts */
  yes?: boolean
}

/**
 * Default config templates
 */
const CONFIG_TEMPLATES = {
  ts: `import { defineConfig } from '@ldesign/cli'

export default defineConfig({
  // Log level
  logLevel: 'info',

  // UI configuration
  ui: {
    server: {
      port: 3000,
      host: '127.0.0.1'
    },
    web: {
      port: 5173
    },
    open: true
  },

  // Build configuration
  build: {
    mode: 'production',
    sourcemap: true,
    analyze: false
  },

  // Dev configuration
  dev: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    https: false
  }
})
`,
  js: `import { defineConfig } from '@ldesign/cli'

export default defineConfig({
  // Log level
  logLevel: 'info',

  // UI configuration
  ui: {
    server: {
      port: 3000,
      host: '127.0.0.1'
    },
    web: {
      port: 5173
    },
    open: true
  },

  // Build configuration
  build: {
    mode: 'production',
    sourcemap: true,
    analyze: false
  },

  // Dev configuration
  dev: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    https: false
  }
})
`,
  json: `{
  "logLevel": "info",
  "ui": {
    "server": {
      "port": 3000,
      "host": "127.0.0.1"
    },
    "web": {
      "port": 5173
    },
    "open": true
  },
  "build": {
    "mode": "production",
    "sourcemap": true,
    "analyze": false
  },
  "dev": {
    "port": 5173,
    "host": "127.0.0.1",
    "open": true,
    "https": false
  }
}
`
}

/**
 * Init command handler
 */
export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  const initLogger = logger.withPrefix('INIT')
  const cwd = options.cwd || process.cwd()
  const fileType = options.type || 'ts'
  const force = options.force || false

  try {
    initLogger.info('Initializing LDesign configuration...')

    // Determine config file name
    const configFileName = `ldesign.config.${fileType}`
    const configPath = resolve(cwd, configFileName)

    // Check if config already exists
    if (existsSync(configPath) && !force) {
      throw new FileSystemError(
        `Config file already exists: ${configFileName}. Use --force to overwrite.`,
        configPath
      )
    }

    // Get template
    const template = CONFIG_TEMPLATES[fileType]
    if (!template) {
      throw new Error(`Invalid config type: ${fileType}`)
    }

    // Write config file
    writeFileSync(configPath, template, 'utf-8')

    initLogger.success(`âœ?Created config file: ${configFileName}`)
    initLogger.info('')
    initLogger.info('Next steps:')
    initLogger.info('  1. Edit the config file to customize settings')
    initLogger.info('  2. Run `ldesign ui` to start the UI')
    initLogger.info('  3. Run `ldesign --help` to see all available commands')
    
  } catch (error) {
    initLogger.error('Init failed:', error)
    throw error
  }
}

/**
 * Init command handler (CommandHandler implementation)
 */
export const initCommandHandler: CommandHandler = {
  name: 'init',
  description: 'Initialize LDesign configuration file',

  setup(cli: CAC) {
    cli
      .command('init', 'Initialize LDesign configuration file')
      .option('--force', 'Force overwrite existing config')
      .option('--type <type>', 'Config file type (ts, js, json)', {
        default: 'ts'
      })
      .option('--yes, -y', 'Skip interactive prompts')
      .action(async (options: InitCommandOptions) => {
        await initCommand(options)
      })
  },

  execute: initCommand
}
