// ========================================
// 动态锚点管理 Composable
// 实现类似 n8n 的动态连接点机制
// ========================================

import { reactive, computed, ref, nextTick } from 'vue'
import type { DynamicHandleInfo } from '@/types/flow.types'

// 全局动态锚点状态存储（使用 reactive 对象而非 Map）
// key: nodeId, value: 该节点的动态锚点信息
const nodeHandlesState = reactive<Record<string, {
  inputHandles: DynamicHandleInfo[]
  outputHandles: DynamicHandleInfo[]
}>>({})

// 存储 updateNodeInternals 函数的引用（由 TaskCanvas 注册）
let updateNodeInternalsFunc: ((nodeId: string | string[]) => void) | null = null

// ========================================
// 连线状态管理（用于动态生成目标 handle）
// ========================================

// 是否正在连线中
const isConnecting = ref(false)

// 当前连线的源节点信息
const connectingSource = ref<{
  nodeId: string
  handleId: string | null
} | null>(null)

// 当前悬停的目标节点（用于动态显示 handle）
const hoveringTargetNodeId = ref<string | null>(null)

// 临时输入 handle（连线悬停时显示的）
const tempInputHandle = ref<{
  nodeId: string
  handleId: string
} | null>(null)

// 存储所有节点的 DOM 边界信息（用于连线时的碰撞检测）
const nodesBounds = reactive<Record<string, DOMRect>>({})

// 生成唯一的 handle ID
let handleIdCounter = 0
function generateHandleId(type: 'input' | 'output'): string {
  return `${type}-dynamic-${++handleIdCounter}-${Date.now()}`
}

// 计算锚点位置（均匀分布）
function calculateHandlePositions(count: number): string[] {
  if (count === 0) return []
  if (count === 1) return ['50%']
  const padding = 20 // 上下边距百分比
  const range = 100 - 2 * padding
  return Array.from({ length: count }, (_, i) => {
    const pos = padding + (range / (count - 1)) * i
    return `${pos}%`
  })
}

// 重新计算并更新节点锚点位置
function recalculatePositions(nodeId: string) {
  const nodeHandles = nodeHandlesState[nodeId]
  if (!nodeHandles) return

  const inputPositions = calculateHandlePositions(nodeHandles.inputHandles.length)
  const outputPositions = calculateHandlePositions(nodeHandles.outputHandles.length)

  nodeHandles.inputHandles.forEach((handle, index) => {
    handle.position = inputPositions[index]
  })

  nodeHandles.outputHandles.forEach((handle, index) => {
    handle.position = outputPositions[index]
  })

  // 通知 Vue Flow 节点内部发生变化，强制重新计算边的连接点
  // 需要等待 DOM 更新后再触发
  nextTick(() => {
    if (updateNodeInternalsFunc) {
      updateNodeInternalsFunc(nodeId)
    }
  })
}

export function useDynamicHandles() {
  // 注册 updateNodeInternals 函数（由 TaskCanvas 调用）
  function registerUpdateNodeInternals(fn: (nodeId: string | string[]) => void) {
    updateNodeInternalsFunc = fn
  }

  // 初始化节点的锚点状态
  function initNodeHandles(nodeId: string) {
    if (!nodeHandlesState[nodeId]) {
      nodeHandlesState[nodeId] = {
        inputHandles: [],
        outputHandles: []
      }
    }
  }

  // 获取节点的输入锚点（返回 computed 以保持响应式）
  function getInputHandles(nodeId: string) {
    initNodeHandles(nodeId)
    return computed(() => nodeHandlesState[nodeId]?.inputHandles || [])
  }

  // 获取节点的输出锚点（返回 computed 以保持响应式）
  function getOutputHandles(nodeId: string) {
    initNodeHandles(nodeId)
    return computed(() => nodeHandlesState[nodeId]?.outputHandles || [])
  }

  // ========================================
  // 连线状态管理
  // ========================================

  // 开始连线
  function startConnecting(sourceNodeId: string, sourceHandleId: string | null) {
    isConnecting.value = true
    connectingSource.value = {
      nodeId: sourceNodeId,
      handleId: sourceHandleId
    }
  }

  // 结束连线
  function endConnecting() {
    isConnecting.value = false
    connectingSource.value = null
    hoveringTargetNodeId.value = null
    tempInputHandle.value = null
  }

  // 设置悬停的目标节点（当连线拖拽到节点上方时）
  function setHoveringTarget(nodeId: string | null) {
    // 不能连接到源节点自身
    if (nodeId && connectingSource.value?.nodeId === nodeId) {
      return
    }
    
    // 如果离开了之前悬停的节点，清理临时 handle
    if (hoveringTargetNodeId.value && hoveringTargetNodeId.value !== nodeId) {
      tempInputHandle.value = null
    }
    
    hoveringTargetNodeId.value = nodeId
    
    // 如果悬停到新节点，创建临时输入 handle
    if (nodeId && isConnecting.value) {
      const handleId = `temp-input-${nodeId}-${Date.now()}`
      tempInputHandle.value = {
        nodeId,
        handleId
      }
    }
  }

  // 获取节点是否正在被悬停（连线过程中）
  function isNodeHovered(nodeId: string) {
    return computed(() => 
      isConnecting.value && hoveringTargetNodeId.value === nodeId
    )
  }

  // 获取节点的临时输入 handle（连线悬停时显示）
  function getTempInputHandle(nodeId: string) {
    return computed(() => 
      tempInputHandle.value?.nodeId === nodeId ? tempInputHandle.value.handleId : null
    )
  }

  // 确认临时 handle（连线成功时将临时 handle 转为正式 handle）
  function confirmTempHandle(nodeId: string, edgeId: string): string | null {
    if (tempInputHandle.value?.nodeId === nodeId) {
      const handleId = tempInputHandle.value.handleId
      // 将临时 handle 转为正式的动态 handle
      initNodeHandles(nodeId)
      nodeHandlesState[nodeId].inputHandles.push({
        id: handleId,
        position: '50%',
        connectedEdgeId: edgeId
      })
      recalculatePositions(nodeId)
      tempInputHandle.value = null
      return handleId
    }
    return null
  }

  // 注册节点的 DOM 边界（节点挂载时调用）
  function registerNodeBounds(nodeId: string, element: HTMLElement | null) {
    if (element) {
      nodesBounds[nodeId] = element.getBoundingClientRect()
    }
  }

  // 更新所有节点的边界（画布滚动/缩放时调用）
  function updateAllNodeBounds() {
    document.querySelectorAll('.vue-flow__node').forEach((el) => {
      const nodeId = el.getAttribute('data-id')
      if (nodeId) {
        nodesBounds[nodeId] = el.getBoundingClientRect()
      }
    })
  }

  // 根据鼠标坐标检测悬停的节点
  function detectHoveredNode(clientX: number, clientY: number): string | null {
    // 更新所有节点边界
    updateAllNodeBounds()
    
    // 源节点不能作为目标
    const sourceNodeId = connectingSource.value?.nodeId
    
    for (const [nodeId, bounds] of Object.entries(nodesBounds)) {
      if (nodeId === sourceNodeId) continue
      
      // 扩大检测范围，让连线更容易触发
      const padding = 20
      if (
        clientX >= bounds.left - padding &&
        clientX <= bounds.right + padding &&
        clientY >= bounds.top - padding &&
        clientY <= bounds.bottom + padding
      ) {
        return nodeId
      }
    }
    return null
  }

  // 处理连线过程中的鼠标移动（由 canvas 调用）
  function handleConnectingMouseMove(clientX: number, clientY: number) {
    if (!isConnecting.value) return
    
    const hoveredNodeId = detectHoveredNode(clientX, clientY)
    
    if (hoveredNodeId !== hoveringTargetNodeId.value) {
      setHoveringTarget(hoveredNodeId)
    }
  }

  // 创建输出锚点（当从节点拖出连线时）
  function createOutputHandle(nodeId: string, edgeId?: string): string {
    initNodeHandles(nodeId)
    
    const handleId = generateHandleId('output')
    nodeHandlesState[nodeId].outputHandles.push({
      id: handleId,
      position: '50%',
      connectedEdgeId: edgeId
    })
    
    recalculatePositions(nodeId)
    return handleId
  }

  // 创建输入锚点（当连线连入节点时）
  function createInputHandle(nodeId: string, edgeId?: string): string {
    initNodeHandles(nodeId)
    
    const handleId = generateHandleId('input')
    nodeHandlesState[nodeId].inputHandles.push({
      id: handleId,
      position: '50%',
      connectedEdgeId: edgeId
    })
    
    recalculatePositions(nodeId)
    return handleId
  }

  // 更新锚点的关联边 ID
  function updateHandleEdge(nodeId: string, handleId: string, edgeId: string) {
    const nodeHandles = nodeHandlesState[nodeId]
    if (!nodeHandles) return

    const inputHandle = nodeHandles.inputHandles.find(h => h.id === handleId)
    if (inputHandle) {
      inputHandle.connectedEdgeId = edgeId
      return
    }

    const outputHandle = nodeHandles.outputHandles.find(h => h.id === handleId)
    if (outputHandle) {
      outputHandle.connectedEdgeId = edgeId
    }
  }

  // 删除锚点（当连线被删除时）
  function removeHandle(nodeId: string, handleId: string) {
    const nodeHandles = nodeHandlesState[nodeId]
    if (!nodeHandles) return

    const inputIndex = nodeHandles.inputHandles.findIndex(h => h.id === handleId)
    if (inputIndex !== -1) {
      nodeHandles.inputHandles.splice(inputIndex, 1)
      recalculatePositions(nodeId)
      return
    }

    const outputIndex = nodeHandles.outputHandles.findIndex(h => h.id === handleId)
    if (outputIndex !== -1) {
      nodeHandles.outputHandles.splice(outputIndex, 1)
      recalculatePositions(nodeId)
    }
  }

  // 根据边 ID 删除锚点
  function removeHandleByEdgeId(nodeId: string, edgeId: string) {
    const nodeHandles = nodeHandlesState[nodeId]
    if (!nodeHandles) return

    const inputIndex = nodeHandles.inputHandles.findIndex(h => h.connectedEdgeId === edgeId)
    if (inputIndex !== -1) {
      nodeHandles.inputHandles.splice(inputIndex, 1)
      recalculatePositions(nodeId)
    }

    const outputIndex = nodeHandles.outputHandles.findIndex(h => h.connectedEdgeId === edgeId)
    if (outputIndex !== -1) {
      nodeHandles.outputHandles.splice(outputIndex, 1)
      recalculatePositions(nodeId)
    }
  }

  // 清除节点的所有锚点
  function clearNodeHandles(nodeId: string) {
    delete nodeHandlesState[nodeId]
  }

  // 清除所有锚点状态
  function clearAllHandles() {
    Object.keys(nodeHandlesState).forEach(key => {
      delete nodeHandlesState[key]
    })
  }

  // 获取节点是否有任何连接
  function hasConnections(nodeId: string): boolean {
    const nodeHandles = nodeHandlesState[nodeId]
    if (!nodeHandles) return false
    return nodeHandles.inputHandles.length > 0 || nodeHandles.outputHandles.length > 0
  }

  // 获取节点的输入连接数
  function getInputCount(nodeId: string): number {
    return nodeHandlesState[nodeId]?.inputHandles.length ?? 0
  }

  // 获取节点的输出连接数
  function getOutputCount(nodeId: string): number {
    return nodeHandlesState[nodeId]?.outputHandles.length ?? 0
  }

  // 清理没有关联边的锚点（连线取消时调用）
  function cleanupUnconnectedHandles(nodeId: string) {
    const nodeHandles = nodeHandlesState[nodeId]
    if (!nodeHandles) return

    // 清理没有 connectedEdgeId 的输出锚点
    const outputsToRemove = nodeHandles.outputHandles
      .filter(h => !h.connectedEdgeId)
      .map(h => h.id)
    
    outputsToRemove.forEach(id => {
      const index = nodeHandles.outputHandles.findIndex(h => h.id === id)
      if (index !== -1) {
        nodeHandles.outputHandles.splice(index, 1)
      }
    })

    // 清理没有 connectedEdgeId 的输入锚点
    const inputsToRemove = nodeHandles.inputHandles
      .filter(h => !h.connectedEdgeId)
      .map(h => h.id)
    
    inputsToRemove.forEach(id => {
      const index = nodeHandles.inputHandles.findIndex(h => h.id === id)
      if (index !== -1) {
        nodeHandles.inputHandles.splice(index, 1)
      }
    })

    recalculatePositions(nodeId)
  }

  // 清理所有节点中没有关联边的锚点
  function cleanupAllUnconnectedHandles() {
    Object.keys(nodeHandlesState).forEach(nodeId => {
      cleanupUnconnectedHandles(nodeId)
    })
  }

  return {
    // 状态
    nodeHandlesState,
    isConnecting,
    connectingSource,
    hoveringTargetNodeId,
    tempInputHandle,
    
    // 节点锚点管理
    initNodeHandles,
    getInputHandles,
    getOutputHandles,
    createOutputHandle,
    createInputHandle,
    updateHandleEdge,
    removeHandle,
    removeHandleByEdgeId,
    clearNodeHandles,
    clearAllHandles,
    hasConnections,
    getInputCount,
    getOutputCount,
    cleanupUnconnectedHandles,
    cleanupAllUnconnectedHandles,
    
    // 连线状态管理
    startConnecting,
    endConnecting,
    setHoveringTarget,
    isNodeHovered,
    getTempInputHandle,
    confirmTempHandle,
    
    // 碰撞检测
    registerNodeBounds,
    updateAllNodeBounds,
    detectHoveredNode,
    handleConnectingMouseMove,
    
    // Vue Flow 集成
    registerUpdateNodeInternals
  }
}
