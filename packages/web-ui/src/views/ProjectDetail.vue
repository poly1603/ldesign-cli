<template>
  <n-layout style="height: 100vh">
    <n-layout-header bordered style="height: 64px; padding: 0 24px">
      <n-space align="center">
        <n-button text @click="$router.back()">← 返回</n-button>
        <h2>{{ projectsStore.currentProject?.name }}</h2>
      </n-space>
    </n-layout-header>

    <n-layout has-sider>
      <n-layout-sider bordered :width="200">
        <n-menu :options="toolMenuOptions" :value="currentTool" @update:value="handleToolSelect" />
      </n-layout-sider>

      <n-layout-content style="padding: 24px">
        <n-spin :show="projectsStore.loading">
          <n-card v-if="projectsStore.currentProject">
            <n-descriptions :column="2">
              <n-descriptions-item label="项目类型">
                {{ projectsStore.currentProject.type }}
              </n-descriptions-item>
              <n-descriptions-item label="框架">
                {{ projectsStore.currentProject.framework || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="包管理器">
                {{ projectsStore.currentProject.packageManager || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="路径">
                {{ projectsStore.currentProject.path }}
              </n-descriptions-item>
            </n-descriptions>

            <n-divider />

            <n-alert type="info" title="工具功能开发中">
              各工具的详细功能页面正在开发中,敬请期待!
            </n-alert>
          </n-card>
        </n-spin>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NSpace,
  NButton,
  NMenu,
  NCard,
  NSpin,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NAlert,
} from 'naive-ui'
import { useProjectsStore } from '../store/projects'

const route = useRoute()
const projectsStore = useProjectsStore()

const currentTool = ref('overview')

const toolMenuOptions: MenuOption[] = [
  { label: '概览', key: 'overview' },
  { label: '🔨 构建', key: 'builder' },
  { label: '🚀 启动', key: 'launcher' },
  { label: '🧪 测试', key: 'tester' },
  { label: '📊 分析', key: 'analyzer' },
  { label: '🌐 部署', key: 'deployer' },
  { label: '📚 文档', key: 'docs' },
  { label: '📦 Git', key: 'git' },
  { label: '📈 监控', key: 'monitor' },
  { label: '🔒 安全', key: 'security' },
  { label: '📦 依赖', key: 'deps' },
]

function handleToolSelect(key: string) {
  currentTool.value = key
}

onMounted(() => {
  const projectId = route.params.id as string
  projectsStore.fetchProject(projectId)
})
</script>

