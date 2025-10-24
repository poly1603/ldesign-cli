/**
 * 请求日志中间件
 */

import type { Request, Response, NextFunction } from 'express'
import { logger } from '../../shared/utils'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - start
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`

    if (res.statusCode >= 500) {
      logger.error(message)
    } else if (res.statusCode >= 400) {
      logger.warn(message)
    } else {
      logger.info(message)
    }
  })

  next()
}


