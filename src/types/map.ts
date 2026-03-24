export interface Point2D {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  height: number;
  color: string;
  polygon: Point2D[];
}

export interface MapObject {
  id: string;
  type: 'light' | 'robot' | 'desk' | 'chair';
  position: Point2D;
}

export interface VectorMapData {
  rooms: Room[];
  objects: MapObject[];
}
