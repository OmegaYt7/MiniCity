
import React, { createContext, useContext, useEffect, useReducer, useCallback, useState, useRef } from 'react';
import { GameState, MapData, PlacedBuilding, BuildingDef, TileType, GameMode, VisualEffect, TelegramUser, GhostPosition } from '../types';
import { INITIAL_RESOURCES, generateMap, MAP_SIZE, BUILDINGS } from '../constants';
import { audioService } from '../services/audioService';

interface PopulationStats {
  free: number;
  total: number;
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
  ghostPosition: GhostPosition | null;
  populationStats: PopulationStats;
  totalIncome: number;
  timeOfDay: number; // 0-24 Float
  activePopup: 'NONE' | 'LEVEL_UP' | 'REFERRAL';
  popupData: any;
  actions: {
    setGhostPosition: (x: number, y: number) => void;
    confirmBuilding: () => boolean;
    cancelBuilding: () => void;
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
    closePopup: () => void;
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
  | { type: 'EXCHANGE_XP'; payload: { xp: number, coins: number } }
  | { type: 'REFERRAL_REWARD'; payload: number };

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'ADD_COINS':
      return { ...state, coins: Math.max(0, Math.floor(state.coins + action.payload)) };
    case 'ADD_XP':
      const earnedXp = action.payload;
      const newSpendableXp = state.xp + earnedXp;
      const newTotalXp = state.totalXpEarned + earnedXp;
      
      // Cumulative Level Logic
      // Level N requires N*500 XP total accumulated
      // Check if current Total XP is enough for Next Level
      // If Total XP >= (Level+1) * 500, then Level Up
      
      let calcLevel = 1;
      let costForNext = 500;
      // Simple linear cumulative: Lvl 1=0, Lvl 2=500, Lvl 3=1000...
      // OR Prompt says: "Total XP required... does not need to be shown globally"
      // Let's use: Total XP / 500 + 1 (floor).
      // Example: 0 XP = Level 1. 500 XP = Level 2. 1200 XP = Level 3.
      calcLevel = Math.floor(newTotalXp / 500) + 1;
      
      // Ensure level never drops
      if (calcLevel < state.level) calcLevel = state.level;
      
      return { 
          ...state, 
          xp: newSpendableXp, 
          totalXpEarned: newTotalXp,
          level: calcLevel 
      };
      
    case 'PLACE_BUILDING':
      // Just deduct coins, XP addition handled separately or here?
      // Let's do both here to be safe
      return {
        ...state,
        coins: Math.max(0, state.coins - action.payload.def.price),
        xp: state.xp + action.payload.def.xp,
        totalXpEarned: state.totalXpEarned + action.payload.def.xp,
        level: Math.floor((state.totalXpEarned + action.payload.def.xp) / 500) + 1
      };
    case 'SET_NAME':
      return { ...state, playerName: action.payload };
    case 'EXCHANGE_XP':
      return {
          ...state,
          xp: Math.max(0, state.xp - action.payload.xp),
          coins: state.coins + action.payload.coins
      };
    case 'REFERRAL_REWARD':
      return {
          ...state,
          coins: state.coins + action.payload,
          referrals: state.referrals + 1
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
  
  // Ghost for placement
  const [ghostPosition, setGhostPositionRaw] = useState<GhostPosition | null>(null);

  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  
  // Popup State
  const [activePopup, setActivePopup] = useState<'NONE' | 'LEVEL_UP' | 'REFERRAL'>('NONE');
  const [popupData, setPopupData] = useState<any>(null);

  // Derived Stats
  const [populationStats, setPopulationStats] = useState<PopulationStats>({ free: 0, total: 0 });
  const [totalIncome, setTotalIncome] = useState(0);

  // Time State (0-24)
  const [timeOfDay, setTimeOfDay] = useState(12);

  // Level Up Check Effect
  const prevLevel = useRef(gameState.level);
  useEffect(() => {
      if (gameState.level > prevLevel.current) {
          audioService.playUpgrade();
          setActivePopup('LEVEL_UP');
          setPopupData({ level: gameState.level, reward: gameState.level * 1000 });
          dispatch({ type: 'ADD_COINS', payload: gameState.level * 1000 });
          prevLevel.current = gameState.level;
      }
  }, [gameState.level]);

  // Initialize Telegram User & Referrals
  useEffect(() => {
     if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe?.user) {
            setTelegramUser(tg.initDataUnsafe.user);
            dispatch({ type: 'SET_NAME', payload: tg.initDataUnsafe.user.first_name });
        }
        
        // Referral Check logic
        const startParam = tg.initDataUnsafe?.start_param;
        if (startParam && startParam.includes('ref')) {
             setTimeout(() => {
                setActivePopup('REFERRAL');
                setPopupData({ reward: 5000 });
                dispatch({ type: 'REFERRAL_REWARD', payload: 5000 });
             }, 1000);
        }
     }
  }, []);

  // Internal Time Loop (12 minutes = 24 hours game time)
  // 12 mins = 720 seconds. 24 hours / 720s = 0.0333 hours per second.
  // We want 4 phases of 3 mins each.
  // 00-06 (6h), 06-12 (6h), 12-18 (6h), 18-24 (6h).
  useEffect(() => {
    const tickRate = 100; // ms
    // Hours per real second = 24 / 720 = 1/30 = 0.0333
    // Hours per 100ms = 0.00333
    const increment = 0.00333; 

    const interval = setInterval(() => {
        setTimeOfDay(prev => (prev + increment) % 24); 
    }, tickRate); 
    return () => clearInterval(interval);
  }, []);

  // Stats Calculation
  useEffect(() => {
    let totalPop = 0;
    let requiredPop = 0;
    let inc = 0;

    buildings.forEach(b => {
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def) return;

        inc += Math.max(0, Math.floor(def.income * (1 + (b.level - 1) * 0.5)));

        const val = def.population * b.level;
        if (def.population > 0) {
            totalPop += val;
        } else {
            requiredPop += Math.abs(val);
        }
    });

    const freePop = Math.max(0, totalPop - requiredPop);

    setPopulationStats({ free: freePop, total: totalPop });
    setTotalIncome(Math.max(0, inc));
  }, [buildings]);

  // Income Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalIncome > 0) {
        dispatch({ type: 'ADD_COINS', payload: totalIncome });
      }
    }, 10000); 
    return () => clearInterval(interval);
  }, [totalIncome]);

  // Cleanup effects
  useEffect(() => {
      if (effects.length === 0) return;
      const timer = setTimeout(() => {
          const now = Date.now();
          setEffects(prev => prev.filter(e => now - e.startTime < 1000));
      }, 1000);
      return () => clearTimeout(timer);
  }, [effects]);

  // Validation Logic reused
  const checkPlacementValidity = (def: BuildingDef, x: number, y: number, ignoreId?: string | null) => {
    // Collision
    const isColliding = buildings.some(b => {
      if (b.id === ignoreId) return false;
      const bDef = BUILDINGS.find(d => d.id === b.defId)!;
      return (
        x < b.x + bDef.width &&
        x + def.width > b.x &&
        y < b.y + bDef.height &&
        y + def.height > b.y
      );
    });
    if (isColliding) return false;
    
    // Terrain
    if (x < 0 || y < 0 || x + def.width > mapData.width || y + def.height > mapData.height) return false;
    for (let i = 0; i < def.width; i++) {
        for (let j = 0; j < def.height; j++) {
            const tile = mapData.tiles[y+j]?.[x+i];
            if (tile !== TileType.GRASS && tile !== TileType.SAND) return false;
        }
    }
    return true;
  };

  const setGhostPosition = (x: number, y: number) => {
      if (!selectedBuildingDef) return;
      const valid = checkPlacementValidity(selectedBuildingDef, x, y, movingInstanceId);
      setGhostPositionRaw({ x, y, valid });
  };

  const confirmBuilding = () => {
      if (!ghostPosition || !ghostPosition.valid || !selectedBuildingDef) {
          audioService.playError();
          return false;
      }
      
      const { x, y } = ghostPosition;
      const def = selectedBuildingDef;

      if (!movingInstanceId && gameState.coins < def.price) {
          audioService.playError();
          return false;
      }

      if (!movingInstanceId && def.population < 0) {
        const required = Math.abs(def.population);
        if (populationStats.free < required) {
             audioService.playError();
             return false;
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

      // Reset interactions
      setGhostPositionRaw(null);
      setSelectedBuildingDef(null);
      setMode('VIEW'); // Important: Switch to View
      setSelectedInstance(null); // Important: Do NOT select the building (avoids mobile popup)
      
      return true;
  };

  const cancelBuilding = () => {
      setGhostPositionRaw(null);
      setMode('VIEW');
      setSelectedBuildingDef(null);
      setMovingInstanceId(null);
      setSelectedInstance(null);
  };

  const upgradeBuilding = (instanceId: string) => {
      const b = buildings.find(b => b.id === instanceId);
      if (!b) return;
      const def = BUILDINGS.find(d => d.id === b.defId);
      if (!def) return;

      const maxLevel = def.maxLevel || 5;
      if (b.level >= maxLevel) return;

      const cost = Math.floor(def.price * (b.level + 1) * 0.5);
      
      if (gameState.coins < cost) {
          audioService.playError();
          return;
      }

      if (def.population < 0) {
          const extraWorkers = Math.abs(def.population); 
          if (populationStats.free < extraWorkers) {
              audioService.playError();
              return;
          }
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
      // Set initial ghost
      setGhostPositionRaw({ x: b.x, y: b.y, valid: true });
      audioService.playClick();
  };

  const selectBuildingDefWrapper = (def: BuildingDef | null) => {
    setSelectedBuildingDef(def);
    setMovingInstanceId(null);
    setGhostPositionRaw(null);
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
    setGhostPosition,
    confirmBuilding,
    cancelBuilding,
    setMode: (m: GameMode) => {
        if (m === 'VIEW') {
            setMovingInstanceId(null);
            setGhostPositionRaw(null);
        }
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
        setTimeOfDay(prev => (prev + 2) % 24); // Debug skip
    },
    updatePlayerName: (name: string) => dispatch({ type: 'SET_NAME', payload: name }),
    exchangeXpForCoins: (xpAmount: number) => {
        if (gameState.xp >= xpAmount) {
            dispatch({ type: 'EXCHANGE_XP', payload: { xp: xpAmount, coins: xpAmount * 10 } });
            audioService.playUpgrade(); 
        }
    },
    closePopup: () => setActivePopup('NONE')
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
      ghostPosition,
      populationStats,
      totalIncome,
      timeOfDay,
      activePopup,
      popupData,
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
