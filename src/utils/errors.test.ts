/**
 * 错误处理测试
 */

import { describe, it, expect } from 'vitest'
import {
  ErrorCode,
  BaseError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  FileSystemError,
  GitError,
  NetworkError,
  ProcessError,
  SecurityError,
  TemplateError,
  ErrorHandler,
  withRetry
} from './errors'

describe('BaseError', () => {
  it('应该创建基础错误', () => {
    const error = new BaseError('测试错误', ErrorCode.UNKNOWN_ERROR)

    expect(error.message).toBe('测试错误')
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR)
    expect(error.timestamp).toBeGreaterThan(0)
  })

  it('应该支持上下文信息', () => {
    const error = new BaseError('测试错误', ErrorCode.UNKNOWN_ERROR, {
      userId: '123',
      action: 'test'
    })

    expect(error.context).toEqual({
      userId: '123',
      action: 'test'
    })
  })

  it('应该正确转换为JSON', () => {
    const error = new BaseError('测试错误', ErrorCode.VALIDATION_ERROR)
    const json = error.toJSON()

    expect(json).toHaveProperty('name')
    expect(json).toHaveProperty('message')
    expect(json).toHaveProperty('code')
    expect(json).toHaveProperty('timestamp')
    expect(json).toHaveProperty('stack')
  })

  it('应该正确转换为简化JSON', () => {
    const error = new BaseError('测试错误', ErrorCode.VALIDATION_ERROR)
    const json = error.toSimpleJSON()

    expect(json).toHaveProperty('name')
    expect(json).toHaveProperty('message')
    expect(json).toHaveProperty('code')
    expect(json).not.toHaveProperty('stack')
  })
})

describe('ValidationError', () => {
  it('应该创建验证错误', () => {
    const error = new ValidationError('字段不能为空')

    expect(error.message).toBe('字段不能为空')
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
  })
})

describe('NotFoundError', () => {
  it('应该创建未找到错误', () => {
    const error = new NotFoundError('项目', '123')

    expect(error.message).toBe('项目 (123) 未找到')
    expect(error.code).toBe(ErrorCode.NOT_FOUND)
    expect(error.context).toEqual({
      resource: '项目',
      id: '123'
    })
  })

  it('应该支持不带ID的资源', () => {
    const error = new NotFoundError('配置文件')

    expect(error.message).toBe('配置文件 未找到')
  })
})

describe('DatabaseError', () => {
  it('应该创建数据库错误', () => {
    const error = new DatabaseError('连接失败')

    expect(error.message).toBe('连接失败')
    expect(error.code).toBe(ErrorCode.DATABASE_ERROR)
  })
})

describe('ErrorHandler', () => {
  it('应该正确包装成功的函数', async () => {
    const fn = async () => 'success'

    const result = await ErrorHandler.wrap(fn)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('success')
    }
  })

  it('应该正确包装失败的函数', async () => {
    const fn = async () => {
      throw new ValidationError('验证失败')
    }

    const result = await ErrorHandler.wrap(fn)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError)
    }
  })

  it('应该规范化未知错误', () => {
    const error1 = ErrorHandler.normalize(new Error('test'))
    expect(error1).toBeInstanceOf(BaseError)

    const error2 = ErrorHandler.normalize('string error')
    expect(error2).toBeInstanceOf(BaseError)

    const error3 = ErrorHandler.normalize(new ValidationError('test'))
    expect(error3).toBeInstanceOf(ValidationError)
  })

  it('应该正确判断错误类型', () => {
    const error1 = new ValidationError('test')
    const error2 = new NotFoundError('resource')

    expect(ErrorHandler.is(error1, ValidationError)).toBe(true)
    expect(ErrorHandler.is(error1, NotFoundError)).toBe(false)
    expect(ErrorHandler.is(error2, NotFoundError)).toBe(true)
  })
})

describe('withRetry', () => {
  it('应该在成功时返回结果', async () => {
    const fn = async () => 'success'

    const result = await withRetry(fn)

    expect(result).toBe('success')
  })

  it('应该重试失败的函数', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 2) {
        throw new Error('Failed')
      }
      return 'success'
    }

    const result = await withRetry(fn, { maxRetries: 2, initialDelay: 10 })

    expect(result).toBe('success')
    expect(attempts).toBe(2)
  })

  it('应该在达到最大重试次数后抛出错误', async () => {
    const fn = async () => {
      throw new Error('Always fails')
    }

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Always fails')
  })

  it('应该支持自定义重试条件', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      throw new Error('Network error')
    }

    const shouldRetry = (error: Error) => {
      return error.message.includes('Network')
    }

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 10, shouldRetry })
    ).rejects.toThrow()

    expect(attempts).toBe(3) // 初始 + 2次重试
  })
})


