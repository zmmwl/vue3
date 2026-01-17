<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { EdgeChange } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import DataSourceNode from '../nodes/DataSourceNode.vue'
import ComputeTaskNode from '../nodes/ComputeTaskNode.vue'
import TaskEdge from '../edges/TaskEdge.vue'
import ArrowMarker from '../edges/ArrowMarker.vue'

import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useDynamicHandles } from '@/composables/useDynamicHandles'
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
  onConnectStart,
  onConnectEnd,
  onEdgesChange,
  onNodesChange,
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  getSelectedNodes,
  getSelectedEdges,
  edges,
  updateNodeInternals
} = useVueFlow(CANVAS_ID)

const { getDragData, getNodeDimensions } = useDragAndDrop()

// 动态锚点管理
const { 
  initNodeHandles,
  createInputHandle, 
  updateHandleEdge,
  removeHandleByEdgeId,
  clearNodeHandles,
  cleanupAllUnconnectedHandles,
  startConnecting,
  endConnecting,
  confirmTempHandle,
  handleConnectingMouseMove,
  isConnecting,
  registerUpdateNodeInternals
} = useDynamicHandles()

// 注册 updateNodeInternals 到动态锚点管理中
// 这样当锚点位置变化时，可以通知 Vue Flow 重新计算边的连接点
registerUpdateNodeInternals(updateNodeInternals)

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
  // 初始化节点的动态锚点状态
  initNodeHandles(id)
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
  // 初始化节点的动态锚点状态
  initNodeHandles(id)
  addNodes([{
    id,
    type: 'computeTask',
    position,
    data: {
      label: `${taskType} 任务`,
      taskType,
      inputCount: 0,  // 动态模式下初始为0
      outputCount: 0
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

// 处理连线开始
// 参数类型: { nodeId: string; handleId: string | null; type: 'source' | 'target' }
onConnectStart((params) => {
  if (params?.nodeId) {
    startConnecting(params.nodeId, params.handleId ?? null)
  }
})

// 处理连接建立
onConnect((params) => {
  const edgeId = generateEdgeId()
  
  // 确定目标锚点 ID
  let targetHandleId = params.targetHandle
  
  // 情况1：连接到临时输入锚点，确认它并转为正式锚点
  if (targetHandleId?.startsWith('temp-input-')) {
    const confirmedHandleId = confirmTempHandle(params.target, edgeId)
    if (confirmedHandleId) {
      targetHandleId = confirmedHandleId
    }
  } 
  // 情况2：没有 targetHandle，尝试确认临时 handle 或创建新锚点
  else if (!targetHandleId) {
    const confirmedHandleId = confirmTempHandle(params.target, edgeId)
    if (confirmedHandleId) {
      targetHandleId = confirmedHandleId
    } else {
      targetHandleId = createInputHandle(params.target, edgeId)
    }
  } 
  // 情况3：连接到已有的动态锚点 - 每条边需要独立的锚点，创建新的
  else {
    targetHandleId = createInputHandle(params.target, edgeId)
  }
  
  // 更新源节点的输出锚点关联的边 ID
  if (params.sourceHandle) {
    updateHandleEdge(params.source, params.sourceHandle, edgeId)
  }
  
  const edge: FlowEdge = {
    id: edgeId,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle ?? undefined,
    targetHandle: targetHandleId,
    type: 'taskEdge',
    markerEnd: 'arrow'
  }
  addEdges([edge])
})

// 处理连线结束（无论是否成功）
onConnectEnd(() => {
  // 结束连线状态
  endConnecting()
  // 连线取消时，清理未使用的临时锚点（没有关联边的锚点）
  cleanupAllUnconnectedHandles()
})

// 监听边的变化，处理边删除时的锚点清理
onEdgesChange((changes: EdgeChange[]) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      // 获取被删除的边
      const removedEdge = edges.value.find(e => e.id === change.id)
      if (removedEdge) {
        // 清理源节点的输出锚点
        removeHandleByEdgeId(removedEdge.source, removedEdge.id)
        // 清理目标节点的输入锚点
        removeHandleByEdgeId(removedEdge.target, removedEdge.id)
      }
    }
  })
})

// 监听节点变化，处理节点删除时的锚点清理
onNodesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      // 清理被删除节点的所有锚点状态
      clearNodeHandles(change.id)
    }
  })
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

// 处理画布上的鼠标移动（用于连线时的碰撞检测）
function onCanvasMouseMove(event: MouseEvent) {
  if (isConnecting.value) {
    handleConnectingMouseMove(event.clientX, event.clientY)
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
    @mousemove="onCanvasMouseMove"
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
