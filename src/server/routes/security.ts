/**
 * 安全扫描 API 路由
 */

import { Router, type IRouter } from 'express'
import { existsSync } from 'fs'
import {
  scanVulnerabilities,
  scanLicenses,
  fixVulnerabilities,
  getRecommendedWhitelist,
  getRecommendedBlacklist,
  type SecurityScanResult,
  type LicenseScanResult
} from '../services/security-scanner.js'
import { logger } from '../../utils/logger.js'

const securityRouter: IRouter = Router()
const securityLogger = logger.withPrefix('SecurityAPI')

// 缓存扫描结果（避免频繁扫描）
const scanCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

/**
 * 扫描项目漏洞
 * POST /api/security/scan-vulnerabilities
 */
securityRouter.post('/scan-vulnerabilities', async (req, res) => {
  try {
    const { projectPath, forceRefresh } = req.body

    // 验证必填字段
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    // 验证路径是否存在
    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    // 检查缓存
    const cacheKey = `vuln:${projectPath}`
    const cached = scanCache.get(cacheKey)
    const now = Date.now()

    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
      securityLogger.info('使用缓存的漏洞扫描结果')
      return res.json({
        success: true,
        data: cached.result,
        fromCache: true
      })
    }

    // 执行扫描
    const result = await scanVulnerabilities(projectPath)

    // 缓存结果
    scanCache.set(cacheKey, {
      result,
      timestamp: now
    })

    res.json({
      success: true,
      data: result,
      fromCache: false
    })
  }
  catch (error) {
    securityLogger.error('扫描漏洞失败:', error)
    res.status(500).json({
      success: false,
      message: '扫描漏洞失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 扫描项目许可证
 * POST /api/security/scan-licenses
 */
securityRouter.post('/scan-licenses', async (req, res) => {
  try {
    const { projectPath, whitelist, blacklist, forceRefresh } = req.body

    // 验证必填字段
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    // 验证路径是否存在
    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    // 检查缓存
    const cacheKey = `license:${projectPath}`
    const cached = scanCache.get(cacheKey)
    const now = Date.now()

    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
      securityLogger.info('使用缓存的许可证扫描结果')
      return res.json({
        success: true,
        data: cached.result,
        fromCache: true
      })
    }

    // 执行扫描
    const result = await scanLicenses(
      projectPath,
      whitelist || getRecommendedWhitelist(),
      blacklist || getRecommendedBlacklist()
    )

    // 缓存结果
    scanCache.set(cacheKey, {
      result,
      timestamp: now
    })

    res.json({
      success: true,
      data: result,
      fromCache: false
    })
  }
  catch (error) {
    securityLogger.error('扫描许可证失败:', error)
    res.status(500).json({
      success: false,
      message: '扫描许可证失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 修复漏洞
 * POST /api/security/fix-vulnerabilities
 */
securityRouter.post('/fix-vulnerabilities', async (req, res) => {
  try {
    const { projectPath, force } = req.body

    // 验证必填字段
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: '项目路径是必填的'
      })
    }

    // 验证路径是否存在
    if (!existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: '项目路径不存在'
      })
    }

    // 执行修复
    const result = await fixVulnerabilities(projectPath, force || false)

    // 清除缓存
    scanCache.delete(`vuln:${projectPath}`)

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `成功修复 ${result.fixed} 个漏洞`
      })
    }
    else {
      res.status(500).json({
        success: false,
        message: result.message
      })
    }
  }
  catch (error) {
    securityLogger.error('修复漏洞失败:', error)
    res.status(500).json({
      success: false,
      message: '修复漏洞失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 获取推荐的许可证配置
 * GET /api/security/recommended-licenses
 */
securityRouter.get('/recommended-licenses', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        whitelist: getRecommendedWhitelist(),
        blacklist: getRecommendedBlacklist()
      }
    })
  }
  catch (error) {
    securityLogger.error('获取推荐许可证配置失败:', error)
    res.status(500).json({
      success: false,
      message: '获取推荐许可证配置失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * 清除扫描缓存
 * POST /api/security/clear-cache
 */
securityRouter.post('/clear-cache', (req, res) => {
  try {
    const { projectPath } = req.body

    if (projectPath) {
      // 清除特定项目的缓存
      scanCache.delete(`vuln:${projectPath}`)
      scanCache.delete(`license:${projectPath}`)
    }
    else {
      // 清除所有缓存
      scanCache.clear()
    }

    res.json({
      success: true,
      message: '缓存已清除'
    })
  }
  catch (error) {
    securityLogger.error('清除缓存失败:', error)
    res.status(500).json({
      success: false,
      message: '清除缓存失败',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export { securityRouter }


