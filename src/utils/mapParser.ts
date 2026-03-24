import { type VectorMapData } from '../types/map';

export const INITIAL_VECTOR_MAP: VectorMapData = {
  rooms: [
    {
      id: 'living-room',
      name: 'Living Room',
      height: 2,
      color: '#e0c8fb', // Light purple
      polygon: [
        { x: -5, y: -5 },
        { x: 2, y: -5 },
        { x: 2, y: 2 },
        { x: -5, y: 2 }
      ]
    },
    {
      id: 'bedroom',
      name: 'Master Bedroom',
      height: 2,
      color: '#fcf3cf', // Light yellow
      polygon: [
        { x: 2, y: -5 },
        { x: 7, y: -5 },
        { x: 7, y: -1 },
        { x: 2, y: -1 }
      ]
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      height: 2,
      color: '#d5f5e3', // Light green
      polygon: [
        { x: 2, y: -1 },
        { x: 7, y: -1 },
        { x: 7, y: 4 },
        { x: 2, y: 4 }
      ]
    }
  ],
  objects: [
    { id: 'light-1', type: 'light', position: { x: -3, y: -3 } },
    { id: 'light-2', type: 'light', position: { x: 4, y: -3 } },
    { id: 'robot-1', type: 'robot', position: { x: 0, y: 0 } }
  ]
};

export const WALL_HEIGHT = 2;
export const WALL_THICKNESS = 0.2;
