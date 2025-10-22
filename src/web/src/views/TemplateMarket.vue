<template>
  <div class="template-market">
    <div class="market-header">
      <h1>模板市场</h1>
      <p class="subtitle">选择一个模板快速创建项目</p>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索模板..."
          @input="handleSearch"
        />
      </div>

      <div class="filter-tabs">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="{ active: selectedCategory === cat.value }"
          @click="selectCategory(cat.value)"
        >
          {{ cat.label }}
          <span v-if="stats.byCategory[cat.value]" class="count">
            {{ stats.byCategory[cat.value] }}
          </span>
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">总模板数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.official }}</span>
        <span class="stat-label">官方模板</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.community }}</span>
        <span class="stat-label">社区模板</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 模板列表 -->
    <div v-else-if="templates.length > 0" class="templates-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        @click="selectTemplate(template)"
      >
        <div class="template-icon">
          {{ template.icon || '📦' }}
        </div>
        <div class="template-info">
          <h3 class="template-name">
            {{ template.name }}
            <span v-if="template.isOfficial" class="official-badge">官方</span>
          </h3>
          <p class="template-description">{{ template.description || '暂无描述' }}</p>
          <div class="template-meta">
            <span class="category">{{ getCategoryLabel(template.category) }}</span>
            <span v-if="template.version" class="version">v{{ template.version }}</span>
          </div>
          <div class="template-stats">
            <span class="stat">⭐ {{ template.starCount || 0 }}</span>
            <span class="stat">⬇️ {{ template.downloadCount || 0 }}</span>
          </div>
          <div v-if="template.tags && template.tags.length" class="template-tags">
            <span v-for="tag in template.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>😔 没有找到匹配的模板</p>
      <button class="btn-primary" @click="resetFilters">清除筛选</button>
    </div>

    <!-- 创建项目对话框 -->
    <div v-if="showCreateDialog" class="modal-overlay" @click.self="closeCreateDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>从模板创建项目</h2>
          <button class="btn-close" @click="closeCreateDialog">×</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedTemplateData" class="template-preview">
            <div class="preview-icon">{{ selectedTemplateData.icon || '📦' }}</div>
            <div class="preview-info">
              <h3>{{ selectedTemplateData.name }}</h3>
              <p>{{ selectedTemplateData.description }}</p>
            </div>
          </div>

          <div class="form-group">
            <label for="projectName">项目名称 *</label>
            <input
              id="projectName"
              v-model="createForm.projectName"
              type="text"
              placeholder="my-awesome-project"
              required
            />
          </div>

          <div class="form-group">
            <label for="targetPath">目标路径 *</label>
            <div class="path-input">
              <input
                id="targetPath"
                v-model="createForm.targetPath"
                type="text"
                placeholder="选择或输入项目路径"
                required
              />
              <button class="btn-secondary" @click="selectPath">浏览</button>
            </div>
          </div>

          <!-- 模板变量 -->
          <div
            v-if="selectedTemplateData?.variables && selectedTemplateData.variables.length > 0"
            class="variables-section"
          >
            <h4>模板变量</h4>
            <div
              v-for="variable in selectedTemplateData.variables"
              :key="variable.name"
              class="form-group"
            >
              <label :for="variable.name">
                {{ variable.label }}
                <span v-if="variable.required" class="required">*</span>
              </label>
              <input
                v-if="variable.type === 'string' || variable.type === 'number'"
                :id="variable.name"
                v-model="createForm.variables[variable.name]"
                :type="variable.type === 'number' ? 'number' : 'text'"
                :placeholder="variable.description"
                :required="variable.required"
              />
              <select
                v-else-if="variable.type === 'select'"
                :id="variable.name"
                v-model="createForm.variables[variable.name]"
                :required="variable.required"
              >
                <option value="">请选择</option>
                <option v-for="option in variable.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <input
                v-else-if="variable.type === 'boolean'"
                :id="variable.name"
                v-model="createForm.variables[variable.name]"
                type="checkbox"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCreateDialog">取消</button>
          <button
            class="btn-primary"
            :disabled="creating || !isFormValid"
            @click="createProject"
          >
            {{ creating ? '创建中...' : '创建项目' }}
          </button>
        </div>
      </div>
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
const templates = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('all')
const showCreateDialog = ref(false)
const selectedTemplateData = ref<any>(null)
const creating = ref(false)

// 统计信息
const stats = ref({
  total: 0,
  byCategory: {} as Record<string, number>,
  official: 0,
  community: 0
})

// 创建表单
const createForm = reactive({
  projectName: '',
  targetPath: '',
  variables: {} as Record<string, any>
})

// 分类列表
const categories = [
  { value: 'all', label: '全部' },
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'node', label: 'Node.js' },
  { value: 'library', label: '库' },
  { value: 'fullstack', label: '全栈' },
  { value: 'mobile', label: '移动端' },
  { value: 'desktop', label: '桌面端' },
  { value: 'other', label: '其他' }
]

// 获取分类标签
const getCategoryLabel = (value: string) => {
  return categories.find(c => c.value === value)?.label || value
}

// 表单验证
const isFormValid = computed(() => {
  if (!createForm.projectName || !createForm.targetPath) {
    return false
  }

  // 验证必填变量
  if (selectedTemplateData.value?.variables) {
    for (const variable of selectedTemplateData.value.variables) {
      if (variable.required && !createForm.variables[variable.name]) {
        return false
      }
    }
  }

  return true
})

// 加载模板列表
const loadTemplates = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value !== 'all') {
      params.category = selectedCategory.value
    }
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }

    const response = await api.get('/api/templates', { params })
    if (response.success) {
      templates.value = response.data
    }
  }
  catch (error) {
    message.error('加载模板列表失败')
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStats = async () => {
  try {
    const response = await api.get('/api/templates/stats/summary')
    if (response.success) {
      stats.value = response.data
    }
  }
  catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 搜索处理（防抖）
let searchTimer: NodeJS.Timeout | null = null
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    loadTemplates()
  }, 300)
}

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category
  loadTemplates()
}

// 重置筛选
const resetFilters = () => {
  searchKeyword.value = ''
  selectedCategory.value = 'all'
  loadTemplates()
}

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplateData.value = template
  createForm.projectName = ''
  createForm.targetPath = ''
  createForm.variables = {}
  
  // 设置默认值
  if (template.variables) {
    template.variables.forEach((variable: any) => {
      if (variable.defaultValue !== undefined) {
        createForm.variables[variable.name] = variable.defaultValue
      }
    })
  }
  
  showCreateDialog.value = true
}

// 关闭创建对话框
const closeCreateDialog = () => {
  showCreateDialog.value = false
  selectedTemplateData.value = null
}

// 选择路径
const selectPath = async () => {
  try {
    const response = await api.get('/api/system/select-directory')
    if (response.success && response.data.path) {
      createForm.targetPath = response.data.path + '/' + createForm.projectName
    }
  }
  catch (error) {
    console.error('选择路径失败:', error)
  }
}

// 创建项目
const createProject = async () => {
  if (!selectedTemplateData.value || !isFormValid.value) {
    return
  }

  creating.value = true
  try {
    const response = await api.post(
      `/api/templates/${selectedTemplateData.value.id}/create-project`,
      {
        projectName: createForm.projectName,
        targetPath: createForm.targetPath,
        variables: createForm.variables
      }
    )

    if (response.success) {
      message.success('项目创建成功！')
      closeCreateDialog()
      // 刷新模板列表以更新下载次数
      await loadTemplates()
    }
    else {
      message.error(response.message || '创建项目失败')
    }
  }
  catch (error: any) {
    message.error(error.message || '创建项目失败')
    console.error(error)
  }
  finally {
    creating.value = false
  }
}

// 初始化
onMounted(() => {
  loadTemplates()
  loadStats()
})
</script>

<style scoped lang="less">
.template-market {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.market-header {
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

.search-filter {
  margin-bottom: 2rem;
}

.search-box {
  margin-bottom: 1rem;

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--ldesign-border-color);
    border-radius: var(--ls-border-radius-base);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--ldesign-brand-color);
    }
  }
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--ldesign-border-color);
    background: var(--ldesign-bg-color);
    border-radius: var(--ls-border-radius-base);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--ldesign-brand-color);
    }

    &.active {
      background: var(--ldesign-brand-color);
      color: white;
      border-color: var(--ldesign-brand-color);
    }

    .count {
      margin-left: 0.5rem;
      opacity: 0.7;
    }
  }
}

.stats-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--ldesign-bg-color-secondary);
  border-radius: var(--ls-border-radius-base);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--ldesign-brand-color);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--ldesign-text-color-secondary);
    }
  }
}

.loading {
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

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  border: 1px solid var(--ldesign-border-color);
  border-radius: var(--ls-border-radius-base);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--ldesign-bg-color);

  &:hover {
    border-color: var(--ldesign-brand-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.template-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.template-info {
  .template-name {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .official-badge {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      background: var(--ldesign-success-color);
      color: white;
      border-radius: 999px;
    }
  }

  .template-description {
    color: var(--ldesign-text-color-secondary);
    margin: 0 0 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .template-meta {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;

    .category,
    .version {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: var(--ldesign-bg-color-secondary);
      border-radius: var(--ls-border-radius-base);
    }
  }

  .template-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;

    .stat {
      font-size: 0.875rem;
      color: var(--ldesign-text-color-secondary);
    }
  }

  .template-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .tag {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      background: var(--ldesign-bg-color-secondary);
      border-radius: var(--ls-border-radius-base);
      color: var(--ldesign-text-color-secondary);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 0;

  p {
    font-size: 1.25rem;
    color: var(--ldesign-text-color-secondary);
    margin-bottom: 1rem;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--ldesign-bg-color);
  border-radius: var(--ls-border-radius-base);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--ldesign-border-color);

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .btn-close {
    border: none;
    background: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    &:hover {
      background: var(--ldesign-bg-color-secondary);
    }
  }
}

.modal-body {
  padding: 1.5rem;
}

.template-preview {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--ldesign-bg-color-secondary);
  border-radius: var(--ls-border-radius-base);
  margin-bottom: 1.5rem;

  .preview-icon {
    font-size: 3rem;
  }

  .preview-info {
    flex: 1;

    h3 {
      margin: 0 0 0.5rem;
    }

    p {
      margin: 0;
      color: var(--ldesign-text-color-secondary);
      font-size: 0.875rem;
    }
  }
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;

    .required {
      color: var(--ldesign-error-color);
    }
  }

  input,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--ldesign-border-color);
    border-radius: var(--ls-border-radius-base);
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: var(--ldesign-brand-color);
    }
  }

  input[type="checkbox"] {
    width: auto;
  }
}

.path-input {
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
  }
}

.variables-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ldesign-border-color);

  h4 {
    margin: 0 0 1rem;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid var(--ldesign-border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: var(--ls-border-radius-base);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

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

.btn-secondary {
  background: var(--ldesign-bg-color-secondary);
  color: var(--ldesign-text-color-primary);

  &:hover {
    background: var(--ldesign-border-color);
  }
}
</style>


