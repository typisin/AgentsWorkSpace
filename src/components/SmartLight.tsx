import { useState } from 'react'
import { useSpring, a } from '@react-spring/three'
import { Vector3 } from 'three'

export function SmartLight({ position }: { position: [number, number, number] }) {
  const [isOn, setOn] = useState(true)

  const { lightIntensity, emissiveColor, haloOpacity } = useSpring({
    lightIntensity: isOn ? 2.5 : 0,
    emissiveColor: isOn ? '#ffaa00' : '#111111',
    haloOpacity: isOn ? 0.4 : 0,
    config: { mass: 1, tension: 120, friction: 14 }
  })

  return (
    <group position={new Vector3(...position)} onClick={() => setOn(!isOn)} style={{ cursor: 'pointer' }}>
      {/* 灯柱 */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 底座 */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.1]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 灯罩/发光体 */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <a.meshStandardMaterial 
          color="#ffffff" 
          emissive={emissiveColor}
          emissiveIntensity={3} 
        />
        <a.pointLight 
          intensity={lightIntensity} 
          distance={15} 
          color="#ffaa00" 
          castShadow
          shadow-bias={-0.001}
        />
        {/* Glow Halo (Vibe effect) */}
        <a.mesh>
          <sphereGeometry args={[0.35, 32, 32]} />
          <a.meshBasicMaterial 
            color="#ffaa00" 
            transparent 
            opacity={haloOpacity}
            depthWrite={false}
          />
        </a.mesh>
      </mesh>
    </group>
  )
}
