import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { Scene } from './components/Scene'
import { MapEditor } from './components/MapEditor'
import { Leva, useControls } from 'leva'
import { INITIAL_VECTOR_MAP } from './utils/mapParser'
import { type VectorMapData } from './types/map'

function App() {
  const [darkMode, setDarkMode] = useState(true) // 默认恢复深色模式以匹配参考图
  const [mapData, setMapData] = useState<VectorMapData>(INITIAL_VECTOR_MAP)

  const { ambientIntensity, directionalIntensity } = useControls('Lighting', {
    ambientIntensity: { value: 0.8, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 0.5, min: 0, max: 5, step: 0.1 },
  })

  return (
    <div style={{ width: '100vw', height: '100vh', background: darkMode ? '#111' : '#f8f9fa', transition: 'background 0.5s' }}>
      {/* 顶部UI */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: darkMode ? 'white' : 'black' }}>
        <h1>Vibe Code 3D</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#333' : '#fff',
            color: darkMode ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <Leva collapsed={false} />

      {/* 2D 矢量地图编辑器 */}
      <MapEditor mapData={mapData} onChange={setMapData} />

      <Canvas shadows camera={{ position: [0, 15, 10], fov: 45 }}>
        <color attach="background" args={[darkMode ? '#111111' : '#f8f9fa']} />
        
        {/* Lights */}
        <ambientLight intensity={darkMode ? ambientIntensity : ambientIntensity} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={darkMode ? directionalIntensity : directionalIntensity} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        
        <Suspense fallback={null}>
          <Scene darkMode={darkMode} mapData={mapData} />
          {/* Environment provides realistic PBR lighting */}
          <Environment preset={darkMode ? "night" : "apartment"} />
          {/* ContactShadows removed to prevent black block artifacts */}
        </Suspense>

        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  )
}

export default App
