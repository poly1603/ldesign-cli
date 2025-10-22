/**
 * Git API 路由
 */

import { Router, type IRouter } from 'express'
import { existsSync } from 'fs'
import {
  isGitRepository,
  initGitRepository,
  getGitStatus,
  getCommitHistory,
  getBranches,
  createBranch,
  checkoutBranch,
  deleteBranch,
  stageFiles,
  commit,
  push,
  pull,
  getDiff,
  generateCommitMessage
} from '../services/git-service.js'
import { logger } from '../../utils/logger.js'

const gitRouter: IRouter = Router()
const gitLogger = logger.withPrefix('GitAPI')

/**
 * 检查是否为 Git 仓库
 * GET /api/git/check/:projectId
 */
gitRouter.get('/check', async (req, res) => {
  try {
    const { projectPath } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    const isRepo = await isGitRepository(projectPath)

    res.json({
      success: true,
      data: { isGitRepository: isRepo }
    })
  }
  catch (error) {
    gitLogger.error('检查 Git 仓库失败:', error)
    res.status(500).json({
      success: false,
      message: '检查 Git 仓库失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 初始化 Git 仓库
 * POST /api/git/init
 */
gitRouter.post('/init', async (req, res) => {
  try {
    const { projectPath } = req.body

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    const result = await initGitRepository(projectPath)

    if (result.success) {
      res.json({
        success: true,
        message: 'Git 仓库初始化成功'
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || 'Git 仓库初始化失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('初始化 Git 仓库失败:', error)
    res.status(500).json({
      success: false,
      message: '初始化 Git 仓库失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取 Git 状态
 * GET /api/git/status
 */
gitRouter.get('/status', async (req, res) => {
  try {
    const { projectPath } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const status = await getGitStatus(projectPath)

    res.json({
      success: true,
      data: status
    })
  }
  catch (error) {
    gitLogger.error('获取 Git 状态失败:', error)
    res.status(500).json({
      success: false,
      message: '获取 Git 状态失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取提交历史
 * GET /api/git/commits
 */
gitRouter.get('/commits', async (req, res) => {
  try {
    const { projectPath, limit } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const limitNum = limit ? parseInt(limit as string) : 50
    const commits = await getCommitHistory(projectPath, limitNum)

    res.json({
      success: true,
      data: commits
    })
  }
  catch (error) {
    gitLogger.error('获取提交历史失败:', error)
    res.status(500).json({
      success: false,
      message: '获取提交历史失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取分支列表
 * GET /api/git/branches
 */
gitRouter.get('/branches', async (req, res) => {
  try {
    const { projectPath } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const branches = await getBranches(projectPath)

    res.json({
      success: true,
      data: branches
    })
  }
  catch (error) {
    gitLogger.error('获取分支列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分支列表失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 创建分支
 * POST /api/git/branches
 */
gitRouter.post('/branches', async (req, res) => {
  try {
    const { projectPath, branchName, checkout } = req.body

    if (!projectPath || !branchName) {
      return res.status(400).json({
        success: false,
        message: '项目路径和分支名称是必填的'
      })
    }

    const result = await createBranch(projectPath, branchName, checkout !== false)

    if (result.success) {
      res.json({
        success: true,
        message: `分支 ${branchName} 创建成功`
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '创建分支失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('创建分支失败:', error)
    res.status(500).json({
      success: false,
      message: '创建分支失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 切换分支
 * POST /api/git/checkout
 */
gitRouter.post('/checkout', async (req, res) => {
  try {
    const { projectPath, branchName } = req.body

    if (!projectPath || !branchName) {
      return res.status(400).json({
        success: false,
        message: '项目路径和分支名称是必填的'
      })
    }

    const result = await checkoutBranch(projectPath, branchName)

    if (result.success) {
      res.json({
        success: true,
        message: `已切换到分支 ${branchName}`
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '切换分支失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('切换分支失败:', error)
    res.status(500).json({
      success: false,
      message: '切换分支失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 删除分支
 * DELETE /api/git/branches
 */
gitRouter.delete('/branches', async (req, res) => {
  try {
    const { projectPath, branchName, force } = req.body

    if (!projectPath || !branchName) {
      return res.status(400).json({
        success: false,
        message: '项目路径和分支名称是必填的'
      })
    }

    const result = await deleteBranch(projectPath, branchName, force || false)

    if (result.success) {
      res.json({
        success: true,
        message: `分支 ${branchName} 已删除`
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '删除分支失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('删除分支失败:', error)
    res.status(500).json({
      success: false,
      message: '删除分支失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 暂存文件
 * POST /api/git/stage
 */
gitRouter.post('/stage', async (req, res) => {
  try {
    const { projectPath, files } = req.body

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const result = await stageFiles(projectPath, files || ['.'])

    if (result.success) {
      res.json({
        success: true,
        message: '文件已暂存'
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '暂存文件失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('暂存文件失败:', error)
    res.status(500).json({
      success: false,
      message: '暂存文件失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 提交更改
 * POST /api/git/commit
 */
gitRouter.post('/commit', async (req, res) => {
  try {
    const { projectPath, message } = req.body

    if (!projectPath || !message) {
      return res.status(400).json({
        success: false,
        message: '项目路径和提交信息是必填的'
      })
    }

    const result = await commit(projectPath, message)

    if (result.success) {
      res.json({
        success: true,
        message: '更改已提交',
        data: { hash: result.hash }
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '提交失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('提交失败:', error)
    res.status(500).json({
      success: false,
      message: '提交失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 推送到远程
 * POST /api/git/push
 */
gitRouter.post('/push', async (req, res) => {
  try {
    const { projectPath, remote, branch, force } = req.body

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const result = await push(projectPath, remote || 'origin', branch, force || false)

    if (result.success) {
      res.json({
        success: true,
        message: '推送成功'
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '推送失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('推送失败:', error)
    res.status(500).json({
      success: false,
      message: '推送失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 从远程拉取
 * POST /api/git/pull
 */
gitRouter.post('/pull', async (req, res) => {
  try {
    const { projectPath, remote, branch } = req.body

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const result = await pull(projectPath, remote || 'origin', branch)

    if (result.success) {
      res.json({
        success: true,
        message: '拉取成功'
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message || '拉取失败'
      })
    }
  }
  catch (error) {
    gitLogger.error('拉取失败:', error)
    res.status(500).json({
      success: false,
      message: '拉取失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取文件差异
 * GET /api/git/diff
 */
gitRouter.get('/diff', async (req, res) => {
  try {
    const { projectPath, file } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const diff = await getDiff(projectPath, file as string | undefined)

    res.json({
      success: true,
      data: { diff }
    })
  }
  catch (error) {
    gitLogger.error('获取差异失败:', error)
    res.status(500).json({
      success: false,
      message: '获取差异失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 生成智能提交信息
 * GET /api/git/generate-commit-message
 */
gitRouter.get('/generate-commit-message', async (req, res) => {
  try {
    const { projectPath } = req.query

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    const message = await generateCommitMessage(projectPath)

    res.json({
      success: true,
      data: { message }
    })
  }
  catch (error) {
    gitLogger.error('生成提交信息失败:', error)
    res.status(500).json({
      success: false,
      message: '生成提交信息失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { gitRouter }


