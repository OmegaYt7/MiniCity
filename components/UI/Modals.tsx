
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { audioService } from '../../services/audioService';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, telegramUser, actions, populationStats } = useGame();
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(state.playerName);

    // Progression Calc
    // Level N requires Total XP approx (Level-1)*500.
    const prevThreshold = (state.level - 1) * 500;
    const nextThreshold = state.level * 500;
    
    const currentProgress = state.totalXpEarned - prevThreshold;
    const needed = 500; 
    const percentage = Math.min(100, Math.max(0, (currentProgress / needed) * 100));

    const handleSave = () => {
        actions.updatePlayerName(tempName);
        setIsEditing(false);
        audioService.playClick();
    };

    const botName = "TheMiniCityBot"; 
    const userId = telegramUser?.id || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id : 0);
    const referralLink = userId 
        ? `https://t.me/${botName}/app?startapp=ref_${userId}`
        : `https://t.me/${botName}/app`;

    const copyRef = () => {
        navigator.clipboard.writeText(referralLink);
        audioService.playClick();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 hover:text-white transition-transform active:scale-95">✕</button>
                
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">👤</span> Профиль
                </h2>

                <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Мэр</div>
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

                {/* Level Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                        <span>Уровень {state.level}</span>
                        <span>{state.totalXpEarned} / {nextThreshold} Total XP</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                </div>

                {/* Telegram Data */}
                {telegramUser && (
                    <div className="bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-500/20">
                        <div className="text-[10px] uppercase font-bold text-blue-300 mb-2">Telegram ID</div>
                        <div className="flex items-center gap-3">
                            {telegramUser.photo_url && <img src={telegramUser.photo_url} alt="" className="w-8 h-8 rounded-full" />}
                            <div>
                                <div className="text-sm font-bold text-white">@{telegramUser.username || 'No Alias'}</div>
                                <div className="text-xs text-slate-400 opacity-60">ID: {telegramUser.id}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Население</div>
                        <div className="text-lg font-bold text-white">{populationStats.total}</div>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Опыт (Валюта)</div>
                        <div className="text-lg font-bold text-purple-400">{state.xp}</div>
                     </div>
                </div>

                {/* Referral */}
                <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4">
                    <div className="text-[10px] uppercase font-bold text-green-400 mb-2">Реферальная программа</div>
                    <div className="text-xs text-slate-400 mb-3">Приглашай друзей и получай бонусы!</div>
                    <div className="flex gap-2">
                        <div className="bg-slate-950 px-3 py-2 rounded text-xs text-slate-500 truncate flex-1 font-mono">
                            {referralLink}
                        </div>
                        <button onClick={copyRef} className="bg-green-600 px-3 rounded text-white font-bold text-xs hover:bg-green-500 active:scale-95 transition-transform">Копия</button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 text-center">
                        Приглашено: <span className="text-white font-bold">{state.referrals}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const XpExchangeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, actions } = useGame();
    const RATE_XP = 100;
    const RATE_COINS = 1000;
    const canExchange = state.xp >= RATE_XP;

    const handleExchange = () => {
        if (canExchange) actions.exchangeXpForCoins(RATE_XP);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 hover:text-white transition-transform active:scale-95">✕</button>
                <div className="text-center mb-6">
                    <div className="text-5xl mb-2">🤝</div>
                    <h2 className="text-2xl font-black text-white">Обмен Опыта</h2>
                    <p className="text-slate-400 text-sm">Получи финансирование за опыт</p>
                </div>
                
                <div className="flex justify-between px-4 mb-4 text-xs font-bold text-slate-400">
                    <span>Баланс: <span className="text-purple-400">{state.xp} XP</span></span>
                    <span>Кошелек: <span className="text-yellow-400">{state.coins} 💰</span></span>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="text-center">
                        <div className="text-2xl font-black text-purple-400">{RATE_XP} XP</div>
                        <div className="text-xs text-slate-500 font-bold">ОТДАЕШЬ</div>
                    </div>
                    <div className="text-slate-600">➔</div>
                    <div className="text-center">
                         <div className="text-2xl font-black text-yellow-400">{RATE_COINS} 💰</div>
                         <div className="text-xs text-slate-500 font-bold">ПОЛУЧАЕШЬ</div>
                    </div>
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
                    {canExchange ? 'Обменять' : 'Не хватает XP'}
                </button>
            </div>
        </div>
    );
};

export const RewardPopup: React.FC = () => {
    const { activePopup, popupData, actions } = useGame();
    
    if (activePopup === 'NONE') return null;

    const isLevelUp = activePopup === 'LEVEL_UP';
    const isOffline = activePopup === 'OFFLINE';
    
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}ч ${m}м`;
        return `${m}м`;
    };
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={actions.closePopup}></div>
             <div className="relative w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/50 rounded-3xl shadow-2xl p-8 text-center animate-bounce-gentle">
                
                <div className="text-6xl mb-4 filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    {isLevelUp ? '🎉' : (isOffline ? '🛌' : '🎁')}
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">
                    {isLevelUp ? 'Новый Уровень!' : (isOffline ? 'С возвращением!' : 'Бонус Реферала')}
                </h2>
                
                {isLevelUp && (
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 mb-4">
                        {popupData?.level}
                    </div>
                )}

                <p className="text-slate-300 mb-6">
                    {isLevelUp ? 'Твой город растет!' : (isOffline ? `Город работал пока тебя не было (${formatTime(popupData?.timeOfflineSeconds)})` : 'Друг присоединился к игре!')}
                </p>

                <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-white/10">
                    <div className="text-xs uppercase font-bold text-slate-500 mb-1">Награда</div>
                    <div className="flex flex-col gap-1">
                        <div className="text-2xl font-bold text-green-400">+{popupData?.reward || popupData?.coins} 💰</div>
                        {isOffline && popupData?.xp > 0 && (
                            <div className="text-lg font-bold text-purple-400">+{popupData?.xp} XP</div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={actions.closePopup}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                    Круто!
                </button>
             </div>
        </div>
    );
};
