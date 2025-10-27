/**
 * 错误处理中间件
 */

import type { Request, Response, NextFunction } from 'express'
import { logger, isBaseError, createErrorResponse } from '@ldesign/cli-shared/utils.js'

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  // 记录错误
  logger.error('[API Error]', {
    method: req.method,
    url: req.url,
    error: error.message || error,
    stack: error.stack,
  })

  // 如果响应已经发送，则传递给默认错误处理器
  if (res.headersSent) {
    return next(error)
  }

  // 生成错误响应
  const errorResponse = createErrorResponse(error)

  // 确定 HTTP 状态码
  let statusCode = 500

  if (isBaseError(error)) {
    if (error.code === 'NOT_FOUND' || error.code === 'PROJECT_NOT_FOUND') {
      statusCode = 404
    } else if (error.code === 'INVALID_PARAMS') {
      statusCode = 400
    } else if (error.code === 'ALREADY_EXISTS' || error.code === 'PROJECT_ALREADY_EXISTS') {
      statusCode = 409
    }
  }

  res.status(statusCode).json(errorResponse)
}


