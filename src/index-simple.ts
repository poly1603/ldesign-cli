/**
 * CLI Entry - Simplified version without encoding issues
 */

import { cac } from 'cac'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { buildCommandHandler } from './commands/build'
import { devCommandHandler } from './commands/dev'
import { deployCommandHandler } from './commands/deploy'
import { testCommandHandler } from './commands/test'
import { generateCommandHandler } from './commands/generate'
import { logger } from '@ldesign/shared'
import { getCommandRegistry } from './CommandRegistry-simple'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getVersion(): string {
  try {
    const packagePath = resolve(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version || '1.0.0'
  } catch (error) {
    logger.warn('Cannot read version, using default')
    return '1.0.0'
  }
}

function createCLI() {
  const cli = cac('ldesign')
  cli.version(getVersion())
  
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

  registry.setupCLI(cli)
  cli.help()

  return cli
}

function showWelcome(): void {
  const version = getVersion()
  console.log('')
  console.log('  ╭────────────────────────────────────╮')
  console.log('  │                                    │')
  console.log(`  │     🎨 LDesign CLI v${version.padEnd(14)}│`)
  console.log('  │                                    │')
  console.log('  │     Modern Design System CLI       │')
  console.log('  │                                    │')
  console.log('  ╰────────────────────────────────────╯')
  console.log('')
}

export async function main(): Promise<void> {
  try {
    const cli = createCLI()

    if (process.argv.length <= 2) {
      showWelcome()
      cli.help()
      return
    }

    cli.parse(process.argv)
  } catch (error) {
    logger.error('CLI failed:', error)
    process.exit(1)
  }
}

export default main

const currentFile = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] === currentFile ||
  process.argv[1]?.includes('index-simple')

if (isMainModule) {
  main().catch((error) => {
    logger.error('CLI execution failed:', error)
    process.exit(1)
  })
}
