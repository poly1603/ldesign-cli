/**
 * 同步 API 路由
 */

import { Router, type IRouter } from 'express'
import { syncService } from '../services/sync-service.js'
import { getAllProjects } from '../database/adapters.js'
import { logger } from '../../utils/logger.js'

const syncRouter: IRouter = Router()
const syncLogger = logger.withPrefix('SyncAPI')

/**
 * 导出配置
 * POST /api/sync/export
 */
syncRouter.post('/export', async (req, res) => {
  try {
    // 获取当前所有数据
    const projects = getAllProjects()
    const npmSources: any[] = [] // TODO: 获取NPM源列表
    const settings = {} // TODO: 获取设置

    const config = await syncService.exportConfig(projects, npmSources, settings)

    res.json({
      success: true,
      data: config,
      message: '配置导出成功'
    })
  }
  catch (error) {
    syncLogger.error('导出配置失败:', error)
    res.status(500).json({
      success: false,
      message: '导出配置失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 导入配置
 * POST /api/sync/import
 */
syncRouter.post('/import', async (req, res) => {
  try {
    const { filePath } = req.body

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径是必填的'
      })
    }

    const config = await syncService.importConfig(filePath)

    res.json({
      success: true,
      data: config,
      message: '配置导入成功'
    })
  }
  catch (error) {
    syncLogger.error('导入配置失败:', error)
    res.status(500).json({
      success: false,
      message: '导入配置失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 生成分享链接
 * POST /api/sync/generate-share-link
 */
syncRouter.post('/generate-share-link', async (req, res) => {
  try {
    const { config } = req.body

    if (!config) {
      return res.status(400).json({
        success: false,
        message: '配置数据是必填的'
      })
    }

    const shareLink = syncService.generateShareLink(config)

    res.json({
      success: true,
      data: { shareLink },
      message: '分享链接已生成'
    })
  }
  catch (error) {
    syncLogger.error('生成分享链接失败:', error)
    res.status(500).json({
      success: false,
      message: '生成分享链接失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 解析分享链接
 * POST /api/sync/parse-share-link
 */
syncRouter.post('/parse-share-link', (req, res) => {
  try {
    const { shareLink } = req.body

    if (!shareLink) {
      return res.status(400).json({
        success: false,
        message: '分享链接是必填的'
      })
    }

    const config = syncService.parseShareLink(shareLink)

    res.json({
      success: true,
      data: config,
      message: '分享链接解析成功'
    })
  }
  catch (error) {
    syncLogger.error('解析分享链接失败:', error)
    res.status(500).json({
      success: false,
      message: '解析分享链接失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 创建配置快照
 * POST /api/sync/snapshots
 */
syncRouter.post('/snapshots', async (req, res) => {
  try {
    const { name, config } = req.body

    if (!name || !config) {
      return res.status(400).json({
        success: false,
        message: '快照名称和配置是必填的'
      })
    }

    const snapshotPath = await syncService.createSnapshot(name, config)

    res.json({
      success: true,
      data: { path: snapshotPath },
      message: '快照创建成功'
    })
  }
  catch (error) {
    syncLogger.error('创建快照失败:', error)
    res.status(500).json({
      success: false,
      message: '创建快照失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 列出所有快照
 * GET /api/sync/snapshots
 */
syncRouter.get('/snapshots', (req, res) => {
  try {
    const snapshots = syncService.listSnapshots()

    res.json({
      success: true,
      data: snapshots
    })
  }
  catch (error) {
    syncLogger.error('列出快照失败:', error)
    res.status(500).json({
      success: false,
      message: '列出快照失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { syncRouter }

