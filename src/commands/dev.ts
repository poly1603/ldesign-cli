/**
 * Dev command implementation
 * Integrates @ldesign/launcher package
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared'
import type { CommandHandler } from '../CommandRegistry'
import type { CommandOptions } from '../types/options'
import { CommandError } from '../utils/errors.js'
import { validatePort, validateHost, buildUrl } from '../utils/command-helpers.js'

export interface DevCommandOptions extends CommandOptions {
  port?: number
  host?: string
  open?: boolean
  https?: boolean
  hmr?: boolean
  cors?: boolean
}

/**
 * Validate dev server options
 */
function validateDevOptions(options: DevCommandOptions): void {
  validatePort(options.port, 'port')
  validateHost(options.host, 'host')
}

/**
 * Dev command handler
 */
export async function devCommand(options: DevCommandOptions = {}): Promise<void> {
  const devLogger = logger.withPrefix('DEV')
  
  try {
    devLogger.info('Starting development server...')
    
    // Validate options
    validateDevOptions(options)
    
    // Get configuration with defaults
    const port = options.port || 3000
    const host = options.host || 'localhost'
    const protocol = options.https ? 'https' : 'http'
    const url = buildUrl(protocol, host, port)
    
    // Show configuration
    devLogger.info(`Server URL: ${url}`)
    devLogger.info(`Host: ${host}`)
    devLogger.info(`Port: ${port}`)
    
    // Show enabled features
    const features: string[] = []
    if (options.open) features.push('auto-open browser')
    if (options.https) features.push('HTTPS')
    if (options.hmr !== false) features.push('hot module replacement')
    if (options.cors) features.push('CORS')
    
    if (features.length > 0) {
      devLogger.info(`Features: ${features.join(', ')}`)
    }
    
    // TODO: Integrate @ldesign/launcher package
    // For now, show a helpful message
    devLogger.warn('🚧 Dev server functionality is under development')
    devLogger.info('\nTo integrate @ldesign/launcher:')
    devLogger.info('  1. Ensure @ldesign/launcher is installed')
    devLogger.info('  2. Import and call startDevServer')
    devLogger.info('  3. Pass validated options to the launcher')
    devLogger.info(`\nExpected URL: ${url}`)
    
    // Simulate server start
    devLogger.success('✅ Dev server configuration validated')
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new CommandError(
      'Dev server failed to start',
      'dev',
      { originalError: error }
    )
  }
}

/**
 * Dev command handler (CommandHandler implementation)
 */
export const devCommandHandler: CommandHandler = {
  name: 'dev',
  description: 'Start dev server',

  setup(cli: CAC) {
    cli
      .command('dev', 'Start development server')
      .alias('d')
      .option('-p, --port <port>', 'Specify port', { type: [Number] })
      .option('-H, --host <host>', 'Specify host')
      .option('--open', 'Auto open browser')
      .option('--https', 'Enable HTTPS')
      .action(async (options) => {
        try {
          await devCommand(options)
        } catch (error) {
          logger.error('Dev command failed:', error)
          process.exit(1)
        }
      })
  },

  async execute(options: DevCommandOptions) {
    return devCommand(options)
  },
}
