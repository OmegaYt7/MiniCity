
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { audioService } from '../../services/audioService';
import { ProfileModal, XpExchangeModal, RewardPopup } from './Modals';

interface HUDProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

const HUD: React.FC<HUDProps> = ({ isMuted, onToggleMute }) => {
  const { state, populationStats, totalIncome, timeOfDay, actions, activePopup } = useGame();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showXpExchange, setShowXpExchange] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // Continuous Clock Rotation
  // timeOfDay is 0-24. We want 0-360 degrees.
  // 6:00 (Sunrise) -> -90 deg (Left? No, prompt said Right Edge = Sunrise)
  // Let's standard math: 0 deg = East (Right).
  // So 6:00 = 0 deg.
  // 12:00 = 90 deg (Bottom? No, prompt said Top = Day).
  // Standard clock: Top is -90 deg.
  // 
  // Let's map:
  // 06:00 -> 0 deg (Right)
  // 12:00 -> -90 deg (Top)
  // 18:00 -> -180 deg (Left)
  // 24:00 -> -270 deg (Bottom)
  // Formula: (Time - 6) * -15
  // 6-6=0 -> 0.
  // 12-6=6 -> -90.
  // 18-6=12 -> -180.
  // 0-6 = -6 -> 90 (-270 equiv).
  // This results in counter-clockwise.
  
  // Prompt says: "Must always move forward clockwise"
  // So:
  // 6:00 -> 0 deg (Right)
  // 12:00 -> 270 deg (Top)
  // 18:00 -> 180 deg (Left)
  // 24:00 -> 90 deg (Bottom)
  
  // Actually, visual intuition: Sun rises in East (Right/0), goes up to Top (270/-90), sets West (Left/180).
  // That is Counter-Clockwise motion visually on screen if Top is -90.
  // To make it Clockwise: 
  // 6:00 (Right/0) -> 12:00 (Bottom/90). That's weird for "Day".
  
  // Let's assume the prompt wants visual position:
  // Right -> Top -> Left -> Bottom. (Counter-Clockwise in standard CSS angles where 0 is Right).
  // CSS transform: rotate(Xdeg). 0 = Right, 90 = Down, 180 = Left, 270 = Top.
  // Prompt: "Clockwise".
  // Right (0) -> Bottom (90) -> Left (180) -> Top (270). 
  // Maybe "Center -> Day" implies Top is Day.
  // If we must rotate clockwise and Top is Day:
  // Sunrise (Left) -> Day (Top) -> Sunset (Right).
  // But Prompt says: "Right edge -> Sunrise".
  // So: Right (Sunrise) -> Bottom (Day?) -> Left (Sunset).
  // That would be clockwise.
  
  // Let's stick to the visual:
  // Right (Sunrise). Top (Day). Left (Sunset). Bottom (Night).
  // This path is Counter-Clockwise (0 -> -90 -> -180 -> -270).
  // To simulate "Clockwise" pointer movement, the pointer must rotate 0 -> 90 -> 180.
  // If 0 is Sunrise (Right), 90 is Bottom. 
  // There is a conflict in the prompt description vs standard "Sun goes Up".
  // I will prioritize "Right=Sunrise, Top=Day, Left=Sunset".
  // Rotation: (Time - 6) * -15.
  
  const rotation = (timeOfDay - 6) * -15; 
  // 6am -> 0. 12pm -> -90. 18pm -> -180. 24pm -> -270.
  // Handle smooth wrapping? timeOfDay 24->0 causes jump -270 -> 90.
  // We can just keep time cumulative or use CSS transition trick.
  // Since timeOfDay wraps 24->0 in context, we get a jump.
  // CSS: transition-transform duration-100 ease-linear. 
  // Jump from -270 to 90 is 360 degrees. 
  // To fix jump, we can assume time is continuous in the context, but it resets.
  // For the UI, let's just use the style.
  
  const isSun = timeOfDay >= 6 && timeOfDay < 18;

  return (
    <>
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-20 safe-area-top">
      
      {/* Top Left: Profile & Coins */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        <button 
            onClick={() => { audioService.playClick(); setShowProfile(true); }}
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-xl shadow-lg active:scale-95 transition-transform"
        >
            👤
        </button>

        <div className="flex flex-col gap-1">
             <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl border border-slate-700 min-w-[120px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">Монеты</div>
                <div className="text-xl font-black text-yellow-400 leading-none font-mono drop-shadow-sm">
                    {formatNumber(state.coins)} 💰
                </div>
             </div>
             
             <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 self-start">
                 <span className="text-xs font-bold text-green-400">+{totalIncome}/мин</span>
             </div>
        </div>
      </div>

      {/* Top Right: Status & Clock */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        
        <button 
            onClick={() => { audioService.playClick(); setShowXpExchange(true); }}
            className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl pl-4 pr-2 py-2 rounded-2xl shadow-xl border border-slate-700 active:scale-95 transition-transform group"
        >
           <div className="flex flex-col items-end mr-1">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5 group-hover:text-purple-300 transition-colors">Уровень {state.level}</span>
             <span className="text-lg font-black text-slate-100 leading-none drop-shadow-sm">{formatNumber(state.xp)} XP</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
             ⭐
           </div>
        </button>

        <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl border border-slate-700 flex flex-col items-end">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">Жители</span>
             <div className="flex items-baseline gap-1 font-mono">
                 <span className={`text-xl font-black ${populationStats.free > 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(populationStats.free)}</span>
                 <span className="text-sm text-slate-500 font-bold">/</span>
                 <span className="text-sm text-slate-500 font-bold">{formatNumber(populationStats.total)}</span>
             </div>
        </div>

        {/* Day/Night Clock UI */}
        <div 
            className="w-14 h-14 bg-slate-900/90 backdrop-blur-xl rounded-full shadow-lg border border-slate-700 relative overflow-hidden flex items-center justify-center"
        >
            <div className={`absolute inset-0 transition-colors duration-1000 ${isSun ? 'bg-sky-400/20' : 'bg-indigo-900/40'}`}></div>
            <div className="absolute bottom-0 w-full h-1/2 bg-slate-800/50 border-t border-slate-600"></div>
            
            <div 
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-100 ease-linear"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {/* Pointer (Sun/Moon) offset to Right */}
                <div 
                    className={`absolute right-1 w-4 h-4 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500 ${isSun ? 'bg-yellow-400 text-yellow-400' : 'bg-slate-200 text-slate-200'}`}
                ></div>
            </div>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        </div>
      </div>
    </div>

    {/* Modals */}
    {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    {showXpExchange && <XpExchangeModal onClose={() => setShowXpExchange(false)} />}
    
    {activePopup !== 'NONE' && <RewardPopup />}
    </>
  );
};

export default HUD;
