/**
 * Error handling unit tests
 */

import { describe, it, expect } from 'vitest'
import {
  CLIError,
  ConfigError,
  CommandError,
  ValidationError,
  FileSystemError,
  NetworkError,
  isCLIError,
  formatError
} from '../utils/errors'

describe('errors', () => {
  describe('CLIError', () => {
    it('should create basic CLI error', () => {
      const error = new CLIError('Test error', 'TEST_CODE')
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('CLIError')
    })

    it('should include details', () => {
      const details = { foo: 'bar' }
      const error = new CLIError('Test error', 'TEST_CODE', details)
      
      expect(error.details).toEqual(details)
    })

    it('should serialize to JSON', () => {
      const error = new CLIError('Test error', 'TEST_CODE', { foo: 'bar' })
      const json = error.toJSON()
      
      expect(json).toEqual({
        name: 'CLIError',
        message: 'Test error',
        code: 'TEST_CODE',
        details: { foo: 'bar' }
      })
    })
  })

  describe('ConfigError', () => {
    it('should create config error', () => {
      const error = new ConfigError('Config failed')
      
      expect(error.message).toBe('Config failed')
      expect(error.code).toBe('CONFIG_ERROR')
      expect(error.name).toBe('ConfigError')
    })
  })

  describe('CommandError', () => {
    it('should create command error', () => {
      const error = new CommandError('Command failed', 'build')
      
      expect(error.message).toBe('Command failed')
      expect(error.commandName).toBe('build')
      expect(error.code).toBe('COMMAND_ERROR')
      expect(error.name).toBe('CommandError')
    })
  })

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid field', 'username')
      
      expect(error.message).toBe('Invalid field')
      expect(error.field).toBe('username')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('FileSystemError', () => {
    it('should create file system error', () => {
      const error = new FileSystemError('File not found', '/path/to/file')
      
      expect(error.message).toBe('File not found')
      expect(error.path).toBe('/path/to/file')
      expect(error.code).toBe('FILE_SYSTEM_ERROR')
      expect(error.name).toBe('FileSystemError')
    })
  })

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection failed')
      
      expect(error.message).toBe('Connection failed')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.name).toBe('NetworkError')
    })
  })

  describe('isCLIError', () => {
    it('should return true for CLI errors', () => {
      const error = new CLIError('Test', 'TEST')
      expect(isCLIError(error)).toBe(true)
    })

    it('should return true for derived CLI errors', () => {
      const configError = new ConfigError('Test')
      const commandError = new CommandError('Test', 'cmd')
      
      expect(isCLIError(configError)).toBe(true)
      expect(isCLIError(commandError)).toBe(true)
    })

    it('should return false for regular errors', () => {
      const error = new Error('Test')
      expect(isCLIError(error)).toBe(false)
    })

    it('should return false for non-errors', () => {
      expect(isCLIError('string')).toBe(false)
      expect(isCLIError(null)).toBe(false)
      expect(isCLIError(undefined)).toBe(false)
    })
  })

  describe('formatError', () => {
    it('should format basic CLI error', () => {
      const error = new CLIError('Test error', 'TEST')
      const formatted = formatError(error)
      
      expect(formatted).toContain('❌')
      expect(formatted).toContain('Test error')
    })

    it('should format command error with command name', () => {
      const error = new CommandError('Build failed', 'build')
      const formatted = formatError(error)
      
      expect(formatted).toContain('Build failed')
      expect(formatted).toContain('Command: build')
    })

    it('should format validation error with field', () => {
      const error = new ValidationError('Invalid value', 'port')
      const formatted = formatError(error)
      
      expect(formatted).toContain('Invalid value')
      expect(formatted).toContain('Field: port')
    })

    it('should format file system error with path', () => {
      const error = new FileSystemError('File not found', '/test/path')
      const formatted = formatError(error)
      
      expect(formatted).toContain('File not found')
      expect(formatted).toContain('Path: /test/path')
    })

    it('should include details if present', () => {
      const error = new CLIError('Test', 'TEST', { key: 'value' })
      const formatted = formatError(error)
      
      expect(formatted).toContain('Details:')
      expect(formatted).toContain('key')
      expect(formatted).toContain('value')
    })

    it('should format regular errors', () => {
      const error = new Error('Regular error')
      const formatted = formatError(error)
      
      expect(formatted).toContain('❌')
      expect(formatted).toContain('Regular error')
    })

    it('should format non-error values', () => {
      const formatted = formatError('string error')
      
      expect(formatted).toContain('❌')
      expect(formatted).toContain('string error')
    })
  })
})
