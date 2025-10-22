<template>
  <div class="security-report">
    <div class="report-header">
      <h1>安全报告</h1>
      <p class="subtitle">依赖漏洞扫描和许可证合规检查</p>
    </div>

    <!-- 项目选择器 -->
    <div class="project-selector">
      <label>选择项目：</label>
      <select v-model="selectedProjectId" @change="loadProject">
        <option value="">请选择项目</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
      <button
        v-if="selectedProject"
        class="btn-refresh"
        :disabled="scanning"
        @click="refreshScan"
      >
        {{ scanning ? '扫描中...' : '刷新扫描' }}
      </button>
    </div>

    <!-- 扫描中状态 -->
    <div v-if="scanning" class="scanning-overlay">
      <div class="spinner"></div>
      <p>正在扫描，请稍候...</p>
    </div>

    <!-- 报告内容 -->
    <div v-if="selectedProject && !scanning" class="report-content">
      <!-- Tab 切换 -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'vulnerabilities' }"
          @click="activeTab = 'vulnerabilities'"
        >
          漏洞扫描
          <span v-if="vulnResult" class="badge">{{ vulnResult.totalVulnerabilities }}</span>
        </button>
        <button
          :class="{ active: activeTab === 'licenses' }"
          @click="activeTab = 'licenses'"
        >
          许可证
          <span v-if="licenseResult" class="badge">{{ licenseResult.incompatible.length }}</span>
        </button>
      </div>

      <!-- 漏洞扫描 Tab -->
      <div v-if="activeTab === 'vulnerabilities'" class="tab-content">
        <div v-if="vulnResult" class="vulnerabilities-report">
          <!-- 统计概览 -->
          <div class="summary-cards">
            <div class="summary-card critical">
              <div class="card-value">{{ vulnResult.summary.critical }}</div>
              <div class="card-label">严重</div>
            </div>
            <div class="summary-card high">
              <div class="card-value">{{ vulnResult.summary.high }}</div>
              <div class="card-label">高危</div>
            </div>
            <div class="summary-card moderate">
              <div class="card-value">{{ vulnResult.summary.moderate }}</div>
              <div class="card-label">中危</div>
            </div>
            <div class="summary-card low">
              <div class="card-value">{{ vulnResult.summary.low }}</div>
              <div class="card-label">低危</div>
            </div>
          </div>

          <!-- 修复按钮 -->
          <div v-if="vulnResult.totalVulnerabilities > 0" class="action-bar">
            <button class="btn-primary" :disabled="fixing" @click="fixVulnerabilities(false)">
              {{ fixing ? '修复中...' : '自动修复' }}
            </button>
            <button class="btn-warning" :disabled="fixing" @click="fixVulnerabilities(true)">
              强制修复（可能破坏兼容性）
            </button>
          </div>

          <!-- 漏洞列表 -->
          <div class="vulnerabilities-list">
            <div
              v-for="vuln in sortedVulnerabilities"
              :key="vuln.id"
              class="vulnerability-card"
              :class="`severity-${vuln.severity}`"
            >
              <div class="vuln-header">
                <span class="severity-badge" :class="vuln.severity">
                  {{ severityLabels[vuln.severity] }}
                </span>
                <h3 class="vuln-title">{{ vuln.title }}</h3>
              </div>

              <div class="vuln-body">
                <div class="vuln-info">
                  <div class="info-item">
                    <strong>包名：</strong>
                    <span>{{ vuln.packageName }}</span>
                  </div>
                  <div class="info-item">
                    <strong>当前版本：</strong>
                    <span>{{ vuln.installedVersion }}</span>
                  </div>
                  <div v-if="vuln.fixedVersion" class="info-item">
                    <strong>修复版本：</strong>
                    <span class="fixed-version">{{ vuln.fixedVersion }}</span>
                  </div>
                  <div v-if="vuln.cve && vuln.cve.length > 0" class="info-item">
                    <strong>CVE：</strong>
                    <span>{{ vuln.cve.join(', ') }}</span>
                  </div>
                </div>

                <div v-if="vuln.description" class="vuln-description">
                  {{ vuln.description }}
                </div>

                <div v-if="vuln.recommendation" class="vuln-recommendation">
                  <strong>建议：</strong> {{ vuln.recommendation }}
                </div>

                <a v-if="vuln.url" :href="vuln.url" target="_blank" class="vuln-link">
                  查看详情 →
                </a>
              </div>
            </div>

            <div v-if="vulnResult.totalVulnerabilities === 0" class="empty-state">
              <p>🎉 太棒了！未发现任何漏洞</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>点击"刷新扫描"开始扫描漏洞</p>
        </div>
      </div>

      <!-- 许可证 Tab -->
      <div v-if="activeTab === 'licenses'" class="tab-content">
        <div v-if="licenseResult" class="licenses-report">
          <!-- 统计概览 -->
          <div class="summary-cards">
            <div class="summary-card permissive">
              <div class="card-value">{{ licenseResult.summary.permissive }}</div>
              <div class="card-label">宽松许可证</div>
            </div>
            <div class="summary-card copyleft">
              <div class="card-value">{{ licenseResult.summary.copyleft }}</div>
              <div class="card-label">Copyleft</div>
            </div>
            <div class="summary-card proprietary">
              <div class="card-value">{{ licenseResult.summary.proprietary }}</div>
              <div class="card-label">专有许可证</div>
            </div>
            <div class="summary-card unknown">
              <div class="card-value">{{ licenseResult.summary.unknown }}</div>
              <div class="card-label">未知</div>
            </div>
          </div>

          <!-- 不兼容许可证 -->
          <div v-if="licenseResult.incompatible.length > 0" class="incompatible-section">
            <h3>⚠️ 不兼容许可证（{{ licenseResult.incompatible.length }}）</h3>
            <div class="license-list">
              <div
                v-for="license in licenseResult.incompatible"
                :key="`${license.packageName}-${license.version}`"
                class="license-card incompatible"
              >
                <div class="license-header">
                  <span class="package-name">{{ license.packageName }}</span>
                  <span class="license-badge" :class="license.type">{{ license.name }}</span>
                </div>
                <div class="license-meta">
                  <span>版本: {{ license.version }}</span>
                  <span v-if="license.url">
                    <a :href="license.url" target="_blank">主页 →</a>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 所有许可证 -->
          <div class="all-licenses-section">
            <h3>所有许可证（{{ licenseResult.totalPackages }}）</h3>
            <div class="license-list">
              <div
                v-for="license in licenseResult.licenses"
                :key="`${license.packageName}-${license.version}`"
                class="license-card"
                :class="{ compatible: license.compatible }"
              >
                <div class="license-header">
                  <span class="package-name">{{ license.packageName }}</span>
                  <span class="license-badge" :class="license.type">{{ license.name }}</span>
                </div>
                <div class="license-meta">
                  <span>版本: {{ license.version }}</span>
                  <span v-if="license.url">
                    <a :href="license.url" target="_blank">主页 →</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>点击"刷新扫描"开始扫描许可证</p>
        </div>
      </div>
    </div>

    <!-- 未选择项目 -->
    <div v-else-if="!scanning" class="empty-state">
      <p>请选择一个项目开始安全扫描</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useMessage } from '../composables/useMessage'

const api = useApi()
const message = useMessage()

// 数据状态
const projects = ref<any[]>([])
const selectedProjectId = ref('')
const selectedProject = ref<any>(null)
const activeTab = ref<'vulnerabilities' | 'licenses'>('vulnerabilities')
const scanning = ref(false)
const fixing = ref(false)

// 扫描结果
const vulnResult = ref<any>(null)
const licenseResult = ref<any>(null)

// 严重程度标签
const severityLabels: Record<string, string> = {
  critical: '严重',
  high: '高危',
  moderate: '中危',
  low: '低危',
  info: '信息'
}

// 排序后的漏洞列表
const sortedVulnerabilities = computed(() => {
  if (!vulnResult.value) return []
  
  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 }
  return [...vulnResult.value.vulnerabilities].sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
})

// 加载项目列表
const loadProjects = async () => {
  try {
    const response = await api.get('/api/projects')
    if (response.success) {
      projects.value = response.data
    }
  }
  catch (error) {
    message.error('加载项目列表失败')
    console.error(error)
  }
}

// 加载选中的项目
const loadProject = () => {
  const project = projects.value.find(p => p.id === selectedProjectId.value)
  if (project) {
    selectedProject.value = project
    // 自动开始扫描
    refreshScan()
  }
}

// 刷新扫描
const refreshScan = async () => {
  if (!selectedProject.value) return

  scanning.value = true
  try {
    // 并行扫描漏洞和许可证
    const [vulnResponse, licenseResponse] = await Promise.all([
      api.post('/api/security/scan-vulnerabilities', {
        projectPath: selectedProject.value.path,
        forceRefresh: true
      }),
      api.post('/api/security/scan-licenses', {
        projectPath: selectedProject.value.path,
        forceRefresh: true
      })
    ])

    if (vulnResponse.success) {
      vulnResult.value = vulnResponse.data
    }

    if (licenseResponse.success) {
      licenseResult.value = licenseResponse.data
    }

    message.success('扫描完成')
  }
  catch (error: any) {
    message.error(error.message || '扫描失败')
    console.error(error)
  }
  finally {
    scanning.value = false
  }
}

// 修复漏洞
const fixVulnerabilities = async (force: boolean) => {
  if (!selectedProject.value) return

  fixing.value = true
  try {
    const response = await api.post('/api/security/fix-vulnerabilities', {
      projectPath: selectedProject.value.path,
      force
    })

    if (response.success) {
      message.success(response.message || '修复成功')
      // 重新扫描
      await refreshScan()
    }
    else {
      message.error(response.message || '修复失败')
    }
  }
  catch (error: any) {
    message.error(error.message || '修复失败')
    console.error(error)
  }
  finally {
    fixing.value = false
  }
}

// 初始化
onMounted(() => {
  loadProjects()
})
</script>

<style scoped lang="less">
.security-report {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.report-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    color: var(--ldesign-text-color-primary);
  }

  .subtitle {
    color: var(--ldesign-text-color-secondary);
    margin: 0;
  }
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--ldesign-bg-color-secondary);
  border-radius: var(--ls-border-radius-base);

  label {
    font-weight: 500;
  }

  select {
    flex: 1;
    max-width: 400px;
    padding: 0.5rem;
    border: 1px solid var(--ldesign-border-color);
    border-radius: var(--ls-border-radius-base);
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: var(--ldesign-brand-color);
    }
  }

  .btn-refresh {
    padding: 0.5rem 1rem;
    background: var(--ldesign-brand-color);
    color: white;
    border: none;
    border-radius: var(--ls-border-radius-base);
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.scanning-overlay {
  text-align: center;
  padding: 4rem 0;

  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
    border: 4px solid var(--ldesign-border-color);
    border-top-color: var(--ldesign-brand-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--ldesign-border-color);

  button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 1rem;
    color: var(--ldesign-text-color-secondary);
    transition: all 0.2s;
    position: relative;

    &:hover {
      color: var(--ldesign-text-color-primary);
    }

    &.active {
      color: var(--ldesign-brand-color);
      border-bottom-color: var(--ldesign-brand-color);
    }

    .badge {
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      background: var(--ldesign-error-color);
      color: white;
      border-radius: 999px;
      font-size: 0.75rem;
    }
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  padding: 1.5rem;
  border-radius: var(--ls-border-radius-base);
  text-align: center;
  color: white;

  .card-value {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .card-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  &.critical {
    background: #d32f2f;
  }

  &.high {
    background: #f57c00;
  }

  &.moderate {
    background: #fbc02d;
    color: #333;
  }

  &.low {
    background: #388e3c;
  }

  &.permissive {
    background: #388e3c;
  }

  &.copyleft {
    background: #1976d2;
  }

  &.proprietary {
    background: #d32f2f;
  }

  &.unknown {
    background: #757575;
  }
}

.action-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--ls-border-radius-base);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-primary {
    background: var(--ldesign-brand-color);
    color: white;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }

  .btn-warning {
    background: var(--ldesign-warning-color);
    color: white;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }
}

.vulnerabilities-list,
.license-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vulnerability-card {
  border: 1px solid var(--ldesign-border-color);
  border-left: 4px solid;
  border-radius: var(--ls-border-radius-base);
  padding: 1.5rem;
  background: var(--ldesign-bg-color);

  &.severity-critical {
    border-left-color: #d32f2f;
  }

  &.severity-high {
    border-left-color: #f57c00;
  }

  &.severity-moderate {
    border-left-color: #fbc02d;
  }

  &.severity-low {
    border-left-color: #388e3c;
  }
}

.vuln-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;

  .severity-badge {
    padding: 0.25rem 0.75rem;
    border-radius: var(--ls-border-radius-base);
    font-size: 0.75rem;
    font-weight: bold;
    color: white;

    &.critical {
      background: #d32f2f;
    }

    &.high {
      background: #f57c00;
    }

    &.moderate {
      background: #fbc02d;
      color: #333;
    }

    &.low {
      background: #388e3c;
    }
  }

  .vuln-title {
    margin: 0;
    font-size: 1.125rem;
  }
}

.vuln-body {
  .vuln-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;

    .info-item {
      font-size: 0.875rem;

      strong {
        margin-right: 0.5rem;
      }

      .fixed-version {
        color: var(--ldesign-success-color);
        font-weight: 500;
      }
    }
  }

  .vuln-description {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--ldesign-bg-color-secondary);
    border-radius: var(--ls-border-radius-base);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .vuln-recommendation {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: var(--ldesign-bg-color-secondary);
    border-left: 3px solid var(--ldesign-brand-color);
    font-size: 0.875rem;
  }

  .vuln-link {
    color: var(--ldesign-brand-color);
    text-decoration: none;
    font-size: 0.875rem;

    &:hover {
      text-decoration: underline;
    }
  }
}

.license-card {
  border: 1px solid var(--ldesign-border-color);
  border-radius: var(--ls-border-radius-base);
  padding: 1rem;
  background: var(--ldesign-bg-color);

  &.incompatible {
    border-left: 4px solid var(--ldesign-error-color);
  }

  &.compatible {
    border-left: 4px solid var(--ldesign-success-color);
  }

  .license-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .package-name {
      font-weight: 500;
    }

    .license-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--ls-border-radius-base);
      font-size: 0.75rem;
      background: var(--ldesign-bg-color-secondary);

      &.permissive {
        background: #388e3c;
        color: white;
      }

      &.copyleft {
        background: #1976d2;
        color: white;
      }

      &.proprietary {
        background: #d32f2f;
        color: white;
      }
    }
  }

  .license-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--ldesign-text-color-secondary);

    a {
      color: var(--ldesign-brand-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.incompatible-section,
.all-licenses-section {
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--ldesign-text-color-secondary);

  p {
    font-size: 1.125rem;
  }
}
</style>


