/**
 * 性能工具函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  debounce,
  throttle,
  RequestDeduplicator,
  LRUCache,
  memoize,
  delay,
  retry,
  batchExecute
} from './performance'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该延迟执行函数', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该在连续调用时只执行最后一次', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该传递正确的参数', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn('test', 123)
    vi.advanceTimersByTime(300)

    expect(fn).toHaveBeenCalledWith('test', 123)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该限制函数执行频率', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 200)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('RequestDeduplicator', () => {
  it('应该去重相同的请求', async () => {
    const dedup = new RequestDeduplicator()
    const fn = vi.fn(async () => 'result')

    const [result1, result2, result3] = await Promise.all([
      dedup.execute('key1', fn),
      dedup.execute('key1', fn),
      dedup.execute('key1', fn)
    ])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(result1).toBe('result')
    expect(result2).toBe('result')
    expect(result3).toBe('result')
  })

  it('应该允许不同键的请求并发执行', async () => {
    const dedup = new RequestDeduplicator()
    const fn1 = vi.fn(async () => 'result1')
    const fn2 = vi.fn(async () => 'result2')

    const [result1, result2] = await Promise.all([
      dedup.execute('key1', fn1),
      dedup.execute('key2', fn2)
    ])

    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(result1).toBe('result1')
    expect(result2).toBe('result2')
  })

  it('应该在请求完成后允许再次执行', async () => {
    const dedup = new RequestDeduplicator()
    const fn = vi.fn(async () => 'result')

    await dedup.execute('key1', fn)
    await dedup.execute('key1', fn)

    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('LRUCache', () => {
  it('应该正确存储和获取值', () => {
    const cache = new LRUCache<string, number>(3)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('应该在超过容量时删除最旧的项', () => {
    const cache = new LRUCache<string, number>(2)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('应该在访问时更新项的位置', () => {
    const cache = new LRUCache<string, number>(2)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // 访问 a，使其成为最近使用
    cache.set('c', 3)

    expect(cache.get('a')).toBe(1) // a 应该还在
    expect(cache.get('b')).toBeUndefined() // b 应该被删除
    expect(cache.get('c')).toBe(3)
  })

  it('应该正确报告大小', () => {
    const cache = new LRUCache<string, number>(10)

    expect(cache.size).toBe(0)

    cache.set('a', 1)
    cache.set('b', 2)

    expect(cache.size).toBe(2)

    cache.delete('a')

    expect(cache.size).toBe(1)

    cache.clear()

    expect(cache.size).toBe(0)
  })
})

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该延迟指定的时间', async () => {
    const promise = delay(1000)

    vi.advanceTimersByTime(999)
    // Promise 还未 resolve

    vi.advanceTimersByTime(1)
    await promise // 现在应该 resolve 了
  })
})

describe('retry', () => {
  it('应该在函数成功时返回结果', async () => {
    const fn = vi.fn(async () => 'success')

    const result = await retry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该重试失败的函数', async () => {
    let attempts = 0
    const fn = vi.fn(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Failed')
      }
      return 'success'
    })

    const result = await retry(fn, 3, 100)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('应该在达到最大重试次数后抛出错误', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Always fails')
    })

    await expect(retry(fn, 2, 100)).rejects.toThrow('Always fails')
    expect(fn).toHaveBeenCalledTimes(3) // 初始 + 2次重试
  })
})

describe('batchExecute', () => {
  it('应该执行所有任务', async () => {
    const tasks = [
      async () => 1,
      async () => 2,
      async () => 3
    ]

    const results = await batchExecute(tasks, 2)

    expect(results).toEqual([1, 2, 3])
  })

  it('应该限制并发数', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    const createTask = (value: number) => async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await delay(10)
      concurrent--
      return value
    }

    const tasks = Array.from({ length: 10 }, (_, i) => createTask(i))

    await batchExecute(tasks, 3)

    expect(maxConcurrent).toBeLessThanOrEqual(3)
  })
})

describe('memoize', () => {
  it('应该缓存函数结果', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoizedFn = memoize(fn, 60000)

    expect(memoizedFn(5)).toBe(10)
    expect(memoizedFn(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该为不同参数分别缓存', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoizedFn = memoize(fn, 60000)

    expect(memoizedFn(5)).toBe(10)
    expect(memoizedFn(10)).toBe(20)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})


