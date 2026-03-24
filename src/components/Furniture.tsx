import { Vector3 } from 'three'

interface FurnitureProps {
  position: [number, number, number]
}

export function Desk({ position }: FurnitureProps) {
  return (
    <group position={new Vector3(...position)}>
      {/* 桌面 */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.8]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.6} />
      </mesh>
      {/* 桌腿 */}
      {[-0.7, 0.7].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.375, -0.35]} castShadow>
            <boxGeometry args={[0.05, 0.75, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[x, 0.375, 0.35]} castShadow>
            <boxGeometry args={[0.05, 0.75, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      ))}
      {/* 电脑显示器（装饰） */}
      <mesh position={[0, 0.95, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* 屏幕发光 */}
      <mesh position={[0, 0.95, -0.17]}>
        <planeGeometry args={[0.55, 0.35]} />
        <meshStandardMaterial color="#3388ff" emissive="#3388ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

export function Chair({ position }: FurnitureProps) {
  return (
    <group position={new Vector3(...position)}>
      {/* 坐垫 */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* 靠背 */}
      <mesh position={[0, 0.8, -0.21]} castShadow>
        <boxGeometry args={[0.45, 0.6, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* 支撑柱 */}
      <mesh position={[0, 0.225, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.45]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 滚轮底座 */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  )
}
