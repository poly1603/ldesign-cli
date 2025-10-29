/**
 * UI command: start server + web with better UX & robustness
 */

import type { CAC } from 'cac'
import { join } from 'path'
import { existsSync } from 'fs'
import { execa } from 'execa'
import waitOn from 'wait-on'
import open from 'open'
import { logger } from '@ldesign/shared'
import type { CommandHandler } from '../CommandRegistry'

export interface UIOptions {
  host?: string
  open?: boolean
  dev?: boolean
  serverPort?: number
  webPort?: number
  serverOnly?: boolean
  webOnly?: boolean
  noBuild?: boolean
}

const TOOLS_ROOT = join(__dirname, '..', '..', '..')
const SERVER_PATH = join(TOOLS_ROOT, 'server')
const WEB_PATH = join(TOOLS_ROOT, 'web')
const DEFAULT_SERVER_PORT = 3000
const DEFAULT_WEB_PORT = 5173

async function run(cmd: string, args: string[], cwd: string) {
  const child = execa(cmd, args, { cwd, stdio: 'inherit', shell: true })
  return child
}

async function waitForPort(port: number, host = '127.0.0.1') {
  await waitOn({ resources: [`tcp:${host}:${port}`], timeout: 60_000 })
}

export async function uiCommand(options: UIOptions = {}): Promise<void> {
  const uiLogger = logger.withPrefix('UI')
  const host = options.host || '127.0.0.1'
  const serverPort = options.serverPort || DEFAULT_SERVER_PORT
  const webPort = options.webPort || DEFAULT_WEB_PORT
  const isDev = !!options.dev

  // sanity check
  if (!existsSync(SERVER_PATH)) throw new Error(`Server path not found: ${SERVER_PATH}`)
  if (!existsSync(WEB_PATH)) throw new Error(`Web path not found: ${WEB_PATH}`)

  const procs: { kill: () => Promise<void> }[] = []
  const cleanup = async () => {
    await Promise.allSettled(procs.map((p) => p.kill()))
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    // build server when necessary
    if (!isDev && !options.noBuild) {
      uiLogger.info('Building server...')
      const buildProc = await run('pnpm', ['-C', SERVER_PATH, 'build'], SERVER_PATH)
      await buildProc
    }

    // start server
    uiLogger.info('Starting server...')
    const serverCmd = isDev ? ['-C', SERVER_PATH, 'dev'] : ['-C', SERVER_PATH, 'start']
    const serverProc = execa('pnpm', serverCmd, { cwd: SERVER_PATH, shell: true })
    procs.push({ kill: async () => serverProc.kill('SIGTERM', { forceKillAfterTimeout: 2000 }) })

    // wait server ready (port)
    await waitForPort(serverPort, host)
    uiLogger.info(`Server ready: http://${host}:${serverPort}`)

    // start web if needed
    if (!options.serverOnly) {
      uiLogger.info('Starting web...')
      const webProc = execa('pnpm', ['-C', WEB_PATH, 'dev'], { cwd: WEB_PATH, shell: true })
      procs.push({ kill: async () => webProc.kill('SIGTERM', { forceKillAfterTimeout: 2000 }) })
      await waitForPort(webPort, host)
      uiLogger.info(`Web ready: http://${host}:${webPort}`)

      if (options.open !== false) {
        await open(`http://localhost:${webPort}`)
      }
    }
  } catch (e) {
    uiLogger.error('UI start failed:', e)
    await cleanup()
    throw e
  }
}

export const uiCommandHandler: CommandHandler = {
  name: 'ui',
  description: '启动可视化管理界面',
  setup(cli: CAC) {
    cli
      .command('ui', '启动可视化管理界面')
      .option('--host <host>', 'Host to bind')
      .option('--server-port <port>', 'Server port', { type: [Number] })
      .option('--web-port <port>', 'Web port', { type: [Number] })
      .option('--server-only', 'Only start server')
      .option('--web-only', 'Only start web')
      .option('--no-build', 'Skip server build step')
      .option('--dev', 'Run in dev mode')
      .option('--no-open', 'Do not open browser')
      .action(async (options) => {
        try {
          await uiCommand(options)
        } catch (error) {
          logger.error('UI command failed:', error)
          process.exit(1)
        }
      })
  },
  async execute(options: UIOptions) {
    return uiCommand(options)
  },
}
