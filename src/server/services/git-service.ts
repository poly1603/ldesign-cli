/**
 * Git 服务
 * 提供 Git 操作和版本控制功能
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { join } from 'path'
import { logger } from '../../utils/logger.js'

const execAsync = promisify(exec)
const gitLogger = logger.withPrefix('GitService')

/**
 * Git 状态接口
 */
export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  clean: boolean
}

/**
 * Git 提交信息接口
 */
export interface GitCommit {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
  files: number
}

/**
 * Git 分支信息接口
 */
export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  lastCommit?: string
}

/**
 * 检查是否为 Git 仓库
 */
export async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('git rev-parse --git-dir', {
      cwd: projectPath
    })
    return true
  }
  catch {
    return false
  }
}

/**
 * 初始化 Git 仓库
 */
export async function initGitRepository(projectPath: string): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`初始化 Git 仓库: ${projectPath}`)

    await execAsync('git init', {
      cwd: projectPath
    })

    gitLogger.success('Git 仓库初始化成功')
    return { success: true }
  }
  catch (error) {
    gitLogger.error('初始化 Git 仓库失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 获取 Git 状态
 */
export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  try {
    const isRepo = await isGitRepository(projectPath)
    if (!isRepo) {
      throw new Error('不是 Git 仓库')
    }

    // 获取当前分支
    const { stdout: branchOutput } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectPath
    })
    const branch = branchOutput.trim()

    // 获取与远程的差异
    let ahead = 0
    let behind = 0
    try {
      const { stdout: revOutput } = await execAsync(`git rev-list --left-right --count origin/${branch}...HEAD`, {
        cwd: projectPath
      })
      const [behindStr, aheadStr] = revOutput.trim().split('\t')
      behind = parseInt(behindStr)
      ahead = parseInt(aheadStr)
    }
    catch {
      // 可能没有远程分支
    }

    // 获取文件状态
    const { stdout: statusOutput } = await execAsync('git status --porcelain', {
      cwd: projectPath
    })

    const staged: string[] = []
    const unstaged: string[] = []
    const untracked: string[] = []

    statusOutput.split('\n').forEach(line => {
      if (!line) return

      const status = line.substring(0, 2)
      const file = line.substring(3)

      if (status === '??') {
        untracked.push(file)
      }
      else if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file)
      }
      else if (status[1] !== ' ') {
        unstaged.push(file)
      }
    })

    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0
    }
  }
  catch (error) {
    gitLogger.error('获取 Git 状态失败:', error)
    throw error
  }
}

/**
 * 获取提交历史
 */
export async function getCommitHistory(
  projectPath: string,
  limit: number = 50
): Promise<GitCommit[]> {
  try {
    const isRepo = await isGitRepository(projectPath)
    if (!isRepo) {
      throw new Error('不是 Git 仓库')
    }

    const { stdout } = await execAsync(
      `git log -${limit} --pretty=format:"%H|%h|%an|%ae|%ai|%s" --numstat`,
      {
        cwd: projectPath,
        maxBuffer: 10 * 1024 * 1024
      }
    )

    const commits: GitCommit[] = []
    const lines = stdout.split('\n')
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        continue
      }

      const parts = line.split('|')
      if (parts.length === 6) {
        const [hash, shortHash, author, email, date, message] = parts

        // 计算文件数量
        let files = 0
        i++
        while (i < lines.length && lines[i] && !lines[i].includes('|')) {
          files++
          i++
        }

        commits.push({
          hash,
          shortHash,
          author,
          email,
          date,
          message,
          files
        })
      }
      else {
        i++
      }
    }

    return commits
  }
  catch (error) {
    gitLogger.error('获取提交历史失败:', error)
    throw error
  }
}

/**
 * 获取所有分支
 */
export async function getBranches(projectPath: string): Promise<GitBranch[]> {
  try {
    const isRepo = await isGitRepository(projectPath)
    if (!isRepo) {
      throw new Error('不是 Git 仓库')
    }

    const { stdout } = await execAsync('git branch -a -v', {
      cwd: projectPath
    })

    const branches: GitBranch[] = []

    stdout.split('\n').forEach(line => {
      if (!line.trim()) return

      const isCurrent = line.startsWith('*')
      const parts = line.replace('*', '').trim().split(/\s+/)

      if (parts.length >= 2) {
        const name = parts[0]
        const lastCommit = parts.slice(1).join(' ')

        branches.push({
          name,
          current: isCurrent,
          remote: name.startsWith('remotes/') ? name.split('/')[1] : undefined,
          lastCommit
        })
      }
    })

    return branches
  }
  catch (error) {
    gitLogger.error('获取分支列表失败:', error)
    throw error
  }
}

/**
 * 创建新分支
 */
export async function createBranch(
  projectPath: string,
  branchName: string,
  checkout: boolean = true
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`创建分支: ${branchName}`)

    const command = checkout ? `git checkout -b ${branchName}` : `git branch ${branchName}`

    await execAsync(command, {
      cwd: projectPath
    })

    gitLogger.success(`分支 ${branchName} 创建成功`)
    return { success: true }
  }
  catch (error) {
    gitLogger.error('创建分支失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 切换分支
 */
export async function checkoutBranch(
  projectPath: string,
  branchName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`切换到分支: ${branchName}`)

    await execAsync(`git checkout ${branchName}`, {
      cwd: projectPath
    })

    gitLogger.success(`已切换到分支 ${branchName}`)
    return { success: true }
  }
  catch (error) {
    gitLogger.error('切换分支失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 删除分支
 */
export async function deleteBranch(
  projectPath: string,
  branchName: string,
  force: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`删除分支: ${branchName}`)

    const flag = force ? '-D' : '-d'
    await execAsync(`git branch ${flag} ${branchName}`, {
      cwd: projectPath
    })

    gitLogger.success(`分支 ${branchName} 已删除`)
    return { success: true }
  }
  catch (error) {
    gitLogger.error('删除分支失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 暂存文件
 */
export async function stageFiles(
  projectPath: string,
  files: string[] = ['.']
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`暂存文件: ${files.join(', ')}`)

    const filesArg = files.map(f => `"${f}"`).join(' ')
    await execAsync(`git add ${filesArg}`, {
      cwd: projectPath
    })

    gitLogger.success('文件已暂存')
    return { success: true }
  }
  catch (error) {
    gitLogger.error('暂存文件失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 提交更改
 */
export async function commit(
  projectPath: string,
  message: string
): Promise<{ success: boolean; message?: string; hash?: string }> {
  try {
    gitLogger.info(`提交更改: ${message}`)

    await execAsync(`git commit -m "${message}"`, {
      cwd: projectPath
    })

    // 获取最新提交的 hash
    const { stdout } = await execAsync('git rev-parse HEAD', {
      cwd: projectPath
    })

    const hash = stdout.trim()

    gitLogger.success('更改已提交')
    return { success: true, hash }
  }
  catch (error) {
    gitLogger.error('提交失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 推送到远程
 */
export async function push(
  projectPath: string,
  remote: string = 'origin',
  branch?: string,
  force: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`推送到远程: ${remote}`)

    const branchArg = branch || ''
    const forceFlag = force ? '--force' : ''
    const command = `git push ${forceFlag} ${remote} ${branchArg}`.trim()

    await execAsync(command, {
      cwd: projectPath
    })

    gitLogger.success('推送成功')
    return { success: true }
  }
  catch (error) {
    gitLogger.error('推送失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 从远程拉取
 */
export async function pull(
  projectPath: string,
  remote: string = 'origin',
  branch?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    gitLogger.info(`从远程拉取: ${remote}`)

    const branchArg = branch || ''
    const command = `git pull ${remote} ${branchArg}`.trim()

    await execAsync(command, {
      cwd: projectPath
    })

    gitLogger.success('拉取成功')
    return { success: true }
  }
  catch (error) {
    gitLogger.error('拉取失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 获取文件差异
 */
export async function getDiff(
  projectPath: string,
  file?: string
): Promise<string> {
  try {
    const fileArg = file ? `"${file}"` : ''
    const { stdout } = await execAsync(`git diff ${fileArg}`, {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024
    })

    return stdout
  }
  catch (error) {
    gitLogger.error('获取差异失败:', error)
    throw error
  }
}

/**
 * 生成智能提交信息（基于文件变更）
 */
export async function generateCommitMessage(projectPath: string): Promise<string> {
  try {
    const status = await getGitStatus(projectPath)

    const changedFiles = [...status.staged, ...status.unstaged, ...status.untracked]

    if (changedFiles.length === 0) {
      return 'chore: update files'
    }

    // 分析文件类型
    const categories: Record<string, string[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      test: [],
      chore: []
    }

    changedFiles.forEach(file => {
      if (file.includes('test') || file.includes('spec')) {
        categories.test.push(file)
      }
      else if (file.endsWith('.md') || file.includes('README')) {
        categories.docs.push(file)
      }
      else if (file.endsWith('.css') || file.endsWith('.less') || file.endsWith('.scss')) {
        categories.style.push(file)
      }
      else if (file.includes('config') || file.includes('.json')) {
        categories.chore.push(file)
      }
      else {
        categories.feat.push(file)
      }
    })

    // 选择最主要的类型
    let type = 'chore'
    let maxCount = 0

    Object.entries(categories).forEach(([cat, files]) => {
      if (files.length > maxCount) {
        maxCount = files.length
        type = cat
      }
    })

    const scope = changedFiles[0].split('/')[0] || 'project'
    return `${type}(${scope}): update ${changedFiles.length} file(s)`
  }
  catch (error) {
    gitLogger.error('生成提交信息失败:', error)
    return 'chore: update files'
  }
}


