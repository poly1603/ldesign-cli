/**
 * API 测试脚本
 */

async function testApi() {
  const baseUrl = 'http://localhost:3000'

  console.log('🧪 测试 LDesign CLI API...\n')

  // 测试项目API
  console.log('1. 测试项目列表...')
  try {
    const res = await fetch(`${baseUrl}/api/projects`)
    const data = await res.json()
    console.log('✅ /api/projects:', data)
  } catch (error) {
    console.log('❌ /api/projects:', error.message)
  }

  // 测试工具API
  console.log('\n2. 测试工具列表...')
  try {
    const res = await fetch(`${baseUrl}/api/tools`)
    const data = await res.json()
    console.log('✅ /api/tools:', data)
  } catch (error) {
    console.log('❌ /api/tools:', error.message)
  }

  // 测试根路径
  console.log('\n3. 测试根路径...')
  try {
    const res = await fetch(`${baseUrl}/`)
    console.log('✅ /:', res.status, res.statusText)
  } catch (error) {
    console.log('❌ /:', error.message)
  }

  console.log('\n✨ 测试完成!')
}

testApi().catch(console.error)


