/**
 * 项目数据仓库
 */

import type Database from 'better-sqlite3'
import type { Project, ProjectOperation, ProjectStats } from '@ldesign/cli-shared/types.js'
import { generateId, safeJsonParse, safeJsonStringify } from '@ldesign/cli-shared/utils.js'
import { ProjectNotFoundError, ProjectAlreadyExistsError } from '@ldesign/cli-shared/utils/errors.js'

export class ProjectRepository {
  constructor(private db: Database.Database) { }

  /**
   * 创建项目
   */
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = Date.now()
    const id = generateId('proj')

    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now,
    }

    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, name, path, type, framework, package_manager, node_version,
        description, created_at, updated_at, last_opened_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    try {
      stmt.run(
        newProject.id,
        newProject.name,
        newProject.path,
        newProject.type,
        newProject.framework || null,
        newProject.packageManager || null,
        newProject.nodeVersion || null,
        newProject.description || null,
        newProject.createdAt,
        newProject.updatedAt,
        newProject.lastOpenedAt || null,
        safeJsonStringify(newProject.metadata)
      )

      // 创建对应的统计记录
      this.createStats(newProject.id)

      return newProject
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new ProjectAlreadyExistsError(project.path)
      }
      throw error
    }
  }

  /**
   * 根据ID查找项目
   */
  findById(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?')
    const row = stmt.get(id) as any

    return row ? this.mapRowToProject(row) : null
  }

  /**
   * 根据路径查找项目
   */
  findByPath(path: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE path = ?')
    const row = stmt.get(path) as any

    return row ? this.mapRowToProject(row) : null
  }

  /**
   * 获取所有项目
   */
  findAll(options: { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Project[] {
    const { limit, offset, sortBy = 'updated_at', sortOrder = 'desc' } = options

    let sql = `SELECT * FROM projects ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`

    if (limit) {
      sql += ` LIMIT ${limit}`
      if (offset) {
        sql += ` OFFSET ${offset}`
      }
    }

    const stmt = this.db.prepare(sql)
    const rows = stmt.all() as any[]

    return rows.map((row) => this.mapRowToProject(row))
  }

  /**
   * 搜索项目
   */
  search(keyword: string): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects
      WHERE name LIKE ? OR path LIKE ? OR description LIKE ?
      ORDER BY updated_at DESC
    `)

    const pattern = `%${keyword}%`
    const rows = stmt.all(pattern, pattern, pattern) as any[]

    return rows.map((row) => this.mapRowToProject(row))
  }

  /**
   * 更新项目
   */
  update(id: string, updates: Partial<Project>): Project {
    const existing = this.findById(id)
    if (!existing) {
      throw new ProjectNotFoundError(id)
    }

    const now = Date.now()
    const updated: Project = {
      ...existing,
      ...updates,
      id: existing.id, // 不允许修改ID
      createdAt: existing.createdAt, // 不允许修改创建时间
      updatedAt: now,
    }

    const stmt = this.db.prepare(`
      UPDATE projects SET
        name = ?, path = ?, type = ?, framework = ?,
        package_manager = ?, node_version = ?, description = ?,
        updated_at = ?, last_opened_at = ?, metadata = ?
      WHERE id = ?
    `)

    stmt.run(
      updated.name,
      updated.path,
      updated.type,
      updated.framework || null,
      updated.packageManager || null,
      updated.nodeVersion || null,
      updated.description || null,
      updated.updatedAt,
      updated.lastOpenedAt || null,
      safeJsonStringify(updated.metadata),
      id
    )

    return updated
  }

  /**
   * 删除项目
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * 更新最后打开时间
   */
  updateLastOpenedAt(id: string): void {
    const stmt = this.db.prepare('UPDATE projects SET last_opened_at = ?, updated_at = ? WHERE id = ?')
    const now = Date.now()
    stmt.run(now, now, id)
  }

  /**
   * 获取项目数量
   */
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM projects')
    const result = stmt.get() as { count: number }
    return result.count
  }

  /**
   * 创建项目统计记录
   */
  private createStats(projectId: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO project_stats (id, project_id, updated_at)
      VALUES (?, ?, ?)
    `)

    stmt.run(generateId('stats'), projectId, Date.now())
  }

  /**
   * 获取项目统计
   */
  getStats(projectId: string): ProjectStats | null {
    const stmt = this.db.prepare('SELECT * FROM project_stats WHERE project_id = ?')
    const row = stmt.get(projectId) as any

    if (!row) {
      return null
    }

    return {
      id: row.id,
      projectId: row.project_id,
      buildCount: row.build_count || 0,
      testCount: row.test_count || 0,
      deployCount: row.deploy_count || 0,
      lastBuildTime: row.last_build_time || undefined,
      lastTestTime: row.last_test_time || undefined,
      lastDeployTime: row.last_deploy_time || undefined,
      updatedAt: row.updated_at,
    }
  }

  /**
   * 添加项目操作记录
   */
  addOperation(operation: Omit<ProjectOperation, 'id' | 'createdAt'>): ProjectOperation {
    const id = generateId('op')
    const createdAt = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO project_operations (
        id, project_id, operation_type, tool_name, status, result, error, duration, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      operation.projectId,
      operation.operationType,
      operation.toolName,
      operation.status,
      safeJsonStringify(operation.result),
      operation.error || null,
      operation.duration || null,
      createdAt
    )

    return {
      ...operation,
      id,
      createdAt,
    }
  }

  /**
   * 获取项目操作记录
   */
  getOperations(projectId: string, limit: number = 50): ProjectOperation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM project_operations
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)

    const rows = stmt.all(projectId, limit) as any[]

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      operationType: row.operation_type,
      toolName: row.tool_name,
      status: row.status,
      result: safeJsonParse(row.result),
      error: row.error || undefined,
      duration: row.duration || undefined,
      createdAt: row.created_at,
    }))
  }

  /**
   * 将数据库行映射为项目对象
   */
  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      type: row.type,
      framework: row.framework || undefined,
      packageManager: row.package_manager || undefined,
      nodeVersion: row.node_version || undefined,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastOpenedAt: row.last_opened_at || undefined,
      metadata: safeJsonParse(row.metadata),
    }
  }
}


