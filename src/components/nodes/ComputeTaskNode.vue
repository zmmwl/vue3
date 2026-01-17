<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { ComputeTaskNodeData } from '@/types/flow.types'
import { COMPUTE_TASK_CONFIGS } from '@/types/flow.types'

const props = defineProps<NodeProps<ComputeTaskNodeData>>()

// 获取任务类型配置
const taskConfig = computed(() => {
  return COMPUTE_TASK_CONFIGS[props.data.taskType] || COMPUTE_TASK_CONFIGS.PSI
})

// 输入端口数量（默认2个）
const inputCount = computed(() => props.data.inputCount || 2)

// 输出端口数量（默认1个）
const outputCount = computed(() => props.data.outputCount || 1)

// 生成输入 Handle 列表
const inputHandles = computed(() => {
  return Array.from({ length: inputCount.value }, (_, i) => ({
    id: `input-${i}`,
    position: calculateHandlePosition(i, inputCount.value)
  }))
})

// 生成输出 Handle 列表
const outputHandles = computed(() => {
  return Array.from({ length: outputCount.value }, (_, i) => ({
    id: `output-${i}`,
    position: calculateHandlePosition(i, outputCount.value)
  }))
})

// 计算 Handle 在边上的位置（百分比）
function calculateHandlePosition(index: number, total: number): string {
  if (total === 1) return '50%'
  const padding = 20 // 两端留白百分比
  const range = 100 - 2 * padding
  const step = range / (total - 1)
  return `${padding + index * step}%`
}

// 节点样式类
const nodeClasses = computed(() => ({
  'compute-task-node': true,
  'selected': props.selected,
  [`task-type--${props.data.taskType.toLowerCase()}`]: true
}))

// 节点主体样式（动态边框颜色）
const nodeBodyStyle = computed(() => ({
  '--task-color': taskConfig.value.color
}))
</script>

<template>
  <div :class="nodeClasses">
    <!-- 输入 Handles（顶部，每个独立连接点） -->
    <Handle
      v-for="handle in inputHandles"
      :key="handle.id"
      :id="handle.id"
      type="target"
      :position="Position.Top"
      class="handle handle-input"
      :style="{ left: handle.position }"
    />

    <!-- 节点主体（圆角长方形） -->
    <div class="node-body" :style="nodeBodyStyle">
      <div class="node-icon">
        {{ taskConfig.icon }}
      </div>
      <div class="node-content">
        <div class="node-type-badge">
          {{ data.taskType }}
        </div>
        <div class="node-label">
          {{ data.label || taskConfig.label }}
        </div>
      </div>
    </div>

    <!-- 输出 Handles（底部，每个独立连接点） -->
    <Handle
      v-for="handle in outputHandles"
      :key="handle.id"
      :id="handle.id"
      type="source"
      :position="Position.Bottom"
      class="handle handle-output"
      :style="{ left: handle.position }"
    />
  </div>
</template>

<style lang="scss" scoped>
.compute-task-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;

  .node-body {
    width: var(--compute-node--width);
    height: var(--compute-node--height);
    border-radius: var(--radius--lg);
    background: var(--node--color--background);
    border: var(--node--border-width) solid var(--task-color, var(--node--border-color));
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing--xs);
    padding: 0 var(--spacing--sm);
    transition: all 0.2s ease;
    box-shadow: var(--shadow--sm);
    position: relative;

    &:hover {
      box-shadow: var(--shadow--md);
      transform: translateY(-1px);
    }
  }

  .node-icon {
    font-size: var(--compute-node--icon-size);
    line-height: 1;
    flex-shrink: 0;
  }

  .node-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
  }

  .node-type-badge {
    font-size: 10px;
    font-weight: var(--font-weight--semibold);
    color: var(--color--neutral-white);
    padding: 1px 5px;
    border-radius: var(--radius--sm);
    background: var(--task-color, var(--color--neutral-400));
  }

  .node-label {
    font-size: var(--font-size--xs);
    font-weight: var(--font-weight--medium);
    color: var(--color--neutral-600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70px;
  }

  // 选中状态
  &.selected {
    .node-body {
      border-color: var(--node--border-color--selected);
      border-width: 2px;
      box-shadow: 0 0 0 4px var(--canvas--color--selected);
    }
  }

  // 不同任务类型的样式
  &.task-type--psi .node-body { --task-color: var(--node-type--psi); }
  &.task-type--pir .node-body { --task-color: var(--node-type--pir); }
  &.task-type--mpc .node-body { --task-color: var(--node-type--mpc); }
  &.task-type--fl .node-body { --task-color: var(--node-type--fl); }
}

// Handle 样式
.handle {
  width: var(--handle--size) !important;
  height: var(--handle--size) !important;
  background: var(--handle--color) !important;
  border: var(--handle--border-width) solid var(--handle--border-color) !important;
  border-radius: 50% !important;
  transform: translateX(-50%);
  
  &.handle-input {
    top: -6px !important;
  }
  
  &.handle-output {
    bottom: -6px !important;
  }

  &:hover {
    transform: translateX(-50%) scale(var(--handle--hover-scale));
    border-color: var(--color--neutral-400) !important;
    background: var(--color--neutral-100) !important;
  }
}
</style>
