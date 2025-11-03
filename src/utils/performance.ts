/**
 * Performance monitoring and profiling utilities
 */

import { performance } from 'perf_hooks'
import { logger } from '@ldesign/shared'

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  memory?: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  metadata?: Record<string, any>
}

/**
 * Performance profiler
 */
export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private enabled: boolean

  constructor(enabled = false) {
    this.enabled = enabled
  }

  /**
   * Start tracking a metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    const metric: PerformanceMetrics = {
      name,
      startTime: performance.now(),
      metadata
    }

    this.metrics.set(name, metric)
  }

  /**
   * End tracking a metric
   */
  end(name: string): PerformanceMetrics | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      logger.warn(`Performance metric not found: ${name}`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    // Capture memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      metric.memory = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      }
    }

    return metric
  }

  /**
   * Get a metric
   */
  get(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name)
  }

  /**
   * Get all metrics
   */
  getAll(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Enable profiling
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * Disable profiling
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`
    if (ms < 1000) return `${ms.toFixed(2)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  /**
   * Format memory for display
   */
  private formatMemory(bytes: number): string {
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(2)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(2)} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  /**
   * Print summary
   */
  printSummary(): void {
    if (!this.enabled) return

    const metrics = this.getAll()
    if (metrics.length === 0) {
      logger.info('No performance metrics recorded')
      return
    }

    logger.info('\n📊 Performance Summary:')
    logger.info('─'.repeat(60))

    for (const metric of metrics) {
      if (metric.duration === undefined) continue

      logger.info(`\n${metric.name}:`)
      logger.info(`  Duration: ${this.formatDuration(metric.duration)}`)

      if (metric.memory) {
        logger.info(`  Memory: ${this.formatMemory(metric.memory.heapUsed)} / ${this.formatMemory(metric.memory.heapTotal)}`)
      }

      if (metric.metadata) {
        logger.info(`  Metadata:`, metric.metadata)
      }
    }

    logger.info('\n' + '─'.repeat(60))
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.getAll(), null, 2)
  }
}

/**
 * Global profiler instance
 */
let globalProfiler: PerformanceProfiler | null = null

/**
 * Get global profiler
 */
export function getProfiler(enabled?: boolean): PerformanceProfiler {
  if (!globalProfiler) {
    globalProfiler = new PerformanceProfiler(enabled)
  } else if (enabled !== undefined) {
    if (enabled) {
      globalProfiler.enable()
    } else {
      globalProfiler.disable()
    }
  }
  return globalProfiler
}

/**
 * Measure function execution time
 */
export async function measure<T>(
  name: string,
  fn: () => T | Promise<T>,
  profiler?: PerformanceProfiler
): Promise<T> {
  const prof = profiler || getProfiler()
  
  prof.start(name)
  try {
    const result = await fn()
    prof.end(name)
    return result
  } catch (error) {
    prof.end(name)
    throw error
  }
}

/**
 * Decorator for measuring method performance
 */
export function measureMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const profiler = getProfiler()
    const name = `${target.constructor.name}.${propertyKey}`
    
    profiler.start(name)
    try {
      const result = await originalMethod.apply(this, args)
      profiler.end(name)
      return result
    } catch (error) {
      profiler.end(name)
      throw error
    }
  }

  return descriptor
}

/**
 * Create a performance checkpoint
 */
export function checkpoint(name: string, metadata?: Record<string, any>): void {
  const profiler = getProfiler()
  if (!profiler.isEnabled()) return

  profiler.start(name, {
    ...metadata,
    timestamp: Date.now(),
    type: 'checkpoint'
  })
  profiler.end(name)
}

/**
 * Benchmark a function
 */
export async function benchmark(
  name: string,
  fn: () => any | Promise<any>,
  iterations = 100
): Promise<{
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  ops: number
}> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0)
  const averageTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const ops = 1000 / averageTime // operations per second

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    ops
  }
}
