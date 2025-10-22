/**
 * 安全扫描服务
 * 提供依赖漏洞检测和许可证合规检查
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { logger } from '../../utils/logger.js'

const execAsync = promisify(exec)
const securityLogger = logger.withPrefix('SecurityScanner')

/**
 * 漏洞严重程度
 */
export type VulnerabilitySeverity = 'critical' | 'high' | 'moderate' | 'low' | 'info'

/**
 * 漏洞信息接口
 */
export interface Vulnerability {
  id: string
  title: string
  severity: VulnerabilitySeverity
  packageName: string
  installedVersion: string
  fixedVersion?: string
  cve?: string[]
  cwe?: string[]
  url?: string
  description?: string
  recommendation?: string
  isDirect: boolean
  paths: string[]
}

/**
 * 扫描结果接口
 */
export interface SecurityScanResult {
  totalVulnerabilities: number
  vulnerabilities: Vulnerability[]
  summary: {
    critical: number
    high: number
    moderate: number
    low: number
    info: number
  }
  scannedAt: number
  projectPath: string
}

/**
 * 许可证类型
 */
export interface License {
  name: string
  type: 'permissive' | 'copyleft' | 'proprietary' | 'unknown'
  compatible: boolean
  packageName: string
  version: string
  url?: string
}

/**
 * 许可证扫描结果
 */
export interface LicenseScanResult {
  totalPackages: number
  licenses: License[]
  summary: {
    permissive: number
    copyleft: number
    proprietary: number
    unknown: number
  }
  incompatible: License[]
  scannedAt: number
  projectPath: string
}

/**
 * 扫描项目漏洞（使用 npm audit）
 */
export async function scanVulnerabilities(
  projectPath: string
): Promise<SecurityScanResult> {
  securityLogger.info(`开始扫描项目漏洞: ${projectPath}`)

  try {
    // 检查 package.json 是否存在
    const packageJsonPath = join(projectPath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      throw new Error('项目目录中未找到 package.json')
    }

    // 执行 npm audit
    const { stdout } = await execAsync('npm audit --json', {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }).catch(error => {
      // npm audit 在发现漏洞时会返回非零退出码
      // 但仍然会输出 JSON 结果
      return { stdout: error.stdout || '{}' }
    })

    // 解析结果
    const auditResult = JSON.parse(stdout)
    const vulnerabilities: Vulnerability[] = []

    // 处理 npm audit 结果
    if (auditResult.vulnerabilities) {
      Object.entries(auditResult.vulnerabilities).forEach(([packageName, vulnData]: [string, any]) => {
        const vulnerability: Vulnerability = {
          id: vulnData.via?.[0]?.source || `${packageName}-${Date.now()}`,
          title: vulnData.via?.[0]?.title || vulnData.name || 'Unknown vulnerability',
          severity: vulnData.severity || 'info',
          packageName,
          installedVersion: vulnData.range || 'unknown',
          fixedVersion: vulnData.fixAvailable?.version,
          cve: vulnData.via?.filter((v: any) => typeof v === 'object').map((v: any) => v.cve).filter(Boolean),
          cwe: vulnData.via?.filter((v: any) => typeof v === 'object').map((v: any) => v.cwe).filter(Boolean),
          url: vulnData.via?.[0]?.url,
          description: vulnData.via?.[0]?.description,
          recommendation: vulnData.fixAvailable ?
            `升级到 ${vulnData.fixAvailable.name}@${vulnData.fixAvailable.version}` :
            '暂无修复版本',
          isDirect: vulnData.isDirect || false,
          paths: vulnData.effects || []
        }
        vulnerabilities.push(vulnerability)
      })
    }

    // 统计漏洞数量
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length
    }

    const result: SecurityScanResult = {
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary,
      scannedAt: Date.now(),
      projectPath
    }

    securityLogger.success(`漏洞扫描完成: 发现 ${vulnerabilities.length} 个漏洞`)
    return result
  }
  catch (error) {
    securityLogger.error('漏洞扫描失败:', error)
    throw error
  }
}

/**
 * 扫描许可证（从 package.json 和 node_modules）
 */
export async function scanLicenses(
  projectPath: string,
  whitelist: string[] = [],
  blacklist: string[] = []
): Promise<LicenseScanResult> {
  securityLogger.info(`开始扫描项目许可证: ${projectPath}`)

  try {
    const licenses: License[] = []
    const incompatible: License[] = []

    // 读取 package.json
    const packageJsonPath = join(projectPath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      throw new Error('项目目录中未找到 package.json')
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const dependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    }

    // 扫描每个依赖的许可证
    for (const [packageName, version] of Object.entries(dependencies)) {
      try {
        const depPackageJsonPath = join(projectPath, 'node_modules', packageName, 'package.json')

        if (existsSync(depPackageJsonPath)) {
          const depPackageJson = JSON.parse(readFileSync(depPackageJsonPath, 'utf-8'))
          const licenseName = depPackageJson.license || 'Unknown'
          const licenseType = getLicenseType(licenseName)

          const license: License = {
            name: licenseName,
            type: licenseType,
            compatible: isLicenseCompatible(licenseName, whitelist, blacklist),
            packageName,
            version: depPackageJson.version || version as string,
            url: depPackageJson.homepage || depPackageJson.repository?.url
          }

          licenses.push(license)

          if (!license.compatible) {
            incompatible.push(license)
          }
        }
      }
      catch (error) {
        // 某些包可能没有 package.json 或读取失败，跳过
        securityLogger.warn(`无法读取 ${packageName} 的许可证信息`)
      }
    }

    // 统计许可证类型
    const summary = {
      permissive: licenses.filter(l => l.type === 'permissive').length,
      copyleft: licenses.filter(l => l.type === 'copyleft').length,
      proprietary: licenses.filter(l => l.type === 'proprietary').length,
      unknown: licenses.filter(l => l.type === 'unknown').length
    }

    const result: LicenseScanResult = {
      totalPackages: licenses.length,
      licenses,
      summary,
      incompatible,
      scannedAt: Date.now(),
      projectPath
    }

    securityLogger.success(`许可证扫描完成: 扫描了 ${licenses.length} 个包，发现 ${incompatible.length} 个不兼容许可证`)
    return result
  }
  catch (error) {
    securityLogger.error('许可证扫描失败:', error)
    throw error
  }
}

/**
 * 判断许可证类型
 */
function getLicenseType(licenseName: string): 'permissive' | 'copyleft' | 'proprietary' | 'unknown' {
  const name = licenseName.toUpperCase()

  // 宽松许可证
  const permissiveLicenses = ['MIT', 'BSD', 'APACHE', 'ISC', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', '0BSD', 'UNLICENSE']
  if (permissiveLicenses.some(l => name.includes(l))) {
    return 'permissive'
  }

  // Copyleft 许可证
  const copyleftLicenses = ['GPL', 'AGPL', 'LGPL', 'MPL', 'EPL', 'CDDL', 'CPL', 'CC-BY-SA']
  if (copyleftLicenses.some(l => name.includes(l))) {
    return 'copyleft'
  }

  // 专有许可证
  const proprietaryLicenses = ['PROPRIETARY', 'COMMERCIAL', 'UNLICENSED']
  if (proprietaryLicenses.some(l => name.includes(l))) {
    return 'proprietary'
  }

  return 'unknown'
}

/**
 * 检查许可证兼容性
 */
function isLicenseCompatible(
  licenseName: string,
  whitelist: string[],
  blacklist: string[]
): boolean {
  const name = licenseName.toUpperCase()

  // 如果在黑名单中，不兼容
  if (blacklist.length > 0 && blacklist.some(l => name.includes(l.toUpperCase()))) {
    return false
  }

  // 如果有白名单且不在白名单中，不兼容
  if (whitelist.length > 0 && !whitelist.some(l => name.includes(l.toUpperCase()))) {
    return false
  }

  return true
}

/**
 * 修复漏洞（自动升级依赖）
 */
export async function fixVulnerabilities(
  projectPath: string,
  force: boolean = false
): Promise<{ success: boolean; message: string; fixed: number }> {
  securityLogger.info(`开始修复漏洞: ${projectPath}`)

  try {
    const command = force ? 'npm audit fix --force' : 'npm audit fix'

    const { stdout, stderr } = await execAsync(command, {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024
    })

    // 解析输出以确定修复了多少漏洞
    const fixedMatch = stdout.match(/fixed (\d+)/)
    const fixed = fixedMatch ? parseInt(fixedMatch[1]) : 0

    securityLogger.success(`修复完成: 修复了 ${fixed} 个漏洞`)

    return {
      success: true,
      message: stdout,
      fixed
    }
  }
  catch (error: any) {
    securityLogger.error('修复漏洞失败:', error)
    return {
      success: false,
      message: error.message || '修复失败',
      fixed: 0
    }
  }
}

/**
 * 获取推荐的许可证白名单
 */
export function getRecommendedWhitelist(): string[] {
  return [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    '0BSD',
    'Unlicense'
  ]
}

/**
 * 获取推荐的许可证黑名单
 */
export function getRecommendedBlacklist(): string[] {
  return [
    'AGPL',
    'GPL-3.0',
    'Proprietary',
    'Commercial',
    'Unlicensed'
  ]
}


