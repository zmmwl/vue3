<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { DataSourceNodeData } from '@/types/flow.types'
import { DATA_SOURCE_CONFIGS } from '@/types/flow.types'

const props = defineProps<NodeProps<DataSourceNodeData>>()

// 获取数据源配置
const sourceConfig = computed(() => {
  return DATA_SOURCE_CONFIGS[props.data.sourceType] || DATA_SOURCE_CONFIGS.database
})

// 节点样式类
const nodeClasses = computed(() => ({
  'data-source-node': true,
  'selected': props.selected,
  [`source-type--${props.data.sourceType}`]: true
}))
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

    <!-- 输出 Handle（底部，圆点样式） -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      class="handle handle-output"
    />
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

// Handle 样式
.handle {
  width: var(--handle--size) !important;
  height: var(--handle--size) !important;
  background: var(--handle--color) !important;
  border: var(--handle--border-width) solid var(--handle--border-color) !important;
  border-radius: 50% !important;
  
  &.handle-output {
    bottom: -6px !important;
  }

  &:hover {
    transform: scale(var(--handle--hover-scale));
    border-color: var(--color--neutral-400) !important;
    background: var(--color--neutral-100) !important;
  }
}
</style>
