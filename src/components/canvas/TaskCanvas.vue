<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import DataSourceNode from '../nodes/DataSourceNode.vue'
import ComputeTaskNode from '../nodes/ComputeTaskNode.vue'
import TaskEdge from '../edges/TaskEdge.vue'
import ArrowMarker from '../edges/ArrowMarker.vue'

import { useDragAndDrop } from '@/composables/useDragAndDrop'
import type { ComputeTaskType, DataSourceType, FlowEdge } from '@/types/flow.types'

// 画布唯一 ID
const CANVAS_ID = 'privacy-computing-canvas'

// 自定义节点类型
const nodeTypes = {
  dataSource: DataSourceNode,
  computeTask: ComputeTaskNode
}

// 自定义边类型
const edgeTypes = {
  taskEdge: TaskEdge
}

// 生成唯一ID
let nodeIdCounter = 0
let edgeIdCounter = 0

function generateNodeId(prefix: string = 'node'): string {
  return `${prefix}-${++nodeIdCounter}-${Date.now()}`
}

function generateEdgeId(): string {
  return `edge-${++edgeIdCounter}-${Date.now()}`
}

// VueFlow 实例
const { 
  project, 
  onConnect,
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  getSelectedNodes,
  getSelectedEdges
} = useVueFlow(CANVAS_ID)

const { getDragData, getNodeDimensions } = useDragAndDrop()

// 画布容器引用
const canvasWrapper = ref<HTMLElement | null>(null)

// 网格大小
const GRID_SIZE = 20

// 添加数据源节点
function addDataSourceNode(
  position: { x: number; y: number },
  sourceType: DataSourceType
) {
  const id = generateNodeId('datasource')
  addNodes([{
    id,
    type: 'dataSource',
    position,
    data: {
      label: `数据源 ${nodeIdCounter}`,
      sourceType,
    }
  }])
}

// 添加计算任务节点
function addComputeTaskNode(
  position: { x: number; y: number },
  taskType: ComputeTaskType
) {
  const id = generateNodeId('compute')
  addNodes([{
    id,
    type: 'computeTask',
    position,
    data: {
      label: `${taskType} 任务`,
      taskType,
      inputCount: 2,
      outputCount: 1
    }
  }])
}

// 处理拖放
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  
  const dragData = getDragData(event)
  if (!dragData) return

  // 计算画布坐标
  const bounds = canvasWrapper.value?.getBoundingClientRect()
  if (!bounds) return

  // 获取鼠标在画布上的位置
  const canvasPosition = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  // 获取节点尺寸，将节点中心对齐到鼠标位置
  const nodeType = dragData.type as 'dataSource' | 'computeTask'
  const dimensions = getNodeDimensions(nodeType)
  
  // 计算节点左上角位置（鼠标位置减去节点一半的尺寸）
  const position = {
    x: canvasPosition.x - dimensions.width / 2,
    y: canvasPosition.y - dimensions.height / 2
  }

  // 吸附到网格
  position.x = Math.round(position.x / GRID_SIZE) * GRID_SIZE
  position.y = Math.round(position.y / GRID_SIZE) * GRID_SIZE

  // 根据类型添加节点
  if (dragData.type === 'dataSource') {
    const sourceType = (dragData.data as { sourceType?: DataSourceType }).sourceType || 'database'
    addDataSourceNode(position, sourceType)
  } else if (dragData.type === 'computeTask') {
    const taskType = (dragData.data as { taskType?: ComputeTaskType }).taskType || 'PSI'
    addComputeTaskNode(position, taskType)
  }
}

// 处理连接
onConnect((params) => {
  const edge: FlowEdge = {
    id: generateEdgeId(),
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle ?? undefined,
    targetHandle: params.targetHandle ?? undefined,
    type: 'taskEdge',
    markerEnd: 'arrow'
  }
  addEdges([edge])
})

// 删除选中元素
function deleteSelected() {
  const selectedNodeIds = getSelectedNodes.value.map(n => n.id)
  const selectedEdgeIds = getSelectedEdges.value.map(e => e.id)
  
  if (selectedNodeIds.length > 0) {
    removeNodes(selectedNodeIds)
  }
  if (selectedEdgeIds.length > 0) {
    removeEdges(selectedEdgeIds)
  }
}

// 键盘快捷键
function onKeyDown(event: KeyboardEvent) {
  // 确保不是在输入框中
  if ((event.target as HTMLElement).tagName === 'INPUT') return
  
  if (event.key === 'Delete' || event.key === 'Backspace') {
    deleteSelected()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div 
    ref="canvasWrapper" 
    class="canvas-wrapper"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <VueFlow
      :id="CANVAS_ID"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[GRID_SIZE, GRID_SIZE]"
      :connection-radius="30"
      :default-edge-options="{
        type: 'taskEdge',
        markerEnd: 'arrow'
      }"
      fit-view-on-init
      class="task-canvas"
    >
      <!-- SVG Defs for markers -->
      <template #connection-line="{ sourceX, sourceY, targetX, targetY }">
        <g>
          <path
            :d="`M${sourceX},${sourceY} C${sourceX},${(sourceY + targetY) / 2} ${targetX},${(sourceY + targetY) / 2} ${targetX},${targetY}`"
            class="animated-connection-line"
          />
        </g>
      </template>

      <!-- 背景网格 -->
      <Background 
        :gap="GRID_SIZE" 
        pattern-color="var(--canvas--dot--color)"
        :size="1"
      />
      
      <!-- 控制按钮 -->
      <Controls position="bottom-left" />
      
      <!-- 小地图 -->
      <MiniMap 
        position="bottom-right" 
        :pannable="true"
        :zoomable="true"
      />

      <!-- 自定义箭头标记 -->
      <svg style="position: absolute; width: 0; height: 0;">
        <defs>
          <ArrowMarker id="arrow" />
          <ArrowMarker id="arrow-selected" color="var(--color--primary)" />
        </defs>
      </svg>
    </VueFlow>
  </div>
</template>

<style lang="scss" scoped>
.canvas-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
  background: var(--canvas--background);
}

.task-canvas {
  width: 100%;
  height: 100%;
}

.animated-connection-line {
  stroke: var(--edge--color);
  stroke-width: 2px;
  fill: none;
  stroke-dasharray: 5 5;
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
