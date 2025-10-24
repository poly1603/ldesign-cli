/**
 * 直接测试 - 同步启动和测试
 */

import express from 'express'
import http from 'http'

console.log('🚀 启动测试...\n')

const app = express()

app.use(express.json())

// 测试路由
app.get('/test', (req, res) => {
  console.log('✅ 收到请求: GET /test')
  res.json({ message: 'Test OK!' })
})

app.get('/api/projects', (req, res) => {
  console.log('✅ 收到请求: GET /api/projects')
  res.json({
    success: true,
    data: [{ id: '1', name: 'Test Project' }],
    timestamp: Date.now()
  })
})

app.get('*', (req, res) => {
  console.log(`✅ 收到请求: GET ${req.path}`)
  res.send('<h1>Server is running!</h1>')
})

const port = 3001
const host = '127.0.0.1'

const server = http.createServer(app)

server.listen(port, host, () => {
  console.log(`✅ 服务器已启动: http://${host}:${port}`)
  console.log('\n现在可以在浏览器访问或使用curl测试:')
  console.log(`  http://localhost:${port}/test`)
  console.log(`  http://localhost:${port}/api/projects`)
  console.log('\n按 Ctrl+C 停止\n')

  // 自动测试
  setTimeout(async () => {
    console.log('🧪 自动测试...')
    try {
      const res = await fetch(`http://localhost:${port}/test`)
      const data = await res.json()
      console.log('✅ 测试成功:', data)
    } catch (error) {
      console.log('❌ 测试失败:', error.message)
    }
  }, 1000)
})

server.on('error', (error) => {
  console.error('❌ 服务器错误:', error)
})


