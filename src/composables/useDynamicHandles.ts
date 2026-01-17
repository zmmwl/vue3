// ========================================
// 动态锚点管理 Composable
// 实现类似 n8n 的动态连接点机制
// ========================================

import { reactive, computed } from 'vue'
import type { DynamicHandleInfo } from '@/types/flow.types'

// 全局动态锚点状态存储（使用 reactive 对象而非 Map）
// key: nodeId, value: 该节点的动态锚点信息
const nodeHandlesState = reactive<Record<string, {
  inputHandles: DynamicHandleInfo[]
  outputHandles: DynamicHandleInfo[]
}>>({})

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
}

export function useDynamicHandles() {
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
    nodeHandlesState,
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
    cleanupAllUnconnectedHandles
  }
}
