/**
 * 性能优化工具函数
 * 提供防抖、节流等常用优化方法
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 * 
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 * 
 * @param fn 要节流的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 200
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

/**
 * 请求去重
 * 避免相同的请求在执行中时重复发起
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * 执行请求，如果相同的请求正在执行，则返回现有的 Promise
   * 
   * @param key 请求的唯一标识
   * @param fn 请求函数
   * @returns Promise
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // 如果请求已经在执行中，返回现有的 Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    // 创建新的请求
    const promise = fn().finally(() => {
      // 请求完成后移除
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * 清除所有待处理的请求
   */
  clear() {
    this.pendingRequests.clear()
  }

  /**
   * 获取待处理请求数量
   */
  get pendingCount(): number {
    return this.pendingRequests.size
  }
}

/**
 * LRU 缓存
 * 最近最少使用缓存策略
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 将访问的项移到最后（最近使用）
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 如果键已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果缓存已满，删除最旧的项（第一个）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    // 添加新项到最后
    this.cache.set(key, value)
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }
}

/**
 * 创建带缓存的函数
 * 
 * @param fn 要缓存的函数
 * @param ttl 缓存过期时间（毫秒），默认5分钟
 * @param maxSize 最大缓存数量
 * @returns 带缓存的函数
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 5 * 60 * 1000,
  maxSize: number = 100
): T {
  const cache = new Map<string, { value: any; expireAt: number }>()

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    const now = Date.now()

    // 检查缓存
    const cached = cache.get(key)
    if (cached && cached.expireAt > now) {
      return cached.value
    }

    // 执行函数
    const result = fn.apply(this, args)

    // 缓存结果
    if (cache.size >= maxSize) {
      // 删除第一个项
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    cache.set(key, {
      value: result,
      expireAt: now + ttl
    })

    return result
  } as T
}

/**
 * 延迟执行
 * 
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 请求重试
 * 
 * @param fn 要重试的函数
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns Promise
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (i < maxRetries) {
        await delay(retryDelay * (i + 1)) // 指数退避
      }
    }
  }

  throw lastError
}

/**
 * 批量执行任务（限制并发数）
 * 
 * @param tasks 任务数组
 * @param concurrency 最大并发数
 * @returns Promise数组
 */
export async function batchExecute<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result)
    })

    executing.push(promise as any)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise as any), 1)
    }
  }

  await Promise.all(executing)
  return results
}


