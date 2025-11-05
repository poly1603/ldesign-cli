/**
 * CommandRegistry unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandRegistry, type CommandHandler } from '../core/CommandRegistry'
import type { CAC } from 'cac'

describe('CommandRegistry', () => {
  let registry: CommandRegistry

  beforeEach(() => {
    registry = new CommandRegistry()
  })

  describe('register', () => {
    it('should register a command', () => {
      const handler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        setup: vi.fn()
      }

      registry.register(handler)
      expect(registry.has('test')).toBe(true)
      expect(registry.get('test')).toBe(handler)
    })

    it('should overwrite existing command with warning', () => {
      const handler1: CommandHandler = {
        name: 'test',
        description: 'Test command 1',
        setup: vi.fn()
      }
      const handler2: CommandHandler = {
        name: 'test',
        description: 'Test command 2',
        setup: vi.fn()
      }

      registry.register(handler1)
      registry.register(handler2)
      
      expect(registry.get('test')).toBe(handler2)
    })
  })

  describe('unregister', () => {
    it('should unregister a command', () => {
      const handler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        setup: vi.fn()
      }

      registry.register(handler)
      expect(registry.has('test')).toBe(true)

      const result = registry.unregister('test')
      expect(result).toBe(true)
      expect(registry.has('test')).toBe(false)
    })

    it('should return false when unregistering non-existent command', () => {
      const result = registry.unregister('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('get', () => {
    it('should get a registered command', () => {
      const handler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        setup: vi.fn()
      }

      registry.register(handler)
      const retrieved = registry.get('test')
      expect(retrieved).toBe(handler)
    })

    it('should return undefined for non-existent command', () => {
      const retrieved = registry.get('nonexistent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('should return all registered commands', () => {
      const handler1: CommandHandler = {
        name: 'test1',
        description: 'Test command 1',
        setup: vi.fn()
      }
      const handler2: CommandHandler = {
        name: 'test2',
        description: 'Test command 2',
        setup: vi.fn()
      }

      registry.register(handler1)
      registry.register(handler2)

      const all = registry.getAll()
      expect(all).toHaveLength(2)
      expect(all).toContain(handler1)
      expect(all).toContain(handler2)
    })

    it('should return empty array when no commands registered', () => {
      const all = registry.getAll()
      expect(all).toHaveLength(0)
    })
  })

  describe('has', () => {
    it('should return true for registered command', () => {
      const handler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        setup: vi.fn()
      }

      registry.register(handler)
      expect(registry.has('test')).toBe(true)
    })

    it('should return false for non-existent command', () => {
      expect(registry.has('nonexistent')).toBe(false)
    })
  })

  describe('setupCLI', () => {
    it('should call setup for all registered commands', () => {
      const mockCLI = {} as CAC
      
      const handler1: CommandHandler = {
        name: 'test1',
        description: 'Test command 1',
        setup: vi.fn()
      }
      const handler2: CommandHandler = {
        name: 'test2',
        description: 'Test command 2',
        setup: vi.fn()
      }

      registry.register(handler1)
      registry.register(handler2)
      registry.setupCLI(mockCLI)

      expect(handler1.setup).toHaveBeenCalledWith(mockCLI)
      expect(handler2.setup).toHaveBeenCalledWith(mockCLI)
    })

    it('should handle setup errors gracefully', () => {
      const mockCLI = {} as CAC
      
      const handler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        setup: vi.fn(() => {
          throw new Error('Setup failed')
        })
      }

      registry.register(handler)
      
      // Should not throw
      expect(() => registry.setupCLI(mockCLI)).not.toThrow()
    })
  })

  describe('clear', () => {
    it('should clear all registered commands', () => {
      const handler1: CommandHandler = {
        name: 'test1',
        description: 'Test command 1',
        setup: vi.fn()
      }
      const handler2: CommandHandler = {
        name: 'test2',
        description: 'Test command 2',
        setup: vi.fn()
      }

      registry.register(handler1)
      registry.register(handler2)
      expect(registry.getAll()).toHaveLength(2)

      registry.clear()
      expect(registry.getAll()).toHaveLength(0)
    })
  })
})
