/**
 * Configuration file loader
 * Supports loading config from .ts, .js, .json files
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { logger } from '@ldesign/shared'
import type { LDesignConfig } from '../types/config'
import { ConfigError } from './errors.js'

const CONFIG_FILES = [
  'ldesign.config.ts',
  'ldesign.config.mts',
  'ldesign.config.js',
  'ldesign.config.mjs',
  'ldesign.config.json',
  '.ldesignrc.json',
  '.ldesignrc.js'
]

/**
 * Load config file from specific path
 */
export async function loadConfigFromFile(
  configFile: string
): Promise<LDesignConfig | null> {
  const configPath = resolve(process.cwd(), configFile)

  if (!existsSync(configPath)) {
    return null
  }

  try {
    // JSON files
    if (configPath.endsWith('.json')) {
      const { readFileSync } = await import('fs')
      const content = readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }

    // TypeScript/JavaScript files
    const fileUrl = pathToFileURL(configPath).href
    const module = await import(fileUrl)
    
    // Support both default export and named export
    return module.default || module.config || module
  } catch (error) {
    throw new ConfigError(
      `Failed to load config from ${configPath}`,
      { originalError: error }
    )
  }
}

/**
 * Search and load config file
 */
export async function loadConfig(
  cwd: string = process.cwd(),
  configFile?: string
): Promise<LDesignConfig> {
  // If specific config file is provided
  if (configFile) {
    const config = await loadConfigFromFile(configFile)
    if (config) {
      logger.debug(`Loaded config from: ${configFile}`)
      return config
    }
    logger.warn(`Config file not found: ${configFile}`)
  }

  // Search for config files
  for (const file of CONFIG_FILES) {
    const configPath = resolve(cwd, file)
    if (existsSync(configPath)) {
      try {
        const config = await loadConfigFromFile(file)
        if (config) {
          logger.debug(`Loaded config from: ${file}`)
          return config
        }
      } catch (error) {
        logger.warn(`Failed to load config from ${file}:`, error)
      }
    }
  }

  // Return default config
  logger.debug('No config file found, using defaults')
  return {}
}

/**
 * Merge configs with priority
 */
export function mergeConfig(
  defaults: LDesignConfig,
  ...configs: (LDesignConfig | undefined)[]
): LDesignConfig {
  return configs.reduce(
    (merged, config) => {
      if (!config) {
        return merged
      }
      return {
        ...merged,
        ...config,
        // Deep merge for nested objects
        ui: { ...merged.ui, ...config.ui },
        build: { ...merged.build, ...config.build },
        dev: { ...merged.dev, ...config.dev }
      }
    },
    { ...defaults }
  )
}

/**
 * Validate config
 */
export function validateConfig(config: LDesignConfig): boolean {
  // Basic validation
  if (config.logLevel && !['debug', 'info', 'warn', 'error', 'silent'].includes(config.logLevel)) {
    logger.warn(`Invalid logLevel: ${config.logLevel}, using default`)
    return false
  }

  if (config.ui?.server?.port && (config.ui.server.port < 1 || config.ui.server.port > 65535)) {
    logger.warn(`Invalid server port: ${config.ui.server.port}`)
    return false
  }

  if (config.ui?.web?.port && (config.ui.web.port < 1 || config.ui.web.port > 65535)) {
    logger.warn(`Invalid web port: ${config.ui.web.port}`)
    return false
  }

  return true
}
