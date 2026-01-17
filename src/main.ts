import { createApp } from 'vue'
import App from './App.vue'

// VueFlow 样式
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// 全局样式
import './styles/main.scss'

createApp(App).mount('#app')
