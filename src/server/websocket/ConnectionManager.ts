/**
 * WebSocket 连接管理器
 */

import type { WebSocket } from 'ws'
import type { WSMessage } from '../../shared/types'
import { logger } from '../../shared/utils'

export class ConnectionManager {
  private connections: Set<WebSocket> = new Set()

  /**
   * 添加连接
   */
  addConnection(ws: WebSocket): void {
    this.connections.add(ws)
    logger.debug(`[WebSocket] 新连接已建立，当前连接数: ${this.connections.size}`)

    // 监听连接关闭
    ws.on('close', () => {
      this.removeConnection(ws)
    })
  }

  /**
   * 移除连接
   */
  removeConnection(ws: WebSocket): void {
    this.connections.delete(ws)
    logger.debug(`[WebSocket] 连接已关闭，当前连接数: ${this.connections.size}`)
  }

  /**
   * 广播消息到所有连接
   */
  broadcast<T = any>(message: WSMessage<T>): void {
    const payload = JSON.stringify(message)

    this.connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload)
      }
    })

    logger.debug(`[WebSocket] 广播消息: ${message.type}`)
  }

  /**
   * 发送消息到特定连接
   */
  send<T = any>(ws: WebSocket, message: WSMessage<T>): void {
    if (ws.readyState === ws.OPEN) {
      const payload = JSON.stringify(message)
      ws.send(payload)
      logger.debug(`[WebSocket] 发送消息: ${message.type}`)
    }
  }

  /**
   * 获取连接数
   */
  getConnectionCount(): number {
    return this.connections.size
  }

  /**
   * 关闭所有连接
   */
  closeAll(): void {
    this.connections.forEach((ws) => {
      ws.close()
    })
    this.connections.clear()
    logger.info('[WebSocket] 所有连接已关闭')
  }
}


