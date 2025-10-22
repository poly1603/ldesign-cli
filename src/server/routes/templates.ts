/**
 * 模板管理 API 路由
 */

import { Router, type IRouter } from 'express'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  incrementDownloadCount,
  setStarCount,
  getTemplateStats,
  type ProjectTemplate
} from '../database/templates.js'
import {
  createProjectFromTemplate,
  saveProjectAsTemplate,
  readTemplateConfig,
  validateTemplateVariables,
  type CreateFromTemplateOptions
} from '../services/template-manager.js'
import { logger } from '../../utils/logger.js'
import { addProject } from '../database/adapters.js'

const templatesRouter: IRouter = Router()
const templateLogger = logger.withPrefix('TemplatesAPI')

/**
 * 获取所有模板
 * GET /api/templates
 */
templatesRouter.get('/', (req, res) => {
  try {
    const { category, search } = req.query

    let templates: ProjectTemplate[]

    if (search && typeof search === 'string') {
      templates = searchTemplates(search)
    }
    else if (category && typeof category === 'string') {
      templates = getTemplatesByCategory(category)
    }
    else {
      templates = getAllTemplates()
    }

    res.json({
      success: true,
      data: templates
    })
  }
  catch (error) {
    templateLogger.error('获取模板列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 根据 ID 获取模板
 * GET /api/templates/:id
 */
templatesRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const template = getTemplateById(id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      })
    }

    res.json({
      success: true,
      data: template
    })
  }
  catch (error) {
    templateLogger.error('获取模板详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取模板统计信息
 * GET /api/templates/stats/summary
 */
templatesRouter.get('/stats/summary', (req, res) => {
  try {
    const stats = getTemplateStats()

    res.json({
      success: true,
      data: stats
    })
  }
  catch (error) {
    templateLogger.error('获取模板统计信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模板统计信息失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 添加模板
 * POST /api/templates
 */
templatesRouter.post('/', async (req, res) => {
  try {
    const templateData = req.body

    // 验证必填字段
    if (!templateData.name || !templateData.category) {
      return res.status(400).json({
        success: false,
        message: '模板名称和分类是必填的'
      })
    }

    // 验证源
    if (!templateData.gitUrl && !templateData.localPath) {
      return res.status(400).json({
        success: false,
        message: '必须提供 Git URL 或本地路径'
      })
    }

    // 如果提供了本地路径，验证路径是否存在
    if (templateData.localPath && !existsSync(templateData.localPath)) {
      return res.status(400).json({
        success: false,
        message: '本地路径不存在'
      })
    }

    // 如果提供了本地路径，尝试读取模板配置
    if (templateData.localPath) {
      const config = await readTemplateConfig(templateData.localPath)
      if (config && config.variables) {
        templateData.variables = config.variables
      }
    }

    const template = addTemplate(templateData)

    res.json({
      success: true,
      data: template,
      message: '模板添加成功'
    })
  }
  catch (error) {
    templateLogger.error('添加模板失败:', error)
    res.status(500).json({
      success: false,
      message: '添加模板失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 更新模板
 * PUT /api/templates/:id
 */
templatesRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // 检查模板是否存在
    const template = getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      })
    }

    const success = updateTemplate(id, updates)

    if (success) {
      const updatedTemplate = getTemplateById(id)
      res.json({
        success: true,
        data: updatedTemplate,
        message: '模板更新成功'
      })
    }
    else {
      res.status(400).json({
        success: false,
        message: '模板更新失败'
      })
    }
  }
  catch (error) {
    templateLogger.error('更新模板失败:', error)
    res.status(500).json({
      success: false,
      message: '更新模板失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 删除模板
 * DELETE /api/templates/:id
 */
templatesRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params

    // 检查模板是否存在
    const template = getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      })
    }

    const success = deleteTemplate(id)

    if (success) {
      res.json({
        success: true,
        message: '模板删除成功'
      })
    }
    else {
      res.status(400).json({
        success: false,
        message: '模板删除失败'
      })
    }
  }
  catch (error) {
    templateLogger.error('删除模板失败:', error)
    res.status(500).json({
      success: false,
      message: '删除模板失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 从模板创建项目
 * POST /api/templates/:id/create-project
 */
templatesRouter.post('/:id/create-project', async (req, res) => {
  try {
    const { id } = req.params
    const { projectName, targetPath, variables } = req.body

    // 验证必填字段
    if (!projectName || !targetPath) {
      return res.status(400).json({
        success: false,
        message: '项目名称和目标路径是必填的'
      })
    }

    // 获取模板
    const template = getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      })
    }

    // 验证变量
    if (template.variables && template.variables.length > 0) {
      const validation = validateTemplateVariables(template.variables, variables || {})
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: '变量验证失败',
          errors: validation.errors
        })
      }
    }

    // 确保目标路径不存在
    const fullTargetPath = resolve(targetPath)
    if (existsSync(fullTargetPath)) {
      return res.status(400).json({
        success: false,
        message: '目标路径已存在'
      })
    }

    // 创建项目
    const result = await createProjectFromTemplate(template, {
      templateId: id,
      targetPath: fullTargetPath,
      projectName,
      variables
    })

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || '创建项目失败'
      })
    }

    // 增加下载次数
    incrementDownloadCount(id)

    // 将项目添加到项目列表
    try {
      const project = addProject({
        name: projectName,
        path: fullTargetPath,
        type: 'web',
        framework: template.category,
        description: template.description
      })

      res.json({
        success: true,
        message: '项目创建成功',
        data: {
          projectPath: result.projectPath,
          project
        }
      })
    }
    catch (projectError) {
      // 项目创建成功，但添加到列表失败，仍然返回成功
      templateLogger.warn('项目创建成功，但添加到列表失败:', projectError)
      res.json({
        success: true,
        message: '项目创建成功',
        data: {
          projectPath: result.projectPath
        }
      })
    }
  }
  catch (error) {
    templateLogger.error('从模板创建项目失败:', error)
    res.status(500).json({
      success: false,
      message: '从模板创建项目失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 将项目保存为模板
 * POST /api/templates/save-from-project
 */
templatesRouter.post('/save-from-project', async (req, res) => {
  try {
    const { projectPath, templateName, category, description, variables } = req.body

    // 验证必填字段
    if (!projectPath || !templateName || !category) {
      return res.status(400).json({
        success: false,
        message: '项目路径、模板名称和分类是必填的'
      })
    }

    // 验证项目路径是否存在
    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    // 创建模板存储目录
    const templatesDir = join(homedir(), '.ldesign-cli', 'templates')
    const templatePath = join(templatesDir, `${templateName}-${Date.now()}`)

    // 保存模板
    const result = await saveProjectAsTemplate(
      projectPath,
      templatePath,
      variables
    )

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || '保存模板失败'
      })
    }

    // 添加模板记录
    const template = addTemplate({
      name: templateName,
      category,
      description,
      localPath: templatePath,
      variables,
      isOfficial: false
    })

    res.json({
      success: true,
      message: '模板保存成功',
      data: template
    })
  }
  catch (error) {
    templateLogger.error('保存模板失败:', error)
    res.status(500).json({
      success: false,
      message: '保存模板失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 设置模板星标
 * POST /api/templates/:id/star
 */
templatesRouter.post('/:id/star', (req, res) => {
  try {
    const { id } = req.params
    const { count } = req.body

    // 检查模板是否存在
    const template = getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      })
    }

    const success = setStarCount(id, count || (template.starCount || 0) + 1)

    if (success) {
      const updatedTemplate = getTemplateById(id)
      res.json({
        success: true,
        data: updatedTemplate,
        message: '星标设置成功'
      })
    }
    else {
      res.status(400).json({
        success: false,
        message: '星标设置失败'
      })
    }
  }
  catch (error) {
    templateLogger.error('设置星标失败:', error)
    res.status(500).json({
      success: false,
      message: '设置星标失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { templatesRouter }


