import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import WorldMap from './components/WorldMap';
import HUD from './components/UI/HUD';
import ConstructionMenu from './components/UI/ConstructionMenu';
import BuildingInspect from './components/UI/BuildingInspect';
import { audioService } from './services/audioService';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Fake loading screen
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[#0ea5e9] flex flex-col items-center justify-center text-white z-50">
        <div className="relative mb-6">
           <div className="text-8xl animate-bounce filter drop-shadow-lg">🏗️</div>
           <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/10 rounded-[100%] blur-sm animate-pulse"></div>
        </div>
        <h1 className="text-3xl font-black tracking-[0.2em] text-white/90 mb-8 drop-shadow-md">МОЙ ГОРОД</h1>
        
        <div className="w-48 h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[width_1.5s_ease-in-out_forwards] shadow-[0_0_10px_white]" style={{ width: '0%' }}></div>
        </div>
        <div className="mt-4 text-xs font-bold text-white/70">ЗАГРУЗКА...</div>
      </div>
    );
  }

  return (
    <GameProvider>
      <div className="relative w-full h-full overflow-hidden bg-[#0ea5e9] select-none font-sans">
        
        {/* Layer 1: The Game World (Canvas) */}
        <WorldMap onInteract={() => {}} />

        {/* Layer 2: UI Overlays */}
        {/* We pass the mute state to HUD to keep controls unified */}
        <HUD isMuted={isMuted} onToggleMute={toggleMute} />
        
        {/* Layer 3: Interactive Panels */}
        <ConstructionMenu />
        <BuildingInspect />

        {/* Placement Instructions */}
        <InstructionOverlay />
        
      </div>
    </GameProvider>
  );
}

// Helper component to show hints based on mode
const InstructionOverlay = () => {
  const { mode, actions } = useGame();
  
  if (mode === 'PLACING') {
    return (
      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-4 pointer-events-none z-40">
        <div className="bg-white/90 backdrop-blur-md text-slate-700 px-6 py-3 rounded-2xl shadow-xl font-bold border border-white/50 flex items-center gap-2 animate-bounce">
          <span>👇</span> Выберите место для стройки
        </div>
        <button 
            onClick={() => {
                actions.setMode('VIEW');
                actions.selectBuildingDef(null);
            }}
            className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform active:scale-95"
        >
            Отмена
        </button>
      </div>
    );
  }

  return null; 
}

export default App;