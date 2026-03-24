# Tasks

- [x] Task 1: 优化墙体视觉效果
  - [x] SubTask 1.1: 修改 `src/components/Walls.tsx` 中的 `wallFragmentShader`，移除网格（grid）生成代码，保留边缘发光和整体的透明渐变效果。
  - [x] SubTask 1.2: 在 `src/components/Scene.tsx` 中，将 `useControls` 里 `wallColor` 的默认值修改为 `#ffffff`。
- [x] Task 2: 实现机器人避障移动
  - [x] SubTask 2.1: 修改 `src/components/Scene.tsx`，将 `mapData` 作为 prop 传递给 `<Robot />` 组件。
  - [x] SubTask 2.2: 在 `src/components/Robot.tsx` 中接收 `mapData` 属性，并实现 3D 坐标到 2D 网格坐标的转换函数（`worldToGrid`）。
  - [x] SubTask 2.3: 在 `src/components/Robot.tsx` 中修改 `useFrame` 的移动逻辑：让机器人按当前朝向直线移动，并在移动前通过 `worldToGrid` 检查前方一小段距离的网格是否为障碍物（如不等于 `2` 和 `4`）。若遇到障碍物，则随机旋转一个角度后继续移动。
