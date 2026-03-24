import { useState } from 'react'
import { useSpring, a } from '@react-spring/three'
import { Vector3 } from 'three'

export function SmartLight({ position }: { position: [number, number, number] }) {
  const [isOn, setOn] = useState(true)

  const { lightIntensity, emissiveColor } = useSpring({
    lightIntensity: isOn ? 2 : 0,
    emissiveColor: isOn ? '#ffaa00' : '#222222',
    config: { mass: 1, tension: 170, friction: 26 }
  })

  return (
    <group position={new Vector3(...position)} onClick={() => setOn(!isOn)}>
      {/* 灯柱 */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* 底座 */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.2]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* 灯罩/发光体 */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <a.meshStandardMaterial 
          color="#ffffff" 
          emissive={emissiveColor}
          emissiveIntensity={2} 
        />
        <a.pointLight 
          intensity={lightIntensity} 
          distance={10} 
          color="#ffaa00" 
          castShadow
        />
      </mesh>
    </group>
  )
}
