import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, MeshStandardMaterial, Shape } from 'three'
import { type VectorMapData } from '../types/map'

interface FloorProps {
  darkMode: boolean
  mapData: VectorMapData
  color?: string
  opacity?: number
}

const FLOOR_RENDER_ORDER = 0
const FLOOR_PLANE_OFFSET = 0

interface FloorMeshProps {
  shape: Shape
  color: string
  opacity: number
}

function FloorMesh({ shape, color, opacity }: FloorMeshProps) {
  const materialRef = useRef<MeshStandardMaterial>(null)

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.color.set(color)
    materialRef.current.opacity = opacity
    materialRef.current.transparent = opacity < 1
    materialRef.current.depthWrite = opacity >= 1
    materialRef.current.needsUpdate = true
  }, [color, opacity])

  return (
    <mesh receiveShadow position={[0, 0, FLOOR_PLANE_OFFSET]} renderOrder={FLOOR_RENDER_ORDER}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.15}
        metalness={0.3}
        side={DoubleSide}
        depthTest
        depthWrite={opacity >= 1}
        polygonOffset
        polygonOffsetFactor={0.5}
        polygonOffsetUnits={1}
      />
    </mesh>
  )
}

export function Floor({ darkMode, mapData, color, opacity = 1.0 }: FloorProps) {
  const shapes = useMemo(() => {
    return mapData.rooms.map(room => {
      const shape = new Shape()
      if (room.polygon.length > 0) {
        shape.moveTo(room.polygon[0].x, room.polygon[0].y)
        for (let i = 1; i < room.polygon.length; i++) {
          shape.lineTo(room.polygon[i].x, room.polygon[i].y)
        }
        shape.lineTo(room.polygon[0].x, room.polygon[0].y)
      }
      return { id: room.id, shape }
    })
  }, [mapData])

  const resolvedColor = color ?? (darkMode ? '#151515' : '#ffffff')

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {shapes.map(({ id, shape }) => (
        <FloorMesh key={id} shape={shape} color={resolvedColor} opacity={opacity} />
      ))}
    </group>
  )
}
