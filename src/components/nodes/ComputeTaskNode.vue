<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { ComputeTaskNodeData } from '@/types/flow.types'
import { COMPUTE_TASK_CONFIGS } from '@/types/flow.types'
import { useDynamicHandles } from '@/composables/useDynamicHandles'

const props = defineProps<NodeProps<ComputeTaskNodeData>>()

// 动态锚点管理
const { 
  getInputHandles, 
  getOutputHandles, 
  createOutputHandle,
  getTempInputHandle
} = useDynamicHandles()

// 获取任务类型配置
const taskConfig = computed(() => {
  return COMPUTE_TASK_CONFIGS[props.data.taskType] || COMPUTE_TASK_CONFIGS.PSI
})

// 获取当前节点的动态输入锚点
const inputHandles = getInputHandles(props.id)

// 获取当前节点的动态输出锚点
const outputHandles = getOutputHandles(props.id)

// 获取临时输入 handle（连线悬停时动态生成）
const tempInputHandleId = getTempInputHandle(props.id)

// 是否显示默认的连接点（当没有动态锚点且没有临时锚点时显示）
const showDefaultInputHandle = computed(() => 
  inputHandles.value.length === 0 && !tempInputHandleId.value
)

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

// 点击"+"按钮时，先创建锚点，然后触发其 mousedown 事件
async function onAddBtnMouseDown(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  // 创建新的输出锚点
  const handleId = createOutputHandle(props.id)
  
  // 等待 DOM 更新
  await nextTick()
  
  // 找到新创建的 Handle 元素并触发 mousedown
  const handleElement = document.querySelector(
    `.vue-flow__handle[data-handleid="${handleId}"]`
  ) as HTMLElement
  
  if (handleElement) {
    // 创建并派发 mousedown 事件
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      button: 0
    })
    handleElement.dispatchEvent(mousedownEvent)
  }
}
</script>

<template>
  <div :class="nodeClasses">
    <!-- 默认输入锚点（当没有动态输入锚点时显示，用于接收连线） -->
    <Handle
      v-if="showDefaultInputHandle"
      id="default-input"
      type="target"
      :position="Position.Top"
      class="handle handle-input handle-default"
    />

    <!-- 临时输入锚点（连线悬停时动态生成） -->
    <Handle
      v-if="tempInputHandleId"
      :id="tempInputHandleId"
      type="target"
      :position="Position.Top"
      class="handle handle-input handle-temp"
    />

    <!-- 动态输入锚点（顶部） -->
    <Handle
      v-for="handle in inputHandles"
      :key="handle.id"
      :id="handle.id"
      type="target"
      :position="Position.Top"
      class="handle handle-input handle-dynamic"
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

    <!-- 动态输出锚点（底部） -->
    <Handle
      v-for="handle in outputHandles"
      :key="handle.id"
      :id="handle.id"
      type="source"
      :position="Position.Bottom"
      class="handle handle-output handle-dynamic"
      :style="{ left: handle.position }"
    />

    <!-- 添加连线按钮（十字） - 底部 -->
    <div 
      class="add-connection-btn add-connection-btn--bottom"
      @mousedown="onAddBtnMouseDown"
      title="拖拽添加连线"
    >
      <span class="plus-icon">+</span>
    </div>
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

// 添加连线按钮（十字）
.add-connection-btn {
  position: absolute;
  width: var(--handle-add-btn--size, 20px);
  height: var(--handle-add-btn--size, 20px);
  border-radius: 50%;
  background: var(--color--neutral-white);
  border: 1.5px solid var(--handle-add-btn--color, var(--color--neutral-300));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  transition: all 0.2s ease;
  z-index: 10;
  opacity: 0;
  
  .compute-task-node:hover & {
    opacity: 1;
  }

  &--bottom {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

  .plus-icon {
    font-size: 14px;
    font-weight: bold;
    color: var(--handle-add-btn--color, var(--color--neutral-400));
    line-height: 1;
    user-select: none;
  }

  &:hover {
    border-color: var(--handle-add-btn--hover-color, var(--color--primary));
    background: var(--color--primary-light, #fff0ee);
    transform: translateX(-50%) scale(1.1);
    
    .plus-icon {
      color: var(--handle-add-btn--hover-color, var(--color--primary));
    }
  }

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

// Handle 样式
.handle {
  width: var(--handle--size) !important;
  height: var(--handle--size) !important;
  background: var(--handle--color) !important;
  border: var(--handle--border-width) solid var(--handle--border-color) !important;
  border-radius: 50% !important;
  transition: all 0.15s ease;
  
  &.handle-input {
    top: -6px !important;
    left: 50%;
    transform: translateX(-50%);
  }
  
  &.handle-output {
    bottom: -6px !important;
    left: 50%;
    transform: translateX(-50%);
  }

  // 默认锚点样式（初始时显示，悬停时更明显）
  &.handle-default {
    opacity: 0.5;
    
    .compute-task-node:hover & {
      opacity: 1;
    }
  }

  // 临时锚点样式（连线悬停时动态生成的）
  &.handle-temp {
    opacity: 1;
    background: var(--color--primary-light, #fff0ee) !important;
    border-color: var(--color--primary) !important;
    animation: pulse-handle 0.6s ease-in-out infinite;
  }

  // 动态锚点样式（已建立连接的）
  &.handle-dynamic {
    opacity: 1;
    
    &:hover {
      transform: translateX(-50%) scale(var(--handle--hover-scale));
      border-color: var(--color--neutral-400) !important;
      background: var(--color--neutral-100) !important;
    }
  }
}

// 临时锚点的脉冲动画
@keyframes pulse-handle {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 0 rgba(var(--color--primary-rgb, 255, 87, 51), 0.4);
  }
  50% {
    transform: translateX(-50%) scale(1.2);
    box-shadow: 0 0 0 4px rgba(var(--color--primary-rgb, 255, 87, 51), 0);
  }
}
</style>
