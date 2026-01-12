
import { BuildingCategory, BuildingDef, TileType, Decoration, MapData } from "./types";

export const TILE_SIZE = 64;
export const MAP_SIZE = 60; 
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2.0;

// Vibrant / Dark Theme Colors (Base)
export const COLORS = {
  WATER: '#0ea5e9', 
  WATER_DARK: '#0284c7', 
  SAND: '#fcd34d', 
  GRASS: '#22c55e', 
  GRASS_DARK: '#16a34a', 
  ROAD: '#1e293b', // Darker cleaner asphalt
  ROAD_MARKING: '#64748b', 
  GRID: 'rgba(255,255,255,0.05)',
  HIGHLIGHT_VALID: 'rgba(34, 197, 94, 0.6)', 
  HIGHLIGHT_INVALID: 'rgba(239, 68, 68, 0.6)', 
  UI_BG: 'rgba(15, 23, 42, 0.95)',
};

export const INITIAL_RESOURCES = {
  playerName: 'Мэр',
  coins: 50000, 
  xp: 0,
  level: 1,
  population: 0,
};

// Buildings Data - Expanded
export const BUILDINGS: BuildingDef[] = [
  // --- RESIDENTIAL ---
  {
    id: 'res_1',
    name: 'Капсула',
    category: BuildingCategory.RESIDENTIAL,
    price: 100,
    width: 1,
    height: 1,
    population: 5,
    income: 0,
    xp: 10,
    imageColor: '#f87171',
    description: 'Компактное жилье для студентов.',
  },
  {
    id: 'res_cabin',
    name: 'Лесной Дом',
    category: BuildingCategory.RESIDENTIAL,
    price: 350,
    width: 1,
    height: 1,
    population: 8,
    income: 0,
    xp: 20,
    imageColor: '#b91c1c',
    description: 'Уединенный домик из бруса.',
  },
  {
    id: 'res_modern',
    name: 'Модерн',
    category: BuildingCategory.RESIDENTIAL,
    price: 800,
    width: 2,
    height: 1,
    population: 12,
    income: 0,
    xp: 35,
    imageColor: '#e11d48',
    description: 'Стильный одноэтажный дом.',
  },
  {
    id: 'res_2',
    name: 'Коттедж',
    category: BuildingCategory.RESIDENTIAL,
    price: 500,
    width: 2,
    height: 2,
    population: 15,
    income: 0,
    xp: 50,
    imageColor: '#ef4444',
    description: 'Уютный дом для большой семьи.',
  },
  {
    id: 'res_duplex',
    name: 'Дуплекс',
    category: BuildingCategory.RESIDENTIAL,
    price: 1200,
    width: 2,
    height: 2,
    population: 25,
    income: 0,
    xp: 100,
    imageColor: '#fca5a5',
    description: 'Дом на две семьи с гаражом.',
  },
  {
    id: 'res_villa',
    name: 'Вилла',
    category: BuildingCategory.RESIDENTIAL,
    price: 3000,
    width: 3,
    height: 3,
    population: 30,
    income: 0,
    xp: 150,
    imageColor: '#be123c',
    description: 'Роскошь с бассейном.',
    lightRadius: 3,
    lightColor: '#fecdd3'
  },
  {
    id: 'res_3',
    name: 'Таунхаус',
    category: BuildingCategory.RESIDENTIAL,
    price: 2500,
    width: 2,
    height: 2,
    population: 40,
    income: 0,
    xp: 200,
    imageColor: '#dc2626',
    description: 'Двухэтажный городской комплекс.',
  },
  {
    id: 'res_condo',
    name: 'ЖК "Сити"',
    category: BuildingCategory.RESIDENTIAL,
    price: 5000,
    width: 3,
    height: 2,
    population: 80,
    income: 0,
    xp: 400,
    imageColor: '#9f1239',
    description: 'Элитный жилой блок.',
  },
  {
    id: 'res_4',
    name: 'Небоскреб',
    category: BuildingCategory.RESIDENTIAL,
    price: 12000,
    width: 3,
    height: 3,
    population: 150,
    income: 0,
    xp: 1000,
    imageColor: '#991b1b',
    description: 'Жизнь в облаках.',
    lightRadius: 5,
    lightColor: '#fff1f2'
  },
  {
    id: 'res_mega',
    name: 'Аркология',
    category: BuildingCategory.RESIDENTIAL,
    price: 45000,
    width: 4,
    height: 4,
    population: 500,
    income: 0,
    xp: 3000,
    imageColor: '#7f1d1d',
    description: 'Автономный город в здании.',
  },

  // --- COMMERCIAL ---
  {
    id: 'com_1',
    name: 'Киоск',
    category: BuildingCategory.COMMERCIAL,
    price: 300,
    width: 1,
    height: 1,
    population: -2,
    income: 25,
    xp: 25,
    imageColor: '#60a5fa',
    description: 'Свежая пресса и снеки.',
  },
  {
    id: 'com_flower',
    name: 'Цветы',
    category: BuildingCategory.COMMERCIAL,
    price: 600,
    width: 1,
    height: 1,
    population: -3,
    income: 40,
    xp: 40,
    imageColor: '#93c5fd',
    description: 'Ароматный бутик.',
  },
  {
    id: 'com_bakery',
    name: 'Пекарня',
    category: BuildingCategory.COMMERCIAL,
    price: 900,
    width: 2,
    height: 1,
    population: -5,
    income: 60,
    xp: 60,
    imageColor: '#3b82f6',
    description: 'Свежий хлеб каждое утро.',
  },
  {
    id: 'com_2',
    name: 'Маркет',
    category: BuildingCategory.COMMERCIAL,
    price: 1200,
    width: 2,
    height: 2,
    population: -10,
    income: 120,
    xp: 150,
    imageColor: '#2563eb',
    description: 'Продукты у дома.',
  },
  {
    id: 'com_diner',
    name: 'Дайнер',
    category: BuildingCategory.COMMERCIAL,
    price: 2000,
    width: 2,
    height: 2,
    population: -12,
    income: 180,
    xp: 200,
    imageColor: '#1d4ed8',
    description: 'Бургеры и кофе 24/7.',
    lightRadius: 3,
    lightColor: '#bfdbfe'
  },
  {
    id: 'com_mall',
    name: 'ТЦ "Плаза"',
    category: BuildingCategory.COMMERCIAL,
    price: 8000,
    width: 4,
    height: 3,
    population: -60,
    income: 600,
    xp: 800,
    imageColor: '#1e40af',
    description: 'Шопинг и развлечения.',
    lightRadius: 4,
    lightColor: '#ffffff'
  },
  {
    id: 'com_3',
    name: 'Офис',
    category: BuildingCategory.COMMERCIAL,
    price: 5000,
    width: 3,
    height: 3,
    population: -45,
    income: 450,
    xp: 600,
    imageColor: '#1e3a8a',
    description: 'Бизнес-центр класса А.',
  },
  {
    id: 'com_bank',
    name: 'Банк',
    category: BuildingCategory.COMMERCIAL,
    price: 10000,
    width: 3,
    height: 3,
    population: -30,
    income: 700,
    xp: 900,
    imageColor: '#172554',
    description: 'Финансовое сердце города.',
  },

  // --- INDUSTRIAL ---
  {
    id: 'ind_1',
    name: 'Гараж',
    category: BuildingCategory.INDUSTRIAL,
    price: 800,
    width: 2,
    height: 2,
    population: -8,
    income: 90,
    xp: 100,
    imageColor: '#f59e0b',
    description: 'Автосервис и шиномонтаж.',
  },
  {
    id: 'ind_sawmill',
    name: 'Лесопилка',
    category: BuildingCategory.INDUSTRIAL,
    price: 1200,
    width: 3,
    height: 2,
    population: -10,
    income: 130,
    xp: 150,
    imageColor: '#d97706',
    description: 'Обработка древесины.',
  },
  {
    id: 'ind_warehouse',
    name: 'Склад',
    category: BuildingCategory.INDUSTRIAL,
    price: 1500,
    width: 3,
    height: 2,
    population: -15,
    income: 150,
    xp: 200,
    imageColor: '#b45309',
    description: 'Логистический центр.',
  },
  {
    id: 'ind_2',
    name: 'Завод',
    category: BuildingCategory.INDUSTRIAL,
    price: 4500,
    width: 3,
    height: 3,
    population: -40,
    income: 500,
    xp: 550,
    imageColor: '#92400e',
    description: 'Тяжелая промышленность.',
  },
  {
    id: 'ind_power',
    name: 'ТЭЦ',
    category: BuildingCategory.INDUSTRIAL,
    price: 8000,
    width: 4,
    height: 3,
    population: -30,
    income: 800,
    xp: 1000,
    imageColor: '#78350f',
    description: 'Энергия для города.',
    lightRadius: 6,
    lightColor: '#fef3c7'
  },
  {
    id: 'ind_3',
    name: 'Технопарк',
    category: BuildingCategory.INDUSTRIAL,
    price: 15000,
    width: 4,
    height: 4,
    population: -100,
    income: 1600,
    xp: 2000,
    imageColor: '#451a03',
    description: 'Инновационный кластер.',
    lightRadius: 4,
    lightColor: '#60a5fa'
  },

  // --- ENTERTAINMENT ---
  {
    id: 'ent_1',
    name: 'Кафе',
    category: BuildingCategory.ENTERTAINMENT,
    price: 2000,
    width: 2,
    height: 2,
    population: -15,
    income: 220,
    xp: 250,
    imageColor: '#d946ef',
    description: 'Лучший кофе в городе.',
  },
  {
    id: 'ent_club',
    name: 'Неон Клуб',
    category: BuildingCategory.ENTERTAINMENT,
    price: 4000,
    width: 2,
    height: 2,
    population: -20,
    income: 450,
    xp: 500,
    imageColor: '#a21caf',
    description: 'Танцы до утра.',
    lightRadius: 4,
    lightColor: '#ff00ff'
  },
  {
    id: 'ent_circus',
    name: 'Цирк',
    category: BuildingCategory.ENTERTAINMENT,
    price: 6000,
    width: 3,
    height: 3,
    population: -30,
    income: 600,
    xp: 700,
    imageColor: '#be185d',
    description: 'Шоу под куполом.',
    lightRadius: 4,
    lightColor: '#f472b6'
  },
  {
    id: 'ent_2',
    name: 'Кинотеатр',
    category: BuildingCategory.ENTERTAINMENT,
    price: 8000,
    width: 3,
    height: 3,
    population: -50,
    income: 900,
    xp: 1200,
    imageColor: '#c026d3',
    description: 'Премьеры блокбастеров.',
    lightRadius: 5,
    lightColor: '#e879f9'
  },
  {
    id: 'ent_casino',
    name: 'Казино',
    category: BuildingCategory.ENTERTAINMENT,
    price: 15000,
    width: 3,
    height: 3,
    population: -40,
    income: 1800,
    xp: 2000,
    imageColor: '#86198f',
    description: 'Азарт и удача.',
    lightRadius: 5,
    lightColor: '#fbbf24'
  },
  {
    id: 'ent_stadium',
    name: 'Арена',
    category: BuildingCategory.ENTERTAINMENT,
    price: 25000,
    width: 4,
    height: 4,
    population: -150,
    income: 2500,
    xp: 3000,
    imageColor: '#701a75',
    description: 'Спортивные события.',
    lightRadius: 8,
    lightColor: '#ffffff'
  },

  // --- DECOR ---
  {
    id: 'dec_tree',
    name: 'Дуб',
    category: BuildingCategory.DECORATION,
    price: 100,
    width: 1,
    height: 1,
    population: 0,
    income: 0,
    xp: 10,
    imageColor: '#4ade80',
    description: 'Могучее дерево.',
  },
  {
    id: 'dec_palm',
    name: 'Пальма',
    category: BuildingCategory.DECORATION,
    price: 150,
    width: 1,
    height: 1,
    population: 0,
    income: 0,
    xp: 15,
    imageColor: '#a3e635',
    description: 'Южная экзотика.',
  },
  {
    id: 'dec_bench',
    name: 'Скамья',
    category: BuildingCategory.DECORATION,
    price: 50,
    width: 1,
    height: 1,
    population: 0,
    income: 0,
    xp: 5,
    imageColor: '#94a3b8',
    description: 'Место для отдыха.',
  },
  {
    id: 'dec_lamp',
    name: 'Фонарь',
    category: BuildingCategory.DECORATION,
    price: 200,
    width: 1,
    height: 1,
    population: 0,
    income: 0,
    xp: 20,
    imageColor: '#fcd34d',
    description: 'Освещает путь.',
    lightRadius: 4,
    lightColor: '#fbbf24'
  },
  {
    id: 'dec_fountain',
    name: 'Фонтан',
    category: BuildingCategory.DECORATION,
    price: 2500,
    width: 2,
    height: 2,
    population: 0,
    income: 10,
    xp: 300,
    imageColor: '#22d3ee',
    description: 'Прохлада в жару.',
    lightRadius: 3,
    lightColor: '#67e8f9'
  },
    {
    id: 'dec_statue',
    name: 'Статуя',
    category: BuildingCategory.DECORATION,
    price: 5000,
    width: 2,
    height: 2,
    population: 0,
    income: 20,
    xp: 500,
    imageColor: '#cbd5e1',
    description: 'Памятник основателю.',
  },
];

// Map Generator (unchanged logic, just keeping export)
export const generateMap = (size: number): MapData => {
  const tiles: TileType[][] = Array(size).fill(0).map(() => Array(size).fill(TileType.WATER));
  const decorations: Decoration[] = [];
  const center = size / 2;
  
  // 1. Terrain
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const angle = Math.atan2(dy, dx);
      const noise = Math.sin(angle * 8 + dist * 0.2) * 2;
      const islandRadius = (size * 0.45) + noise;

      if (dist < islandRadius) {
        if (dist > islandRadius - 3) {
            tiles[y][x] = TileType.SAND;
        } else {
            tiles[y][x] = TileType.GRASS;
            if (Math.random() < 0.15) {
                const type = Math.random() > 0.7 ? 'ROCK' : (Math.random() > 0.5 ? 'BUSH' : 'TREE');
                decorations.push({
                    x, y, type, variation: Math.random()
                });
            }
        }
      } else {
        tiles[y][x] = TileType.WATER;
      }
    }
  }

  // 2. Roads
  const roadSpacing = 8;
  const start = Math.floor(size * 0.2);
  const end = Math.floor(size * 0.8);
  
  for (let i = start; i <= end; i += roadSpacing) {
    for (let j = start; j <= end; j++) {
        if (tiles[j]?.[i] === TileType.GRASS) {
            tiles[j][i] = TileType.ROAD;
            const idx = decorations.findIndex(d => d.x === i && d.y === j);
            if(idx > -1) decorations.splice(idx, 1);
        }
        if (tiles[i]?.[j] === TileType.GRASS) {
            tiles[i][j] = TileType.ROAD;
             const idx = decorations.findIndex(d => d.x === j && d.y === i);
             if(idx > -1) decorations.splice(idx, 1);
        }
    }
  }

  return { width: size, height: size, tiles, decorations };
};
