/**
 * CLI Entry Point
 * Unified entry file with all commands registered
 */

import { cac } from 'cac'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { logger } from '@ldesign/shared'
import { getCommandRegistry } from './CommandRegistry'
import type { LDesignConfig } from './types/config'

// Import all command handlers
import { buildCommandHandler } from './commands/build'
import { devCommandHandler } from './commands/dev'
import { deployCommandHandler } from './commands/deploy'
import { testCommandHandler } from './commands/test'
import { generateCommandHandler } from './commands/generate'
import { uiCommandHandler } from './commands/ui'
import { changelogCommandHandler } from './commands/changelog'
import { formatterCommandHandler } from './commands/formatter'
import { depsCommandHandler } from './commands/deps'
import { gitCommandHandler } from './commands/git'
import { monitorCommandHandler } from './commands/monitor'
import { performanceCommandHandler } from './commands/performance'
import { publisherCommandHandler } from './commands/publisher'
import { securityCommandHandler } from './commands/security'
import { docsCommandHandler } from './commands/docs'
import { translatorCommandHandler } from './commands/translator'

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
function loadUserConfig(): LDesignConfig {
  try {
    // TODO: Implement config file loading
    // For now, return empty config
    return {}
  } catch (error) {
    logger.debug('No config file found, using defaults')
    return {}
  }
}

/**
 * Apply global options
 */
function applyGlobalOptions(options: any, config: LDesignConfig): void {
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

  const registry = getCommandRegistry()
  
  // Register all commands
  registry.register(buildCommandHandler)
  registry.register(devCommandHandler)
  registry.register(deployCommandHandler)
  registry.register(testCommandHandler)
  registry.register(generateCommandHandler)
  registry.register(uiCommandHandler)
  registry.register(changelogCommandHandler)
  registry.register(formatterCommandHandler)
  registry.register(depsCommandHandler)
  registry.register(gitCommandHandler)
  registry.register(monitorCommandHandler)
  registry.register(performanceCommandHandler)
  registry.register(publisherCommandHandler)
  registry.register(securityCommandHandler)
  registry.register(docsCommandHandler)
  registry.register(translatorCommandHandler)

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
  console.log('  │                                     │')
  console.log('  ╰─────────────────────────────────────╯')
  console.log('')
}

/**
 * Main function
 */
export async function main(): Promise<void> {
  try {
    // Load user config
    const config = loadUserConfig()

    // Create CLI
    const cli = createCLI(config)

    // Show welcome if no arguments
    if (process.argv.length <= 2) {
      showWelcome()
      cli.help()
      return
    }

    // Parse before getting options
    const parsed = cli.parse(process.argv, { run: false })
    
    // Apply global options
    applyGlobalOptions(parsed.options, config)

    // Run the command
    await cli.runMatchedCommand()
  } catch (error) {
    logger.error('CLI failed:', error)
    process.exit(1)
  }
}

export default main

const currentFile = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] === currentFile ||
  process.argv[1]?.includes('index')

if (isMainModule) {
  main().catch((error) => {
    logger.error('CLI execution failed:', error)
    process.exit(1)
  })
}
