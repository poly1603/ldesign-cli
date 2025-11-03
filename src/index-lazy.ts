/**
 * CLI Entry Point (Lazy Loading Version)
 * Optimized for faster startup with on-demand command loading
 */

import { cac } from 'cac'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { logger } from '@ldesign/shared'
import { getLazyCommandRegistry } from './LazyCommandRegistry'
import type { LDesignConfig } from './types/config'
import type { GlobalOptions } from './types/options'
import { handleError } from './utils/errors.js'
import { getProfiler } from './utils/performance.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Get package version
 */
function getVersion(): string {
  try {
    const packagePath = resolve(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version || '1.0.0'
  } catch (error) {
    logger.warn('Cannot read version, using default')
    return '1.0.0'
  }
}

/**
 * Load user config from ldesign.config.ts/js
 */
async function loadUserConfig(): Promise<LDesignConfig> {
  const { loadConfig, validateConfig } = await import('./utils/config-loader.js')
  
  try {
    const config = await loadConfig()
    validateConfig(config)
    return config
  } catch (error) {
    logger.debug('No config file found, using defaults')
    return {}
  }
}

/**
 * Apply global options
 */
function applyGlobalOptions(options: GlobalOptions, config: LDesignConfig): void {
  if (options.debug) {
    logger.setLevel('debug')
  } else if (options.verbose) {
    logger.setLevel('verbose')
  } else if (options.silent) {
    logger.setLevel('silent')
  } else if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }
}

/**
 * Register all commands (lazy)
 */
function registerLazyCommands() {
  const registry = getLazyCommandRegistry()

  // Register commands with lazy loaders
  registry.registerLazy('init', 'Initialize LDesign configuration file', 
    () => import('./commands/init.js'))
  
  registry.registerLazy('build', 'Build project', 
    () => import('./commands/build.js'))
  
  registry.registerLazy('dev', 'Start development server', 
    () => import('./commands/dev.js'))
  
  registry.registerLazy('deploy', 'Deploy project', 
    () => import('./commands/deploy.js'))
  
  registry.registerLazy('test', 'Run tests', 
    () => import('./commands/test.js'))
  
  registry.registerLazy('generate', 'Generate code', 
    () => import('./commands/generate.js'))
  
  registry.registerLazy('ui', 'Start UI server', 
    () => import('./commands/ui.js'))
  
  registry.registerLazy('changelog', 'Generate changelog', 
    () => import('./commands/changelog.js'))
  
  registry.registerLazy('formatter', 'Format code', 
    () => import('./commands/formatter.js'))
  
  registry.registerLazy('deps', 'Manage dependencies', 
    () => import('./commands/deps.js'))
  
  registry.registerLazy('git', 'Git operations', 
    () => import('./commands/git.js'))
  
  registry.registerLazy('monitor', 'Monitor performance', 
    () => import('./commands/monitor.js'))
  
  registry.registerLazy('performance', 'Analyze performance', 
    () => import('./commands/performance.js'))
  
  registry.registerLazy('publisher', 'Publish package', 
    () => import('./commands/publisher.js'))
  
  registry.registerLazy('security', 'Security audit', 
    () => import('./commands/security.js'))
  
  registry.registerLazy('docs', 'Generate documentation', 
    () => import('./commands/docs.js'))
  
  registry.registerLazy('translator', 'Translate content', 
    () => import('./commands/translator.js'))

  return registry
}

/**
 * Create CLI application
 */
function createCLI(config: LDesignConfig) {
  const cli = cac('ldesign')
  cli.version(getVersion())
  
  // Global options
  cli
    .option('--debug', 'Enable debug mode')
    .option('--silent', 'Silent mode')
    .option('--verbose', 'Verbose output')

  const registry = registerLazyCommands()
  registry.setupCLI(cli)
  
  cli.help()

  return cli
}

/**
 * Show welcome message
 */
function showWelcome(): void {
  const version = getVersion()
  console.log('')
  console.log('  ╭─────────────────────────────────────╮')
  console.log('  │                                     │')
  console.log(`  │    🎨 LDesign CLI v${version.padEnd(14)}│`)
  console.log('  │                                     │')
  console.log('  │    Modern Design System CLI         │')
  console.log('  │    ⚡ Lightning Fast Lazy Loading   │')
  console.log('  │                                     │')
  console.log('  ╰─────────────────────────────────────╯')
  console.log('')
}

/**
 * Main function
 */
export async function main(): Promise<void> {
  const startTime = Date.now()
  const profiler = getProfiler()
  
  try {
    // Enable profiling in debug mode
    profiler.start('cli-total')
    
    // Load user config
    profiler.start('config-loading')
    const config = await loadUserConfig()
    profiler.end('config-loading')

    // Enable profiling if debug/verbose
    if (config.logLevel === 'debug' || config.logLevel === 'verbose') {
      profiler.enable()
    }
    
    // Create CLI
    profiler.start('cli-creation')
    const cli = createCLI(config)
    profiler.end('cli-creation')

    // Show welcome if no arguments
    if (process.argv.length <= 2) {
      showWelcome()
      cli.help()
      
      // Show startup time in debug mode
      if (config.logLevel === 'debug') {
        const duration = Date.now() - startTime
        logger.debug(`CLI startup took ${duration}ms`)
      }
      return
    }

    // Parse before getting options
    const parsed = cli.parse(process.argv, { run: false })
    
    // Apply global options
    applyGlobalOptions(parsed.options, config)

    // Run the command (will load on-demand)
    profiler.start('command-execution')
    await cli.runMatchedCommand()
    profiler.end('command-execution')
    profiler.end('cli-total')
    
    // Show stats in debug mode
    if (parsed.options.debug || parsed.options.verbose) {
      const registry = getLazyCommandRegistry()
      const stats = registry.getStats()
      logger.debug(`\n📊 Command Loading Stats:`)
      logger.debug(`  - Loaded: ${stats.loaded}`)
      logger.debug(`  - Pending: ${stats.pending}`)
      logger.debug(`  - Total: ${stats.total}`)
      
      const duration = Date.now() - startTime
      logger.debug(`\n⏱️  Total execution time: ${duration}ms`)
      
      // Print performance summary
      if (parsed.options.verbose) {
        profiler.printSummary()
      }
    }
  } catch (error) {
    profiler.end('cli-total')
    await handleError(error, { exit: true })
  }
}

// Export config helper
export { defineConfig } from './types/config'

export default main

const currentFile = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] === currentFile ||
  process.argv[1]?.includes('index')

if (isMainModule) {
  main().catch(async (error) => {
    await handleError(error, { exit: true })
  })
}
