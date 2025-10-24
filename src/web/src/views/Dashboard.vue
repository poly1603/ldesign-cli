<template>
  <n-layout style="height: 100vh">
    <n-layout-header bordered style="height: 64px; padding: 0 24px; display: flex; align-items: center">
      <h2>🎨 LDesign CLI</h2>
      <n-space style="margin-left: auto">
        <n-button @click="themeStore.toggle">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </n-button>
      </n-space>
    </n-layout-header>

    <n-layout has-sider>
      <n-layout-sider bordered :width="200" :collapsed-width="64" show-trigger collapse-mode="width">
        <n-menu :options="menuOptions" :value="currentRoute" @update:value="handleMenuSelect" />
      </n-layout-sider>

      <n-layout-content style="padding: 24px">
        <n-card title="欢迎使用 LDesign CLI">
          <n-space vertical size="large">
            <n-statistic label="项目数量" :value="projectsStore.projects.length" />

            <n-grid cols="3" x-gap="12">
              <n-grid-item>
                <n-card title="快速导入" hoverable @click="handleImport">
                  <template #header-extra>
                    📁
                  </template>
                  导入现有项目
                </n-card>
              </n-grid-item>

              <n-grid-item>
                <n-card title="创建项目" hoverable @click="handleCreate">
                  <template #header-extra>
                    ➕
                  </template>
                  从模板创建新项目
                </n-card>
              </n-grid-item>

              <n-grid-item>
                <n-card title="工具状态" hoverable @click="handleTools">
                  <template #header-extra>
                    🔧
                  </template>
                  查看工具状态
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-space>
        </n-card>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NCard,
  NButton,
  NSpace,
  NStatistic,
  NGrid,
  NGridItem,
} from 'naive-ui'
import { useThemeStore } from '../store/theme'
import { useProjectsStore } from '../store/projects'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const projectsStore = useProjectsStore()

const currentRoute = computed(() => route.path)

const menuOptions: MenuOption[] = [
  {
    label: '仪表板',
    key: '/',
  },
  {
    label: '项目管理',
    key: '/projects',
  },
  {
    label: '工具总览',
    key: '/tools',
  },
  {
    label: '设置',
    key: '/settings',
  },
]

function handleMenuSelect(key: string) {
  router.push(key)
}

function handleImport() {
  router.push('/projects?action=import')
}

function handleCreate() {
  router.push('/projects?action=create')
}

function handleTools() {
  router.push('/tools')
}

onMounted(() => {
  projectsStore.fetchProjects()
})
</script>

