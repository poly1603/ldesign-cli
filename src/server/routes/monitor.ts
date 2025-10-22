/**
 * 性能监控 API 路由
 */

import { Router, type IRouter } from 'express'
import { monitorService } from '../services/monitor-service.js'
import { logger } from '../../utils/logger.js'

const monitorRouter: IRouter = Router()
const monitorLogger = logger.withPrefix('MonitorAPI')

/**
 * 获取当前指标
 * GET /api/monitor/current
 */
monitorRouter.get('/current', (req, res) => {
  try {
    const metrics = monitorService.collectMetrics()

    res.json({
      success: true,
      data: metrics
    })
  }
  catch (error) {
    monitorLogger.error('获取当前指标失败:', error)
    res.status(500).json({
      success: false,
      message: '获取当前指标失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取历史指标
 * GET /api/monitor/history
 */
monitorRouter.get('/history', (req, res) => {
  try {
    const { limit } = req.query
    const limitNum = limit ? parseInt(limit as string) : undefined

    const history = monitorService.getHistory(limitNum)

    res.json({
      success: true,
      data: history
    })
  }
  catch (error) {
    monitorLogger.error('获取历史指标失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历史指标失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取统计摘要
 * GET /api/monitor/summary
 */
monitorRouter.get('/summary', (req, res) => {
  try {
    const { duration } = req.query
    const durationMs = duration ? parseInt(duration as string) : 60000

    const summary = monitorService.getSummary(durationMs)

    res.json({
      success: true,
      data: summary
    })
  }
  catch (error) {
    monitorLogger.error('获取统计摘要失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计摘要失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 启动监控
 * POST /api/monitor/start
 */
monitorRouter.post('/start', (req, res) => {
  try {
    const { interval } = req.body
    const intervalMs = interval || 5000

    monitorService.startMonitoring(intervalMs)

    res.json({
      success: true,
      message: '监控已启动'
    })
  }
  catch (error) {
    monitorLogger.error('启动监控失败:', error)
    res.status(500).json({
      success: false,
      message: '启动监控失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 停止监控
 * POST /api/monitor/stop
 */
monitorRouter.post('/stop', (req, res) => {
  try {
    monitorService.stopMonitoring()

    res.json({
      success: true,
      message: '监控已停止'
    })
  }
  catch (error) {
    monitorLogger.error('停止监控失败:', error)
    res.status(500).json({
      success: false,
      message: '停止监控失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 重置统计数据
 * POST /api/monitor/reset
 */
monitorRouter.post('/reset', (req, res) => {
  try {
    monitorService.resetStats()
    monitorService.clearHistory()

    res.json({
      success: true,
      message: '统计数据已重置'
    })
  }
  catch (error) {
    monitorLogger.error('重置统计数据失败:', error)
    res.status(500).json({
      success: false,
      message: '重置统计数据失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { monitorRouter }


