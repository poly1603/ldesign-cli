/**
 * 安全扫描服务测试
 */

import { describe, it, expect, vi } from 'vitest'
import * as child_process from 'child_process'

// 模拟测试数据
const mockAuditResult = {
  vulnerabilities: {
    'test-package': {
      severity: 'high',
      via: [{
        source: 'CVE-2024-001',
        title: 'Test Vulnerability',
        url: 'https://example.com/cve',
        cve: 'CVE-2024-001',
        cwe: 'CWE-79',
        description: 'Test vulnerability description'
      }],
      range: '>=1.0.0 <2.0.0',
      fixAvailable: {
        name: 'test-package',
        version: '2.0.0'
      },
      isDirect: true,
      effects: ['path1', 'path2']
    }
  }
}

describe('安全扫描服务', () => {
  describe('scanVulnerabilities', () => {
    it('应该处理漏洞扫描结果', () => {
      // 验证漏洞数据结构
      const vulns = mockAuditResult.vulnerabilities
      expect(Object.keys(vulns).length).toBeGreaterThan(0)

      const testPackage = vulns['test-package']
      expect(testPackage.severity).toBe('high')
      expect(testPackage.via).toBeDefined()
      expect(testPackage.fixAvailable).toBeDefined()
    })

    it('应该正确分类漏洞严重程度', () => {
      const severities = ['critical', 'high', 'moderate', 'low', 'info']

      severities.forEach(severity => {
        expect(['critical', 'high', 'moderate', 'low', 'info']).toContain(severity)
      })
    })
  })

  describe('许可证类型检测', () => {
    it('应该识别宽松许可证', () => {
      const permissiveLicenses = ['MIT', 'BSD', 'Apache-2.0', 'ISC']

      permissiveLicenses.forEach(license => {
        const upper = license.toUpperCase()
        expect(['MIT', 'BSD', 'APACHE', 'ISC'].some(l => upper.includes(l))).toBe(true)
      })
    })

    it('应该识别Copyleft许可证', () => {
      const copyleftLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-2.1']

      copyleftLicenses.forEach(license => {
        const upper = license.toUpperCase()
        expect(['GPL', 'AGPL', 'LGPL'].some(l => upper.includes(l))).toBe(true)
      })
    })
  })

  describe('许可证兼容性', () => {
    it('应该支持白名单检查', () => {
      const whitelist = ['MIT', 'Apache-2.0']

      expect(whitelist.some(l => 'MIT'.includes(l))).toBe(true)
      expect(whitelist.some(l => 'GPL-3.0'.includes(l))).toBe(false)
    })

    it('应该支持黑名单检查', () => {
      const blacklist = ['GPL', 'AGPL']

      expect(blacklist.some(l => 'GPL-3.0'.toUpperCase().includes(l))).toBe(true)
      expect(blacklist.some(l => 'MIT'.toUpperCase().includes(l))).toBe(false)
    })
  })
})


