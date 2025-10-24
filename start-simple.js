/**
 * 简单启动脚本 - 用于调试
 */

import express from 'express'

const app = express()

console.log('🚀 启动简单测试服务器...')

app.get('/health', (req, res) => {
  console.log('收到请求: GET /health')
  res.json({ status: 'ok', message: 'Server is running!' })
})

app.get('/api/test', (req, res) => {
  console.log('收到请求: GET /api/test')
  res.json({ success: true, message: 'API works!' })
})

app.get('*', (req, res) => {
  console.log(`收到请求: GET ${req.path}`)
  res.send('<h1>LDesign CLI</h1><p>Server is running!</p>')
})

const port = 3000
const host = 'localhost'

app.listen(port, host, () => {
  console.log(`✅ 服务器已启动: http://${host}:${port}`)
  console.log('测试URL:')
  console.log(`  - http://${host}:${port}/health`)
  console.log(`  - http://${host}:${port}/api/test`)
  console.log('')
  console.log('按 Ctrl+C 停止服务器')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  process.exit(0)
})


