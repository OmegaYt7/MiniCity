
import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import WorldMap from './components/WorldMap';
import HUD from './components/UI/HUD';
import ConstructionMenu from './components/UI/ConstructionMenu';
import BuildingInspect from './components/UI/BuildingInspect';
import { audioService } from './services/audioService';

function GameContent() {
    const { isLoadingSave } = useGame();
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
  
    useEffect(() => {
      // Fake loading visual
      setTimeout(() => setLoadingProgress(100), 100);
      
      const timer = setTimeout(() => setIsLoaded(true), 1600);
      return () => clearTimeout(timer);
    }, []);
  
    const toggleMute = () => {
      const muted = audioService.toggleMute();
      setIsMuted(muted);
    };

    if (!isLoaded || isLoadingSave) {
        return (
          <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50">
            <div className="relative mb-6">
               <div className="text-8xl animate-bounce-gentle filter drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">🏗️</div>
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-[100%] blur-sm animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-black tracking-[0.2em] text-slate-200 mb-8 drop-shadow-lg">МОЙ ГОРОД</h1>
            
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 loading-bar shadow-[0_0_10px_#3b82f6]" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isLoadingSave ? 'Синхронизация...' : 'Загрузка ресурсов...'}
            </div>
          </div>
        );
      }
    
      return (
        <div className="relative w-full h-full overflow-hidden bg-[#0f172a] select-none font-sans text-slate-200">
            <WorldMap onInteract={() => {}} />
            <HUD isMuted={isMuted} onToggleMute={toggleMute} />
            <ConstructionMenu />
            <BuildingInspect />
            <InstructionOverlay />
        </div>
      );
}

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

// Helper component to show hints based on mode
const InstructionOverlay = () => {
  const { mode, actions, ghostPosition } = useGame();
  
  if (mode === 'PLACING') {
    return (
      <div className="absolute bottom-24 left-0 w-full flex flex-col items-center gap-4 pointer-events-none z-40">
        {!ghostPosition && (
            <div className="bg-slate-900/90 backdrop-blur-md text-slate-200 px-6 py-3 rounded-2xl shadow-2xl font-bold border border-slate-700 flex items-center gap-2 animate-pulse">
            <span>👇</span> Выберите место на карте
            </div>
        )}

        {ghostPosition && (
            <div className="pointer-events-auto flex gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
                <button 
                    onClick={() => actions.cancelBuilding()}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-900/50"
                >
                    Отмена
                </button>
                <button 
                    onClick={() => actions.confirmBuilding()}
                    disabled={!ghostPosition.valid}
                    className={`font-bold py-3 px-8 rounded-xl shadow-lg transition-all ${
                        ghostPosition.valid 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/50 scale-105' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    Построить
                </button>
            </div>
        )}

        {!ghostPosition && (
            <button 
                onClick={() => actions.cancelBuilding()}
                className="pointer-events-auto bg-slate-800 text-slate-300 font-bold py-2 px-8 rounded-full shadow-lg border border-slate-600"
            >
                Отмена
            </button>
        )}
      </div>
    );
  }

  return null; 
}

export default App;
