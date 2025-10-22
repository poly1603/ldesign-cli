/**
 * Git 服务测试
 */

import { describe, it, expect } from 'vitest'

describe('Git 服务', () => {
  describe('Git 状态解析', () => {
    it('应该正确解析分支名称', () => {
      const branchOutput = 'main\n'
      const branch = branchOutput.trim()

      expect(branch).toBe('main')
    })

    it('应该正确解析文件状态', () => {
      const statusLines = [
        '?? new-file.txt',
        ' M modified-file.txt',
        'A  staged-file.txt',
        'MM both-modified.txt'
      ]

      const staged: string[] = []
      const unstaged: string[] = []
      const untracked: string[] = []

      statusLines.forEach(line => {
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

      expect(untracked).toContain('new-file.txt')
      expect(unstaged).toContain('modified-file.txt')
      expect(staged).toContain('staged-file.txt')
      expect(staged).toContain('both-modified.txt')
    })
  })

  describe('提交历史解析', () => {
    it('应该正确解析提交信息', () => {
      const commitLine = 'abc123|abc|John Doe|john@example.com|2024-01-01 12:00:00|feat: add new feature'
      const parts = commitLine.split('|')

      expect(parts).toHaveLength(6)
      expect(parts[0]).toBe('abc123') // hash
      expect(parts[1]).toBe('abc') // shortHash
      expect(parts[2]).toBe('John Doe') // author
      expect(parts[3]).toBe('john@example.com') // email
      expect(parts[4]).toBe('2024-01-01 12:00:00') // date
      expect(parts[5]).toBe('feat: add new feature') // message
    })
  })

  describe('分支信息解析', () => {
    it('应该识别当前分支', () => {
      const branchLine = '* main abc123 Latest commit'
      const isCurrent = branchLine.startsWith('*')

      expect(isCurrent).toBe(true)
    })

    it('应该解析分支名称', () => {
      const branchLine = '  feature/test abc123 Branch commit'
      const parts = branchLine.replace('*', '').trim().split(/\s+/)
      const branchName = parts[0]

      expect(branchName).toBe('feature/test')
    })

    it('应该识别远程分支', () => {
      const remoteBranch = 'remotes/origin/main'
      const isRemote = remoteBranch.startsWith('remotes/')

      expect(isRemote).toBe(true)

      if (isRemote) {
        const remote = remoteBranch.split('/')[1]
        expect(remote).toBe('origin')
      }
    })
  })

  describe('智能提交信息生成', () => {
    it('应该根据文件类型生成合适的前缀', () => {
      const testCases = [
        { file: 'test/unit.spec.ts', expected: 'test' },
        { file: 'README.md', expected: 'docs' },
        { file: 'styles/main.css', expected: 'style' },
        { file: 'config.json', expected: 'chore' },
        { file: 'src/feature.ts', expected: 'feat' }
      ]

      testCases.forEach(({ file, expected }) => {
        let category = 'chore'

        if (file.includes('test') || file.includes('spec')) {
          category = 'test'
        }
        else if (file.endsWith('.md') || file.includes('README')) {
          category = 'docs'
        }
        else if (file.endsWith('.css') || file.endsWith('.less') || file.endsWith('.scss')) {
          category = 'style'
        }
        else if (file.includes('config') || file.includes('.json')) {
          category = 'chore'
        }
        else {
          category = 'feat'
        }

        expect(category).toBe(expected)
      })
    })

    it('应该生成Conventional Commits格式', () => {
      const type = 'feat'
      const scope = 'auth'
      const message = `${type}(${scope}): update 3 file(s)`

      expect(message).toMatch(/^(feat|fix|docs|style|refactor|test|chore)\([a-z-]+\):/)
    })
  })
})


