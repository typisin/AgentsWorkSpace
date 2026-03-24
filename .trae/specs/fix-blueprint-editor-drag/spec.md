# Fix Blueprint Editor Drag Spec

## Why
目前 2D 蓝图编辑器（Blueprint Editor）中的元素（房间、顶点、物品）虽然绑定了 `pointerEvents` 和事件监听，但在实际使用中依然无法被正确拖拽和编辑。这导致用户无法规划整体的房间布局和家具、台灯的位置，严重影响了核心功能的可用性。需要排查并修复导致拖拽失效的事件绑定、坐标计算或 React 状态更新问题。

## What Changes
- 修复 `MapEditor.tsx` 中 `onPointerMove` 和 `onPointerUp` 等事件在 SVG 元素上的绑定和冒泡逻辑。
- 确保全局或父级容器（如外层 `div` 或 `window`）能够正确捕获和处理拖拽过程中的指针移动和抬起事件。
- 检查坐标转换函数（`toWorld` 和 `toSvg`）在拖拽过程中的精度和边界处理。

## Impact
- Affected specs: 2D 蓝图编辑器的交互体验（拖拽房间、顶点、物品）
- Affected code: `src/components/MapEditor.tsx`

## ADDED Requirements
### Requirement: Robust Drag and Drop
系统必须提供稳定且跟手的 2D 元素拖拽功能，不受鼠标移动速度或脱离元素边界的限制。

#### Scenario: Success case
- **WHEN** 用户在蓝图编辑器中按下并拖动房间多边形、顶点或物品图标
- **THEN** 该元素应紧随鼠标移动，释放鼠标后更新其在 3D 场景中的对应位置。
