/**
 * Custom error types for better error handling
 */

/**
 * Base CLI Error
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'CLIError'
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details
    }
  }
}

/**
 * Configuration Error
 */
export class ConfigError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details)
    this.name = 'ConfigError'
  }
}

/**
 * Command Error
 */
export class CommandError extends CLIError {
  constructor(
    message: string,
    public readonly commandName: string,
    details?: any
  ) {
    super(message, 'COMMAND_ERROR', details)
    this.name = 'CommandError'
  }
}

/**
 * Validation Error
 */
export class ValidationError extends CLIError {
  constructor(
    message: string,
    public readonly field: string,
    details?: any
  ) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * File System Error
 */
export class FileSystemError extends CLIError {
  constructor(
    message: string,
    public readonly path: string,
    details?: any
  ) {
    super(message, 'FILE_SYSTEM_ERROR', details)
    this.name = 'FileSystemError'
  }
}

/**
 * Network Error
 */
export class NetworkError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'NetworkError'
  }
}

/**
 * Check if error is a CLI error
 */
export function isCLIError(error: any): error is CLIError {
  return error instanceof CLIError
}

/**
 * Format error for display
 */
export function formatError(error: any): string {
  if (isCLIError(error)) {
    let message = `❌ ${error.message}`
    
    if (error instanceof CommandError) {
      message += `\n   Command: ${error.commandName}`
    }
    
    if (error instanceof ValidationError) {
      message += `\n   Field: ${error.field}`
    }
    
    if (error instanceof FileSystemError) {
      message += `\n   Path: ${error.path}`
    }
    
    if (error.details) {
      message += `\n   Details: ${JSON.stringify(error.details, null, 2)}`
    }
    
    return message
  }
  
  if (error instanceof Error) {
    return `❌ ${error.message}`
  }
  
  return `❌ ${String(error)}`
}

/**
 * Error handler with recovery
 */
export interface ErrorRecoveryOptions {
  retry?: boolean
  fallback?: () => Promise<void> | void
  exit?: boolean
}

export async function handleError(
  error: any,
  options: ErrorRecoveryOptions = {}
): Promise<void> {
  const { retry = false, fallback, exit = true } = options
  
  // Log formatted error
  const formattedError = formatError(error)
  console.error('\n' + formattedError)
  
  // Show stack trace in debug mode
  if (process.env.DEBUG && error instanceof Error && error.stack) {
    console.error('\nStack trace:')
    console.error(error.stack)
  }
  
  // Try fallback
  if (fallback) {
    try {
      await fallback()
      return
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError)
    }
  }
  
  // Exit if needed
  if (exit) {
    process.exit(1)
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: ErrorRecoveryOptions
): (...args: T) => Promise<R | undefined> {
  return async (...args: T) => {
    try {
      return await fn(...args)
    } catch (error) {
      await handleError(error, options)
      return undefined
    }
  }
}

/**
 * Assert with custom error
 */
export function assert(
  condition: any,
  message: string,
  ErrorClass: typeof CLIError = CLIError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message, 'ASSERTION_ERROR')
  }
}
