/**
 * Build command implementation
 * Integrates @ldesign/builder package
 */

import type { CAC } from 'cac'
import { logger } from '@ldesign/shared'
import type { CommandHandler } from '../CommandRegistry'
import type { CommandOptions } from '../types/options'
import { CommandError } from '../utils/errors.js'
import { validateEnum, validateFilePath, validateDirPath } from '../utils/command-helpers.js'

export interface BuildCommandOptions extends CommandOptions {
  entry?: string
  mode?: 'development' | 'production'
  watch?: boolean
  analyze?: boolean
  sourcemap?: boolean
  outDir?: string
  minify?: boolean
  clean?: boolean
}

/**
 * Validate build options
 */
function validateBuildOptions(options: BuildCommandOptions): void {
  // Validate mode
  validateEnum(options.mode, ['development', 'production'], 'mode')

  // Validate entry file if specified
  if (options.entry) {
    validateFilePath(options.entry, 'entry')
  }

  // Validate output directory
  validateDirPath(options.outDir, 'outDir')
}

/**
 * Build command handler
 */
export async function buildCommand(options: BuildCommandOptions = {}): Promise<void> {
  const buildLogger = logger.withPrefix('BUILD')
  
  try {
    buildLogger.info('Starting build...')
    
    // Validate options
    validateBuildOptions(options)
    
    // Get configuration
    const mode = options.mode || 'production'
    const outDir = options.outDir || 'dist'
    const cwd = options.cwd || process.cwd()
    
    buildLogger.info(`Mode: ${mode}`)
    buildLogger.info(`Output directory: ${outDir}`)
    if (options.entry) buildLogger.info(`Entry: ${options.entry}`)
    
    // Show enabled options
    const features: string[] = []
    if (options.watch) features.push('watch')
    if (options.analyze) features.push('bundle analysis')
    if (options.sourcemap) features.push('source maps')
    if (options.minify) features.push('minification')
    if (options.clean) features.push('clean output')
    
    if (features.length > 0) {
      buildLogger.info(`Features: ${features.join(', ')}`)
    }
    
    // TODO: Integrate @ldesign/builder package
    // For now, show a helpful message
    buildLogger.warn('🚧 Build functionality is under development')
    buildLogger.info('\nTo integrate @ldesign/builder:')
    buildLogger.info('  1. Ensure @ldesign/builder is installed')
    buildLogger.info('  2. Import and call the build function')
    buildLogger.info('  3. Pass validated options to the builder')
    
    // Simulate build success for demonstration
    buildLogger.success('✅ Build configuration validated')
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new CommandError(
      'Build failed',
      'build',
      { originalError: error }
    )
  }
}

/**
 * Build command handler (CommandHandler implementation)
 */
export const buildCommandHandler: CommandHandler = {
  name: 'build',
  description: 'Build project',

  setup(cli: CAC) {
    cli
      .command('build [entry]', 'Build project')
      .alias('b')
      .option('--mode <mode>', 'Build mode (development/production)', { default: 'production' })
      .option('--watch', 'Watch file changes')
      .option('--analyze', 'Enable bundle analysis')
      .option('--sourcemap', 'Generate source maps')
      .action(async (entry, options) => {
        try {
          await buildCommand({ ...options, entry })
        } catch (error) {
          logger.error('Build command failed:', error)
          process.exit(1)
        }
      })
  },

  async execute(options: BuildCommandOptions) {
    return buildCommand(options)
  },
}
