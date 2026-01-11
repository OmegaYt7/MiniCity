export enum TileType {
  WATER = 0,
  SAND = 1,
  GRASS = 2,
  ROAD = 3,
}

export enum BuildingCategory {
  RESIDENTIAL = 'Жильё',
  COMMERCIAL = 'Бизнес',
  INDUSTRIAL = 'Заводы',
  DECORATION = 'Декор',
}

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  price: number;
  width: number;
  height: number;
  population: number;
  income: number; // Coins per minute
  xp: number; // XP gained on build
  imageColor: string;
  description: string;
}

export interface PlacedBuilding {
  id: string; // Unique instance ID
  defId: string; // Reference to BuildingDef
  x: number;
  y: number;
  builtAt: number;
}

export interface GameState {
  coins: number;
  population: number;
  xp: number;
  level: number;
}

export interface MapData {
  width: number;
  height: number;
  tiles: TileType[][];
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type GameMode = 'VIEW' | 'BUILDING_SELECT' | 'BUILDING_PREVIEW' | 'PLACING' | 'INSPECT';
