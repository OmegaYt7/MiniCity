
import React, { useRef, useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { BuildingCategory, BuildingDef } from '../../types';
import { BUILDINGS } from '../../constants';
import { audioService } from '../../services/audioService';

const CATEGORIES = [
  { id: BuildingCategory.RESIDENTIAL, icon: '🏠', label: 'Жильё' },
  { id: BuildingCategory.COMMERCIAL, icon: '🏪', label: 'Бизнес' },
  { id: BuildingCategory.INDUSTRIAL, icon: '🏭', label: 'Заводы' },
  { id: BuildingCategory.ENTERTAINMENT, icon: '🎡', label: 'Досуг' },
  { id: BuildingCategory.DECORATION, icon: '🌲', label: 'Декор' },
];

const ConstructionMenu: React.FC = () => {
  const { mode, selectedCategory, actions, state, populationStats } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewingBuilding, setViewingBuilding] = useState<BuildingDef | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  useEffect(() => {
      if(scrollRef.current) scrollRef.current.scrollLeft = 0;
      setScrollProgress(0);
  }, [selectedCategory]);

  if (mode === 'INSPECT' || mode === 'PLACING') return null;

  const handleCategoryClick = (cat: string) => {
    audioService.playClick();
    if (selectedCategory === cat) {
      actions.selectCategory(null);
    } else {
      actions.selectCategory(cat);
    }
  };

  const handleCardClick = (def: BuildingDef) => {
    if (isDragging.current) return;
    audioService.playClick();
    setViewingBuilding(def);
  };

  const handleBuildConfirm = () => {
    if (viewingBuilding) {
        audioService.playClick();
        actions.selectBuildingDef(viewingBuilding);
        actions.selectCategory(null);
        setViewingBuilding(null);
        actions.startMovingBuilding(''); 
    }
  };

  // Validation Logic for Button Text
  let buttonText = 'Выбрать место';
  let canBuild = true;

  if (viewingBuilding) {
      const enoughCoins = state.coins >= viewingBuilding.price;
      const enoughPop = viewingBuilding.population >= 0 || populationStats.free >= Math.abs(viewingBuilding.population);
      
      if (!enoughCoins && !enoughPop) {
          buttonText = 'Не хватает монет и жителей';
          canBuild = false;
      } else if (!enoughCoins) {
          buttonText = 'Недостаточно монет';
          canBuild = false;
      } else if (!enoughPop) {
          buttonText = 'Недостаточно свободных жителей';
          canBuild = false;
      }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    startX.current = e.pageX;
    startScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!scrollRef.current || e.buttons === 0) return;
    const x = e.pageX;
    const walk = (x - startX.current);
    if (Math.abs(walk) > 5) {
        isDragging.current = true;
        scrollRef.current.scrollLeft = startScrollLeft.current - walk;
    }
  };

  const handleScroll = () => {
      if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          const maxScroll = scrollWidth - clientWidth;
          if (maxScroll > 0) {
              setScrollProgress(scrollLeft / maxScroll);
          }
      }
  };

  return (
    <>
    <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col justify-end pointer-events-none">
      
      <div 
        className={`pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 transition-all duration-300 ease-out overflow-hidden ${selectedCategory ? 'max-h-[300px] opacity-100 py-4 pb-8' : 'max-h-0 opacity-0 py-0'}`}
      >
        <div className="px-4 relative">
             <div className="flex justify-between items-center mb-3 pl-1">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    {selectedCategory}
                </h3>
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: '30%', transform: `translateX(${scrollProgress * 230}%)` }} 
                    ></div>
                </div>
             </div>

             <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onScroll={handleScroll}
                onPointerUp={() => { /* reset handled by click/blur */ }}
                onPointerLeave={() => { isDragging.current = false; }}
             >
                {BUILDINGS.filter(b => b.category === selectedCategory).map(b => {
                    const canAfford = state.coins >= b.price;
                    return (
                        <div 
                            key={b.id}
                            onClick={() => handleCardClick(b)}
                            className={`flex-shrink-0 w-36 select-none bg-slate-800 border rounded-xl overflow-hidden transition-transform active:scale-95 ${canAfford ? 'border-slate-600 hover:border-blue-500' : 'border-red-900/40 opacity-70'}`}
                        >
                            <div className="h-24 w-full flex items-center justify-center relative pointer-events-none" style={{background: `linear-gradient(to bottom right, ${b.imageColor}33, #1e293b)`}}>
                                <div className="w-10 h-10 rounded shadow-md" style={{backgroundColor: b.imageColor}}></div>
                                <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-400 border border-yellow-500/20">
                                    {b.price}
                                </div>
                            </div>
                            <div className="p-2.5 pointer-events-none">
                                <div className="font-bold text-slate-200 text-xs truncate mb-1">{b.name}</div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 italic">ур. 1</span>
                                    {b.income > 0 ? (
                                        <span className="text-green-400">+{b.income} 💰</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div className="w-2 flex-shrink-0"></div>
             </div>
        </div>
      </div>

      <div className="pointer-events-auto bg-slate-950/90 border-t border-slate-800 backdrop-blur-md pb-6 pt-2 px-2 safe-area-bottom">
        <div className="flex justify-around items-end max-w-lg mx-auto w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-[18%] ${selectedCategory === cat.id ? 'translate-y-[-2px] bg-slate-800 shadow-lg shadow-blue-900/20' : 'opacity-70 hover:opacity-100 hover:scale-105 active:scale-95'}`}
              >
                <span className="text-2xl filter drop-shadow-sm">{cat.icon}</span>
                <span className={`text-[9px] uppercase font-bold tracking-tight text-center leading-none ${selectedCategory === cat.id ? 'text-white' : 'text-slate-400'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>

    {viewingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingBuilding(null)}></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="h-32 relative flex items-center justify-center" style={{background: `linear-gradient(to bottom, ${viewingBuilding.imageColor}44, #0f172a)`}}>
                    <div className="text-6xl filter drop-shadow-lg">{viewingBuilding.category === 'Декор' ? '🌲' : '🏠'}</div>
                    <button 
                        onClick={() => setViewingBuilding(null)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-5">
                    <h2 className="text-2xl font-black text-white mb-1">{viewingBuilding.name}</h2>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{viewingBuilding.category}</div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {viewingBuilding.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Стоимость</div>
                            <div className={`font-bold text-lg ${state.coins >= viewingBuilding.price ? 'text-yellow-400' : 'text-red-400'}`}>
                                {viewingBuilding.price} 💰
                            </div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                             <div className="text-[10px] text-slate-500 font-bold uppercase">Эффект</div>
                             <div className="font-bold text-sm text-slate-200">
                                 {viewingBuilding.population > 0 && <span className="text-blue-400">+{viewingBuilding.population} жилья</span>}
                                 {viewingBuilding.population < 0 && <span className="text-orange-400">{Math.abs(viewingBuilding.population)} раб.</span>}
                                 {viewingBuilding.income > 0 && <span className="text-green-400 block">+{viewingBuilding.income} дох./м</span>}
                                 {viewingBuilding.population === 0 && viewingBuilding.income === 0 && <span className="text-purple-400">Красота</span>}
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleBuildConfirm}
                        disabled={!canBuild}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg ${
                            canBuild 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 active:scale-95' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default ConstructionMenu;
