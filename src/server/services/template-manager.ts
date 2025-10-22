/**
 * 模板管理服务
 * 处理模板的创建、克隆、变量替换等业务逻辑
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../../utils/logger.js'
import type { ProjectTemplate, TemplateVariable } from '../database/templates.js'

const execAsync = promisify(exec)
const templateLogger = logger.withPrefix('TemplateManager')

/**
 * 模板创建选项
 */
export interface CreateFromTemplateOptions {
  templateId: string
  targetPath: string
  projectName: string
  variables?: Record<string, any>
}

/**
 * 从 Git 仓库克隆模板
 */
export async function cloneTemplateFromGit(
  gitUrl: string,
  targetPath: string
): Promise<{ success: boolean; message?: string }> {
  try {
    templateLogger.info(`正在从 Git 克隆模板: ${gitUrl}`)

    // 确保目标目录不存在
    if (fs.existsSync(targetPath)) {
      return {
        success: false,
        message: '目标目录已存在'
      }
    }

    // 克隆仓库
    await execAsync(`git clone ${gitUrl} "${targetPath}"`, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })

    // 删除 .git 目录
    const gitDir = path.join(targetPath, '.git')
    if (fs.existsSync(gitDir)) {
      await fs.promises.rm(gitDir, { recursive: true, force: true })
    }

    templateLogger.success(`模板克隆成功: ${targetPath}`)
    return { success: true }
  }
  catch (error) {
    templateLogger.error('克隆模板失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 从本地路径复制模板
 */
export async function copyTemplateFromLocal(
  sourcePath: string,
  targetPath: string
): Promise<{ success: boolean; message?: string }> {
  try {
    templateLogger.info(`正在从本地复制模板: ${sourcePath}`)

    // 检查源路径是否存在
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        message: '源模板路径不存在'
      }
    }

    // 确保目标目录不存在
    if (fs.existsSync(targetPath)) {
      return {
        success: false,
        message: '目标目录已存在'
      }
    }

    // 递归复制目录
    await copyDirectory(sourcePath, targetPath)

    templateLogger.success(`模板复制成功: ${targetPath}`)
    return { success: true }
  }
  catch (error) {
    templateLogger.error('复制模板失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 递归复制目录
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true })

  const entries = await fs.promises.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    // 跳过 .git 目录和 node_modules
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue
    }

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    }
    else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

/**
 * 替换文件中的模板变量
 */
export async function replaceTemplateVariables(
  filePath: string,
  variables: Record<string, any>
): Promise<void> {
  try {
    let content = await fs.promises.readFile(filePath, 'utf-8')

    // 替换变量 {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      content = content.replace(regex, String(value))
    })

    await fs.promises.writeFile(filePath, content, 'utf-8')
  }
  catch (error) {
    // 如果文件是二进制文件，跳过
    if (error instanceof Error && error.message.includes('EISDIR')) {
      return
    }
    templateLogger.warn(`无法处理文件: ${filePath}`)
  }
}

/**
 * 递归替换目录中所有文件的模板变量
 */
export async function replaceVariablesInDirectory(
  dirPath: string,
  variables: Record<string, any>
): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      // 跳过 node_modules 和 dist 等目录
      if (['node_modules', 'dist', '.git', '.idea', '.vscode'].includes(entry.name)) {
        continue
      }
      await replaceVariablesInDirectory(fullPath, variables)
    }
    else {
      // 只处理文本文件
      const textFileExtensions = [
        '.js', '.ts', '.jsx', '.tsx', '.vue', '.json', '.md', '.txt',
        '.html', '.css', '.scss', '.less', '.yaml', '.yml', '.xml'
      ]
      const ext = path.extname(entry.name).toLowerCase()
      if (textFileExtensions.includes(ext) || entry.name === '.gitignore') {
        await replaceTemplateVariables(fullPath, variables)
      }
    }
  }
}

/**
 * 更新 package.json 中的项目信息
 */
export async function updatePackageJson(
  projectPath: string,
  projectName: string,
  description?: string,
  author?: string
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    templateLogger.warn('package.json 不存在，跳过更新')
    return
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content)

    packageJson.name = projectName
    if (description) {
      packageJson.description = description
    }
    if (author) {
      packageJson.author = author
    }
    packageJson.version = '0.1.0'

    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8'
    )

    templateLogger.success('package.json 已更新')
  }
  catch (error) {
    templateLogger.error('更新 package.json 失败:', error)
    throw error
  }
}

/**
 * 从模板创建项目
 */
export async function createProjectFromTemplate(
  template: ProjectTemplate,
  options: CreateFromTemplateOptions
): Promise<{ success: boolean; message?: string; projectPath?: string }> {
  const { targetPath, projectName, variables = {} } = options

  try {
    templateLogger.info(`正在从模板创建项目: ${template.name}`)

    // 1. 克隆或复制模板
    let result: { success: boolean; message?: string }

    if (template.gitUrl) {
      result = await cloneTemplateFromGit(template.gitUrl, targetPath)
    }
    else if (template.localPath) {
      result = await copyTemplateFromLocal(template.localPath, targetPath)
    }
    else {
      return {
        success: false,
        message: '模板没有有效的源（Git URL 或本地路径）'
      }
    }

    if (!result.success) {
      return result
    }

    // 2. 准备变量映射
    const variableMap: Record<string, any> = {
      projectName,
      PROJECT_NAME: projectName,
      project_name: projectName.toLowerCase().replace(/\s+/g, '-'),
      ...variables
    }

    // 3. 替换文件中的变量
    await replaceVariablesInDirectory(targetPath, variableMap)

    // 4. 更新 package.json
    await updatePackageJson(
      targetPath,
      variableMap.project_name,
      variables.description,
      variables.author
    )

    templateLogger.success(`项目创建成功: ${targetPath}`)

    return {
      success: true,
      projectPath: targetPath
    }
  }
  catch (error) {
    templateLogger.error('从模板创建项目失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 将项目保存为模板
 */
export async function saveProjectAsTemplate(
  projectPath: string,
  templatePath: string,
  variablesToExtract?: string[]
): Promise<{ success: boolean; message?: string }> {
  try {
    templateLogger.info(`正在将项目保存为模板: ${projectPath}`)

    // 复制项目到模板目录
    await copyDirectory(projectPath, templatePath)

    // 如果指定了要提取的变量，创建 .template.json 配置文件
    if (variablesToExtract && variablesToExtract.length > 0) {
      const templateConfig = {
        variables: variablesToExtract.map(name => ({
          name,
          label: name,
          type: 'string',
          required: true
        }))
      }

      const configPath = path.join(templatePath, '.template.json')
      await fs.promises.writeFile(
        configPath,
        JSON.stringify(templateConfig, null, 2),
        'utf-8'
      )
    }

    templateLogger.success(`模板已保存: ${templatePath}`)

    return { success: true }
  }
  catch (error) {
    templateLogger.error('保存模板失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 读取模板配置文件
 */
export async function readTemplateConfig(
  templatePath: string
): Promise<{ variables?: TemplateVariable[] } | null> {
  const configPath = path.join(templatePath, '.template.json')

  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    const content = await fs.promises.readFile(configPath, 'utf-8')
    return JSON.parse(content)
  }
  catch (error) {
    templateLogger.error('读取模板配置失败:', error)
    return null
  }
}

/**
 * 验证模板变量
 */
export function validateTemplateVariables(
  variables: TemplateVariable[],
  values: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  variables.forEach(variable => {
    const value = values[variable.name]

    // 检查必填字段
    if (variable.required && (value === undefined || value === null || value === '')) {
      errors.push(`变量 "${variable.label}" 是必填的`)
      return
    }

    // 检查类型
    if (value !== undefined && value !== null) {
      switch (variable.type) {
        case 'number':
          if (typeof value !== 'number' && Number.isNaN(Number(value))) {
            errors.push(`变量 "${variable.label}" 必须是数字`)
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`变量 "${variable.label}" 必须是布尔值`)
          }
          break
        case 'select':
          if (variable.options && !variable.options.includes(value)) {
            errors.push(`变量 "${variable.label}" 的值必须是以下之一: ${variable.options.join(', ')}`)
          }
          break
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}


