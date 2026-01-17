<script setup lang="ts">
import TaskCanvas from './components/canvas/TaskCanvas.vue'
import NodePanel from './components/sidebar/NodePanel.vue'
</script>

<template>
  <div class="app-container">
    <NodePanel />
    <TaskCanvas />
  </div>
</template>

<style lang="scss">
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
