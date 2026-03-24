import { useRef, useMemo, useEffect } from 'react'
import { DoubleSide, ShaderMaterial, Color, Shape } from 'three'
import { useFrame } from '@react-three/fiber'
import { WALL_HEIGHT, WALL_THICKNESS } from '../utils/mapParser'
import { type VectorMapData, type Point2D } from '../types/map'

const wallVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const wallFragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    // Top edge highlight (vUv.y approaches 1.0)
    float topEdge = smoothstep(0.98, 1.0, vUv.y);
    
    // Side edges highlight (vUv.x approaches 0.0 or 1.0)
    float sideEdge = smoothstep(0.02, 0.0, vUv.x) + smoothstep(0.98, 1.0, vUv.x);
    
    // Combine edges
    float edges = max(topEdge, sideEdge);
    
    // Use uniform color and opacity
    vec3 baseColor = color; 
    float baseAlpha = opacity;
    
    // Edge color (bright white)
    vec3 edgeColor = vec3(1.0, 1.0, 1.0);
    float edgeAlpha = edges * 0.4;
    
    // Final composite
    vec3 finalColor = mix(baseColor, edgeColor, edges);
    float finalAlpha = max(baseAlpha, edgeAlpha);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`

interface WallsProps {
  color: string
  opacity: number
  mapData: VectorMapData
}

interface WallGeometry {
  id: string
  shape: Shape
}

export function Walls({ color, opacity, mapData }: WallsProps) {
  const threeColor = useMemo(() => new Color(color), [color])

  // Extract wall positions and handle doors
  const wallGeometries = useMemo<WallGeometry[]>(() => {
    return mapData.rooms.reduce<WallGeometry[]>((acc, room) => {
      const pts = room.polygon;
      if (pts.length < 3) return acc;

      const outerPts: Point2D[] = [];
      const innerPts: Point2D[] = [];

      const getOffsetPoint = (p1: Point2D, p2: Point2D, p3: Point2D, offset: number): Point2D => {
        const dx1 = p2.x - p1.x; const dy1 = p2.y - p1.y;
        const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        const nx1 = -dy1/len1; const ny1 = dx1/len1;

        const dx2 = p3.x - p2.x; const dy2 = p3.y - p2.y;
        const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        const nx2 = -dy2/len2; const ny2 = dx2/len2;

        let nx = nx1 + nx2; let ny = ny1 + ny2;
        const len = Math.sqrt(nx*nx + ny*ny);
        if (len > 0) { nx /= len; ny /= len; }
        else { nx = nx1; ny = ny1; }

        return { x: p2.x + nx * offset, y: p2.y + ny * offset };
      };

      // Pre-calculate all offset points
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[(i - 1 + pts.length) % pts.length];
        const p2 = pts[i];
        const p3 = pts[(i + 1) % pts.length];
        outerPts.push(getOffsetPoint(p1, p2, p3, WALL_THICKNESS / 2));
        innerPts.push(getOffsetPoint(p1, p2, p3, -WALL_THICKNESS / 2));
      }

      // Helper to project a point onto a line segment and return the ratio t [0, 1]
      const getProjectionRatio = (p: Point2D, s1: Point2D, s2: Point2D): number => {
        const dx = s2.x - s1.x; const dy = s2.y - s1.y;
        const lenSq = dx*dx + dy*dy;
        if (lenSq === 0) return 0;
        const t = ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / lenSq;
        return Math.max(0, Math.min(1, t));
      };

      const getDistanceToSegment = (p: Point2D, s1: Point2D, s2: Point2D): number => {
        const dx = s2.x - s1.x; const dy = s2.y - s1.y;
        const t = getProjectionRatio(p, s1, s2);
        const projX = s1.x + t * dx; const projY = s1.y + t * dy;
        return Math.sqrt(Math.pow(p.x - projX, 2) + Math.pow(p.y - projY, 2));
      };

      // Create segments, skipping door areas
      const DOOR_WIDTH = 1.0;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        const p1 = pts[i];
        const p2 = pts[j];
        const segLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

        // Find all doors on this segment
        const segmentDoors = mapData.objects
          .filter(obj => obj.type === 'door' && getDistanceToSegment(obj.position, p1, p2) < 0.3)
          .map(door => ({
            t: getProjectionRatio(door.position, p1, p2),
            widthT: (DOOR_WIDTH / 2) / segLen
          }))
          .sort((a, b) => a.t - b.t);

        // Generate sub-segments
        let currentT = 0;
        for (const door of segmentDoors) {
          const doorStartT = Math.max(0, door.t - door.widthT);
          const doorEndT = Math.min(1, door.t + door.widthT);

          if (doorStartT > currentT) {
            // Create wall part before the door
            const shape = new Shape();
            const lerp = (a: Point2D, b: Point2D, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
            
            const o1 = lerp(outerPts[i], outerPts[j], currentT);
            const o2 = lerp(outerPts[i], outerPts[j], doorStartT);
            const i2 = lerp(innerPts[i], innerPts[j], doorStartT);
            const i1 = lerp(innerPts[i], innerPts[j], currentT);

            shape.moveTo(o1.x, o1.y);
            shape.lineTo(o2.x, o2.y);
            shape.lineTo(i2.x, i2.y);
            shape.lineTo(i1.x, i1.y);
            shape.closePath();
            acc.push({ id: `${room.id}-${i}-${currentT}`, shape });
          }
          currentT = doorEndT;
        }

        // Final part after all doors on this segment
        if (currentT < 1) {
          const shape = new Shape();
          const lerp = (a: Point2D, b: Point2D, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
          
          const o1 = lerp(outerPts[i], outerPts[j], currentT);
          const o2 = outerPts[j];
          const i2 = innerPts[j];
          const i1 = lerp(innerPts[i], innerPts[j], currentT);

          shape.moveTo(o1.x, o1.y);
          shape.lineTo(o2.x, o2.y);
          shape.lineTo(i2.x, i2.y);
          shape.lineTo(i1.x, i1.y);
          shape.closePath();
          acc.push({ id: `${room.id}-${i}-${currentT}`, shape });
        }
      }
      return acc;
    }, []);
  }, [mapData]);

  const extrudeSettings = {
    depth: -WALL_HEIGHT,
    bevelEnabled: false,
  };

  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
      {wallGeometries.map((wg) => (
        <mesh key={wg.id} castShadow receiveShadow>
          <extrudeGeometry args={[wg.shape, extrudeSettings]} />
          {/* Top/Bottom Cap */}
          <meshStandardMaterial attach="material-0" color={threeColor} transparent opacity={opacity} depthWrite={false} side={DoubleSide} />
          {/* Sides */}
          <WallMaterial attach="material-1" color={threeColor} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function WallMaterial({ color, opacity, attach }: { color: Color, opacity: number, attach: string }) {
  const materialRef = useRef<ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    color: { value: color.clone() },
    opacity: { value: opacity }
  }), [color, opacity])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.opacity.value = opacity
      materialRef.current.needsUpdate = true
    }
  }, [color, opacity])

  return (
    <shaderMaterial 
      attach={attach} 
      ref={materialRef} 
      uniforms={uniforms}
      vertexShader={wallVertexShader}
      fragmentShader={wallFragmentShader}
      depthWrite={false} 
      transparent={true} 
      side={DoubleSide}
    />
  )
}
