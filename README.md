# 隐私计算可视化任务流程拖拽系统

基于 Vue 3 + VueFlow 的可视化任务流程编排系统，为隐私计算用户提供拖拽式任务图构建能力。

## 功能特性

- **可视化拖拽编排**：通过左侧面板拖拽节点到画布，快速构建任务流程
- **多种节点类型**：
  - 数据源节点（圆形）：数据库、文件、API接口、数据流
  - 计算任务节点（圆角矩形）：PSI、PIR、MPC、FL
- **灵活的连线方式**：
  - 支持多输入多输出
  - 每条连线独立连接点
  - n8n 风格的灰色箭头和圆点端点
- **现代化 UI**：参考 n8n 的浅色配色方案，美观易用

## 技术栈

- Vue 3 (Composition API)
- VueFlow 1.48+
- TypeScript
- Vite
- SCSS

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用指南

### 添加节点

1. 从左侧面板选择需要的节点类型
2. 拖拽到画布中松开即可添加

### 连接节点

1. 从一个节点的输出端点（底部圆点）开始拖拽
2. 连接到另一个节点的输入端点（顶部圆点）

### 删除元素

- 选中节点或连线后按 `Delete` 或 `Backspace` 键删除

### 画布操作

- **平移**：拖拽画布空白区域
- **缩放**：使用鼠标滚轮或底部控制按钮
- **框选**：按住 Shift 拖拽进行框选

## 节点类型说明

### 数据源节点

| 类型 | 图标 | 说明 |
|------|------|------|
| 数据库 | 🗄️ | 关系型或NoSQL数据库 |
| 文件 | 📁 | CSV、Excel等文件数据 |
| API接口 | 🌐 | REST API或其他接口 |
| 数据流 | 📡 | 实时数据流 |

### 计算任务节点

| 类型 | 图标 | 说明 |
|------|------|------|
| PSI | 🔗 | 隐私集合求交 - 安全地计算两个集合的交集 |
| PIR | 🔍 | 隐私信息检索 - 在不暴露查询内容的情况下检索信息 |
| MPC | 🔐 | 多方安全计算 - 多方协作计算而不暴露各自数据 |
| FL | 🤖 | 联邦学习 - 分布式机器学习，数据不出本地 |

## 项目结构

```
src/
├── components/
│   ├── canvas/
│   │   └── TaskCanvas.vue      # 主画布组件
│   ├── nodes/
│   │   ├── DataSourceNode.vue  # 数据源节点
│   │   └── ComputeTaskNode.vue # 计算任务节点
│   ├── edges/
│   │   ├── TaskEdge.vue        # 连线组件
│   │   └── ArrowMarker.vue     # 箭头标记
│   └── sidebar/
│       └── NodePanel.vue       # 节点拖拽面板
├── composables/
│   ├── useCanvasState.ts       # 画布状态管理
│   └── useDragAndDrop.ts       # 拖拽逻辑
├── types/
│   └── flow.types.ts           # 类型定义
├── styles/
│   ├── variables.scss          # CSS 变量
│   ├── vueflow-overrides.scss  # VueFlow 样式覆盖
│   └── main.scss               # 全局样式入口
├── App.vue
└── main.ts
```

## License

MIT
