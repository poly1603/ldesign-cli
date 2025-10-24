/**
 * 数据库管理器
 * 使用 better-sqlite3
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { logger } from '../../shared/utils'
import { DatabaseError } from '../../shared/utils/errors'
import { DB_FILE_NAME } from '../../shared/constants'

export interface DatabaseConfig {
  dbPath?: string
  verbose?: boolean
  readonly?: boolean
  fileMustExist?: boolean
}

export class DatabaseManager {
  private db: Database.Database | null = null
  private config: DatabaseConfig
  private dbPath: string

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      verbose: config.verbose ?? false,
      readonly: config.readonly ?? false,
      fileMustExist: config.fileMustExist ?? false,
      ...config,
    }

    this.dbPath = config.dbPath || this.getDefaultDbPath()
  }

  /**
   * 获取默认数据库路径
   */
  private getDefaultDbPath(): string {
    const dataDir = join(process.cwd(), 'data')

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    return join(dataDir, DB_FILE_NAME)
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      logger.debug(`初始化数据库: ${this.dbPath}`)

      this.db = new Database(this.dbPath, {
        verbose: this.config.verbose ? ((msg?: unknown) => logger.debug(String(msg || ''))) : undefined,
        readonly: this.config.readonly,
        fileMustExist: this.config.fileMustExist,
      })

      // 性能优化配置
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('temp_store = MEMORY')
      this.db.pragma('mmap_size = 30000000000')
      this.db.pragma('page_size = 4096')
      this.db.pragma('cache_size = -2000')
      this.db.pragma('foreign_keys = ON')

      // 创建表结构
      await this.createTables()

      logger.info('数据库初始化成功')
    } catch (error) {
      logger.error('数据库初始化失败:', error)
      throw new DatabaseError('数据库初始化失败', error as Error)
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('数据库未初始化')
    }

    // 项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        framework TEXT,
        package_manager TEXT,
        node_version TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_opened_at INTEGER,
        metadata TEXT
      )
    `)

    // 项目操作记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_operations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT,
        error TEXT,
        duration INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 项目统计表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_stats (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        build_count INTEGER DEFAULT 0,
        test_count INTEGER DEFAULT 0,
        deploy_count INTEGER DEFAULT 0,
        last_build_time INTEGER,
        last_test_time INTEGER,
        last_deploy_time INTEGER,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 工具配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_configs (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL UNIQUE,
        config TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        updated_at INTEGER NOT NULL
      )
    `)

    // 构建记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS build_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        status TEXT NOT NULL,
        config TEXT,
        result TEXT,
        logs TEXT,
        started_at INTEGER,
        completed_at INTEGER,
        duration INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 测试记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        test_type TEXT,
        status TEXT NOT NULL,
        total_tests INTEGER,
        passed_tests INTEGER,
        failed_tests INTEGER,
        coverage REAL,
        result TEXT,
        logs TEXT,
        duration INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 部署记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deployment_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        environment TEXT NOT NULL,
        platform TEXT NOT NULL,
        strategy TEXT,
        status TEXT NOT NULL,
        config TEXT,
        result TEXT,
        logs TEXT,
        started_at INTEGER,
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 文档记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documentation_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        output_format TEXT,
        output_path TEXT,
        status TEXT NOT NULL,
        config TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 安全扫描表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS security_scans (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        scan_type TEXT NOT NULL,
        status TEXT NOT NULL,
        total_issues INTEGER,
        critical_issues INTEGER,
        high_issues INTEGER,
        medium_issues INTEGER,
        low_issues INTEGER,
        result TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 监控数据表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS monitor_data (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        tags TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 工作流记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        current_step INTEGER,
        steps TEXT NOT NULL,
        variables TEXT,
        started_at INTEGER,
        completed_at INTEGER,
        error TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 项目模板表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        tags TEXT,
        git_url TEXT,
        local_path TEXT,
        version TEXT,
        author TEXT,
        icon TEXT,
        variables TEXT,
        is_official INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        star_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // 插件表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        author TEXT,
        status TEXT NOT NULL,
        config TEXT,
        installed_at INTEGER NOT NULL,
        activated_at INTEGER,
        error TEXT
      )
    `)

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_last_opened_at ON projects(last_opened_at DESC);
      CREATE INDEX IF NOT EXISTS idx_project_operations_project_id ON project_operations(project_id);
      CREATE INDEX IF NOT EXISTS idx_build_records_project_id ON build_records(project_id);
      CREATE INDEX IF NOT EXISTS idx_build_records_created_at ON build_records(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_test_records_project_id ON test_records(project_id);
      CREATE INDEX IF NOT EXISTS idx_deployment_records_project_id ON deployment_records(project_id);
      CREATE INDEX IF NOT EXISTS idx_monitor_data_project_timestamp ON monitor_data(project_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_workflow_records_project_status ON workflow_records(project_id, status);
    `)

    logger.debug('数据库表创建成功')
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new DatabaseError('数据库未初始化，请先调用 initialize()')
    }
    return this.db
  }

  /**
   * 执行事务
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getDatabase()
    const transaction = db.transaction(fn)
    return transaction(db)
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      logger.info('数据库已关闭')
    }
  }

  /**
   * 备份数据库
   */
  async backup(backupPath?: string): Promise<string> {
    const db = this.getDatabase()
    const targetPath = backupPath || `${this.dbPath}.backup-${Date.now()}`

    try {
      await db.backup(targetPath)
      logger.info(`数据库备份成功: ${targetPath}`)
      return targetPath
    } catch (error) {
      throw new DatabaseError('数据库备份失败', error as Error)
    }
  }

  /**
   * 优化数据库
   */
  optimize(): void {
    const db = this.getDatabase()
    db.pragma('optimize')
    db.exec('VACUUM')
    logger.info('数据库优化完成')
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): {
    size: number
    pageCount: number
    pageSize: number
    tables: Array<{ name: string; rowCount: number }>
  } {
    const db = this.getDatabase()

    const pageCount = db.pragma('page_count', { simple: true }) as number
    const pageSize = db.pragma('page_size', { simple: true }) as number
    const size = pageCount * pageSize

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
      .all() as Array<{ name: string }>

    const tablesWithCount = tables.map(({ name }) => {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get() as { count: number }
      return {
        name,
        rowCount: result.count,
      }
    })

    return {
      size,
      pageCount,
      pageSize,
      tables: tablesWithCount,
    }
  }

  /**
   * 检查数据库完整性
   */
  checkIntegrity(): boolean {
    const db = this.getDatabase()
    const result = db.pragma('integrity_check', { simple: true })
    return result === 'ok'
  }
}

// 导出单例
let instance: DatabaseManager | null = null

export function getDatabaseManager(config?: DatabaseConfig): DatabaseManager {
  if (!instance) {
    instance = new DatabaseManager(config)
  }
  return instance
}

export function closeDatabaseManager(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}

