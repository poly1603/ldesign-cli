<template>
  <div class="monitor-dashboard">
    <div class="dashboard-header">
      <h1>性能监控</h1>
      <div class="header-actions">
        <button
          :class="{ active: monitoring }"
          class="btn-toggle"
          @click="toggleMonitoring"
        >
          {{ monitoring ? '⏸️ 暂停' : '▶️ 开始' }}
        </button>
        <button class="btn-refresh" @click="refreshMetrics">🔄 刷新</button>
        <button class="btn-reset" @click="resetStats">🗑️ 重置</button>
      </div>
    </div>

    <!-- 实时指标卡片 -->
    <div v-if="currentMetrics" class="metrics-cards">
      <!-- CPU -->
      <div class="metric-card">
        <div class="card-header">
          <h3>CPU 使用率</h3>
          <span class="card-icon">💻</span>
        </div>
        <div class="card-body">
          <div class="metric-value" :class="getStatusClass(currentMetrics.system.cpu.usage, 80, 90)">
            {{ currentMetrics.system.cpu.usage }}%
          </div>
          <div class="metric-label">
            {{ currentMetrics.system.cpu.count }} 核心 · {{ currentMetrics.system.cpu.model }}
          </div>
        </div>
      </div>

      <!-- 内存 -->
      <div class="metric-card">
        <div class="card-header">
          <h3>内存使用</h3>
          <span class="card-icon">🧠</span>
        </div>
        <div class="card-body">
          <div class="metric-value" :class="getStatusClass(currentMetrics.system.memory.usagePercent, 70, 85)">
            {{ currentMetrics.system.memory.usagePercent }}%
          </div>
          <div class="metric-label">
            {{ formatMB(currentMetrics.system.memory.used) }} / {{ formatMB(currentMetrics.system.memory.total) }}
          </div>
        </div>
      </div>

      <!-- 进程内存 -->
      <div class="metric-card">
        <div class="card-header">
          <h3>进程内存</h3>
          <span class="card-icon">⚙️</span>
        </div>
        <div class="card-body">
          <div class="metric-value">
            {{ formatMB(currentMetrics.app.process.memory.heapUsed) }}
          </div>
          <div class="metric-label">
            堆: {{ formatMB(currentMetrics.app.process.memory.heapUsed) }} / {{ formatMB(currentMetrics.app.process.memory.heapTotal) }}
          </div>
        </div>
      </div>

      <!-- 运行时间 -->
      <div class="metric-card">
        <div class="card-header">
          <h3>运行时间</h3>
          <span class="card-icon">⏱️</span>
        </div>
        <div class="card-body">
          <div class="metric-value">
            {{ formatUptime(currentMetrics.app.process.uptime) }}
          </div>
          <div class="metric-label">
            系统运行: {{ formatUptime(currentMetrics.system.uptime) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 请求统计 -->
    <div v-if="currentMetrics" class="stats-section">
      <h2>应用统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ currentMetrics.app.requests.total }}</div>
          <div class="stat-label">总请求数</div>
        </div>
        <div class="stat-item success">
          <div class="stat-value">{{ currentMetrics.app.requests.successful }}</div>
          <div class="stat-label">成功</div>
        </div>
        <div class="stat-item error">
          <div class="stat-value">{{ currentMetrics.app.requests.failed }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentMetrics.app.requests.avgResponseTime }}ms</div>
          <div class="stat-label">平均响应时间</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentMetrics.app.websocket.connections }}</div>
          <div class="stat-label">WebSocket 连接</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentMetrics.app.websocket.messagesReceived }}</div>
          <div class="stat-label">接收消息</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentMetrics.app.websocket.messagesSent }}</div>
          <div class="stat-label">发送消息</div>
        </div>
      </div>
    </div>

    <!-- 历史趋势图 -->
    <div v-if="metricsHistory.length > 0" class="charts-section">
      <h2>历史趋势</h2>
      
      <div class="chart-container">
        <h3>CPU 使用率趋势</h3>
        <div class="simple-chart">
          <div
            v-for="(metric, index) in recentHistory"
            :key="index"
            class="chart-bar"
            :style="{ height: metric.system.cpu.usage + '%' }"
            :title="`${metric.system.cpu.usage}%`"
          ></div>
        </div>
      </div>

      <div class="chart-container">
        <h3>内存使用率趋势</h3>
        <div class="simple-chart">
          <div
            v-for="(metric, index) in recentHistory"
            :key="index"
            class="chart-bar memory"
            :style="{ height: metric.system.memory.usagePercent + '%' }"
            :title="`${metric.system.memory.usagePercent}%`"
          ></div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useMessage } from '../composables/useMessage'
import { useWebSocket } from '../composables/useWebSocket'

const api = useApi()
const message = useMessage()
const { subscribe, unsubscribe } = useWebSocket()

// 数据状态
const currentMetrics = ref<any>(null)
const metricsHistory = ref<any[]>([])
const loading = ref(false)
const monitoring = ref(false)

// 最近的历史记录（用于图表）
const recentHistory = computed(() => {
  return metricsHistory.value.slice(-50) // 最近50条
})

// 格式化MB
const formatMB = (mb: number) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(2)} MB`
}

// 格式化运行时间
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}天 ${hours}时`
  }
  if (hours > 0) {
    return `${hours}时 ${mins}分`
  }
  return `${mins}分`
}

// 获取状态类（正常/警告/危险）
const getStatusClass = (value: number, warning: number, danger: number) => {
  if (value >= danger) {
    return 'danger'
  }
  if (value >= warning) {
    return 'warning'
  }
  return 'normal'
}

// 刷新指标
const refreshMetrics = async () => {
  loading.value = true
  try {
    const [currentResponse, historyResponse] = await Promise.all([
      api.get('/api/monitor/current'),
      api.get('/api/monitor/history', { params: { limit: 100 } })
    ])

    if (currentResponse.success) {
      currentMetrics.value = currentResponse.data
    }

    if (historyResponse.success) {
      metricsHistory.value = historyResponse.data
    }
  }
  catch (error: any) {
    message.error(error.message || '刷新指标失败')
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

// 切换监控
const toggleMonitoring = async () => {
  try {
    if (monitoring.value) {
      await api.post('/api/monitor/stop')
      monitoring.value = false
      message.info('监控已暂停')
    }
    else {
      await api.post('/api/monitor/start', { interval: 5000 })
      monitoring.value = true
      message.success('监控已启动')
    }
  }
  catch (error: any) {
    message.error(error.message || '操作失败')
    console.error(error)
  }
}

// 重置统计
const resetStats = async () => {
  try {
    await api.post('/api/monitor/reset')
    metricsHistory.value = []
    message.success('统计数据已重置')
  }
  catch (error: any) {
    message.error(error.message || '重置失败')
    console.error(error)
  }
}

// 定时刷新
let refreshTimer: NodeJS.Timeout | null = null

// 初始化
onMounted(() => {
  refreshMetrics()
  monitoring.value = true

  // 每5秒刷新一次
  refreshTimer = setInterval(refreshMetrics, 5000)

  // 订阅实时指标更新
  subscribe('metrics-update', (data) => {
    if (data.metrics) {
      currentMetrics.value = data.metrics
      metricsHistory.value.push(data.metrics)

      // 限制历史记录
      if (metricsHistory.value.length > 100) {
        metricsHistory.value.shift()
      }
    }
  })
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  unsubscribe('metrics-update')
})
</script>

<style scoped lang="less">
.monitor-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    margin: 0;
    color: var(--ldesign-text-color-primary);
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--ls-border-radius-base);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;

      &.btn-toggle {
        background: var(--ldesign-brand-color);
        color: white;

        &.active {
          background: var(--ldesign-warning-color);
        }

        &:hover {
          opacity: 0.9;
        }
      }

      &.btn-refresh {
        background: var(--ldesign-bg-color-secondary);
        color: var(--ldesign-text-color-primary);

        &:hover {
          background: var(--ldesign-border-color);
        }
      }

      &.btn-reset {
        background: var(--ldesign-error-color);
        color: white;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: var(--ldesign-bg-color);
  border: 1px solid var(--ldesign-border-color);
  border-radius: var(--ls-border-radius-base);
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 0.875rem;
      color: var(--ldesign-text-color-secondary);
      font-weight: 500;
    }

    .card-icon {
      font-size: 1.5rem;
    }
  }

  .card-body {
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;

      &.normal {
        color: var(--ldesign-success-color);
      }

      &.warning {
        color: var(--ldesign-warning-color);
      }

      &.danger {
        color: var(--ldesign-error-color);
      }
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--ldesign-text-color-secondary);
    }
  }
}

.stats-section {
  margin-bottom: 2rem;

  h2 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
    color: var(--ldesign-text-color-primary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  background: var(--ldesign-bg-color);
  border: 1px solid var(--ldesign-border-color);
  border-radius: var(--ls-border-radius-base);
  padding: 1rem;
  text-align: center;

  &.success {
    border-left: 4px solid var(--ldesign-success-color);
  }

  &.error {
    border-left: 4px solid var(--ldesign-error-color);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: var(--ldesign-text-color-primary);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--ldesign-text-color-secondary);
  }
}

.charts-section {
  h2 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
    color: var(--ldesign-text-color-primary);
  }
}

.chart-container {
  background: var(--ldesign-bg-color);
  border: 1px solid var(--ldesign-border-color);
  border-radius: var(--ls-border-radius-base);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: var(--ldesign-text-color-secondary);
  }
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 2px;
  padding: 1rem;
  background: var(--ldesign-bg-color-secondary);
  border-radius: var(--ls-border-radius-base);

  .chart-bar {
    flex: 1;
    background: var(--ldesign-brand-color);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }

    &.memory {
      background: var(--ldesign-success-color);
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--ldesign-border-color);
    border-top-color: var(--ldesign-brand-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 1rem;
    color: white;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

