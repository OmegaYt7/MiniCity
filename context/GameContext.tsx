import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { GameState, MapData, PlacedBuilding, BuildingDef, TileType, GameMode } from '../types';
import { INITIAL_RESOURCES, generateMap, MAP_SIZE, BUILDINGS } from '../constants';
import { audioService } from '../services/audioService';

interface GameContextProps {
  state: GameState;
  mapData: MapData;
  buildings: PlacedBuilding[];
  mode: GameMode;
  selectedCategory: string | null;
  selectedBuildingDef: BuildingDef | null;
  selectedInstance: PlacedBuilding | null;
  actions: {
    placeBuilding: (def: BuildingDef, x: number, y: number) => boolean;
    setMode: (mode: GameMode) => void;
    selectCategory: (category: string | null) => void;
    selectBuildingDef: (def: BuildingDef | null) => void;
    selectInstance: (instance: PlacedBuilding | null) => void;
    upgradeBuilding: (instanceId: string) => void;
    moveBuilding: (instanceId: string, newX: number, newY: number) => void;
    addCoins: (amount: number) => void;
  };
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

// Actions
type Action =
  | { type: 'TICK_INCOME' }
  | { type: 'PLACE_BUILDING'; payload: { def: BuildingDef; x: number; y: number } }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SELECT_CATEGORY'; payload: string | null }
  | { type: 'SELECT_BUILDING_DEF'; payload: BuildingDef | null }
  | { type: 'SELECT_INSTANCE'; payload: PlacedBuilding | null }
  | { type: 'MOVE_BUILDING'; payload: { id: string; x: number; y: number } }
  | { type: 'ADD_COINS'; payload: number };

// Reducer
const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'TICK_INCOME':
      // This is handled partly in hook, but here we could do complex logic
      return state; 
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload };
    case 'PLACE_BUILDING':
      return {
        ...state,
        coins: state.coins - action.payload.def.price,
        population: state.population + action.payload.def.population,
        xp: state.xp + action.payload.def.xp,
      };
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_RESOURCES);
  const [mapData] = React.useState<MapData>(() => ({
    width: MAP_SIZE,
    height: MAP_SIZE,
    tiles: generateMap(MAP_SIZE),
  }));
  const [buildings, setBuildings] = React.useState<PlacedBuilding[]>([]);
  const [mode, setMode] = React.useState<GameMode>('VIEW');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedBuildingDef, setSelectedBuildingDef] = React.useState<BuildingDef | null>(null);
  const [selectedInstance, setSelectedInstance] = React.useState<PlacedBuilding | null>(null);

  // Income Loop
  useEffect(() => {
    const interval = setInterval(() => {
      let income = 0;
      buildings.forEach((b) => {
        const def = BUILDINGS.find((d) => d.id === b.defId);
        if (def) income += def.income;
      });

      if (income > 0) {
        dispatch({ type: 'ADD_COINS', payload: income });
      }
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [buildings]);

  const placeBuilding = useCallback((def: BuildingDef, x: number, y: number) => {
    if (gameState.coins < def.price) {
      audioService.playError();
      return false;
    }

    // Check collision with other buildings
    const isColliding = buildings.some(b => {
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
    
    // Check terrain (Must be GRASS)
    for (let i = 0; i < def.width; i++) {
        for (let j = 0; j < def.height; j++) {
            const tile = mapData.tiles[y+j]?.[x+i];
            if (tile !== TileType.GRASS && tile !== TileType.SAND) {
                audioService.playError();
                return false;
            }
        }
    }

    const newBuilding: PlacedBuilding = {
      id: Math.random().toString(36).substr(2, 9),
      defId: def.id,
      x,
      y,
      builtAt: Date.now(),
    };

    setBuildings(prev => [...prev, newBuilding]);
    dispatch({ type: 'PLACE_BUILDING', payload: { def, x, y } });
    audioService.playPlace();
    return true;
  }, [gameState.coins, buildings, mapData]);

  const moveBuilding = useCallback((id: string, x: number, y: number) => {
    // Simplified move logic: assume valid if called (validation happens in UI/Canvas)
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, x, y } : b));
    audioService.playPlace(); // Reuse place sound
  }, []);

  const selectBuildingDefWrapper = (def: BuildingDef | null) => {
    setSelectedBuildingDef(def);
    if (def) {
      // CHANGE: Go to Preview mode first, not Placement
      setMode('BUILDING_PREVIEW');
      setSelectedInstance(null);
    } else {
      setMode('VIEW');
    }
  };

  const selectInstanceWrapper = (inst: PlacedBuilding | null) => {
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
    setMode: (m: GameMode) => setMode(m),
    selectCategory: setSelectedCategory,
    selectBuildingDef: selectBuildingDefWrapper,
    selectInstance: selectInstanceWrapper,
    upgradeBuilding: (id: string) => {
        // Mock upgrade
        audioService.playUpgrade();
        dispatch({type: 'ADD_COINS', payload: -100}); // Cost
        dispatch({type: 'ADD_COINS', payload: 0}); // Force update?
        // In real app, update building level/stats
    },
    moveBuilding,
    addCoins: (amount: number) => dispatch({ type: 'ADD_COINS', payload: amount }),
  };

  return (
    <GameContext.Provider value={{
      state: gameState,
      mapData,
      buildings,
      mode,
      selectedCategory,
      selectedBuildingDef,
      selectedInstance,
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
