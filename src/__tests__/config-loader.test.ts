/**
 * Config loader unit tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mergeConfig, validateConfig } from '../utils/config-loader'
import type { LDesignConfig } from '../types/config'

describe('config-loader', () => {
  describe('mergeConfig', () => {
    it('should merge configs correctly', () => {
      const defaults: LDesignConfig = {
        logLevel: 'info',
        ui: {
          server: {
            port: 3000
          }
        }
      }

      const config1: LDesignConfig = {
        logLevel: 'debug',
        build: {
          mode: 'production'
        }
      }

      const config2: LDesignConfig = {
        ui: {
          web: {
            port: 5173
          }
        }
      }

      const merged = mergeConfig(defaults, config1, config2)

      expect(merged.logLevel).toBe('debug')
      expect(merged.ui?.server?.port).toBe(3000)
      expect(merged.ui?.web?.port).toBe(5173)
      expect(merged.build?.mode).toBe('production')
    })

    it('should handle undefined configs', () => {
      const defaults: LDesignConfig = {
        logLevel: 'info'
      }

      const merged = mergeConfig(defaults, undefined, undefined)
      expect(merged).toEqual(defaults)
    })

    it('should override nested properties', () => {
      const defaults: LDesignConfig = {
        ui: {
          server: {
            port: 3000,
            host: '127.0.0.1'
          }
        }
      }

      const override: LDesignConfig = {
        ui: {
          server: {
            port: 8080
          }
        }
      }

      const merged = mergeConfig(defaults, override)
      expect(merged.ui?.server?.port).toBe(8080)
      // Note: shallow merge means host will be lost
      expect(merged.ui?.server?.host).toBeUndefined()
    })
  })

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const config: LDesignConfig = {
        logLevel: 'info',
        ui: {
          server: {
            port: 3000
          },
          web: {
            port: 5173
          }
        }
      }

      expect(validateConfig(config)).toBe(true)
    })

    it('should reject invalid logLevel', () => {
      const config: LDesignConfig = {
        logLevel: 'invalid' as any
      }

      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid server port', () => {
      const config: LDesignConfig = {
        ui: {
          server: {
            port: 99999
          }
        }
      }

      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid web port', () => {
      const config: LDesignConfig = {
        ui: {
          web: {
            port: -1
          }
        }
      }

      expect(validateConfig(config)).toBe(false)
    })

    it('should accept valid port range', () => {
      const config: LDesignConfig = {
        ui: {
          server: {
            port: 8080
          },
          web: {
            port: 3000
          }
        }
      }

      expect(validateConfig(config)).toBe(true)
    })

    it('should accept empty config', () => {
      const config: LDesignConfig = {}
      expect(validateConfig(config)).toBe(true)
    })
  })
})
