// ========================================
// 任务流程类型定义
// ========================================

import type { Node, Edge } from '@vue-flow/core'

// 计算任务类型
export type ComputeTaskType = 'PSI' | 'PIR' | 'MPC' | 'FL'

// 数据源类型
export type DataSourceType = 'database' | 'file' | 'api' | 'stream'

// 节点类型
export type FlowNodeType = 'dataSource' | 'computeTask'

// ========================================
// 动态锚点相关类型
// ========================================

// 动态锚点信息
export interface DynamicHandleInfo {
  id: string
  position: string  // 百分比位置，如 "30%"
  connectedEdgeId?: string
}

// 动态锚点状态
export interface DynamicHandleState {
  inputHandles: DynamicHandleInfo[]
  outputHandles: DynamicHandleInfo[]
}

// ========================================
// 节点数据类型
// ========================================

// 数据源节点数据
export interface DataSourceNodeData {
  label: string
  sourceType: DataSourceType
  icon?: string
  description?: string
}

// 计算任务节点数据
export interface ComputeTaskNodeData {
  label: string
  taskType: ComputeTaskType
  icon?: string
  description?: string
  // 输入输出端口数量（保留用于兼容，动态锚点模式下不使用）
  inputCount: number
  outputCount: number
}

// 统一节点数据类型
export type FlowNodeData = DataSourceNodeData | ComputeTaskNodeData

// 自定义节点类型
export type DataSourceNode = Node<DataSourceNodeData, any, 'dataSource'>
export type ComputeTaskNode = Node<ComputeTaskNodeData, any, 'computeTask'>
export type FlowNode = DataSourceNode | ComputeTaskNode

// 自定义边类型
export interface FlowEdgeData {
  label?: string
}

export type FlowEdge = Edge<FlowEdgeData>

// 拖拽项类型
export interface DragItem {
  type: FlowNodeType
  data: Partial<DataSourceNodeData> | Partial<ComputeTaskNodeData>
}

// 任务类型配置
export interface TaskTypeConfig {
  type: ComputeTaskType
  label: string
  color: string
  icon: string
  description: string
}

// 数据源类型配置
export interface DataSourceTypeConfig {
  type: DataSourceType
  label: string
  icon: string
  description: string
}

// 计算任务类型配置映射
export const COMPUTE_TASK_CONFIGS: Record<ComputeTaskType, TaskTypeConfig> = {
  PSI: {
    type: 'PSI',
    label: '隐私集合求交',
    color: 'var(--node-type--psi)',
    icon: '🔗',
    description: '安全地计算两个集合的交集'
  },
  PIR: {
    type: 'PIR',
    label: '隐私信息检索',
    color: 'var(--node-type--pir)',
    icon: '🔍',
    description: '在不暴露查询内容的情况下检索信息'
  },
  MPC: {
    type: 'MPC',
    label: '多方安全计算',
    color: 'var(--node-type--mpc)',
    icon: '🔐',
    description: '多方协作计算而不暴露各自数据'
  },
  FL: {
    type: 'FL',
    label: '联邦学习',
    color: 'var(--node-type--fl)',
    icon: '🤖',
    description: '分布式机器学习，数据不出本地'
  }
}

// 数据源类型配置映射
export const DATA_SOURCE_CONFIGS: Record<DataSourceType, DataSourceTypeConfig> = {
  database: {
    type: 'database',
    label: '数据库',
    icon: '🗄️',
    description: '关系型或NoSQL数据库'
  },
  file: {
    type: 'file',
    label: '文件',
    icon: '📁',
    description: 'CSV、Excel等文件数据'
  },
  api: {
    type: 'api',
    label: 'API接口',
    icon: '🌐',
    description: 'REST API或其他接口'
  },
  stream: {
    type: 'stream',
    label: '数据流',
    icon: '📡',
    description: '实时数据流'
  }
}
