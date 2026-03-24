import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Vector3, MathUtils } from 'three'
import { type VectorMapData, type Point2D } from '../types/map'

interface RobotProps {
  position: [number, number, number]
  mapData?: VectorMapData
}

// Math helper for line segment intersection
function lineSegmentsIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D) {
  const ccw = (A: Point2D, B: Point2D, C: Point2D) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

export function Robot({ position, mapData }: RobotProps) {
  const robotRef = useRef<Group>(null)
  const currentAngle = useRef(0) // 初始朝向
  
  // 扫地机器人避障移动逻辑 (Vector Raycasting)
  useFrame((_, delta) => {
    if (!robotRef.current || !mapData) return
    
    const speed = 2 * delta // 移动速度
    const lookAheadDist = 0.6 // 前方检测距离
    
    const { x, z } = robotRef.current.position
    
    // 计算前方检测点坐标 (2D Ray)
    const currentPos = { x, y: z }
    const nextPos = {
      x: x + Math.sin(currentAngle.current) * lookAheadDist,
      y: z + Math.cos(currentAngle.current) * lookAheadDist
    }
    
    let isObstacle = false;

    // Check intersection with any wall segment
    for (const room of mapData.rooms) {
      const pts = room.polygon;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        if (lineSegmentsIntersect(currentPos, nextPos, p1, p2)) {
          isObstacle = true;
          break;
        }
      }
      if (isObstacle) break;
    }

    // Check intersection with lights (simple radius check)
    if (!isObstacle) {
      for (const obj of mapData.objects) {
        if (obj.type === 'light') {
          const dx = obj.position.x - nextPos.x;
          const dy = obj.position.y - nextPos.y;
          if (Math.sqrt(dx*dx + dy*dy) < 0.8) {
            isObstacle = true;
            break;
          }
        }
      }
    }
    
    if (isObstacle) {
      // 遇到障碍物，随机旋转一个角度（例如 90 到 180 度之间）
      currentAngle.current += MathUtils.randFloat(Math.PI / 2, Math.PI)
    } else {
      // 无障碍物，沿当前朝向直线移动
      robotRef.current.position.x += Math.sin(currentAngle.current) * speed
      robotRef.current.position.z += Math.cos(currentAngle.current) * speed
    }
    
    // 让机器人朝向移动方向
    const lookAtX = robotRef.current.position.x + Math.sin(currentAngle.current)
    const lookAtZ = robotRef.current.position.z + Math.cos(currentAngle.current)
    robotRef.current.lookAt(new Vector3(lookAtX, robotRef.current.position.y, lookAtZ))
  })

  return (
    <group ref={robotRef} position={new Vector3(...position)}>
      {/* 机器人主体 */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.15, 32]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* 机器人顶部传感器 */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      
      {/* 前方指示灯 */}
      <mesh position={[0, 0, 0.4]}>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}
