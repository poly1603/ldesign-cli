/**
 * WebSocket 模块
 */

import type { WebSocketServer, WebSocket } from 'ws'
import type { WSMessage } from '../../shared/types'
import { ConnectionManager } from './ConnectionManager'
import { logger, safeJsonParse } from '../../shared/utils'

export { ConnectionManager }

// 全局连接管理器
let connectionManager: ConnectionManager | null = null

export function getConnectionManager(): ConnectionManager {
  if (!connectionManager) {
    connectionManager = new ConnectionManager()
  }
  return connectionManager
}

/**
 * 设置 WebSocket 服务器
 */
export function setupWebSocket(wss: WebSocketServer): void {
  const manager = getConnectionManager()

  logger.info('[WebSocket] 初始化 WebSocket 服务器')

  wss.on('connection', (ws: WebSocket) => {
    logger.info('[WebSocket] 客户端已连接')

    // 添加到连接管理器
    manager.addConnection(ws)

    // 发送欢迎消息
    manager.send(ws, {
      type: 'server-status',
      data: {
        status: 'connected',
        message: '连接成功',
      },
      timestamp: Date.now(),
    })

    // 处理消息
    ws.on('message', (data: Buffer) => {
      try {
        const message = safeJsonParse<WSMessage>(data.toString())

        if (!message) {
          logger.warn('[WebSocket] 无效的消息格式')
          return
        }

        logger.debug(`[WebSocket] 收到消息: ${message.type}`)

        // 处理 ping/pong
        if (message.type === 'ping') {
          manager.send(ws, {
            type: 'pong',
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
          })
        }

        // 其他消息类型的处理可以在这里添加
      } catch (error) {
        logger.error('[WebSocket] 处理消息失败:', error)
      }
    })

    // 处理错误
    ws.on('error', (error) => {
      logger.error('[WebSocket] 连接错误:', error)
    })

    // 处理关闭
    ws.on('close', () => {
      logger.info('[WebSocket] 客户端已断开')
    })
  })

  logger.info('[WebSocket] WebSocket 服务器已启动')
}


