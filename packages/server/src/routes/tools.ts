/**
 * 工具管理 API 路由
 */

import { Router } from 'express'
import type { Request, Response, Router as ExpressRouter } from 'express'
import { getToolManager } from '../core/tool-manager/index.js'
import type { ApiResponse, ToolName } from '@ldesign/cli-shared/types.js'
import { logger } from '@ldesign/cli-shared/utils.js'

export const toolsRouter: ExpressRouter = Router()

/**
 * GET /api/tools
 * 获取所有工具状态
 */
toolsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tm = getToolManager()
    const allStatus = tm.getAllToolStatus()
    const allMetadata = tm.getAllToolMetadata()

    const tools = allStatus.map((item) => ({
      ...item,
      metadata: allMetadata[item.name],
    }))

    const response: ApiResponse = {
      success: true,
      data: tools,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error('[API] 获取工具列表失败:', error)
    throw error
  }
})

/**
 * GET /api/tools/:name/status
 * 获取工具状态
 */
toolsRouter.get('/:name/status', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as ToolName
    const tm = getToolManager()
    const status = tm.getToolStatus(name)

    const response: ApiResponse = {
      success: true,
      data: { name, status },
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 获取工具状态失败: ${req.params.name}`, error)
    throw error
  }
})

/**
 * GET /api/tools/:name/config
 * 获取工具配置
 */
toolsRouter.get('/:name/config', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as ToolName
    const tm = getToolManager()
    const config = tm.getToolConfig(name)

    const response: ApiResponse = {
      success: true,
      data: config,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 获取工具配置失败: ${req.params.name}`, error)
    throw error
  }
})

/**
 * PUT /api/tools/:name/config
 * 更新工具配置
 */
toolsRouter.put('/:name/config', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as ToolName
    const config = req.body

    const tm = getToolManager()
    await tm.updateToolConfig(name, config)

    const response: ApiResponse = {
      success: true,
      message: '配置更新成功',
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 更新工具配置失败: ${req.params.name}`, error)
    throw error
  }
})

/**
 * POST /api/tools/:name/execute
 * 执行工具操作
 */
toolsRouter.post('/:name/execute', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as ToolName
    const { action, params = {} } = req.body

    if (!action) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: action',
        timestamp: Date.now(),
      })
    }

    const tm = getToolManager()
    const result = await tm.executeTool(name, action, params)

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 执行工具操作失败: ${req.params.name}`, error)
    throw error
  }
})

/**
 * POST /api/tools/:name/load
 * 加载工具
 */
toolsRouter.post('/:name/load', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as ToolName
    const tm = getToolManager()

    await tm.loadTool(name)

    const response: ApiResponse = {
      success: true,
      message: '工具加载成功',
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 加载工具失败: ${req.params.name}`, error)
    throw error
  }
})

