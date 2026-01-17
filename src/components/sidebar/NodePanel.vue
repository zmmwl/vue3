<script setup lang="ts">
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { COMPUTE_TASK_CONFIGS, DATA_SOURCE_CONFIGS } from '@/types/flow.types'
import type { ComputeTaskType, DataSourceType } from '@/types/flow.types'

const { startDragDataSource, startDragComputeTask, endDrag } = useDragAndDrop()

// 数据源列表
const dataSources = Object.values(DATA_SOURCE_CONFIGS)

// 计算任务列表
const computeTasks = Object.values(COMPUTE_TASK_CONFIGS)

// 处理数据源拖拽开始
function onDragStartDataSource(event: DragEvent, type: DataSourceType) {
  startDragDataSource(event, type)
}

// 处理计算任务拖拽开始
function onDragStartComputeTask(event: DragEvent, type: ComputeTaskType) {
  startDragComputeTask(event, type)
}
</script>

<template>
  <aside class="node-panel">
    <div class="panel-header">
      <h2 class="panel-title">节点面板</h2>
    </div>
    
    <div class="panel-content">
      <!-- 数据源分类 -->
      <section class="node-section">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          数据源
        </h3>
        <div class="node-list">
          <div
            v-for="source in dataSources"
            :key="source.type"
            class="node-item data-source-item"
            draggable="true"
            @dragstart="onDragStartDataSource($event, source.type)"
            @dragend="endDrag"
          >
            <div class="node-item-icon" :class="`source-${source.type}`">
              {{ source.icon }}
            </div>
            <div class="node-item-info">
              <span class="node-item-label">{{ source.label }}</span>
              <span class="node-item-desc">{{ source.description }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 计算任务分类 -->
      <section class="node-section">
        <h3 class="section-title">
          <span class="section-icon">⚙️</span>
          计算任务
        </h3>
        <div class="node-list">
          <div
            v-for="task in computeTasks"
            :key="task.type"
            class="node-item compute-task-item"
            draggable="true"
            @dragstart="onDragStartComputeTask($event, task.type)"
            @dragend="endDrag"
          >
            <div class="node-item-icon" :class="`task-${task.type.toLowerCase()}`">
              {{ task.icon }}
            </div>
            <div class="node-item-info">
              <span class="node-item-label">{{ task.label }}</span>
              <span class="node-item-desc">{{ task.description }}</span>
            </div>
            <span class="node-item-badge" :style="{ background: task.color }">
              {{ task.type }}
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- 底部提示 -->
    <div class="panel-footer">
      <p class="tip">拖拽节点到画布中开始编排</p>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.node-panel {
  width: var(--sidebar--width);
  height: 100%;
  background: var(--sidebar--background);
  border-right: 1px solid var(--sidebar--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  padding: var(--spacing--md) var(--spacing--lg);
  border-bottom: 1px solid var(--sidebar--border-color);
}

.panel-title {
  font-size: var(--font-size--lg);
  font-weight: var(--font-weight--semibold);
  color: var(--color--neutral-800);
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing--md);
}

.node-section {
  margin-bottom: var(--spacing--xl);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing--xs);
  font-size: var(--font-size--sm);
  font-weight: var(--font-weight--semibold);
  color: var(--color--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 var(--spacing--sm) 0;
}

.section-icon {
  font-size: var(--font-size--md);
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing--xs);
}

.node-item {
  display: flex;
  align-items: center;
  gap: var(--spacing--sm);
  padding: var(--spacing--sm);
  background: var(--color--neutral-50);
  border: 1px solid var(--color--neutral-200);
  border-radius: var(--radius--lg);
  cursor: grab;
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    background: var(--color--neutral-100);
    border-color: var(--color--neutral-300);
    box-shadow: var(--shadow--sm);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
}

.node-item-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius--lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--color--neutral-white);
  border: 1.5px solid var(--color--neutral-200);
  flex-shrink: 0;

  // 数据源图标颜色
  &.source-database { border-color: var(--node-type--datasource); }
  &.source-file { border-color: #f59e0b; }
  &.source-api { border-color: #10b981; }
  &.source-stream { border-color: #8b5cf6; }

  // 计算任务图标颜色
  &.task-psi { border-color: var(--node-type--psi); }
  &.task-pir { border-color: var(--node-type--pir); }
  &.task-mpc { border-color: var(--node-type--mpc); }
  &.task-fl { border-color: var(--node-type--fl); }
}

.node-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-item-label {
  font-size: var(--font-size--sm);
  font-weight: var(--font-weight--medium);
  color: var(--color--neutral-800);
}

.node-item-desc {
  font-size: var(--font-size--xs);
  color: var(--color--neutral-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-item-badge {
  padding: 2px 6px;
  border-radius: var(--radius--sm);
  font-size: 10px;
  font-weight: var(--font-weight--semibold);
  color: white;
  flex-shrink: 0;
}

.panel-footer {
  padding: var(--spacing--md);
  border-top: 1px solid var(--sidebar--border-color);
  background: var(--color--neutral-50);
}

.tip {
  font-size: var(--font-size--xs);
  color: var(--color--neutral-500);
  text-align: center;
  margin: 0;
}
</style>
