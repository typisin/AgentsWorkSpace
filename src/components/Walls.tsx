import { useRef, useMemo } from 'react'
import { DoubleSide, ShaderMaterial, Color, Shape, ExtrudeGeometry } from 'three'
import { useFrame } from '@react-three/fiber'
import { WALL_HEIGHT, WALL_THICKNESS } from '../utils/mapParser'
import { type VectorMapData } from '../types/map'

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
  varying vec2 vUv;

  void main() {
    // Top edge highlight (vUv.y approaches 1.0)
    float topEdge = smoothstep(0.98, 1.0, vUv.y);
    
    // Side edges highlight (vUv.x approaches 0.0 or 1.0)
    float sideEdge = smoothstep(0.02, 0.0, vUv.x) + smoothstep(0.98, 1.0, vUv.x);
    
    // Combine edges
    float edges = max(topEdge, sideEdge);
    
    // Base transparent glass color (Darker to match reference)
    vec3 baseColor = vec3(0.2, 0.2, 0.25); 
    float baseAlpha = 0.25; // Slightly more visible dark glass
    
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
  mapData: VectorMapData
}

export function Walls({ color, mapData }: WallsProps) {
  const threeColor = useMemo(() => new Color(color), [color])

  const shaderArgs = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      color: { value: [threeColor.r, threeColor.g, threeColor.b] }
    },
    vertexShader: wallVertexShader,
    fragmentShader: wallFragmentShader,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    depthTest: true
  }), [threeColor])

  // Extract wall positions from the 2D vector map
  const wallGeometries = useMemo(() => {
    return mapData.rooms.map(room => {
      const pts = room.polygon;
      if (pts.length < 3) return null;

      // Create a shape with a hole to make it a thick outline (wall)
      const outerShape = new Shape();
      const innerPath = new Shape();

      // Simple normal extrusion for thickness (assumes clockwise polygon)
      const getOffsetPoint = (p1: any, p2: any, p3: any, offset: number) => {
        // Calculate normals
        const dx1 = p2.x - p1.x; const dy1 = p2.y - p1.y;
        const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        const nx1 = -dy1/len1; const ny1 = dx1/len1;

        const dx2 = p3.x - p2.x; const dy2 = p3.y - p2.y;
        const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        const nx2 = -dy2/len2; const ny2 = dx2/len2;

        // Average normal
        let nx = nx1 + nx2; let ny = ny1 + ny2;
        const len = Math.sqrt(nx*nx + ny*ny);
        if (len > 0) { nx /= len; ny /= len; }
        else { nx = nx1; ny = ny1; }

        return { x: p2.x + nx * offset, y: p2.y + ny * offset };
      };

      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[(i - 1 + pts.length) % pts.length];
        const p2 = pts[i];
        const p3 = pts[(i + 1) % pts.length];
        
        const outerP = getOffsetPoint(p1, p2, p3, WALL_THICKNESS / 2);
        const innerP = getOffsetPoint(p1, p2, p3, -WALL_THICKNESS / 2);

        if (i === 0) {
          outerShape.moveTo(outerP.x, outerP.y);
          innerPath.moveTo(innerP.x, innerP.y);
        } else {
          outerShape.lineTo(outerP.x, outerP.y);
          innerPath.lineTo(innerP.x, innerP.y);
        }
      }
      
      // To close the path properly, we get the first point of the shape
      // Shape.curves is an array of curves, for simple lines it's LineCurve which has v1/v2
      const firstOuterCurve = outerShape.curves[0] as any;
      const firstInnerCurve = innerPath.curves[0] as any;
      
      if (firstOuterCurve && firstOuterCurve.v1) {
        outerShape.lineTo(firstOuterCurve.v1.x, firstOuterCurve.v1.y);
      }
      if (firstInnerCurve && firstInnerCurve.v1) {
        innerPath.lineTo(firstInnerCurve.v1.x, firstInnerCurve.v1.y);
      }
      
      outerShape.holes.push(innerPath);

      return { id: room.id, shape: outerShape };
    }).filter(Boolean);
  }, [mapData]);

  const extrudeSettings = {
    depth: WALL_HEIGHT,
    bevelEnabled: false,
  };

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
      {wallGeometries.map((wg) => (
        <mesh key={wg!.id} castShadow receiveShadow>
          <extrudeGeometry args={[wg!.shape, extrudeSettings]} />
          {/* Apply invisible material to top/bottom caps, and shader to the sides */}
          <meshBasicMaterial attach="material-0" color="#ffffff" transparent opacity={0.0} depthWrite={false} />
          <WallMaterial attach="material-1" shaderArgs={shaderArgs} />
        </mesh>
      ))}
    </group>
  );
}

// Separate component for material to handle useFrame individually
function WallMaterial({ shaderArgs, attach }: { shaderArgs: any, attach: string }) {
  const materialRef = useRef<ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return <shaderMaterial attach={attach} ref={materialRef} args={[shaderArgs]} depthWrite={false} transparent={true} />
}
