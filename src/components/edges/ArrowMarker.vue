<script setup lang="ts">
// 箭头标记组件
// 参考 n8n 的箭头样式实现
defineProps<{
  id: string
  color?: string
}>()
</script>

<template>
  <marker
    :id="id"
    viewBox="-10 -10 20 20"
    refX="0"
    refY="0"
    markerWidth="12"
    markerHeight="12"
    markerUnits="strokeWidth"
    orient="auto-start-reverse"
  >
    <polyline
      stroke-linecap="round"
      stroke-linejoin="round"
      points="-5,-4 0,0 -5,4"
      stroke-width="1.5"
      :stroke="color || 'var(--edge--color)'"
      :fill="color || 'var(--edge--color)'"
    />
  </marker>
</template>
