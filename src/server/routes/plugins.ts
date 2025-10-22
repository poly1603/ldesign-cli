/**
 * 插件管理 API 路由
 */

import { Router, type IRouter } from 'express'
import { pluginManager } from '../plugin-system/plugin-manager.js'
import { PluginLoader } from '../plugin-system/plugin-loader.js'
import { logger } from '../../utils/logger.js'
import { homedir } from 'os'
import { join } from 'path'

const pluginsRouter: IRouter = Router()
const pluginLogger = logger.withPrefix('PluginsAPI')

// 插件目录
const PLUGINS_DIR = join(homedir(), '.ldesign-cli', 'plugins')

/**
 * 获取所有插件
 * GET /api/plugins
 */
pluginsRouter.get('/', (req, res) => {
  try {
    const plugins = pluginManager.getAllPlugins()

    res.json({
      success: true,
      data: plugins
    })
  }
  catch (error) {
    pluginLogger.error('获取插件列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取插件列表失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取插件详情
 * GET /api/plugins/:id
 */
pluginsRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const plugin = pluginManager.getPlugin(id)

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: '插件不存在'
      })
    }

    res.json({
      success: true,
      data: plugin
    })
  }
  catch (error) {
    pluginLogger.error('获取插件详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取插件详情失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取插件统计
 * GET /api/plugins/stats/summary
 */
pluginsRouter.get('/stats/summary', (req, res) => {
  try {
    const stats = pluginManager.getStats()

    res.json({
      success: true,
      data: stats
    })
  }
  catch (error) {
    pluginLogger.error('获取插件统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取插件统计失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 激活插件
 * POST /api/plugins/:id/activate
 */
pluginsRouter.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params

    await pluginManager.activatePlugin(id)

    res.json({
      success: true,
      message: '插件已激活'
    })
  }
  catch (error) {
    pluginLogger.error('激活插件失败:', error)
    res.status(500).json({
      success: false,
      message: '激活插件失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 停用插件
 * POST /api/plugins/:id/deactivate
 */
pluginsRouter.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params

    await pluginManager.deactivatePlugin(id)

    res.json({
      success: true,
      message: '插件已停用'
    })
  }
  catch (error) {
    pluginLogger.error('停用插件失败:', error)
    res.status(500).json({
      success: false,
      message: '停用插件失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 卸载插件
 * DELETE /api/plugins/:id
 */
pluginsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await pluginManager.uninstallPlugin(id)

    res.json({
      success: true,
      message: '插件已卸载'
    })
  }
  catch (error) {
    pluginLogger.error('卸载插件失败:', error)
    res.status(500).json({
      success: false,
      message: '卸载插件失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 更新插件配置
 * PUT /api/plugins/:id/config
 */
pluginsRouter.put('/:id/config', async (req, res) => {
  try {
    const { id } = req.params
    const config = req.body

    await pluginManager.updatePluginConfig(id, config)

    res.json({
      success: true,
      message: '配置已更新'
    })
  }
  catch (error) {
    pluginLogger.error('更新插件配置失败:', error)
    res.status(500).json({
      success: false,
      message: '更新插件配置失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 扫描可用插件
 * GET /api/plugins/scan/available
 */
pluginsRouter.get('/scan/available', async (req, res) => {
  try {
    const loader = new PluginLoader({
      pluginsDir: PLUGINS_DIR,
      autoActivate: false
    })

    const plugins = await loader.scanPlugins()

    res.json({
      success: true,
      data: plugins
    })
  }
  catch (error) {
    pluginLogger.error('扫描插件失败:', error)
    res.status(500).json({
      success: false,
      message: '扫描插件失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { pluginsRouter }

