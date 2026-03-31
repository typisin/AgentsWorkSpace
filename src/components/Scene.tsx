import { Floor } from './Floor'
import { Walls } from './Walls'
import { SmartLight } from './SmartLight'
import { Robot } from './Robot'
import { Desk, Chair } from './Furniture'
import { useControls } from 'leva'
import { type VectorMapData } from '../types/map'

interface SceneProps {
  darkMode: boolean
  mapData: VectorMapData
}

export function Scene({ darkMode, mapData }: SceneProps) {
  const { wallColor, wallOpacity, floorColor, floorOpacity } = useControls('Environment', {
    wallColor: darkMode ? '#333333' : '#ffffff',
    wallOpacity: { value: 0.35, min: 0, max: 1, step: 0.05 },
    floorColor: darkMode ? '#1a1a1a' : '#f0f0f0',
    floorOpacity: { value: 0.95, min: 0, max: 1, step: 0.05 },
  }, [darkMode])

  // 解析对象数据
  const lights = mapData.objects.filter(obj => obj.type === 'light');
  const desks = mapData.objects.filter(obj => obj.type === 'desk');
  const chairs = mapData.objects.filter(obj => obj.type === 'chair');
  const robot = mapData.objects.find(obj => obj.type === 'robot');

  return (
    <group>
      {/* 房间基座 */}
      <Floor darkMode={darkMode} mapData={mapData} color={floorColor} opacity={floorOpacity} />
      <Walls color={wallColor} opacity={wallOpacity} mapData={mapData} />

      {/* 智能灯具 */}
      {lights.map(light => (
        <SmartLight key={light.id} position={[light.position.x, 0, light.position.y]} />
      ))}
      
      {/* 办公桌 */}
      {desks.map(desk => (
        <Desk key={desk.id} position={[desk.position.x, 0, desk.position.y]} />
      ))}

      {/* 座椅 */}
      {chairs.map(chair => (
        <Chair key={chair.id} position={[chair.position.x, 0, chair.position.y]} />
      ))}
      
      {/* 扫地机器人 */}
      {robot && (
        <Robot position={[robot.position.x, 0.2, robot.position.y]} mapData={mapData} />
      )}
    </group>
  )
}
