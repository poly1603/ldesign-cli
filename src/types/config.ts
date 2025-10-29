/**
 * LDesign CLI 配置类型定义
 */

export interface ServerConfig {
  /** Server 路径 */
  path?: string
  /** Server 端口 */
  port?: number
  /** Server 启动命令 */
  startCmd?: string
  /** Server 开发命令 */
  devCmd?: string
  /** Server 构建命令 */
  buildCmd?: string
}

export interface WebConfig {
  /** Web 路径 */
  path?: string
  /** Web 端口 */
  port?: number
  /** Web 启动命令 */
  startCmd?: string
  /** Web 开发命令 */
  devCmd?: string
  /** Web 构建命令 */
  buildCmd?: string
}

export interface UIConfig {
  /** Server 配置 */
  server?: ServerConfig
  /** Web 配置 */
  web?: WebConfig
  /** 是否自动打开浏览器 */
  open?: boolean
  /** 主机地址 */
  host?: string
}

export interface BuildConfig {
  /** 构建模式 */
  mode?: 'development' | 'production'
  /** 入口文件 */
  entry?: string
  /** 输出目录 */
  outDir?: string
  /** 是否生成 sourcemap */
  sourcemap?: boolean
  /** 是否启用分析 */
  analyze?: boolean
}

export interface DevConfig {
  /** 端口 */
  port?: number
  /** 主机地址 */
  host?: string
  /** 是否自动打开浏览器 */
  open?: boolean
  /** 是否启用 HTTPS */
  https?: boolean
}

export interface LDesignConfig {
  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  
  /** UI 配置 */
  ui?: UIConfig
  
  /** 构建配置 */
  build?: BuildConfig
  
  /** 开发配置 */
  dev?: DevConfig
  
  /** 插件列表 */
  plugins?: string[]
  
  /** 扩展配置 */
  [key: string]: any
}

/**
 * 定义配置函数类型
 */
export type DefineConfig = (config: LDesignConfig) => LDesignConfig

/**
 * 辅助函数：定义配置
 */
export function defineConfig(config: LDesignConfig): LDesignConfig {
  return config
}
