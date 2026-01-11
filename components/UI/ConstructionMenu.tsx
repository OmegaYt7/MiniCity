import React from 'react';
import { useGame } from '../../context/GameContext';
import { BuildingCategory, BuildingDef } from '../../types';
import { BUILDINGS } from '../../constants';
import { audioService } from '../../services/audioService';

const CATEGORIES = [
  { id: BuildingCategory.RESIDENTIAL, icon: '🏠', label: 'ЖИЛЬЁ' },
  { id: BuildingCategory.COMMERCIAL, icon: '🏪', label: 'БИЗНЕС' },
  { id: BuildingCategory.INDUSTRIAL, icon: '🏭', label: 'ЗАВОДЫ' },
  { id: BuildingCategory.DECORATION, icon: '🌳', label: 'ДЕКОР' },
];

const ConstructionMenu: React.FC = () => {
  const { mode, selectedCategory, actions, state } = useGame();
  
  // Hide if in Placement, Inspection OR Preview mode
  if (mode === 'PLACING' || mode === 'INSPECT' || mode === 'BUILDING_PREVIEW') return null;

  const handleCategoryClick = (cat: string) => {
    audioService.playClick();
    if (selectedCategory === cat) {
      actions.selectCategory(null);
    } else {
      actions.selectCategory(cat);
    }
  };

  const handleBuildingSelect = (def: BuildingDef) => {
    audioService.playClick();
    actions.selectBuildingDef(def);
    actions.selectCategory(null);
  };

  return (
    <>
      {/* Backdrop for menu */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 transition-opacity duration-300 ${selectedCategory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => actions.selectCategory(null)}
      />

      {/* Main Container - Fixed to Bottom */}
      <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col items-center pointer-events-none">
        
        {/* Building Grid Drawer (Slides up) */}
        {/* REDUCED HEIGHT: Changed from h-[55vh] to h-[40vh] */}
        <div 
          className={`w-full bg-white/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-auto overflow-hidden ${selectedCategory ? 'h-[40vh] translate-y-0' : 'h-0 translate-y-10'}`}
        >
          {selectedCategory && (
            <div className="h-full flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-xl">{CATEGORIES.find(c => c.id === selectedCategory)?.icon}</span>
                    {selectedCategory}
                    </h3>
                    <button 
                    onClick={() => actions.selectCategory(null)}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 transition-colors"
                    >
                    ✕
                    </button>
                </div>
                
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pb-12">
                    {BUILDINGS.filter(b => b.category === selectedCategory).map(b => {
                      const canAfford = state.coins >= b.price;
                      return (
                        <div 
                            key={b.id} 
                            onClick={(e) => { e.stopPropagation(); handleBuildingSelect(b); }}
                            className={`group relative flex flex-col items-center bg-white border rounded-xl p-3 transition-all duration-200 shadow-sm hover:shadow-md text-left w-full cursor-pointer ${canAfford ? 'border-slate-200 hover:border-blue-400' : 'border-red-100 opacity-80'}`}
                        >
                            <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                                {b.price} 💰
                            </div>

                            <div 
                            className="w-full aspect-[4/3] rounded-lg mb-3 flex items-center justify-center shadow-inner transition-transform group-hover:scale-105"
                            style={{ backgroundColor: b.imageColor }}
                            >
                              <span className="text-4xl filter drop-shadow-md">🏗️</span>
                            </div>
                            
                            <div className="w-full">
                              <div className="font-bold text-slate-800 text-sm leading-tight mb-1">{b.name}</div>
                              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 font-medium">
                                  {b.population > 0 && <span className="text-blue-600 bg-blue-50 px-1 rounded">+{b.population} Чел</span>}
                                  {b.income > 0 && <span className="text-green-600 bg-green-50 px-1 rounded">+{b.income}$/м</span>}
                              </div>
                            </div>
                        </div>
                      );
                    })}
                </div>
            </div>
          )}
        </div>

        {/* Fixed Dashboard Dock */}
        <div className="w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 pointer-events-auto pb-6 pt-2 px-2 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 group ${selectedCategory === cat.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition-all ${selectedCategory === cat.id ? 'bg-white border-blue-400 text-blue-500 shadow-md' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'}`}>
                  {cat.icon}
                </div>
                <span className={`text-[10px] font-bold tracking-wider ${selectedCategory === cat.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConstructionMenu;
