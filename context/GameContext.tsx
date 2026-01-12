
import React, { createContext, useContext, useEffect, useReducer, useCallback, useState, useRef } from 'react';
import { GameState, MapData, PlacedBuilding, BuildingDef, TileType, GameMode, VisualEffect, TelegramUser, GhostPosition, OfflineEarnings } from '../types';
import { INITIAL_RESOURCES, generateMap, MAP_SIZE, BUILDINGS } from '../constants';
import { audioService } from '../services/audioService';
import { storageService, SaveData } from '../services/storageService';

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
  activePopup: 'NONE' | 'LEVEL_UP' | 'REFERRAL' | 'OFFLINE';
  popupData: any;
  isLoadingSave: boolean;
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
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'TICK_INCOME' }
  | { type: 'PLACE_BUILDING'; payload: { def: BuildingDef; x: number; y: number } }
  | { type: 'REMOVE_BUILDING'; payload: string }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'EXCHANGE_XP'; payload: { xp: number, coins: number } }
  | { type: 'REFERRAL_REWARD'; payload: number }
  | { type: 'OFFLINE_EARNINGS'; payload: { coins: number; xp: number } };

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'LOAD_STATE':
        return { ...action.payload };
    case 'ADD_COINS':
      return { ...state, coins: Math.max(0, Math.floor(state.coins + action.payload)) };
    case 'ADD_XP':
      const earnedXp = action.payload;
      const newSpendableXp = state.xp + earnedXp;
      const newTotalXp = state.totalXpEarned + earnedXp;
      
      let calcLevel = Math.floor(newTotalXp / 500) + 1;
      if (calcLevel < state.level) calcLevel = state.level;
      
      return { 
          ...state, 
          xp: newSpendableXp, 
          totalXpEarned: newTotalXp,
          level: calcLevel 
      };
      
    case 'PLACE_BUILDING':
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
    case 'OFFLINE_EARNINGS':
       return {
           ...state,
           coins: state.coins + action.payload.coins,
           xp: state.xp + action.payload.xp,
           totalXpEarned: state.totalXpEarned + action.payload.xp
           // Level up check is mostly visual on load, done by logic
       };
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_RESOURCES);
  const [mapData, setMapData] = useState<MapData>(() => generateMap(MAP_SIZE));
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
  const [activePopup, setActivePopup] = useState<'NONE' | 'LEVEL_UP' | 'REFERRAL' | 'OFFLINE'>('NONE');
  const [popupData, setPopupData] = useState<any>(null);

  // Derived Stats
  const [populationStats, setPopulationStats] = useState<PopulationStats>({ free: 0, total: 0 });
  const [totalIncome, setTotalIncome] = useState(0);

  // Time State (0-24)
  const [timeOfDay, setTimeOfDay] = useState(12);

  // Loading flag
  const [isLoadingSave, setIsLoadingSave] = useState(true);

  // --- PERSISTENCE & OFFLINE LOGIC ---

  const saveData = useCallback(() => {
      const data: SaveData = {
          gameState: { ...gameState, lastSaveTime: Date.now() },
          mapData,
          buildings,
          timeOfDay
      };
      storageService.saveState(data);
  }, [gameState, mapData, buildings, timeOfDay]);

  // Initial Load
  useEffect(() => {
      const init = async () => {
          const loaded = await storageService.loadState();
          if (loaded) {
              dispatch({ type: 'LOAD_STATE', payload: loaded.gameState });
              setMapData(loaded.mapData);
              setBuildings(loaded.buildings);
              setTimeOfDay(loaded.timeOfDay);

              // Offline Calculation
              const now = Date.now();
              const lastSave = loaded.gameState.lastSaveTime || now;
              const diffMs = now - lastSave;
              const diffSeconds = Math.floor(diffMs / 1000);
              
              // Max offline time: 24 hours (86400 seconds)
              const cappedSeconds = Math.min(diffSeconds, 86400);
              const diffMinutes = cappedSeconds / 60;

              if (diffMinutes > 5) { // Minimum 5 mins to trigger
                  let totalCoins = 0;
                  let totalXp = 0;

                  loaded.buildings.forEach(b => {
                      const def = BUILDINGS.find(d => d.id === b.defId);
                      if (def) {
                          const income = Math.max(0, Math.floor(def.income * (1 + (b.level - 1) * 0.5)));
                          totalCoins += income * diffMinutes;
                          // Small passive XP? Let's say 10% of coins as XP for fun
                          totalXp += Math.floor((income * diffMinutes) * 0.05); 
                      }
                  });
                  
                  totalCoins = Math.floor(totalCoins);
                  
                  if (totalCoins > 0) {
                      dispatch({ type: 'OFFLINE_EARNINGS', payload: { coins: totalCoins, xp: totalXp } });
                      setPopupData({ coins: totalCoins, xp: totalXp, timeOfflineSeconds: cappedSeconds });
                      setActivePopup('OFFLINE');
                  }
              }

          }
          setIsLoadingSave(false);
      };
      init();
  }, []);

  // Auto-Save Loop (30s)
  useEffect(() => {
      if (isLoadingSave) return;
      const interval = setInterval(() => {
          saveData();
      }, 30000);
      return () => clearInterval(interval);
  }, [saveData, isLoadingSave]);


  // --- STANDARD GAME LOGIC ---

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
                saveData(); // Save immediately on referral
             }, 2000); // Delay slightly to not overlap with offline popup
        }
     }
  }, []);

  // Level Up Check Effect
  const prevLevel = useRef(gameState.level);
  useEffect(() => {
      if (!isLoadingSave && gameState.level > prevLevel.current) {
          audioService.playUpgrade();
          setActivePopup('LEVEL_UP');
          setPopupData({ level: gameState.level, reward: gameState.level * 1000 });
          dispatch({ type: 'ADD_COINS', payload: gameState.level * 1000 });
          prevLevel.current = gameState.level;
          saveData(); // Save on level up
      }
  }, [gameState.level, isLoadingSave, saveData]);

  // Internal Time Loop
  useEffect(() => {
    const tickRate = 100; // ms
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

      setGhostPositionRaw(null);
      setSelectedBuildingDef(null);
      setMode('VIEW'); 
      setSelectedInstance(null);
      saveData(); // Save on build
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
      saveData(); // Save on upgrade
      
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
      saveData(); // Save on destroy
  };

  const startMovingBuilding = (instanceId: string) => {
      const b = buildings.find(b => b.id === instanceId);
      if (!b) return;
      const def = BUILDINGS.find(d => d.id === b.defId);
      
      setMovingInstanceId(instanceId);
      setSelectedBuildingDef(def!);
      setSelectedInstance(null);
      setMode('PLACING');
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
        setTimeOfDay(prev => (prev + 2) % 24); 
    },
    updatePlayerName: (name: string) => {
        dispatch({ type: 'SET_NAME', payload: name });
        saveData(); // Save name change
    },
    exchangeXpForCoins: (xpAmount: number) => {
        if (gameState.xp >= xpAmount) {
            dispatch({ type: 'EXCHANGE_XP', payload: { xp: xpAmount, coins: xpAmount * 10 } });
            audioService.playUpgrade(); 
            saveData(); // Save exchange
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
      isLoadingSave,
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
