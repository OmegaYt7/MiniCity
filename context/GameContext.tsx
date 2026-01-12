
import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { GameState, MapData, PlacedBuilding, BuildingDef, TileType, GameMode, VisualEffect, TelegramUser } from '../types';
import { INITIAL_RESOURCES, generateMap, MAP_SIZE, BUILDINGS } from '../constants';
import { audioService } from '../services/audioService';

interface PopulationStats {
  current: number; // Sum of all provided housing
  max: number;     // Cap determined by Player Level
}

interface GameContextProps {
  state: GameState;
  telegramUser: TelegramUser | null;
  mapData: MapData;
  buildings: PlacedBuilding[];
  effects: VisualEffect[];
  mode: GameMode;
  selectedCategory: string | null;
  selectedBuildingDef: BuildingDef | null;
  selectedInstance: PlacedBuilding | null;
  movingInstanceId: string | null;
  populationStats: PopulationStats;
  totalIncome: number;
  timeOfDay: number; // 0-24 Float
  actions: {
    placeBuilding: (def: BuildingDef, x: number, y: number) => boolean;
    setMode: (mode: GameMode) => void;
    selectCategory: (category: string | null) => void;
    selectBuildingDef: (def: BuildingDef | null) => void;
    selectInstance: (instance: PlacedBuilding | null) => void;
    upgradeBuilding: (instanceId: string) => void;
    startMovingBuilding: (instanceId: string) => void;
    destroyBuilding: (instanceId: string) => void;
    addCoins: (amount: number) => void;
    cycleTime: () => void;
    updatePlayerName: (name: string) => void;
    exchangeXpForCoins: (xpAmount: number) => void;
  };
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

type Action =
  | { type: 'TICK_INCOME' }
  | { type: 'PLACE_BUILDING'; payload: { def: BuildingDef; x: number; y: number } }
  | { type: 'REMOVE_BUILDING'; payload: string }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'EXCHANGE_XP'; payload: { xp: number, coins: number } };

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'ADD_COINS':
      return { ...state, coins: Math.max(0, Math.floor(state.coins + action.payload)) };
    case 'ADD_XP':
      const newXp = Math.max(0, state.xp + action.payload);
      const xpNeeded = state.level * 500;
      let newLevel = state.level;
      if (newXp >= xpNeeded) newLevel++;
      return { ...state, xp: newXp, level: newLevel };
    case 'PLACE_BUILDING':
      return {
        ...state,
        coins: Math.max(0, state.coins - action.payload.def.price),
        xp: state.xp + action.payload.def.xp,
      };
    case 'SET_NAME':
      return { ...state, playerName: action.payload };
    case 'EXCHANGE_XP':
      return {
          ...state,
          xp: Math.max(0, state.xp - action.payload.xp),
          coins: state.coins + action.payload.coins
      };
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_RESOURCES);
  const [mapData] = useState<MapData>(() => generateMap(MAP_SIZE));
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [mode, setMode] = useState<GameMode>('VIEW');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBuildingDef, setSelectedBuildingDef] = useState<BuildingDef | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<PlacedBuilding | null>(null);
  const [movingInstanceId, setMovingInstanceId] = useState<string | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  // Derived Stats
  const [populationStats, setPopulationStats] = useState<PopulationStats>({ current: 0, max: 0 });
  const [totalIncome, setTotalIncome] = useState(0);

  // Time State (0-24)
  const [timeOfDay, setTimeOfDay] = useState(12);

  // Initialize Telegram User
  useEffect(() => {
     if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        if (tg.initDataUnsafe?.user) {
            setTelegramUser(tg.initDataUnsafe.user);
            dispatch({ type: 'SET_NAME', payload: tg.initDataUnsafe.user.first_name });
        }
     }
  }, []);

  // Time Loop
  useEffect(() => {
    const interval = setInterval(() => {
        setTimeOfDay(prev => (prev + 0.05) % 24); 
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  // Stats Calculation
  useEffect(() => {
    let currentPop = 0;
    let inc = 0;

    buildings.forEach(b => {
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def) return;

        // Current Population = Sum of housing provided
        if (def.population > 0) {
            currentPop += def.population * b.level;
        }

        // Income
        inc += Math.max(0, Math.floor(def.income * (1 + (b.level - 1) * 0.5)));
    });

    // Max Population depends on Level. 
    // Level 1 = 100 Cap. Level 2 = 200 Cap.
    const maxPop = gameState.level * 100;

    setPopulationStats({ 
        current: Math.max(0, currentPop), 
        max: maxPop
    });
    setTotalIncome(Math.max(0, inc));
  }, [buildings, gameState.level]);

  // Income Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalIncome > 0) {
        dispatch({ type: 'ADD_COINS', payload: totalIncome });
      }
    }, 10000); 
    return () => clearInterval(interval);
  }, [totalIncome]);

  // Clean up effects
  useEffect(() => {
      if (effects.length === 0) return;
      const timer = setTimeout(() => {
          const now = Date.now();
          setEffects(prev => prev.filter(e => now - e.startTime < 1000));
      }, 1000);
      return () => clearTimeout(timer);
  }, [effects]);

  const placeBuilding = useCallback((def: BuildingDef, x: number, y: number) => {
    if (!movingInstanceId && gameState.coins < def.price) {
      audioService.playError();
      return false;
    }

    // Population Cap Check for Residential
    if (!movingInstanceId && def.population > 0) {
        // Calculate potential new pop
        if (populationStats.current + def.population > populationStats.max) {
             // Optional: Allow building but warn, or block. 
             // For this gameplay loop, let's block to force leveling up
             // audioService.playError();
             // return false; 
             // Actually, usually you can build but it's useless, OR you are blocked. 
             // Let's allow building for freedom, the cap is just a soft limit for "Efficiency" or happiness in complex games.
             // In this simple game, let's just allow it, but maybe show red text in HUD.
        }
    }

    // Collision
    const isColliding = buildings.some(b => {
      if (b.id === movingInstanceId) return false;
      const bDef = BUILDINGS.find(d => d.id === b.defId)!;
      return (
        x < b.x + bDef.width &&
        x + def.width > b.x &&
        y < b.y + bDef.height &&
        y + def.height > b.y
      );
    });

    if (isColliding) {
      audioService.playError();
      return false;
    }
    
    // Terrain
    for (let i = 0; i < def.width; i++) {
        for (let j = 0; j < def.height; j++) {
            const tile = mapData.tiles[y+j]?.[x+i];
            if (tile !== TileType.GRASS && tile !== TileType.SAND) {
                audioService.playError();
                return false;
            }
        }
    }

    if (movingInstanceId) {
        setBuildings(prev => prev.map(b => b.id === movingInstanceId ? { ...b, x, y } : b));
        setMovingInstanceId(null);
        audioService.playPlace();
    } else {
        const newBuilding: PlacedBuilding = {
            id: Math.random().toString(36).substr(2, 9),
            defId: def.id,
            x,
            y,
            builtAt: Date.now(),
            level: 1,
        };
        setBuildings(prev => [...prev, newBuilding]);
        dispatch({ type: 'PLACE_BUILDING', payload: { def, x, y } });
        audioService.playPlace();
    }
    return true;
  }, [gameState.coins, buildings, mapData, movingInstanceId, populationStats]);

  const upgradeBuilding = (instanceId: string) => {
      const b = buildings.find(b => b.id === instanceId);
      if (!b) return;
      const def = BUILDINGS.find(d => d.id === b.defId);
      if (!def) return;

      const maxLevel = def.maxLevel || 3;
      if (b.level >= maxLevel) return;

      const cost = Math.floor(def.price * (b.level + 1) * 0.5);
      
      if (gameState.coins < cost) {
          audioService.playError();
          return;
      }

      dispatch({ type: 'ADD_COINS', payload: -cost });
      dispatch({ type: 'ADD_XP', payload: def.xp * b.level });
      setBuildings(prev => prev.map(item => item.id === instanceId ? { ...item, level: item.level + 1} : item));
      audioService.playUpgrade();
      
      if (selectedInstance?.id === instanceId) {
          setSelectedInstance({ ...b, level: b.level + 1 });
      }
  };

  const destroyBuilding = (instanceId: string) => {
      const b = buildings.find(b => b.id === instanceId);
      if (!b) return;
      const def = BUILDINGS.find(d => d.id === b.defId);
      
      const refund = Math.floor(def!.price * 0.5);

      setEffects(prev => [...prev, {
          id: Math.random().toString(36),
          x: b.x,
          y: b.y,
          type: 'DESTROY',
          startTime: Date.now()
      }]);

      setBuildings(prev => prev.filter(item => item.id !== instanceId));
      dispatch({ type: 'ADD_COINS', payload: refund });
      
      setSelectedInstance(null);
      setMode('VIEW');
      audioService.playClick();
  };

  const startMovingBuilding = (instanceId: string) => {
      const b = buildings.find(b => b.id === instanceId);
      if (!b) return;
      const def = BUILDINGS.find(d => d.id === b.defId);
      
      setMovingInstanceId(instanceId);
      setSelectedBuildingDef(def!);
      setSelectedInstance(null);
      setMode('PLACING');
      audioService.playClick();
  };

  const selectBuildingDefWrapper = (def: BuildingDef | null) => {
    setSelectedBuildingDef(def);
    setMovingInstanceId(null);
    if (def) {
      setMode('PLACING');
      setSelectedInstance(null);
    } else {
      setMode('VIEW');
    }
  };

  const selectInstanceWrapper = (inst: PlacedBuilding | null) => {
    if (mode === 'PLACING') return;
    setSelectedInstance(inst);
    if (inst) {
      setMode('INSPECT');
      audioService.playClick();
    } else {
      setMode('VIEW');
    }
  };

  const actions = {
    placeBuilding,
    setMode: (m: GameMode) => {
        if (m === 'VIEW') setMovingInstanceId(null);
        setMode(m);
    },
    selectCategory: setSelectedCategory,
    selectBuildingDef: selectBuildingDefWrapper,
    selectInstance: selectInstanceWrapper,
    upgradeBuilding,
    startMovingBuilding,
    destroyBuilding,
    addCoins: (amount: number) => dispatch({ type: 'ADD_COINS', payload: amount }),
    cycleTime: () => {
        audioService.playClick();
        setTimeOfDay(prev => (prev + 6) % 24);
    },
    updatePlayerName: (name: string) => dispatch({ type: 'SET_NAME', payload: name }),
    exchangeXpForCoins: (xpAmount: number) => {
        // Rate: 10 XP = 1 Coin (Expensive to discourage, but allows dumping excess XP)
        // Or Reverse: usually people want XP. 
        // Prompt said "exchange XP for Coins".
        // Let's do 1 XP = 10 Coins.
        if (gameState.xp >= xpAmount) {
            dispatch({ type: 'EXCHANGE_XP', payload: { xp: xpAmount, coins: xpAmount * 10 } });
            audioService.playUpgrade(); // Sound effect
        }
    }
  };

  return (
    <GameContext.Provider value={{
      state: gameState,
      telegramUser,
      mapData,
      buildings,
      effects,
      mode,
      selectedCategory,
      selectedBuildingDef,
      selectedInstance,
      movingInstanceId,
      populationStats,
      totalIncome,
      timeOfDay,
      actions
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
