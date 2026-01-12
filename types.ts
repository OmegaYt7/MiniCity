
export enum TileType {
  WATER = 0,
  SAND = 1,
  GRASS = 2,
  ROAD = 3,
}

export enum BuildingCategory {
  RESIDENTIAL = 'Жильё',
  COMMERCIAL = 'Бизнес',
  INDUSTRIAL = 'Промзона',
  ENTERTAINMENT = 'Досуг',
  DECORATION = 'Декор',
}

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  price: number;
  width: number;
  height: number;
  
  // Population Logic
  // If Positive: Provides Housing (Increases Total & Free)
  // If Negative: Requires Workers (Decreases Free)
  population: number; 
  
  income: number; // Coins per minute
  xp: number; // XP gained on build
  imageColor: string;
  description: string;
  
  // Lighting
  lightRadius?: number;
  lightColor?: string;

  // Upgrade Logic
  maxLevel?: number; // Default 5
}

export interface PlacedBuilding {
  id: string; // Unique instance ID
  defId: string; // Reference to BuildingDef
  x: number;
  y: number;
  builtAt: number;
  level: number; // 1 to maxLevel
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface GameState {
  playerName: string;
  coins: number;
  xp: number; // Spendable XP
  totalXpEarned: number; // Lifetime XP for leveling
  level: number;
  referrals: number;
  lastSaveTime: number; // For offline calc
}

export interface Decoration {
  x: number;
  y: number;
  type: 'TREE' | 'ROCK' | 'BUSH';
  variation: number;
}

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  type: 'DESTROY';
  startTime: number;
}

export interface MapData {
  width: number;
  height: number;
  tiles: TileType[][];
  decorations: Decoration[];
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type GameMode = 'VIEW' | 'PLACING' | 'INSPECT';

export interface GhostPosition {
    x: number;
    y: number;
    valid: boolean;
}

export interface OfflineEarnings {
    coins: number;
    xp: number;
    timeOfflineSeconds: number;
}
