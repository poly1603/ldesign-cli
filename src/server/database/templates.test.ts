/**
 * 模板数据库操作测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
  getTemplateStats
} from './templates'

describe('模板数据库操作', () => {
  let testTemplateId: string

  beforeEach(() => {
    // 添加测试模板
    const template = addTemplate({
      name: '测试模板',
      description: '这是一个测试模板',
      category: 'vue',
      tags: ['vue3', 'typescript', 'test'],
      gitUrl: 'https://github.com/test/repo',
      version: '1.0.0',
      author: 'Test Author',
      icon: '🧪',
      isOfficial: false
    })
    testTemplateId = template.id
  })

  afterEach(() => {
    // 清理测试数据
    if (testTemplateId) {
      deleteTemplate(testTemplateId)
    }
  })

  describe('getAllTemplates', () => {
    it('应该返回所有模板', () => {
      const templates = getAllTemplates()

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
    })

    it('应该按创建时间降序排列', () => {
      const templates = getAllTemplates()

      for (let i = 1; i < templates.length; i++) {
        expect(templates[i - 1].createdAt).toBeGreaterThanOrEqual(templates[i].createdAt)
      }
    })
  })

  describe('getTemplateById', () => {
    it('应该返回指定ID的模板', () => {
      const template = getTemplateById(testTemplateId)

      expect(template).toBeTruthy()
      expect(template?.id).toBe(testTemplateId)
      expect(template?.name).toBe('测试模板')
    })

    it('应该在模板不存在时返回null', () => {
      const template = getTemplateById('non-existent-id')

      expect(template).toBeNull()
    })
  })

  describe('getTemplatesByCategory', () => {
    it('应该返回指定分类的模板', () => {
      const templates = getTemplatesByCategory('vue')

      expect(Array.isArray(templates)).toBe(true)
      templates.forEach(template => {
        expect(template.category).toBe('vue')
      })
    })

    it('应该在没有匹配模板时返回空数组', () => {
      const templates = getTemplatesByCategory('non-existent-category')

      expect(templates).toEqual([])
    })
  })

  describe('searchTemplates', () => {
    it('应该搜索模板名称', () => {
      const templates = searchTemplates('测试')

      expect(templates.length).toBeGreaterThan(0)
      expect(templates.some(t => t.name.includes('测试'))).toBe(true)
    })

    it('应该搜索模板描述', () => {
      const templates = searchTemplates('测试模板')

      expect(templates.length).toBeGreaterThan(0)
    })

    it('应该在没有匹配时返回空数组', () => {
      const templates = searchTemplates('xyzabc123456')

      expect(templates).toEqual([])
    })
  })

  describe('addTemplate', () => {
    it('应该添加新模板', () => {
      const template = addTemplate({
        name: '新测试模板',
        category: 'react',
        gitUrl: 'https://github.com/test/new-repo'
      })

      expect(template.id).toBeTruthy()
      expect(template.name).toBe('新测试模板')
      expect(template.category).toBe('react')
      expect(template.createdAt).toBeGreaterThan(0)
      expect(template.updatedAt).toBeGreaterThan(0)

      // 清理
      deleteTemplate(template.id)
    })
  })

  describe('updateTemplate', () => {
    it('应该更新模板', () => {
      const success = updateTemplate(testTemplateId, {
        name: '更新后的名称',
        description: '更新后的描述'
      })

      expect(success).toBe(true)

      const updated = getTemplateById(testTemplateId)
      expect(updated?.name).toBe('更新后的名称')
      expect(updated?.description).toBe('更新后的描述')
    })

    it('应该在模板不存在时返回false', () => {
      const success = updateTemplate('non-existent-id', {
        name: '新名称'
      })

      expect(success).toBe(false)
    })
  })

  describe('deleteTemplate', () => {
    it('应该删除模板', () => {
      const template = addTemplate({
        name: '待删除模板',
        category: 'test'
      })

      const success = deleteTemplate(template.id)

      expect(success).toBe(true)

      const deleted = getTemplateById(template.id)
      expect(deleted).toBeNull()
    })
  })

  describe('incrementDownloadCount', () => {
    it('应该增加下载次数', () => {
      const before = getTemplateById(testTemplateId)
      const beforeCount = before?.downloadCount || 0

      incrementDownloadCount(testTemplateId)

      const after = getTemplateById(testTemplateId)
      const afterCount = after?.downloadCount || 0

      expect(afterCount).toBe(beforeCount + 1)
    })
  })

  describe('setStarCount', () => {
    it('应该设置星标数', () => {
      setStarCount(testTemplateId, 42)

      const template = getTemplateById(testTemplateId)

      expect(template?.starCount).toBe(42)
    })
  })

  describe('getTemplateStats', () => {
    it('应该返回模板统计信息', () => {
      const stats = getTemplateStats()

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('byCategory')
      expect(stats).toHaveProperty('official')
      expect(stats).toHaveProperty('community')

      expect(stats.total).toBeGreaterThan(0)
      expect(typeof stats.byCategory).toBe('object')
    })

    it('应该正确统计官方和社区模板', () => {
      const stats = getTemplateStats()

      expect(stats.total).toBe(stats.official + stats.community)
    })
  })
})


