import { useMemo } from 'react'
import { Shape } from 'three'
import { type VectorMapData } from '../types/map'

interface FloorProps {
  darkMode: boolean
  mapData: VectorMapData
}

export function Floor({ darkMode, mapData }: FloorProps) {
  const shapes = useMemo(() => {
    return mapData.rooms.map(room => {
      const shape = new Shape();
      if (room.polygon.length > 0) {
        shape.moveTo(room.polygon[0].x, room.polygon[0].y);
        for (let i = 1; i < room.polygon.length; i++) {
          shape.lineTo(room.polygon[i].x, room.polygon[i].y);
        }
        shape.lineTo(room.polygon[0].x, room.polygon[0].y); // Close path
      }
      return { id: room.id, shape };
    });
  }, [mapData]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map(({ id, shape }) => (
        <mesh key={id} receiveShadow position={[0, 0, 0]}>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial 
            color={darkMode ? '#151515' : '#ffffff'} 
            roughness={0.8} 
            metalness={0.2} 
          />
        </mesh>
      ))}
      
      {/* Background Grid Helper */}
      <gridHelper args={[100, 100, '#333333', '#222222']} position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}
