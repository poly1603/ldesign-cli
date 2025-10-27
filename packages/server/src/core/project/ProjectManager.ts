/**
 * 项目管理器
 */

import { existsSync, statSync } from 'fs'
import { join, basename } from 'path'
import { readFileSync } from 'fs'
import type {
  Project,
  ProjectDetectionResult,
  CreateProjectOptions,
  ImportProjectOptions,
  ProjectType,
  FrameworkType,
  PackageManager,
} from '@ldesign/cli-shared/types.js'
import { ProjectRepository } from '../database'
import { logger, safeJsonParse } from '@ldesign/cli-shared/utils.js'
import { ProjectNotFoundError, InvalidParamsError } from '@ldesign/cli-shared/utils/errors.js'

export class ProjectManager {
  constructor(private projectRepo: ProjectRepository) { }

  /**
   * 导入项目
   */
  async importProject(options: ImportProjectOptions): Promise<Project> {
    const { path, detect = true } = options

    // 验证路径
    if (!existsSync(path)) {
      throw new InvalidParamsError(`路径不存在: ${path}`)
    }

    const stats = statSync(path)
    if (!stats.isDirectory()) {
      throw new InvalidParamsError(`路径不是目录: ${path}`)
    }

    // 检查是否已存在
    const existing = this.projectRepo.findByPath(path)
    if (existing) {
      logger.info(`项目已存在: ${existing.name}`)
      return existing
    }

    // 检测项目信息
    let detectionResult: ProjectDetectionResult | null = null
    if (detect) {
      detectionResult = await this.detectProject(path)
    }

    // 创建项目记录
    const name = basename(path)
    const project = this.projectRepo.create({
      name,
      path,
      type: detectionResult?.type || 'unknown',
      framework: detectionResult?.framework || undefined,
      packageManager: detectionResult?.packageManager || undefined,
      metadata: detectionResult
        ? {
          hasGit: detectionResult.hasGit,
          hasTypeScript: detectionResult.hasTypeScript,
          buildTool: detectionResult.buildTool as any,
        }
        : undefined,
    })

    logger.success(`项目导入成功: ${project.name}`)

    return project
  }

  /**
   * 创建项目
   */
  async createProject(options: CreateProjectOptions): Promise<Project> {
    const { name, path, template, framework, packageManager, typescript, git } = options

    // 验证路径
    if (existsSync(path)) {
      throw new InvalidParamsError(`路径已存在: ${path}`)
    }

    // TODO: 实现项目创建逻辑
    // 1. 从模板创建
    // 2. 初始化项目结构
    // 3. 安装依赖

    // 暂时创建一个基础记录
    const project = this.projectRepo.create({
      name,
      path,
      type: this.getProjectTypeFromFramework(framework),
      framework,
      packageManager,
      metadata: {
        typescript,
        git: { hasRepo: git || false },
      },
    })

    logger.success(`项目创建成功: ${project.name}`)

    return project
  }

  /**
   * 检测项目信息
   */
  async detectProject(projectPath: string): Promise<ProjectDetectionResult> {
    logger.debug(`检测项目: ${projectPath}`)

    const packageJsonPath = join(projectPath, 'package.json')
    const hasPackageJson = existsSync(packageJsonPath)

    let packageJson: any = {}
    if (hasPackageJson) {
      try {
        const content = readFileSync(packageJsonPath, 'utf-8')
        packageJson = JSON.parse(content)
      } catch (error) {
        logger.warn('读取 package.json 失败:', error)
      }
    }

    // 检测框架
    const framework = this.detectFramework(packageJson)

    // 检测包管理器
    const packageManager = this.detectPackageManager(projectPath)

    // 检测构建工具
    const buildTool = this.detectBuildTool(packageJson)

    // 检测 TypeScript
    const hasTypeScript =
      existsSync(join(projectPath, 'tsconfig.json')) ||
      !!packageJson.devDependencies?.typescript ||
      !!packageJson.dependencies?.typescript

    // 检测 Git
    const hasGit = existsSync(join(projectPath, '.git'))

    // 确定项目类型
    const type = this.getProjectTypeFromFramework(framework)

    return {
      type,
      framework,
      packageManager,
      buildTool,
      hasTypeScript,
      hasGit,
      confidence: hasPackageJson ? 0.9 : 0.3,
    }
  }

  /**
   * 检测框架
   */
  private detectFramework(packageJson: any): FrameworkType {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (deps['nuxt'] || deps['nuxt3']) return 'nuxt'
    if (deps['next']) return 'next'
    if (deps['@angular/core']) return 'angular'
    if (deps['svelte']) {
      if (deps['@sveltejs/kit']) return 'sveltekit'
      return 'svelte'
    }
    if (deps['solid-js']) return 'solid'
    if (deps['@builder.io/qwik']) return 'qwik'
    if (deps['vue']) {
      // 检测 Vue 版本
      const vueVersion = deps['vue']
      if (vueVersion?.startsWith('^2') || vueVersion?.startsWith('~2')) {
        return 'vue2'
      }
      return 'vue3'
    }
    if (deps['react']) return 'react'

    return 'unknown'
  }

  /**
   * 检测包管理器
   */
  private detectPackageManager(projectPath: string): PackageManager {
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn'
    if (existsSync(join(projectPath, 'bun.lockb'))) return 'bun'
    return 'npm'
  }

  /**
   * 检测构建工具
   */
  private detectBuildTool(packageJson: any): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (deps['vite']) return 'vite'
    if (deps['webpack']) return 'webpack'
    if (deps['rollup']) return 'rollup'
    if (deps['esbuild']) return 'esbuild'
    if (deps['parcel']) return 'parcel'

    return undefined
  }

  /**
   * 从框架推断项目类型
   */
  private getProjectTypeFromFramework(framework?: FrameworkType): ProjectType {
    if (!framework || framework === 'unknown') return 'unknown'
    if (framework === 'none') return 'node'

    const frameworkMap: Record<string, ProjectType> = {
      vue2: 'vue',
      vue3: 'vue',
      nuxt: 'vue',
      react: 'react',
      next: 'react',
      angular: 'angular',
      svelte: 'svelte',
      sveltekit: 'svelte',
      solid: 'solid',
    }

    return frameworkMap[framework] || 'unknown'
  }

  /**
   * 获取项目
   */
  getProject(id: string): Project {
    const project = this.projectRepo.findById(id)
    if (!project) {
      throw new ProjectNotFoundError(id)
    }
    return project
  }

  /**
   * 获取所有项目
   */
  getAllProjects(options?: { limit?: number; offset?: number }): Project[] {
    return this.projectRepo.findAll(options)
  }

  /**
   * 搜索项目
   */
  searchProjects(keyword: string): Project[] {
    return this.projectRepo.search(keyword)
  }

  /**
   * 更新项目
   */
  updateProject(id: string, updates: Partial<Project>): Project {
    return this.projectRepo.update(id, updates)
  }

  /**
   * 删除项目
   */
  deleteProject(id: string): boolean {
    return this.projectRepo.delete(id)
  }

  /**
   * 打开项目（更新最后打开时间）
   */
  openProject(id: string): void {
    this.projectRepo.updateLastOpenedAt(id)
  }

  /**
   * 获取项目统计
   */
  getProjectStats(id: string) {
    return this.projectRepo.getStats(id)
  }

  /**
   * 获取项目操作历史
   */
  getProjectOperations(id: string, limit?: number) {
    return this.projectRepo.getOperations(id, limit)
  }
}

