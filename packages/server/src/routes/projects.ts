/**
 * 项目管理 API 路由
 */

import { Router } from 'express'
import type { Request, Response, Router as ExpressRouter } from 'express'
import { getDatabaseManager } from '../core/database/index.js'
import { ProjectRepository } from '../core/database/ProjectRepository.js'
import { ProjectManager } from '../core/project/index.js'
import type { ApiResponse } from '@ldesign/cli-shared/types.js'
import { logger } from '@ldesign/cli-shared/utils.js'

export const projectsRouter: ExpressRouter = Router()

// 创建项目管理器实例（懒加载）
let projectManager: ProjectManager | null = null

function getProjectManager(): ProjectManager {
  if (!projectManager) {
    const db = getDatabaseManager().getDatabase()
    const projectRepo = new ProjectRepository(db)
    projectManager = new ProjectManager(projectRepo)
  }
  return projectManager
}

/**
 * GET /api/projects
 * 获取所有项目
 */
projectsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, offset, keyword } = req.query

    const pm = getProjectManager()
    let projects

    if (keyword && typeof keyword === 'string') {
      projects = pm.searchProjects(keyword)
    } else {
      projects = pm.getAllProjects({
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      })
    }

    const response: ApiResponse = {
      success: true,
      data: projects,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error('[API] 获取项目列表失败:', error)
    throw error
  }
})

/**
 * GET /api/projects/:id
 * 获取项目详情
 */
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const pm = getProjectManager()
    const project = pm.getProject(id)

    const response: ApiResponse = {
      success: true,
      data: project,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 获取项目详情失败: ${req.params.id}`, error)
    throw error
  }
})

/**
 * POST /api/projects/import
 * 导入项目
 */
projectsRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const { path, detect = true } = req.body

    if (!path) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: path',
        timestamp: Date.now(),
      })
    }

    const pm = getProjectManager()
    const project = await pm.importProject({ path, detect })

    const response: ApiResponse = {
      success: true,
      data: project,
      message: '项目导入成功',
      timestamp: Date.now(),
    }

    res.status(201).json(response)
  } catch (error) {
    logger.error('[API] 导入项目失败:', error)
    throw error
  }
})

/**
 * POST /api/projects/create
 * 创建项目
 */
projectsRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const options = req.body

    if (!options.name || !options.path) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: name, path',
        timestamp: Date.now(),
      })
    }

    const pm = getProjectManager()
    const project = await pm.createProject(options)

    const response: ApiResponse = {
      success: true,
      data: project,
      message: '项目创建成功',
      timestamp: Date.now(),
    }

    res.status(201).json(response)
  } catch (error) {
    logger.error('[API] 创建项目失败:', error)
    throw error
  }
})

/**
 * PUT /api/projects/:id
 * 更新项目
 */
projectsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const pm = getProjectManager()
    const project = pm.updateProject(id, updates)

    const response: ApiResponse = {
      success: true,
      data: project,
      message: '项目更新成功',
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 更新项目失败: ${req.params.id}`, error)
    throw error
  }
})

/**
 * DELETE /api/projects/:id
 * 删除项目
 */
projectsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const pm = getProjectManager()
    const deleted = pm.deleteProject(id)

    const response: ApiResponse = {
      success: deleted,
      message: deleted ? '项目删除成功' : '项目未找到',
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 删除项目失败: ${req.params.id}`, error)
    throw error
  }
})

/**
 * POST /api/projects/:id/open
 * 打开项目（更新最后打开时间）
 */
projectsRouter.post('/:id/open', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const pm = getProjectManager()
    pm.openProject(id)

    const response: ApiResponse = {
      success: true,
      message: '项目已打开',
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 打开项目失败: ${req.params.id}`, error)
    throw error
  }
})

/**
 * GET /api/projects/:id/stats
 * 获取项目统计
 */
projectsRouter.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const pm = getProjectManager()
    const stats = pm.getProjectStats(id)

    const response: ApiResponse = {
      success: true,
      data: stats,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 获取项目统计失败: ${req.params.id}`, error)
    throw error
  }
})

/**
 * GET /api/projects/:id/operations
 * 获取项目操作历史
 */
projectsRouter.get('/:id/operations', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { limit } = req.query

    const pm = getProjectManager()
    const operations = pm.getProjectOperations(
      id,
      limit ? parseInt(limit as string) : undefined
    )

    const response: ApiResponse = {
      success: true,
      data: operations,
      timestamp: Date.now(),
    }

    res.json(response)
  } catch (error) {
    logger.error(`[API] 获取项目操作历史失败: ${req.params.id}`, error)
    throw error
  }
})

