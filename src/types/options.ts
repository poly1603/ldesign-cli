/**
 * Global CLI options type definitions
 */

/**
 * Global CLI options
 */
export interface GlobalOptions {
  /** Enable debug mode */
  debug?: boolean
  /** Enable verbose output */
  verbose?: boolean
  /** Enable silent mode */
  silent?: boolean
  /** Specify config file path */
  config?: string
  /** Current working directory */
  cwd?: string
}

/**
 * Parsed CLI result
 */
export interface ParsedCLI {
  /** Command name */
  command?: string
  /** Command options */
  options: GlobalOptions
  /** Command arguments */
  args: string[]
}

/**
 * Command options base
 */
export interface CommandOptions extends GlobalOptions {
  /** Additional options */
  [key: string]: any
}
