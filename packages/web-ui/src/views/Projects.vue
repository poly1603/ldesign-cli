<template>
  <n-layout style="height: 100vh">
    <n-layout-header bordered style="height: 64px; padding: 0 24px">
      <h2>项目管理</h2>
    </n-layout-header>

    <n-layout-content style="padding: 24px">
      <n-space vertical size="large">
        <n-space>
          <n-button type="primary" @click="showImportModal = true">
            📁 导入项目
          </n-button>
          <n-button @click="showCreateModal = true">
            ➕ 创建项目
          </n-button>
          <n-button @click="projectsStore.fetchProjects()">
            🔄 刷新
          </n-button>
        </n-space>

        <n-spin :show="projectsStore.loading">
          <n-grid cols="3" x-gap="12" y-gap="12">
            <n-grid-item v-for="project in projectsStore.projects" :key="project.id">
              <n-card :title="project.name" hoverable @click="handleProjectClick(project.id)">
                <template #header-extra>
                  {{ project.framework || project.type }}
                </template>
                <n-text depth="3">{{ project.path }}</n-text>
              </n-card>
            </n-grid-item>
          </n-grid>

          <n-empty v-if="projectsStore.projects.length === 0" description="暂无项目">
            <template #extra>
              <n-button @click="showImportModal = true">导入项目</n-button>
            </template>
          </n-empty>
        </n-spin>
      </n-space>

      <!-- 导入项目对话框 -->
      <n-modal v-model:show="showImportModal" preset="dialog" title="导入项目">
        <n-form>
          <n-form-item label="项目路径">
            <n-input v-model:value="importPath" placeholder="请输入项目路径" />
          </n-form-item>
        </n-form>
        <template #action>
          <n-button @click="showImportModal = false">取消</n-button>
          <n-button type="primary" @click="handleImport">导入</n-button>
        </template>
      </n-modal>

      <!-- 创建项目对话框 -->
      <n-modal v-model:show="showCreateModal" preset="dialog" title="创建项目">
        <n-form>
          <n-form-item label="项目名称">
            <n-input v-model:value="createForm.name" />
          </n-form-item>
          <n-form-item label="项目路径">
            <n-input v-model:value="createForm.path" />
          </n-form-item>
        </n-form>
        <template #action>
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleCreate">创建</n-button>
        </template>
      </n-modal>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NSpace,
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NSpin,
  NEmpty,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NText,
} from 'naive-ui'
import { useProjectsStore } from '../store/projects'

const router = useRouter()
const message = useMessage()
const projectsStore = useProjectsStore()

const showImportModal = ref(false)
const showCreateModal = ref(false)
const importPath = ref('')
const createForm = ref({
  name: '',
  path: '',
})

function handleProjectClick(id: string) {
  router.push(`/projects/${id}`)
}

async function handleImport() {
  if (!importPath.value) {
    message.error('请输入项目路径')
    return
  }

  try {
    await projectsStore.importProject(importPath.value)
    message.success('项目导入成功')
    showImportModal.value = false
    importPath.value = ''
  } catch (error: any) {
    message.error(error.message || '导入失败')
  }
}

async function handleCreate() {
  // TODO: 实现创建项目
  message.info('创建项目功能开发中...')
}

onMounted(() => {
  projectsStore.fetchProjects()
})
</script>

