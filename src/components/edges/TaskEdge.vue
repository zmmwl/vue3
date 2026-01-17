<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

// 计算贝塞尔曲线路径（纵向布局优化）
const path = computed(() => {
  // 获取边的路径，使用平滑的贝塞尔曲线
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: Position.Bottom,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: Position.Top,
    curvature: 0.25
  })
  
  return {
    path: edgePath,
    labelX,
    labelY
  }
})

// 边的样式类
const edgeClasses = computed(() => ({
  'task-edge': true,
  'selected': props.selected
}))

// 边的样式
const edgeStyle = computed(() => ({
  stroke: props.selected ? 'var(--edge--color--selected)' : 'var(--edge--color)',
  strokeWidth: props.selected ? '2.5px' : 'var(--edge--stroke-width)'
}))

// 起点圆点样式
const sourceCircleStyle = computed(() => ({
  cx: props.sourceX,
  cy: props.sourceY,
  fill: props.selected ? 'var(--edge--color--selected)' : 'var(--edge--color)'
}))
</script>

<template>
  <g :class="edgeClasses">
    <!-- 起点圆点 -->
    <circle
      r="4"
      :cx="sourceCircleStyle.cx"
      :cy="sourceCircleStyle.cy"
      :fill="sourceCircleStyle.fill"
      class="edge-source-dot"
    />
    
    <!-- 连线路径 -->
    <BaseEdge
      :id="id"
      :path="path.path"
      :style="edgeStyle"
      :marker-end="`url(#${selected ? 'arrow-selected' : 'arrow'})`"
      :interaction-width="20"
    />
    
    <!-- 边标签（可选） -->
    <EdgeLabelRenderer v-if="data?.label">
      <div
        class="edge-label"
        :style="{
          transform: `translate(-50%, -50%) translate(${path.labelX}px, ${path.labelY}px)`,
          pointerEvents: 'all'
        }"
      >
        {{ data.label }}
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<style lang="scss" scoped>
.task-edge {
  .edge-source-dot {
    transition: fill 0.15s ease;
  }

  &.selected {
    .edge-source-dot {
      r: 5;
    }
  }
  
  &:hover {
    .edge-source-dot {
      fill: var(--edge--color--hover);
    }
  }
}

.edge-label {
  position: absolute;
  background: var(--color--neutral-white);
  padding: 2px 6px;
  border-radius: var(--radius--sm);
  font-size: var(--font-size--xs);
  color: var(--color--neutral-600);
  border: 1px solid var(--color--neutral-200);
  white-space: nowrap;
}
</style>
