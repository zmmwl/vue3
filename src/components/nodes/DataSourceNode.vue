<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { DataSourceNodeData } from '@/types/flow.types'
import { DATA_SOURCE_CONFIGS } from '@/types/flow.types'
import { useDynamicHandles } from '@/composables/useDynamicHandles'

const props = defineProps<NodeProps<DataSourceNodeData>>()

// 动态锚点管理
const { getOutputHandles, createOutputHandle } = useDynamicHandles()

// 获取数据源配置
const sourceConfig = computed(() => {
  return DATA_SOURCE_CONFIGS[props.data.sourceType] || DATA_SOURCE_CONFIGS.database
})

// 获取当前节点的动态输出锚点
const outputHandles = getOutputHandles(props.id)

// 节点样式类
const nodeClasses = computed(() => ({
  'data-source-node': true,
  'selected': props.selected,
  [`source-type--${props.data.sourceType}`]: true
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
    <!-- 节点主体（圆角长方形） -->
    <div class="node-body">
      <div class="node-icon">
        {{ sourceConfig.icon }}
      </div>
      <div class="node-text">
        {{ data.label || sourceConfig.label }}
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

    <!-- 添加连线按钮（十字） -->
    <div 
      class="add-connection-btn"
      @mousedown="onAddBtnMouseDown"
      title="拖拽添加连线"
    >
      <span class="plus-icon">+</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.data-source-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;

  .node-body {
    width: var(--datasource-node--width);
    height: var(--datasource-node--height);
    border-radius: var(--radius--lg);
    background: var(--node--color--background);
    border: var(--node--border-width) solid var(--node--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing--xs);
    padding: 0 var(--spacing--sm);
    transition: all 0.2s ease;
    box-shadow: var(--shadow--sm);

    &:hover {
      border-color: var(--node--border-color--hover);
      box-shadow: var(--shadow--md);
      transform: translateY(-1px);
    }
  }

  .node-icon {
    font-size: var(--datasource-node--icon-size);
    line-height: 1;
    flex-shrink: 0;
  }

  .node-text {
    font-size: var(--font-size--sm);
    font-weight: var(--font-weight--medium);
    color: var(--color--neutral-700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // 选中状态
  &.selected {
    .node-body {
      border-color: var(--node--border-color--selected);
      border-width: 2px;
      box-shadow: 0 0 0 4px var(--canvas--color--selected);
    }
  }

  // 不同数据源类型的颜色
  &.source-type--database .node-body {
    border-color: var(--node-type--datasource);
  }
  
  &.source-type--file .node-body {
    border-color: #f59e0b;
  }
  
  &.source-type--api .node-body {
    border-color: #10b981;
  }
  
  &.source-type--stream .node-body {
    border-color: #8b5cf6;
  }
}

// 添加连线按钮（十字）
.add-connection-btn {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
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
  
  .data-source-node:hover & {
    opacity: 1;
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
  transform: translateX(-50%);
  transition: all 0.15s ease;
  
  &.handle-output {
    bottom: -6px !important;
  }

  // 动态锚点样式
  &.handle-dynamic {
    opacity: 1;
    
    &:hover {
      transform: translateX(-50%) scale(var(--handle--hover-scale));
      border-color: var(--color--neutral-400) !important;
      background: var(--color--neutral-100) !important;
    }
  }
}
</style>
