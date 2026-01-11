import { BuildingCategory, BuildingDef, TileType } from "./types";

export const TILE_SIZE = 64;
export const MAP_SIZE = 50; // Increased size slightly for better layout
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.0;

// Natural Colors (Daytime)
export const COLORS = {
  WATER: '#3b82f6', // Blue 500
  WATER_DARK: '#2563eb',
  SAND: '#fcd34d', // Amber 300
  GRASS: '#4ade80', // Green 400
  GRASS_DARK: '#22c55e', 
  ROAD: '#64748b', // Slate 500
  ROAD_MARKING: '#cbd5e1', // Slate 300
  GRID: 'rgba(0,0,0,0.05)',
  HIGHLIGHT_VALID: 'rgba(74, 222, 128, 0.6)', 
  HIGHLIGHT_INVALID: 'rgba(239, 68, 68, 0.6)', 
};

// Initial State
export const INITIAL_RESOURCES = {
  coins: 5000,
  population: 0,
  xp: 0,
  level: 1,
};

// Buildings Data (Russian)
export const BUILDINGS: BuildingDef[] = [
  // Residential
  {
    id: 'house_small',
    name: 'Дачный домик',
    category: BuildingCategory.RESIDENTIAL,
    price: 200,
    width: 2,
    height: 2,
    population: 4,
    income: 0,
    xp: 20,
    imageColor: '#f87171', // Red 400
    description: 'Уютный маленький дом для небольшой семьи.',
  },
  {
    id: 'house_medium',
    name: 'Коттедж',
    category: BuildingCategory.RESIDENTIAL,
    price: 500,
    width: 2,
    height: 2,
    population: 10,
    income: 0,
    xp: 50,
    imageColor: '#ef4444', // Red 500
    description: 'Стандартный загородный дом с гаражом.',
  },
  {
    id: 'apartment_block',
    name: 'ЖК "Высота"',
    category: BuildingCategory.RESIDENTIAL,
    price: 2500,
    width: 3,
    height: 3,
    population: 50,
    income: 0,
    xp: 200,
    imageColor: '#b91c1c', // Red 700
    description: 'Многоэтажный комплекс для плотной застройки.',
  },

  // Commercial
  {
    id: 'shop_small',
    name: 'Магазинчик',
    category: BuildingCategory.COMMERCIAL,
    price: 400,
    width: 2,
    height: 2,
    population: 0,
    income: 20,
    xp: 40,
    imageColor: '#60a5fa', // Blue 400
    description: 'Продукты и товары первой необходимости.',
  },
  {
    id: 'supermarket',
    name: 'Супермаркет',
    category: BuildingCategory.COMMERCIAL,
    price: 1500,
    width: 4,
    height: 3,
    population: 0,
    income: 80,
    xp: 150,
    imageColor: '#3b82f6', // Blue 500
    description: 'Большой магазин для всего района.',
  },

  // Industrial / Other
  {
    id: 'factory',
    name: 'Фабрика',
    category: BuildingCategory.INDUSTRIAL,
    price: 3000,
    width: 3,
    height: 3,
    population: 0,
    income: 150,
    xp: 300,
    imageColor: '#fbbf24', // Amber 400
    description: 'Производство товаров. Шумно, но прибыльно.',
  },

  // Decor
  {
    id: 'tree',
    name: 'Дуб',
    category: BuildingCategory.DECORATION,
    price: 50,
    width: 1,
    height: 1,
    population: 0,
    income: 0,
    xp: 5,
    imageColor: '#166534', // Green 800
    description: 'Природа украшает город.',
  },
  {
    id: 'fountain',
    name: 'Фонтан',
    category: BuildingCategory.DECORATION,
    price: 800,
    width: 2,
    height: 2,
    population: 0,
    income: 5, // Tourism
    xp: 80,
    imageColor: '#0ea5e9', // Sky 500
    description: 'Центр притяжения в парке.',
  },
];

// Helper to generate a more organic Island Map with Roads
export const generateMap = (size: number): TileType[][] => {
  const map: TileType[][] = Array(size).fill(0).map(() => Array(size).fill(TileType.WATER));
  const center = size / 2;
  
  // 1. Generate Island Terrain
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Multi-frequency noise simulation (simple pseudo-random)
      const angle = Math.atan2(dy, dx);
      const noise1 = Math.sin(angle * 5) * 2;
      const noise2 = Math.cos(angle * 10 + dist * 0.2) * 1.5;
      const radiusVar = noise1 + noise2;

      const grassLimit = (size * 0.35) + radiusVar;
      const sandLimit = (size * 0.42) + radiusVar;

      if (dist < grassLimit) {
        map[y][x] = TileType.GRASS;
      } else if (dist < sandLimit) {
        map[y][x] = TileType.SAND;
      } else {
        map[y][x] = TileType.WATER;
      }
    }
  }

  // 2. Generate Roads
  // Draw a cross road
  const roadWidth = 2;
  const start = Math.floor(size * 0.15);
  const end = Math.floor(size * 0.85);

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      const dx = (x2 - x1) / length;
      const dy = (y2 - y1) / length;
      
      for(let i=0; i<=length; i++) {
          const cx = Math.round(x1 + dx * i);
          const cy = Math.round(y1 + dy * i);
          // Only place road on land
          if (map[cy]?.[cx] !== undefined && map[cy][cx] !== TileType.WATER) {
              map[cy][cx] = TileType.ROAD;
          }
      }
  };

  // Main Cross
  // Vertical Road
  for(let w=0; w<roadWidth; w++) {
    drawLine(center + w, start, center + w, end);
  }
  // Horizontal Road
  for(let w=0; w<roadWidth; w++) {
    drawLine(start, center + w, end, center + w);
  }

  // Inner Ring Road
  const ringRadius = Math.floor(size * 0.25);
  for (let angle = 0; angle < 360; angle+=2) {
      const rad = angle * (Math.PI / 180);
      const rx = Math.round(center + Math.cos(rad) * ringRadius);
      const ry = Math.round(center + Math.sin(rad) * ringRadius);
       if (map[ry]?.[rx] !== undefined && map[ry][rx] !== TileType.WATER) {
          map[ry][rx] = TileType.ROAD;
           // Make ring 2 wide
           // Just a simple approximation
      }
  }

  return map;
};