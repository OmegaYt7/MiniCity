import React from 'react';
import { useGame } from '../../context/GameContext';
import { BUILDINGS } from '../../constants';
import { audioService } from '../../services/audioService';

const BuildingInspect: React.FC = () => {
  const { mode, selectedBuildingDef, selectedInstance, actions, state } = useGame();

  // Allow component to render in PREVIEW mode as well
  if (mode !== 'PLACING' && mode !== 'INSPECT' && mode !== 'BUILDING_PREVIEW') return null;

  const def = selectedInstance 
    ? BUILDINGS.find(d => d.id === selectedInstance.defId) 
    : selectedBuildingDef;

  if (!def) return null;

  const handleCancel = () => {
    audioService.playClick();
    if (mode === 'PLACING' || mode === 'BUILDING_PREVIEW') actions.selectBuildingDef(null);
    if (mode === 'INSPECT') actions.selectInstance(null);
  };

  // Determine which visual state we are in
  const isPreview = mode === 'BUILDING_PREVIEW';
  const isPlacement = mode === 'PLACING';
  const isInspect = mode === 'INSPECT';

  const canAfford = state.coins >= def.price;

  const handleBuildClick = () => {
      if (canAfford) {
          audioService.playClick();
          actions.setMode('PLACING');
      } else {
          audioService.playError();
      }
  };

  return (
    <>
    <div className="fixed inset-0 z-20" onClick={handleCancel}></div>

    <div className="absolute top-0 right-0 h-full w-full pointer-events-none flex flex-col justify-end md:justify-center md:items-end md:pr-6 z-30 pb-24 md:pb-0 safe-area-bottom">
      
      <div className="pointer-events-auto w-full md:w-96 mx-4 md:mx-0 bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-right-10 fade-in duration-300 flex flex-col">
        
        {/* Header Image */}
        <div 
            className="h-40 w-full flex items-center justify-center relative transition-colors duration-500"
            style={{ backgroundColor: def.imageColor }}
        >
            <span className="text-7xl filter drop-shadow-xl transform transition-transform hover:scale-110 duration-300">🏠</span>
            
            <button 
                onClick={handleCancel}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
            >
                ✕
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="mb-4">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">{def.name}</h2>
                  {(isPlacement || isPreview) && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                      {def.price} 💰
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{def.category}</div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                {def.description}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-xl mb-1">⚡</span>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Доход</div>
                    <div className="font-bold text-slate-800">{def.income > 0 ? `+${def.income}` : '-'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-xl mb-1">👥</span>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Люди</div>
                    <div className="font-bold text-slate-800">{def.population > 0 ? `+${def.population}` : '-'}</div>
                </div>
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-xl mb-1">⭐</span>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">XP</div>
                    <div className="font-bold text-slate-800">{def.xp}</div>
                </div>
            </div>

            {/* Action Buttons */}
            
            {/* 1. Preview Mode: Show Build Button */}
            {isPreview && (
                <button 
                    onClick={handleBuildClick}
                    disabled={!canAfford}
                    className={`w-full font-bold rounded-xl py-4 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide ${
                        canAfford 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {canAfford ? 'Построить' : 'Недостаточно средств'}
                </button>
            )}

            {/* 2. Placing Mode: Show Cancel/Instruction */}
            {isPlacement && (
                <div className="text-center">
                   <div className="text-sm font-bold text-slate-400 animate-pulse mb-2">Нажми на карту для стройки</div>
                   <button 
                     onClick={handleCancel}
                     className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors"
                   >
                     Отмена
                   </button>
                </div>
            )}

            {/* 3. Inspect Mode: Show Upgrade */}
            {isInspect && (
                <button 
                    onClick={() => actions.upgradeBuilding(selectedInstance!.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl py-4 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span className="text-xl">⬆️</span> 
                    <span>Улучшить</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm ml-1">100💰</span>
                </button>
            )}
        </div>
      </div>
    </div>
    </>
  );
};

export default BuildingInspect;
