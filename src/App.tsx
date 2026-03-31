import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { Scene } from './components/Scene'
import { MapEditor } from './components/MapEditor'
import { Leva, useControls } from 'leva'
import { INITIAL_VECTOR_MAP } from './utils/mapParser'
import { type VectorMapData } from './types/map'
import { Moon, Sun } from 'lucide-react'

function App() {
  const [darkMode, setDarkMode] = useState(false) // 默认恢复明亮模式
  const [mapData, setMapData] = useState<VectorMapData>(INITIAL_VECTOR_MAP)

  // 区分深色和浅色模式的光照强度
  const { ambientIntensity, directionalIntensity } = useControls('Lighting', {
    ambientIntensity: { value: darkMode ? 0.3 : 1.2, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: darkMode ? 0.8 : 2.5, min: 0, max: 5, step: 0.1 },
  }, [darkMode])

  const glassStyle = {
    background: darkMode ? 'var(--glass-bg-dark)' : 'var(--glass-bg-light)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${darkMode ? 'var(--glass-border-dark)' : 'var(--glass-border-light)'}`,
    boxShadow: 'var(--glass-shadow)',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: darkMode ? '#0a0a0a' : '#f0f2f5', transition: 'background 0.8s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}>
      
      {/* 顶部高定 UI 叠加层 */}
      <div style={{ 
        position: 'absolute', top: 24, left: 24, zIndex: 10, 
        color: darkMode ? '#fff' : '#111',
        display: 'flex', flexDirection: 'column', gap: '16px',
        transition: 'color 0.5s ease'
      }}>
        <div style={{
          ...glassStyle,
          padding: '16px 24px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>IsoHome 3D</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.7, fontWeight: 400 }}>Interactive Vibe Code</p>
          </div>
          <div style={{ width: '1px', height: '32px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: darkMode ? '#fff' : '#111',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <Leva 
        collapsed={false} 
        theme={{
          colors: {
            elevation1: darkMode ? '#1a1a1a' : '#ffffff',
            elevation2: darkMode ? '#222' : '#f0f0f0',
            elevation3: darkMode ? '#333' : '#e0e0e0',
            highlight1: '#555',
            highlight2: '#888',
            highlight3: '#f08a5d',
            accent1: '#3388ff',
            accent2: '#3388ff',
            accent3: '#3388ff',
            folderWidgetColor: '#888',
            folderTextColor: darkMode ? '#fff' : '#111',
            toolTipBackground: darkMode ? '#222' : '#fff',
            toolTipText: darkMode ? '#fff' : '#111',
          },
          radii: {
            sm: '6px',
            lg: '12px'
          },
          borderWidths: {
            folder: '1px',
            root: '1px',
            row: '0px'
          },
          fonts: {
            mono: 'var(--font-primary)',
            sans: 'var(--font-primary)'
          },
        }}
      />

      {/* 2D 矢量地图编辑器 */}
      <MapEditor mapData={mapData} onChange={setMapData} darkMode={darkMode} />

      <Canvas 
          shadows 
          camera={{ position: [0, 15, 12], fov: 40 }} 
          gl={{ 
            preserveDrawingBuffer: true, 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false
          }}
        >
        <color attach="background" args={[darkMode ? '#0a0a0a' : '#f0f2f5']} />
        <fog attach="fog" args={[darkMode ? '#0a0a0a' : '#f0f2f5', 20, 60]} />
        
        {/* Lights */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={directionalIntensity} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0001}
        />
        
        <Suspense fallback={null}>
          <Scene darkMode={darkMode} mapData={mapData} />
          {/* Environment provides realistic PBR lighting */}
          <Environment preset={darkMode ? "night" : "city"} background={false} blur={0.8} />
        </Suspense>

        <OrbitControls 
          makeDefault 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}

export default App
