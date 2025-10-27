/**
 * 测试服务器 - 简化版本用于调试
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'

const app = express()

app.use(cors())
app.use(express.json())

// 测试路由
app.get('/test', (req, res) => {
  res.json({ message: 'Test OK', timestamp: Date.now() })
})

app.get('/api/projects', (req, res) => {
  console.log('收到请求: GET /api/projects')
  res.json({
    success: true,
    data: [],
    timestamp: Date.now(),
  })
})

app.get('/api/tools', (req, res) => {
  console.log('收到请求: GET /api/tools')
  res.json({
    success: true,
    data: [],
    timestamp: Date.now(),
  })
})

app.get('*', (req, res) => {
  res.send('<h1>LDesign CLI Test Server</h1><p>Server is running!</p>')
})

const server = createServer(app)

server.listen(3000, 'localhost', () => {
  console.log('✅ 测试服务器已启动: http://localhost:3000')
  console.log('测试路由:')
  console.log('  - GET /test')
  console.log('  - GET /api/projects')
  console.log('  - GET /api/tools')
})


