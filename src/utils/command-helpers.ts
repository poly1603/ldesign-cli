/**
 * Common command helper utilities
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { ValidationError } from './errors.js'

/**
 * Validate port number
 */
export function validatePort(port: number | undefined, fieldName = 'port'): void {
  if (port === undefined) return

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ValidationError(
      `Invalid ${fieldName}: ${port}. Must be between 1 and 65535.`,
      fieldName,
      { validRange: '1-65535' }
    )
  }

  // Warn about commonly restricted ports
  const restrictedPorts = [
    { port: 22, service: 'SSH' },
    { port: 80, service: 'HTTP' },
    { port: 443, service: 'HTTPS' },
    { port: 3306, service: 'MySQL' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 27017, service: 'MongoDB' }
  ]

  const restricted = restrictedPorts.find(r => r.port === port)
  if (restricted) {
    console.warn(
      `⚠️  Port ${port} is commonly used by ${restricted.service}. Consider using a different port.`
    )
  }
}

/**
 * Validate file path exists
 */
export function validateFilePath(
  path: string | undefined,
  fieldName: string,
  required = false
): void {
  if (!path) {
    if (required) {
      throw new ValidationError(
        `${fieldName} is required`,
        fieldName
      )
    }
    return
  }

  const fullPath = resolve(process.cwd(), path)
  if (!existsSync(fullPath)) {
    throw new ValidationError(
      `${fieldName} not found: ${path}`,
      fieldName,
      {
        fullPath,
        suggestion: 'Check if the file path is correct'
      }
    )
  }
}

/**
 * Validate directory path format
 */
export function validateDirPath(
  path: string | undefined,
  fieldName: string
): void {
  if (!path) return

  // Check for invalid characters
  if (path.includes('*') || path.includes('?')) {
    throw new ValidationError(
      `${fieldName} cannot contain wildcards`,
      fieldName
    )
  }

  // Check for invalid path patterns
  if (path.includes('..') && !path.startsWith('..')) {
    throw new ValidationError(
      `${fieldName} contains invalid path pattern`,
      fieldName,
      { suggestion: 'Use relative or absolute paths without .. in the middle' }
    )
  }
}

/**
 * Validate host/hostname
 */
export function validateHost(host: string | undefined, fieldName = 'host'): void {
  if (!host) return

  // Allow localhost, IP addresses, and valid hostnames
  const validHostPattern = 
    /^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$|^localhost$|^0\.0\.0\.0$/

  if (!validHostPattern.test(host)) {
    throw new ValidationError(
      `Invalid ${fieldName}: ${host}`,
      fieldName,
      {
        suggestion: 'Use a valid hostname or IP address (e.g., localhost, 0.0.0.0, 127.0.0.1)'
      }
    )
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: T | undefined,
  validValues: T[],
  fieldName: string,
  required = false
): void {
  if (!value) {
    if (required) {
      throw new ValidationError(
        `${fieldName} is required`,
        fieldName,
        { validValues }
      )
    }
    return
  }

  if (!validValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}: ${value}. Must be one of: ${validValues.join(', ')}`,
      fieldName,
      { validValues }
    )
  }
}

/**
 * Validate boolean option
 */
export function validateBoolean(
  value: any,
  fieldName: string
): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ValidationError(
      `${fieldName} must be a boolean value`,
      fieldName,
      { received: typeof value }
    )
  }
}

/**
 * Validate string option
 */
export function validateString(
  value: any,
  fieldName: string,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  } = {}
): void {
  if (value === undefined || value === null) {
    if (options.required) {
      throw new ValidationError(
        `${fieldName} is required`,
        fieldName
      )
    }
    return
  }

  if (typeof value !== 'string') {
    throw new ValidationError(
      `${fieldName} must be a string`,
      fieldName,
      { received: typeof value }
    )
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName,
      { minLength: options.minLength, actual: value.length }
    )
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName,
      { maxLength: options.maxLength, actual: value.length }
    )
  }

  if (options.pattern && !options.pattern.test(value)) {
    throw new ValidationError(
      `${fieldName} has invalid format`,
      fieldName,
      { pattern: options.pattern.toString() }
    )
  }
}

/**
 * Validate array option
 */
export function validateArray(
  value: any,
  fieldName: string,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    itemValidator?: (item: any, index: number) => void
  } = {}
): void {
  if (value === undefined || value === null) {
    if (options.required) {
      throw new ValidationError(
        `${fieldName} is required`,
        fieldName
      )
    }
    return
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(
      `${fieldName} must be an array`,
      fieldName,
      { received: typeof value }
    )
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${options.minLength} items`,
      fieldName,
      { minLength: options.minLength, actual: value.length }
    )
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must have at most ${options.maxLength} items`,
      fieldName,
      { maxLength: options.maxLength, actual: value.length }
    )
  }

  if (options.itemValidator) {
    value.forEach((item, index) => {
      try {
        options.itemValidator!(item, index)
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ValidationError(
            `${fieldName}[${index}]: ${error.message}`,
            `${fieldName}[${index}]`,
            error.details
          )
        }
        throw error
      }
    })
  }
}

/**
 * Format feature list for display
 */
export function formatFeatures(features: Record<string, boolean | undefined>): string {
  const enabled = Object.entries(features)
    .filter(([_, value]) => value === true)
    .map(([key]) => key)

  if (enabled.length === 0) {
    return 'none'
  }

  return enabled.join(', ')
}

/**
 * Build URL from components
 */
export function buildUrl(
  protocol: 'http' | 'https',
  host: string,
  port: number,
  path = ''
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${protocol}://${host}:${port}${cleanPath}`
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI
  )
}

/**
 * Get current working directory safely
 */
export function getCwd(cwd?: string): string {
  return cwd || process.cwd()
}
