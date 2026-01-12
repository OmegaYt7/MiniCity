
import React from 'react';
import { useGame } from '../../context/GameContext';
import { BUILDINGS } from '../../constants';
import { audioService } from '../../services/audioService';

const BuildingInspect: React.FC = () => {
  const { mode, selectedInstance, actions, state, populationStats } = useGame();

  if (mode !== 'INSPECT') return null;

  const def = BUILDINGS.find(d => d.id === selectedInstance?.defId);
  if (!def || !selectedInstance) return null;

  const handleCancel = () => {
    audioService.playClick();
    actions.selectInstance(null);
  };

  const level = selectedInstance.level;
  const maxLevel = def.maxLevel || 5;
  const nextLevel = level + 1;
  const upgradeCost = Math.floor(def.price * nextLevel * 0.5);
  
  const currentIncome = Math.floor(def.income * (1 + (level - 1) * 0.5));
  const nextIncome = Math.floor(def.income * (1 + (nextLevel - 1) * 0.5));
  
  const isResidential = def.population > 0;
  const currentPopVal = Math.abs(def.population * level);
  const nextPopVal = Math.abs(def.population * nextLevel);
  const popDelta = nextPopVal - currentPopVal;

  const hasMoney = state.coins >= upgradeCost;
  const hasWorkers = isResidential 
    ? true 
    : populationStats.free >= popDelta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel}></div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div 
            className="h-32 w-full flex items-center justify-center relative"
            style={{ background: `linear-gradient(to bottom, ${def.imageColor}44, #0f172a)` }}
        >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                {def.lightRadius ? '💡' : (isResidential ? '🏠' : '🏢')}
            </span>
            <button onClick={handleCancel} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md">✕</button>
            
            <div className="absolute bottom-4 left-4 flex gap-1">
                {Array.from({length: maxLevel}).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < level ? 'bg-yellow-400 shadow-[0_0_5px_orange]' : 'bg-slate-700'}`}></div>
                ))}
            </div>
        </div>

        <div className="p-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-2xl font-black text-white leading-none">{def.name}</h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{def.category}</span>
                </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 border-b border-slate-800 pb-4">
                {def.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
                 {def.income > 0 && <StatBox icon="⚡" label="Доход" value={`+${currentIncome}`} sub="/м" color="text-green-400" />}
                 
                 {isResidential ? (
                     <StatBox icon="🏠" label="Жилье" value={`+${currentPopVal}`} color="text-blue-400" />
                 ) : (
                    def.population !== 0 ? <StatBox icon="👷" label="Рабочие" value={`-${currentPopVal}`} color="text-orange-400" /> : null
                 )}
                 
                 <StatBox icon="⭐" label="XP" value={def.xp * level} color="text-purple-400" />
            </div>

            {level < maxLevel && (
                <div className="bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase">След. уровень</span>
                        <div className="text-xs">
                             {def.income > 0 && <span className="text-green-400 mr-2">+{nextIncome - currentIncome} монет</span>}
                             {isResidential 
                                ? <span className="text-blue-400">+{popDelta} жилья</span>
                                : (def.population !== 0 && <span className="text-orange-400">-{popDelta} раб.</span>)
                             }
                        </div>
                    </div>
                    
                    <div className="flex gap-2 text-xs mb-3">
                        <div className={`px-2 py-1 rounded border ${hasMoney ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                            💰 {upgradeCost}
                        </div>
                        {!isResidential && def.population !== 0 && (
                            <div className={`px-2 py-1 rounded border ${hasWorkers ? 'border-blue-500/30 bg-blue-500/10 text-blue-200' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                                👷 Надо {popDelta} своб.
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => actions.upgradeBuilding(selectedInstance.id)}
                        disabled={!hasMoney || !hasWorkers}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                            hasMoney && hasWorkers
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:brightness-110 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <span>Улучшить</span>
                        <span className="text-lg">⬆️</span>
                    </button>
                </div>
            )}
            
            {level >= maxLevel && (
                <div className="w-full py-3 bg-slate-800 rounded-lg text-center text-yellow-500 font-bold border border-yellow-500/20 mb-4">
                    ✨ МАКС. УРОВЕНЬ
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                <button 
                    onClick={() => actions.startMovingBuilding(selectedInstance.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-lg font-bold transition-colors border border-slate-700"
                >
                    🔄 Двигать
                </button>
                <button 
                    onClick={() => actions.destroyBuilding(selectedInstance.id)}
                    className="bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 py-3 rounded-lg font-bold transition-colors border border-red-900/30 flex flex-col items-center leading-none justify-center gap-1"
                >
                    <span>Снести</span>
                    <span className="text-[10px] opacity-70">+{Math.floor(def.price * 0.5)}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value, sub = "", color }: any) => (
    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
        <span className="text-lg mb-1">{icon}</span>
        <div className="text-[9px] text-slate-500 uppercase font-bold">{label}</div>
        <div className={`font-bold text-sm ${color}`}>
            {value}<span className="text-[9px] text-slate-600 font-normal">{sub}</span>
        </div>
    </div>
);

export default BuildingInspect;
