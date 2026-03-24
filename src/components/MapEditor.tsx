import { useState, useRef, useEffect, useCallback } from 'react';
import { type VectorMapData, type Point2D, type MapObject } from '../types/map';
import { PlusSquare, Lightbulb, Bot, Monitor, Armchair, Trash2, DoorOpen } from 'lucide-react';

interface MapEditorProps {
  mapData: VectorMapData;
  onChange: (newMap: VectorMapData) => void;
}

type DraggableObjectType = MapObject['type'];

const SCALE = 20; // 1 meter = 20 pixels in SVG
const OFFSET_X = 150; // Center offset
const OFFSET_Y = 150;

function isObjectDraggable(_type: MapObject['type']): _type is DraggableObjectType {
  return true; // All objects are draggable in editor
}

const MIN_EDGE_LENGTH = 0.5;
const MIN_POLYGON_AREA = 1;

function snapPoint(p: Point2D): Point2D {
  return {
    x: Math.round(p.x * 2) / 2,
    y: Math.round(p.y * 2) / 2
  };
}

function orientation(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point2D, b: Point2D, c: Point2D): boolean {
  return (
    Math.min(a.x, c.x) <= b.x &&
    b.x <= Math.max(a.x, c.x) &&
    Math.min(a.y, c.y) <= b.y &&
    b.y <= Math.max(a.y, c.y)
  );
}

function segmentsIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;
  return false;
}

function polygonArea(polygon: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function hasSelfIntersection(polygon: Point2D[]): boolean {
  const len = polygon.length;
  for (let i = 0; i < len; i++) {
    const a1 = polygon[i];
    const a2 = polygon[(i + 1) % len];
    for (let j = i + 1; j < len; j++) {
      const b1 = polygon[j];
      const b2 = polygon[(j + 1) % len];
      const sharesVertex =
        i === j ||
        (i + 1) % len === j ||
        i === (j + 1) % len;
      if (sharesVertex) continue;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function isPolygonAdjustable(polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < MIN_EDGE_LENGTH) return false;
  }
  if (polygonArea(polygon) < MIN_POLYGON_AREA) return false;
  if (hasSelfIntersection(polygon)) return false;
  return true;
}

export function MapEditor({ mapData, onChange }: MapEditorProps) {
  const [draggingVertex, setDraggingVertex] = useState<{ roomId: string, index: number } | null>(null);
  const [draggingObject, setDraggingObject] = useState<{ id: string, offset: Point2D } | null>(null);
  const [draggingRoom, setDraggingRoom] = useState<{ roomId: string, startPos: Point2D, originalPolygon: Point2D[] } | null>(null);
  const [draggingEdge, setDraggingEdge] = useState<{ roomId: string, edgeIndex: number, startPos: Point2D } | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Convert world coordinates to SVG coordinates
  const toSvg = (p: Point2D) => ({ x: p.x * SCALE + OFFSET_X, y: p.y * SCALE + OFFSET_Y });
  // Convert SVG coordinates to world coordinates
  const toWorld = (clientX: number, clientY: number): Point2D => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x: Math.round(((x - OFFSET_X) / SCALE) * 2) / 2, // Snap to 0.5 grid
      y: Math.round(((y - OFFSET_Y) / SCALE) * 2) / 2
    };
  };

  const applyDragAtPoint = useCallback((worldPt: Point2D) => {
    if (draggingVertex) {
      let changed = false;
      const newRooms = mapData.rooms.map(room => {
        if (room.id !== draggingVertex.roomId) return room;
        const snappedPoint = snapPoint(worldPt);
        if (
          room.polygon[draggingVertex.index].x === snappedPoint.x &&
          room.polygon[draggingVertex.index].y === snappedPoint.y
        ) {
          return room;
        }
        const newPolygon = [...room.polygon];
        newPolygon[draggingVertex.index] = snappedPoint;
        if (!isPolygonAdjustable(newPolygon)) return room;
        changed = true;
        return { ...room, polygon: newPolygon };
      });
      if (changed) {
        onChange({ ...mapData, rooms: newRooms });
      }
    } else if (draggingObject) {
      const nextPosition = {
        x: worldPt.x + draggingObject.offset.x,
        y: worldPt.y + draggingObject.offset.y
      };
      const targetObject = mapData.objects.find(obj => obj.id === draggingObject.id);
      if (!targetObject) return;
      if (targetObject.position.x === nextPosition.x && targetObject.position.y === nextPosition.y) return;

      const newObjects = mapData.objects.map(obj => {
        if (obj.id === draggingObject.id) {
          return { ...obj, position: nextPosition };
        }
        return obj;
      });
      onChange({ ...mapData, objects: newObjects });
    } else if (draggingEdge) {
      const targetRoom = mapData.rooms.find(room => room.id === draggingEdge.roomId);
      if (!targetRoom || targetRoom.polygon.length < 2) return;

      const i = draggingEdge.edgeIndex;
      const j = (i + 1) % targetRoom.polygon.length;
      const p1 = targetRoom.polygon[i];
      const p2 = targetRoom.polygon[j];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const edgeLen = Math.hypot(edge.x, edge.y);
      if (edgeLen === 0) return;

      const normal = { x: -edge.y / edgeLen, y: edge.x / edgeLen };
      const delta = { x: worldPt.x - draggingEdge.startPos.x, y: worldPt.y - draggingEdge.startPos.y };
      const moveDistance = delta.x * normal.x + delta.y * normal.y;

      // Keep grid snapping behavior and avoid jitter
      if (Math.abs(moveDistance) >= 0.5) {
        let changed = false;
        const newRooms = mapData.rooms.map(room => {
          if (room.id !== draggingEdge.roomId) return room;
          const candidatePolygon = room.polygon.map((p, index) => {
            if (index === i || index === j) {
              return snapPoint({
                x: p.x + normal.x * moveDistance,
                y: p.y + normal.y * moveDistance
              });
            }
            return p;
          });
          if (!isPolygonAdjustable(candidatePolygon)) return room;
          changed = true;
          return { ...room, polygon: candidatePolygon };
        });
        if (changed) {
          onChange({ ...mapData, rooms: newRooms });
          setDraggingEdge({ roomId: draggingEdge.roomId, edgeIndex: draggingEdge.edgeIndex, startPos: snapPoint(worldPt) });
        }
      }
    } else if (draggingRoom) {
      const dx = worldPt.x - draggingRoom.startPos.x;
      const dy = worldPt.y - draggingRoom.startPos.y;
      if (dx === 0 && dy === 0) return;

      const newRooms = mapData.rooms.map(room => {
        if (room.id === draggingRoom.roomId) {
          const newPolygon = draggingRoom.originalPolygon.map(p => ({
            x: p.x + dx,
            y: p.y + dy
          }));
          return { ...room, polygon: newPolygon };
        }
        return room;
      });
      onChange({ ...mapData, rooms: newRooms });
    }
  }, [draggingVertex, draggingObject, draggingEdge, draggingRoom, mapData, onChange]);

  const clearDragging = () => {
    setDraggingVertex(null);
    setDraggingObject(null);
    setDraggingRoom(null);
    setDraggingEdge(null);
  };

  const deleteSelected = useCallback(() => {
    if (selectedRoomId) {
      onChange({
        ...mapData,
        rooms: mapData.rooms.filter(r => r.id !== selectedRoomId)
      });
      setSelectedRoomId(null);
    } else if (selectedObjectId) {
      onChange({
        ...mapData,
        objects: mapData.objects.filter(o => o.id !== selectedObjectId)
      });
      setSelectedObjectId(null);
    }
  }, [selectedRoomId, selectedObjectId, mapData, onChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if no input/textarea is focused
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRoomId, selectedObjectId, mapData, deleteSelected]);

  useEffect(() => {
    if (!draggingVertex && !draggingObject && !draggingRoom && !draggingEdge) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const worldPt = toWorld(e.clientX, e.clientY);
      applyDragAtPoint(worldPt);
    };

    const onWindowPointerUp = () => {
      clearDragging();
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [draggingVertex, draggingObject, draggingRoom, draggingEdge, applyDragAtPoint]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.target instanceof Element && e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    clearDragging();
  };

  const deselectAll = () => {
    setSelectedRoomId(null);
    setSelectedObjectId(null);
  };

  const addRoom = () => {
    const newId = `room-${Date.now()}`;
    const newRoom = {
      id: newId,
      name: 'New Room',
      height: 2,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0'),
      polygon: [
        { x: -2, y: -2 },
        { x: 2, y: -2 },
        { x: 2, y: 2 },
        { x: -2, y: 2 }
      ]
    };
    onChange({ ...mapData, rooms: [...mapData.rooms, newRoom] });
    setSelectedRoomId(newId);
  };

  const addObject = (type: 'light' | 'robot' | 'desk' | 'chair' | 'door') => {
    const newObj = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 0, y: 0 }
    };
    onChange({ ...mapData, objects: [...mapData.objects, newObj] });
  };

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#333' }}>Blueprint Editor</h3>
        {(selectedRoomId || selectedObjectId) && (
          <button onClick={deleteSelected} title="Delete Selected" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 4 }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
        <button onClick={addRoom} title="Add Room" style={toolbarBtnStyle}><PlusSquare size={18} /></button>
        <div style={{ width: 1, background: '#eee', margin: '0 4px' }} />
        <button onClick={() => addObject('light')} title="Add Light" style={toolbarBtnStyle}><Lightbulb size={18} color="#ffaa00" /></button>
        <button onClick={() => addObject('robot')} title="Add Robot" style={toolbarBtnStyle}><Bot size={18} color="#ff3333" /></button>
        <button onClick={() => addObject('desk')} title="Add Desk" style={toolbarBtnStyle}><Monitor size={18} color="#444" /></button>
        <button onClick={() => addObject('chair')} title="Add Chair" style={toolbarBtnStyle}><Armchair size={18} color="#666" /></button>
        <button onClick={() => addObject('door')} title="Add Door" style={toolbarBtnStyle}><DoorOpen size={18} color="#8b4513" /></button>
      </div>

      <svg
        ref={svgRef}
        width={300}
        height={300}
        style={{ border: '1px solid #e0e0e0', borderRadius: 8, background: '#f8f9fa', touchAction: 'none' }}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          if (e.target === svgRef.current) deselectAll();
        }}
      >
        {/* Draw Rooms */}
        {mapData.rooms.map(room => {
          const points = room.polygon.map(p => {
            const sp = toSvg(p);
            return `${sp.x},${sp.y}`;
          }).join(' ');
          
          const isSelected = selectedRoomId === room.id;
          const centerPt = {
            x: room.polygon.reduce((sum, p) => sum + p.x, 0) / room.polygon.length,
            y: room.polygon.reduce((sum, p) => sum + p.y, 0) / room.polygon.length
          };

          return (
            <g key={room.id}>
              <polygon
                points={points}
                fill={room.color}
                stroke={isSelected ? "#3388ff" : "#888"}
                strokeWidth={isSelected ? 3 : 1}
                strokeDasharray={isSelected ? "4 2" : "none"}
                opacity={isSelected ? 0.9 : 0.6}
                style={{ cursor: 'move', pointerEvents: 'all' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as Element).setPointerCapture(e.pointerId);
                  setSelectedRoomId(room.id);
                  setSelectedObjectId(null);
                  setDraggingRoom({
                    roomId: room.id,
                    startPos: toWorld(e.clientX, e.clientY),
                    originalPolygon: room.polygon.map(p => ({ ...p }))
                  });
                }}
              />
              {room.polygon.length > 0 && (
                <text
                  x={toSvg(centerPt).x}
                  y={toSvg(centerPt).y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="#333"
                  fontSize={10}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {room.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Draw Edge Handles for Selected Room */}
        {selectedRoomId && mapData.rooms.find(r => r.id === selectedRoomId)?.polygon.map((p, index, polygon) => {
          if (polygon.length < 2) return null;
          const next = polygon[(index + 1) % polygon.length];
          const p1 = toSvg(p);
          const p2 = toSvg(next);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const cursor = Math.abs(dx) >= Math.abs(dy) ? 'ns-resize' : 'ew-resize';

          return (
            <line
              key={`edge-${selectedRoomId}-${index}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="transparent"
              strokeWidth={14}
              style={{ cursor, pointerEvents: 'stroke' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
                setDraggingEdge({
                  roomId: selectedRoomId,
                  edgeIndex: index,
                  startPos: toWorld(e.clientX, e.clientY)
                });
              }}
            />
          );
        })}

        {/* Draw Vertices for Selected Room Only */}
        {selectedRoomId && mapData.rooms.find(r => r.id === selectedRoomId)?.polygon.map((p, index) => {
          const sp = toSvg(p);
          return (
            <circle
              key={`${selectedRoomId}-${index}`}
              cx={sp.x}
              cy={sp.y}
              r={6}
              fill="white"
              stroke="#3388ff"
              strokeWidth={2}
              style={{ cursor: 'crosshair', pointerEvents: 'all' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
                setDraggingVertex({ roomId: selectedRoomId, index });
              }}
            />
          );
        })}

        {/* Draw Objects */}
        {mapData.objects.map(obj => {
          const sp = toSvg(obj.position);
          let icon = 'O';
          let color = '#000';
          if (obj.type === 'light') { icon = 'L'; color = '#ffaa00'; }
          if (obj.type === 'robot') { icon = 'R'; color = '#ff3333'; }
          if (obj.type === 'desk') { icon = 'D'; color = '#444444'; }
          if (obj.type === 'chair') { icon = 'C'; color = '#666666'; }
          if (obj.type === 'door') { icon = '🚪'; color = '#8b4513'; }

          const isSelected = selectedObjectId === obj.id;

          return (
            <g 
              key={obj.id} 
              transform={`translate(${sp.x}, ${sp.y})`}
              style={{ cursor: isObjectDraggable(obj.type) ? 'move' : 'not-allowed', pointerEvents: 'all' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedObjectId(obj.id);
                setSelectedRoomId(null);
                if (!isObjectDraggable(obj.type)) return;
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
                const startWorld = toWorld(e.clientX, e.clientY);
                setDraggingObject({
                  id: obj.id,
                  offset: {
                    x: obj.position.x - startWorld.x,
                    y: obj.position.y - startWorld.y
                  }
                });
              }}
            >
              <circle 
                r={10} 
                fill="white" 
                stroke={isSelected ? "#3388ff" : color} 
                strokeWidth={isSelected ? 3 : 2} 
                style={isSelected ? { filter: 'drop-shadow(0 0 2px rgba(51, 136, 255, 0.5))' } : {}}
              />
              <text x={0} y={3} textAnchor="middle" fill={isSelected ? "#3388ff" : color} fontSize={10} fontWeight="bold" pointerEvents="none">
                {icon}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ margin: 0, fontSize: 11, color: '#888', textAlign: 'center' }}>
        Click room to select. Drag inside to move, drag corners or edges to reshape.
      </p>
    </div>
  );
}

const toolbarBtnStyle = {
  background: '#f0f0f0',
  border: '1px solid #ddd',
  borderRadius: 6,
  padding: '6px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
