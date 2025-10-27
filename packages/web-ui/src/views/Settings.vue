<template>
  <n-layout style="height: 100vh">
    <n-layout-header bordered style="height: 64px; padding: 0 24px">
      <h2>设置</h2>
    </n-layout-header>

    <n-layout-content style="padding: 24px">
      <n-card title="主题设置">
        <n-form-item label="深色模式">
          <n-switch v-model:value="themeStore.isDark" />
        </n-form-item>
      </n-card>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutContent, NCard, NFormItem, NSwitch } from 'naive-ui'
import { useThemeStore } from '../store/theme'

const themeStore = useThemeStore()
</script>

