# 2D 矢量多边形地图与白底模式升级计划

## 1. 目标概述
将当前基于“2D 网格数组 (Tile Grid)”的地图系统，全面升级为“基于矢量多边形 (Vector Polygon)”的地图架构。
实现类似专业户型图软件的交互体验：支持通过拖拽顶点/边来自由调整房间形状；同时 3D 场景将根据这些多边形数据，动态挤出（Extrude）生成连续的墙体和不规则形状的地板。默认主题色切换为“明亮模式（White Mode）”。

## 2. 现状分析
- **数据结构**：当前 `mapData` 是 `number[][]`，用 0,1,2 等数字代表不同图块，导致墙体只能是由一个个正方体拼接而成的“像素风”，视觉效果较差。
- **2D 编辑器**：目前的 `MapEditor` 像是一个像素画板，只能逐格涂抹。
- **3D 渲染**：`Walls.tsx` 和 `Floor.tsx` 都是基于网格坐标渲染标准几何体 (`BoxGeometry`, `PlaneGeometry`)。
- **机器人避障**：当前避障依赖于将机器人坐标转换为网格索引，然后检查数组对应位置的值。

## 3. 核心重构方案

### 3.1 数据结构升级 (`src/types/map.ts`)
引入全新的矢量地图数据结构：
```typescript
export interface Point2D { x: number; y: number }

export interface Room {
  id: string;
  name: string;
  height: number;
  color: string;
  polygon: Point2D[]; // 房间轮廓多边形的顶点集合
}

export interface MapObject {
  id: string;
  type: 'light' | 'robot';
  position: Point2D;
}

export interface VectorMapData {
  rooms: Room[];
  objects: MapObject[];
}
```

### 3.2 2D 蓝图编辑器重写 (`src/components/MapEditor.tsx`)
- 放弃基于 `div` 的网格涂抹方案，改用 `<svg>` 渲染 2D 蓝图。
- **多边形渲染**：遍历 `rooms`，使用 `<polygon>` 标签绘制房间平面。
- **交互逻辑**：
  - 在多边形的每个顶点渲染一个可拖拽的“控制点（Control Handle）”。
  - 监听鼠标事件，支持拖拽顶点来改变多边形形状，并实时更新 `VectorMapData`。
  - （进阶）支持点击选中多边形的某条边并进行整体平移。
- 渲染灯具和机器人图标，支持拖拽改变其位置。

### 3.3 3D 场景渲染适配
- **`Floor.tsx`**：使用 Three.js 的 `Shape` 和 `ShapeGeometry`。遍历每个房间的 `polygon` 生成对应的自定义形状地板。
- **`Walls.tsx`**：放弃 `BoxGeometry` 拼接。遍历每个房间的 `polygon`，沿着多边形的边线生成墙体。可以利用 `ExtrudeGeometry` 将 2D 轮廓挤出为 3D 墙壁，或者通过绘制带有厚度的连续 `BufferGeometry` 实现无缝墙体，彻底解决“像素风”和拼接缝隙问题。
- **`Scene.tsx`**：根据 `objects` 数组动态放置 `SmartLight` 和 `Robot`。

### 3.4 机器人避障算法升级 (`src/components/Robot.tsx`)
- 废弃 `worldToGrid` 的网格检测逻辑。
- 引入**线段相交检测（Raycasting / Segment Intersection）**：
  - 提取所有房间多边形的“边（Edges）”作为物理障碍线段集合。
  - 机器人在移动时，计算前方一小段距离的射线（Ray），判断该射线是否与任何墙体线段相交。
  - 若相交且距离小于阈值，则触发避障转向逻辑。

### 3.5 App 默认状态修改 (`src/App.tsx`)
- 将 `const [darkMode, setDarkMode] = useState(true)` 修改为 `false`。
- 调整灯光和背景色的默认配置，确保在明亮模式下依然有高级的质感和阴影表现。

## 4. 实施步骤 (Todos)
1. **定义基础类型与默认数据**：创建 `types.ts` 并更新 `mapParser.ts`，提供一个包含多边形房间的默认地图数据。
2. **重写 MapEditor**：实现基于 SVG 的交互式多边形编辑器，跑通 2D 数据更新链路。
3. **改造 Floor & Walls 3D 渲染**：利用 `ShapeGeometry` 和 `ExtrudeGeometry` 实现多边形到 3D 实体的转化。
4. **重构 Robot 避障逻辑**：实现基于矢量线段的碰撞检测数学计算。
5. **App 整合与 UI 调整**：切换默认白底模式，联调 2D 编辑器与 3D 视图的实时同步效果。
