/**
 * 统一错误类型体系
 * 提供规范化的错误处理
 */

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR = 1000,
  VALIDATION_ERROR = 1001,
  NOT_FOUND = 1002,
  ALREADY_EXISTS = 1003,
  PERMISSION_DENIED = 1004,
  TIMEOUT = 1005,

  // 数据库错误 (2xxx)
  DATABASE_ERROR = 2000,
  DATABASE_CONNECTION_ERROR = 2001,
  DATABASE_QUERY_ERROR = 2002,
  DATABASE_MIGRATION_ERROR = 2003,

  // 文件系统错误 (3xxx)
  FILE_NOT_FOUND = 3000,
  FILE_READ_ERROR = 3001,
  FILE_WRITE_ERROR = 3002,
  DIRECTORY_NOT_FOUND = 3003,
  DIRECTORY_CREATE_ERROR = 3004,

  // Git 错误 (4xxx)
  GIT_NOT_REPOSITORY = 4000,
  GIT_COMMAND_ERROR = 4001,
  GIT_CONFLICT = 4002,
  GIT_REMOTE_ERROR = 4003,

  // 网络错误 (5xxx)
  NETWORK_ERROR = 5000,
  HTTP_ERROR = 5001,
  WEBSOCKET_ERROR = 5002,
  API_ERROR = 5003,

  // 进程错误 (6xxx)
  PROCESS_ERROR = 6000,
  PROCESS_START_ERROR = 6001,
  PROCESS_STOP_ERROR = 6002,
  PROCESS_TIMEOUT = 6003,

  // 安全错误 (7xxx)
  SECURITY_SCAN_ERROR = 7000,
  VULNERABILITY_FIX_ERROR = 7001,
  LICENSE_COMPLIANCE_ERROR = 7002,

  // 模板错误 (8xxx)
  TEMPLATE_NOT_FOUND = 8000,
  TEMPLATE_INVALID = 8001,
  TEMPLATE_CREATE_ERROR = 8002,
  TEMPLATE_VARIABLE_ERROR = 8003
}

/**
 * 基础错误类
 */
export class BaseError extends Error {
  public readonly code: ErrorCode
  public readonly timestamp: number
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.timestamp = Date.now()
    this.context = context

    // 保持正确的原型链
    Object.setPrototypeOf(this, new.target.prototype)

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * 转换为 JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    }
  }

  /**
   * 转换为简化的 JSON（隐藏堆栈）
   */
  toSimpleJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context
    }
  }
}

/**
 * 验证错误
 */
export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, context)
  }
}

/**
 * 未找到错误
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} (${id}) 未找到` : `${resource} 未找到`,
      ErrorCode.NOT_FOUND,
      { resource, id }
    )
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, context)
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends BaseError {
  constructor(message: string, code: ErrorCode, path?: string) {
    super(message, code, { path })
  }
}

/**
 * Git 错误
 */
export class GitError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.GIT_COMMAND_ERROR, context?: Record<string, any>) {
    super(message, code, context)
  }
}

/**
 * 网络错误
 */
export class NetworkError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR, context?: Record<string, any>) {
    super(message, code, context)
  }
}

/**
 * 进程错误
 */
export class ProcessError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.PROCESS_ERROR, context?: Record<string, any>) {
    super(message, code, context)
  }
}

/**
 * 安全扫描错误
 */
export class SecurityError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.SECURITY_SCAN_ERROR, context?: Record<string, any>) {
    super(message, code, context)
  }
}

/**
 * 模板错误
 */
export class TemplateError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.TEMPLATE_INVALID, context?: Record<string, any>) {
    super(message, code, context)
  }
}

/**
 * 错误处理辅助函数
 */
export class ErrorHandler {
  /**
   * 包装异步函数，自动捕获错误
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    errorMessage: string = '操作失败'
  ): Promise<{ success: true; data: T } | { success: false; error: BaseError }> {
    try {
      const data = await fn()
      return { success: true, data }
    }
    catch (error) {
      if (error instanceof BaseError) {
        return { success: false, error }
      }
      return {
        success: false,
        error: new BaseError(
          error instanceof Error ? error.message : errorMessage,
          ErrorCode.UNKNOWN_ERROR
        )
      }
    }
  }

  /**
   * 将未知错误转换为 BaseError
   */
  static normalize(error: unknown): BaseError {
    if (error instanceof BaseError) {
      return error
    }

    if (error instanceof Error) {
      return new BaseError(error.message, ErrorCode.UNKNOWN_ERROR)
    }

    return new BaseError(String(error), ErrorCode.UNKNOWN_ERROR)
  }

  /**
   * 判断是否为特定类型的错误
   */
  static is<T extends BaseError>(error: unknown, errorClass: new (...args: any[]) => T): error is T {
    return error instanceof errorClass
  }
}

/**
 * 重试包装器（带指数退避）
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 如果不应该重试或已达最大次数，抛出错误
      if (!shouldRetry(lastError) || attempt >= maxRetries) {
        throw lastError
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('未知错误')
}


