
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
  totalXpEarned: 0,
  level: 1,
  population: 0,
  referrals: 0,
  lastSaveTime: Date.now(),
};

// Buildings Data - All non-decor have lights. Specific decor has lights.
export const BUILDINGS: BuildingDef[] = [
  // --- RESIDENTIAL (Positive Population) ---
  { id: 'r1', name: 'Малый дом', category: BuildingCategory.RESIDENTIAL, price: 100, width: 1, height: 1, population: 4, income: 0, xp: 10, imageColor: '#f87171', description: 'Простое укрытие.', maxLevel: 5, lightRadius: 3, lightColor: '#fef3c7' },
  { id: 'r2', name: 'Семейный дом', category: BuildingCategory.RESIDENTIAL, price: 250, width: 1, height: 1, population: 6, income: 0, xp: 20, imageColor: '#ef4444', description: 'Уютное жилье.', maxLevel: 5, lightRadius: 3, lightColor: '#fef3c7' },
  { id: 'r3', name: 'Таунхаус', category: BuildingCategory.RESIDENTIAL, price: 500, width: 2, height: 1, population: 10, income: 0, xp: 40, imageColor: '#dc2626', description: 'Городской стиль.', maxLevel: 5, lightRadius: 3, lightColor: '#fbbf24' },
  { id: 'r4', name: 'Вилла', category: BuildingCategory.RESIDENTIAL, price: 1000, width: 2, height: 2, population: 15, income: 0, xp: 80, imageColor: '#b91c1c', description: 'Просторный участок.', maxLevel: 5, lightRadius: 4, lightColor: '#fef3c7' },
  { id: 'r5', name: 'Многоквартирный дом', category: BuildingCategory.RESIDENTIAL, price: 2500, width: 2, height: 2, population: 30, income: 0, xp: 150, imageColor: '#991b1b', description: 'Высокая плотность.', maxLevel: 5, lightRadius: 4, lightColor: '#fff7ed' },
  { id: 'r6', name: 'Жилой комплекс', category: BuildingCategory.RESIDENTIAL, price: 5000, width: 3, height: 2, population: 50, income: 0, xp: 300, imageColor: '#7f1d1d', description: 'Современные удобства.', maxLevel: 5, lightRadius: 4, lightColor: '#ffedd5' },
  { id: 'r7', name: 'Кондоминиум', category: BuildingCategory.RESIDENTIAL, price: 8000, width: 3, height: 3, population: 80, income: 0, xp: 500, imageColor: '#fecaca', description: 'Стекло и сталь.', maxLevel: 5, lightRadius: 5, lightColor: '#e0f2fe' },
  { id: 'r8', name: 'Элитные апартаменты', category: BuildingCategory.RESIDENTIAL, price: 15000, width: 3, height: 3, population: 120, income: 0, xp: 800, imageColor: '#fee2e2', description: 'Для избранных.', lightRadius: 5, lightColor: '#ffffff', maxLevel: 5 },
  { id: 'r9', name: 'Умная башня', category: BuildingCategory.RESIDENTIAL, price: 30000, width: 4, height: 4, population: 250, income: 0, xp: 1500, imageColor: '#fca5a5', description: 'Автоматизация.', lightRadius: 6, lightColor: '#e0f2fe', maxLevel: 5 },
  { id: 'r10', name: 'Резиденция Элита', category: BuildingCategory.RESIDENTIAL, price: 60000, width: 4, height: 4, population: 500, income: 0, xp: 3000, imageColor: '#f87171', description: 'Вершина комфорта.', lightRadius: 6, lightColor: '#fff1f2', maxLevel: 5 },

  // --- COMMERCIAL (Negative Population - Requires Workers) ---
  { id: 'c1', name: 'Ларек', category: BuildingCategory.COMMERCIAL, price: 200, width: 1, height: 1, population: -2, income: 20, xp: 15, imageColor: '#60a5fa', description: 'Местные товары.', maxLevel: 5, lightRadius: 3, lightColor: '#ffffff' },
  { id: 'c2', name: 'Мини-маркет', category: BuildingCategory.COMMERCIAL, price: 500, width: 1, height: 1, population: -3, income: 40, xp: 30, imageColor: '#3b82f6', description: 'Удобный магазин.', maxLevel: 5, lightRadius: 3, lightColor: '#ffffff' },
  { id: 'c3', name: 'Магазин одежды', category: BuildingCategory.COMMERCIAL, price: 1000, width: 2, height: 1, population: -5, income: 70, xp: 60, imageColor: '#2563eb', description: 'Мода и стиль.', maxLevel: 5, lightRadius: 3, lightColor: '#e0f2fe' },
  { id: 'c4', name: 'Офис', category: BuildingCategory.COMMERCIAL, price: 2000, width: 2, height: 2, population: -10, income: 150, xp: 120, imageColor: '#1d4ed8', description: 'Центр бумаг.', maxLevel: 5, lightRadius: 4, lightColor: '#bfdbfe' },
  { id: 'c5', name: 'Торговый центр', category: BuildingCategory.COMMERCIAL, price: 4000, width: 2, height: 2, population: -15, income: 250, xp: 200, imageColor: '#1e40af', description: 'Импорт/Экспорт.', maxLevel: 5, lightRadius: 4, lightColor: '#eff6ff' },
  { id: 'c6', name: 'Корпоративный хаб', category: BuildingCategory.COMMERCIAL, price: 8000, width: 3, height: 3, population: -30, income: 500, xp: 400, imageColor: '#1e3a8a', description: 'Штаб-квартира.', maxLevel: 5, lightRadius: 5, lightColor: '#dbeafe' },
  { id: 'c7', name: 'Финансовая плаза', category: BuildingCategory.COMMERCIAL, price: 15000, width: 3, height: 3, population: -50, income: 900, xp: 800, imageColor: '#172554', description: 'Доступ к бирже.', lightRadius: 5, lightColor: '#bfdbfe', maxLevel: 5 },
  { id: 'c8', name: 'Бизнес-башня', category: BuildingCategory.COMMERCIAL, price: 25000, width: 4, height: 3, population: -80, income: 1500, xp: 1200, imageColor: '#93c5fd', description: 'Прибыль до небес.', lightRadius: 6, lightColor: '#ffffff', maxLevel: 5 },
  { id: 'c9', name: 'Коммерческий район', category: BuildingCategory.COMMERCIAL, price: 45000, width: 4, height: 4, population: -150, income: 2500, xp: 2000, imageColor: '#60a5fa', description: 'Центр города.', lightRadius: 6, lightColor: '#dbeafe', maxLevel: 5 },
  { id: 'c10', name: 'Мировой торговый центр', category: BuildingCategory.COMMERCIAL, price: 80000, width: 5, height: 5, population: -300, income: 5000, xp: 5000, imageColor: '#2563eb', description: 'Узел экономики.', lightRadius: 8, lightColor: '#eff6ff', maxLevel: 5 },

  // --- INDUSTRIAL (Negative Population) ---
  { id: 'i1', name: 'Мастерская', category: BuildingCategory.INDUSTRIAL, price: 500, width: 1, height: 1, population: -3, income: 50, xp: 25, imageColor: '#f59e0b', description: 'Мелкий ремонт.', maxLevel: 5, lightRadius: 3, lightColor: '#fef3c7' },
  { id: 'i2', name: 'Малый завод', category: BuildingCategory.INDUSTRIAL, price: 1200, width: 2, height: 1, population: -6, income: 100, xp: 50, imageColor: '#d97706', description: 'Базовая сборка.', maxLevel: 5, lightRadius: 3, lightColor: '#fcd34d' },
  { id: 'i3', name: 'Производство', category: BuildingCategory.INDUSTRIAL, price: 2500, width: 2, height: 2, population: -12, income: 200, xp: 100, imageColor: '#b45309', description: 'Массовый выпуск.', maxLevel: 5, lightRadius: 4, lightColor: '#fbbf24' },
  { id: 'i4', name: 'Промзона', category: BuildingCategory.INDUSTRIAL, price: 5000, width: 3, height: 2, population: -20, income: 400, xp: 250, imageColor: '#92400e', description: 'Тяжелые машины.', maxLevel: 5, lightRadius: 4, lightColor: '#f59e0b' },
  { id: 'i5', name: 'Сборочный цех', category: BuildingCategory.INDUSTRIAL, price: 9000, width: 3, height: 3, population: -35, income: 750, xp: 450, imageColor: '#78350f', description: 'Работа 24/7.', lightRadius: 5, lightColor: '#fef3c7', maxLevel: 5 },
  { id: 'i6', name: 'Авто-фабрика', category: BuildingCategory.INDUSTRIAL, price: 16000, width: 3, height: 3, population: -50, income: 1300, xp: 800, imageColor: '#451a03', description: 'Роботизация.', lightRadius: 5, lightColor: '#fde68a', maxLevel: 5 },
  { id: 'i7', name: 'Тяжелая промышленность', category: BuildingCategory.INDUSTRIAL, price: 28000, width: 4, height: 4, population: -80, income: 2200, xp: 1500, imageColor: '#fcd34d', description: 'Сталь и железо.', lightRadius: 6, lightColor: '#fbbf24', maxLevel: 5 },
  { id: 'i8', name: 'Индустриальный комплекс', category: BuildingCategory.INDUSTRIAL, price: 45000, width: 4, height: 4, population: -120, income: 3500, xp: 2500, imageColor: '#fbbf24', description: 'Доминирование.', lightRadius: 6, lightColor: '#f59e0b', maxLevel: 5 },
  { id: 'i9', name: 'Хай-тек завод', category: BuildingCategory.INDUSTRIAL, price: 70000, width: 5, height: 5, population: -200, income: 5500, xp: 4000, imageColor: '#ea580c', description: 'Микрочипы.', lightRadius: 7, lightColor: '#60a5fa', maxLevel: 5 },
  { id: 'i10', name: 'Мега-завод', category: BuildingCategory.INDUSTRIAL, price: 120000, width: 6, height: 6, population: -400, income: 10000, xp: 8000, imageColor: '#c2410c', description: 'Кузница мира.', lightRadius: 8, lightColor: '#fdba74', maxLevel: 5 },

  // --- LEISURE (Negative Population) ---
  { id: 'e1', name: 'Площадка', category: BuildingCategory.ENTERTAINMENT, price: 800, width: 1, height: 1, population: -1, income: 30, xp: 20, imageColor: '#d946ef', description: 'Игры для детей.', maxLevel: 5, lightRadius: 3, lightColor: '#f0abfc' },
  { id: 'e2', name: 'Кафе', category: BuildingCategory.ENTERTAINMENT, price: 1500, width: 2, height: 1, population: -4, income: 80, xp: 50, imageColor: '#c026d3', description: 'Отдых.', maxLevel: 5, lightRadius: 3, lightColor: '#e879f9' },
  { id: 'e3', name: 'Кинотеатр', category: BuildingCategory.ENTERTAINMENT, price: 3000, width: 2, height: 2, population: -8, income: 180, xp: 120, imageColor: '#a21caf', description: 'Новинки кино.', lightRadius: 4, lightColor: '#e879f9', maxLevel: 5 },
  { id: 'e4', name: 'Ресторан', category: BuildingCategory.ENTERTAINMENT, price: 6000, width: 2, height: 2, population: -12, income: 350, xp: 250, imageColor: '#86198f', description: 'Высокая кухня.', lightRadius: 4, lightColor: '#f0abfc', maxLevel: 5 },
  { id: 'e5', name: 'Фитнес-клуб', category: BuildingCategory.ENTERTAINMENT, price: 10000, width: 3, height: 2, population: -20, income: 600, xp: 400, imageColor: '#701a75', description: 'Здоровье прежде всего.', maxLevel: 5, lightRadius: 4, lightColor: '#e879f9' },
  { id: 'e6', name: 'Развлекательный центр', category: BuildingCategory.ENTERTAINMENT, price: 18000, width: 3, height: 3, population: -40, income: 1100, xp: 800, imageColor: '#4a044e', description: 'Аркады и боулинг.', lightRadius: 5, lightColor: '#d8b4fe', maxLevel: 5 },
  { id: 'e7', name: 'Парк аттракционов', category: BuildingCategory.ENTERTAINMENT, price: 30000, width: 4, height: 4, population: -80, income: 2000, xp: 1500, imageColor: '#db2777', description: 'Американские горки.', lightRadius: 6, lightColor: '#f472b6', maxLevel: 5 },
  { id: 'e8', name: 'Концертный зал', category: BuildingCategory.ENTERTAINMENT, price: 50000, width: 4, height: 4, population: -100, income: 3200, xp: 2500, imageColor: '#be185d', description: 'Живая музыка.', lightRadius: 6, lightColor: '#fb7185', maxLevel: 5 },
  { id: 'e9', name: 'Курортный комплекс', category: BuildingCategory.ENTERTAINMENT, price: 80000, width: 5, height: 5, population: -200, income: 5000, xp: 4000, imageColor: '#9d174d', description: 'Всё в одном.', lightRadius: 7, lightColor: '#fda4af', maxLevel: 5 },
  { id: 'e10', name: 'Гранд-отель', category: BuildingCategory.ENTERTAINMENT, price: 150000, width: 6, height: 6, population: -400, income: 9000, xp: 8000, imageColor: '#831843', description: 'Идеальный отпуск.', lightRadius: 8, lightColor: '#fecdd3', maxLevel: 5 },

  // --- DECOR (Neutral) - Only specific items have lights ---
  { id: 'd1', name: 'Дерево', category: BuildingCategory.DECORATION, price: 50, width: 1, height: 1, population: 0, income: 0, xp: 5, imageColor: '#4ade80', description: 'Природа.', maxLevel: 1 },
  { id: 'd2', name: 'Клумба', category: BuildingCategory.DECORATION, price: 100, width: 1, height: 1, population: 0, income: 0, xp: 10, imageColor: '#f472b6', description: 'Цветы.', maxLevel: 1 },
  { id: 'd3', name: 'Скамья', category: BuildingCategory.DECORATION, price: 150, width: 1, height: 1, population: 0, income: 0, xp: 15, imageColor: '#94a3b8', description: 'Отдых.', maxLevel: 1 },
  { id: 'd4', name: 'Фонарь', category: BuildingCategory.DECORATION, price: 200, width: 1, height: 1, population: 0, income: 0, xp: 20, imageColor: '#fbbf24', description: 'Свет.', lightRadius: 4, lightColor: '#fbbf24', maxLevel: 1 },
  { id: 'd5', name: 'Фонтан', category: BuildingCategory.DECORATION, price: 1000, width: 2, height: 2, population: 0, income: 10, xp: 100, imageColor: '#22d3ee', description: 'Вода.', lightRadius: 3, lightColor: '#a5f3fc', maxLevel: 5 },
  { id: 'd6', name: 'Статуя', category: BuildingCategory.DECORATION, price: 2500, width: 2, height: 2, population: 0, income: 20, xp: 250, imageColor: '#cbd5e1', description: 'Искусство.', maxLevel: 5 },
  { id: 'd7', name: 'Парковая зона', category: BuildingCategory.DECORATION, price: 5000, width: 3, height: 3, population: 0, income: 50, xp: 500, imageColor: '#16a34a', description: 'Зелень.', maxLevel: 5 },
  { id: 'd8', name: 'Арка', category: BuildingCategory.DECORATION, price: 8000, width: 3, height: 1, population: 0, income: 0, xp: 800, imageColor: '#e2e8f0', description: 'Вход.', maxLevel: 1 },
  { id: 'd9', name: 'Площадь', category: BuildingCategory.DECORATION, price: 15000, width: 4, height: 4, population: 0, income: 100, xp: 1500, imageColor: '#f1f5f9', description: 'Место встреч.', lightRadius: 5, lightColor: '#f8fafc', maxLevel: 5 },
  { id: 'd10', name: 'Монумент', category: BuildingCategory.DECORATION, price: 50000, width: 4, height: 4, population: 0, income: 300, xp: 5000, imageColor: '#f59e0b', description: 'Гордость.', lightRadius: 8, lightColor: '#fef3c7', maxLevel: 5 },
];

export const generateMap = (size: number): MapData => {
  const tiles: TileType[][] = Array(size).fill(0).map(() => Array(size).fill(TileType.WATER));
  const decorations: Decoration[] = [];
  const center = size / 2;
  
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
