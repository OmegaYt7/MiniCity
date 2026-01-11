import React from 'react';
import { useGame } from '../../context/GameContext';

interface HUDProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

const HUD: React.FC<HUDProps> = ({ isMuted, onToggleMute }) => {
  const { state } = useGame();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-10 safe-area-top">
      {/* Top Left: Resources */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        
        {/* Coins */}
        <div className="group flex items-center gap-3 bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg border border-white/50 transition-transform active:scale-95">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl border-2 border-yellow-300 text-yellow-600">
            💰
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">Монеты</span>
            <span className="text-xl font-black text-slate-800 leading-none font-mono tracking-tight">{formatNumber(state.coins)}</span>
          </div>
        </div>

        {/* Population */}
        <div className="group flex items-center gap-3 bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg border border-white/50 transition-transform active:scale-95">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl border-2 border-blue-300 text-blue-600">
            👥
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">Жители</span>
            <span className="text-xl font-black text-slate-800 leading-none font-mono tracking-tight">{formatNumber(state.population)}</span>
          </div>
        </div>
      </div>

      {/* Top Right: Status & Settings */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {/* Level / XP */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl pl-4 pr-2 py-2 rounded-2xl shadow-lg border border-white/50">
           <div className="flex flex-col items-end mr-1">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">Уровень {state.level}</span>
             <span className="text-lg font-black text-slate-800 leading-none">{formatNumber(state.xp)} XP</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm border-2 border-purple-300">
             ⭐
           </div>
        </div>

        {/* Settings / Mute */}
        <button 
          onClick={onToggleMute}
          className="w-10 h-10 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/50 text-slate-600 hover:text-slate-900 transition-all active:scale-90"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
};

export default HUD;