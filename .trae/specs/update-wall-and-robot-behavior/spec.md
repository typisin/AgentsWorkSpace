# Update Wall Style and Robot Behavior Spec

## Why
提升3D场景的视觉美感，使墙体更加简洁（无网格、白色透明），并增强扫地机器人的真实感，使其具备物理碰撞检测和避障能力。

## What Changes
- 移除 `Walls.tsx` 中的 Shader 网格渲染逻辑。
- 将 `Scene.tsx` 中的默认墙体颜色修改为白色 `#ffffff`。
- 修改 `Robot.tsx`，将环境地图数据 `mapData` 传入其中。
- 在 `Robot.tsx` 的 `useFrame` 中实现基于 2D 地图网格的前方碰撞检测，遇到障碍物（墙体、灯等）自动转向。

## Impact
- Affected specs: 墙体渲染视觉效果，机器人移动逻辑
- Affected code: 
  - `src/components/Walls.tsx`
  - `src/components/Scene.tsx`
  - `src/components/Robot.tsx`

## ADDED Requirements
### Requirement: Robot Collision Avoidance
系统必须为扫地机器人提供基于地图网格的避障功能。

#### Scenario: Success case
- **WHEN** 机器人在移动过程中前方遇到不可行走的网格（如墙体或灯具）
- **THEN** 机器人检测到障碍物，停止前进并改变移动方向（随机转向或按照特定逻辑避开）。

## MODIFIED Requirements
### Requirement: Wall Aesthetics
墙体材质不再显示网格，呈现纯粹的半透明发光效果，且默认颜色设为白色。
