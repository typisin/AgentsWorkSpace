# Tasks

- [x] Task 1: 修复 SVG 内部元素的拖拽事件响应
  - [x] SubTask 1.1: 在 `src/components/MapEditor.tsx` 中，检查外层 `div` 的 `onPointerDownCapture` 和 `onWheelCapture` 的 `e.stopPropagation()` 是否阻断了内部 SVG 元素的事件。
  - [x] SubTask 1.2: 将 `onPointerMove` 和 `onPointerUp` 事件绑定提升到 SVG 的外层容器，或者在 `onPointerDown` 时给 `window` 或 `document` 添加全局事件监听，以确保拖拽过程中的事件不会因为鼠标移出元素而丢失。
- [x] Task 2: 优化拖拽状态更新逻辑
  - [x] SubTask 2.1: 检查 `handlePointerMove` 中的坐标转换（`toWorld`），确保基于客户端坐标（`clientX/Y`）减去 `getBoundingClientRect` 的计算是准确且连续的。
  - [x] SubTask 2.2: 确保在 React 的状态更新中，`onChange` 函数能够实时且正确地反映拖拽产生的新 `mapData`。
