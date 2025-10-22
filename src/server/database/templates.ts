/**
 * 项目模板数据库操作
 * 提供模板的增删改查功能
 */

import { randomBytes } from 'crypto'
import { getDatabaseManager } from './DatabaseManager.js'

/**
 * 项目模板接口
 */
export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  category: string
  tags?: string[]
  gitUrl?: string
  localPath?: string
  version?: string
  author?: string
  icon?: string
  variables?: TemplateVariable[]
  isOfficial?: boolean
  downloadCount?: number
  starCount?: number
  createdAt: number
  updatedAt: number
}

/**
 * 模板变量接口
 */
export interface TemplateVariable {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select'
  defaultValue?: any
  options?: string[]
  required?: boolean
  description?: string
}

/**
 * 数据库模板记录接口
 */
interface TemplateRecord {
  id: string
  name: string
  description: string | null
  category: string
  tags: string | null
  git_url: string | null
  local_path: string | null
  version: string | null
  author: string | null
  icon: string | null
  variables: string | null
  is_official: number
  download_count: number
  star_count: number
  created_at: number
  updated_at: number
}

/**
 * 转换数据库记录为模板对象
 */
function recordToTemplate(record: TemplateRecord): ProjectTemplate {
  return {
    id: record.id,
    name: record.name,
    description: record.description || undefined,
    category: record.category,
    tags: record.tags ? JSON.parse(record.tags) : undefined,
    gitUrl: record.git_url || undefined,
    localPath: record.local_path || undefined,
    version: record.version || undefined,
    author: record.author || undefined,
    icon: record.icon || undefined,
    variables: record.variables ? JSON.parse(record.variables) : undefined,
    isOfficial: record.is_official === 1,
    downloadCount: record.download_count,
    starCount: record.star_count,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  }
}

/**
 * 转换模板对象为数据库记录
 */
function templateToRecord(template: Partial<ProjectTemplate>): Partial<TemplateRecord> {
  const record: Partial<TemplateRecord> = {
    name: template.name,
    description: template.description || null,
    category: template.category || '',
    tags: template.tags ? JSON.stringify(template.tags) : null,
    git_url: template.gitUrl || null,
    local_path: template.localPath || null,
    version: template.version || null,
    author: template.author || null,
    icon: template.icon || null,
    variables: template.variables ? JSON.stringify(template.variables) : null,
    is_official: template.isOfficial ? 1 : 0,
    download_count: template.downloadCount || 0,
    star_count: template.starCount || 0
  }
  return record
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `tpl_${randomBytes(16).toString('hex')}`
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): ProjectTemplate[] {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const records = db.prepare('SELECT * FROM project_templates ORDER BY created_at DESC').all() as TemplateRecord[]
  return records.map(recordToTemplate)
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): ProjectTemplate | null {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const record = db.prepare('SELECT * FROM project_templates WHERE id = ?').get(id) as TemplateRecord | undefined
  return record ? recordToTemplate(record) : null
}

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const records = db.prepare('SELECT * FROM project_templates WHERE category = ? ORDER BY created_at DESC').all(category) as TemplateRecord[]
  return records.map(recordToTemplate)
}

/**
 * 搜索模板
 */
export function searchTemplates(keyword: string): ProjectTemplate[] {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const searchPattern = `%${keyword}%`
  const records = db.prepare(`
    SELECT * FROM project_templates 
    WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
    ORDER BY created_at DESC
  `).all(searchPattern, searchPattern, searchPattern) as TemplateRecord[]
  return records.map(recordToTemplate)
}

/**
 * 添加模板
 */
export function addTemplate(template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>): ProjectTemplate {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const now = Date.now()
  const id = generateId()

  const record = templateToRecord(template)

  db.prepare(`
    INSERT INTO project_templates (
      id, name, description, category, tags, git_url, local_path, version, 
      author, icon, variables, is_official, download_count, star_count, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.name,
    record.description,
    record.category,
    record.tags,
    record.git_url,
    record.local_path,
    record.version,
    record.author,
    record.icon,
    record.variables,
    record.is_official,
    record.download_count,
    record.star_count,
    now,
    now
  )

  return {
    ...template,
    id,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新模板
 */
export function updateTemplate(id: string, updates: Partial<ProjectTemplate>): boolean {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const now = Date.now()

  const record = templateToRecord(updates)
  const fields: string[] = []
  const values: any[] = []

  Object.entries(record).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) {
    return false
  }

  fields.push('updated_at = ?')
  values.push(now)
  values.push(id)

  const result = db.prepare(`
    UPDATE project_templates 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `).run(...values)

  return result.changes > 0
}

/**
 * 删除模板
 */
export function deleteTemplate(id: string): boolean {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const result = db.prepare('DELETE FROM project_templates WHERE id = ?').run(id)
  return result.changes > 0
}

/**
 * 增加下载次数
 */
export function incrementDownloadCount(id: string): boolean {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const result = db.prepare('UPDATE project_templates SET download_count = download_count + 1 WHERE id = ?').run(id)
  return result.changes > 0
}

/**
 * 设置星标数
 */
export function setStarCount(id: string, count: number): boolean {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()
  const result = db.prepare('UPDATE project_templates SET star_count = ? WHERE id = ?').run(count, id)
  return result.changes > 0
}

/**
 * 获取模板统计信息
 */
export function getTemplateStats(): {
  total: number
  byCategory: Record<string, number>
  official: number
  community: number
} {
  const dbManager = getDatabaseManager()
  const db = dbManager.getDatabase()

  const total = (db.prepare('SELECT COUNT(*) as count FROM project_templates').get() as { count: number }).count
  const official = (db.prepare('SELECT COUNT(*) as count FROM project_templates WHERE is_official = 1').get() as { count: number }).count
  const community = total - official

  const categoryRecords = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM project_templates 
    GROUP BY category
  `).all() as Array<{ category: string; count: number }>

  const byCategory: Record<string, number> = {}
  categoryRecords.forEach(record => {
    byCategory[record.category] = record.count
  })

  return {
    total,
    byCategory,
    official,
    community
  }
}

