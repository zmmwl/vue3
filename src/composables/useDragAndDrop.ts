// ========================================
// 拖拽功能
// ========================================

import { ref } from 'vue'
import type { DragItem, ComputeTaskType, DataSourceType } from '@/types/flow.types'

// 当前拖拽的项
const draggedItem = ref<DragItem | null>(null)

// 节点尺寸配置（与 CSS 变量保持一致）
const NODE_DIMENSIONS = {
  dataSource: { width: 120, height: 56 },
  computeTask: { width: 120, height: 64 }
}

export function useDragAndDrop() {
  // 开始拖拽数据源
  function startDragDataSource(event: DragEvent, sourceType: DataSourceType) {
    if (!event.dataTransfer) return
    
    const item: DragItem = {
      type: 'dataSource',
      data: { sourceType }
    }
    
    draggedItem.value = item
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
    
    // 设置拖拽图像（可选：创建一个透明的占位图）
    const dragImage = document.createElement('div')
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  // 开始拖拽计算任务
  function startDragComputeTask(event: DragEvent, taskType: ComputeTaskType) {
    if (!event.dataTransfer) return
    
    const item: DragItem = {
      type: 'computeTask',
      data: { taskType }
    }
    
    draggedItem.value = item
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
    
    // 设置拖拽图像
    const dragImage = document.createElement('div')
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  // 结束拖拽
  function endDrag() {
    draggedItem.value = null
  }

  // 获取拖拽数据
  function getDragData(event: DragEvent): DragItem | null {
    if (!event.dataTransfer) return null
    
    try {
      const data = event.dataTransfer.getData('application/json')
      return JSON.parse(data) as DragItem
    } catch {
      return null
    }
  }

  // 获取节点尺寸
  function getNodeDimensions(type: 'dataSource' | 'computeTask') {
    return NODE_DIMENSIONS[type]
  }

  return {
    draggedItem,
    startDragDataSource,
    startDragComputeTask,
    endDrag,
    getDragData,
    getNodeDimensions
  }
}
