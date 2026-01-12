
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { audioService } from '../../services/audioService';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, telegramUser, actions, populationStats, totalIncome } = useGame();
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(state.playerName);

    const handleSave = () => {
        actions.updatePlayerName(tempName);
        setIsEditing(false);
        audioService.playClick();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 hover:text-white">✕</button>
                
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">👤</span> Профиль
                </h2>

                <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Имя мэра</div>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="bg-slate-950 text-white px-3 py-1 rounded-lg border border-blue-500 w-full outline-none"
                                autoFocus
                            />
                            <button onClick={handleSave} className="bg-blue-600 px-3 rounded-lg text-white">✓</button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-white">{state.playerName}</span>
                            <button onClick={() => setIsEditing(true)} className="text-xs text-blue-400 hover:text-blue-300 uppercase font-bold">Изм.</button>
                        </div>
                    )}
                </div>

                {/* Telegram Data */}
                {telegramUser && (
                    <div className="bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-500/20">
                        <div className="text-[10px] uppercase font-bold text-blue-300 mb-2">Telegram ID</div>
                        <div className="flex items-center gap-3">
                            {telegramUser.photo_url && <img src={telegramUser.photo_url} alt="" className="w-8 h-8 rounded-full" />}
                            <div>
                                <div className="text-sm font-bold text-white">@{telegramUser.username || 'Без ника'}</div>
                                <div className="text-xs text-slate-400 opacity-60">ID: {telegramUser.id}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Всего жителей</div>
                        <div className="text-lg font-bold text-white">{populationStats.current}</div>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Доход/мин</div>
                        <div className="text-lg font-bold text-green-400">+{totalIncome}</div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const XpExchangeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, actions } = useGame();
    
    // Exchange Rate: 100 XP -> 1000 Coins
    const RATE_XP = 100;
    const RATE_COINS = 1000;

    const canExchange = state.xp >= RATE_XP;

    const handleExchange = () => {
        if (canExchange) {
            actions.exchangeXpForCoins(RATE_XP);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 hover:text-white">✕</button>

                <div className="text-center mb-6">
                    <div className="text-5xl mb-2">🤝</div>
                    <h2 className="text-2xl font-black text-white">Обмен Опыта</h2>
                    <p className="text-slate-400 text-sm">Обменяйте опыт на финансирование</p>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="text-center">
                        <div className="text-2xl font-black text-purple-400">{RATE_XP} XP</div>
                        <div className="text-xs text-slate-500 font-bold">ОТДАЕТЕ</div>
                    </div>
                    <div className="text-slate-600">➔</div>
                    <div className="text-center">
                         <div className="text-2xl font-black text-yellow-400">{RATE_COINS} 💰</div>
                         <div className="text-xs text-slate-500 font-bold">ПОЛУЧАЕТЕ</div>
                    </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg mb-6 text-center text-xs text-slate-300">
                    Ваш баланс: <span className="text-purple-400 font-bold">{state.xp} XP</span>
                </div>

                <button 
                    onClick={handleExchange}
                    disabled={!canExchange}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all ${
                        canExchange 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 text-white shadow-lg active:scale-95' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                >
                    {canExchange ? 'Обменять' : 'Не хватает опыта'}
                </button>
            </div>
        </div>
    );
};
