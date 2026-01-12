
import React from 'react';
import { GameState, ScoreRecord } from '../types';
import { Trophy, Play, RotateCcw, Zap, Sparkles } from 'lucide-react';

interface OverlayProps {
  gameState: GameState;
  score: number;
  energy: number;
  totalEnergy: number;
  highScore: number;
  history: ScoreRecord[];
  onStart: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ gameState, score, energy, totalEnergy, highScore, history, onStart }) => {
  if (gameState === GameState.RUNNING) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617]/85 backdrop-blur-lg p-4">
      <div className="bg-white/10 border border-white/20 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full text-center transform transition-all animate-in fade-in zoom-in duration-500 overflow-hidden relative">
        
        {/* Decorative background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>

        {gameState === GameState.START ? (
          <>
            <div className="mb-6 flex justify-center relative">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6 hover:rotate-0 transition-all duration-500 cursor-pointer group">
                    <Sparkles className="text-white w-12 h-12 group-hover:scale-110 transition-transform" />
                </div>
            </div>
            
            <h1 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">
              ШУМИ БЕГИ
            </h1>
            <p className="text-indigo-200/50 mb-8 font-medium tracking-tight text-xs uppercase">
              ПОБЕГ ИЗ ДОНСКОГО
            </p>
            
            <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase mb-0.5">РЕКОРД</div>
                    <div className="text-xl font-black text-white">{highScore}м</div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="text-[10px] font-bold text-yellow-400 uppercase mb-0.5">ЭНЕРГИЯ</div>
                    <div className="text-xl font-black text-white flex items-center justify-center gap-1">
                        <Zap size={14} fill="currentColor" className="text-yellow-400" />
                        {totalEnergy}
                    </div>
                </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-indigo-500/20 text-xl uppercase italic tracking-tighter"
            >
              <Play fill="currentColor" size={24} />
              Играть
            </button>
          </>
        ) : (
          <>
            <div className="mb-2 text-rose-500 font-black tracking-[0.2em] uppercase text-[10px]">
              ЗАБЕГ ОКОНЧЕН
            </div>
            
            <div className="text-7xl font-black text-white mb-4 tracking-tighter italic tabular-nums">
              {score}м
            </div>

            <div className="flex gap-3 mb-8">
                <div className="flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">РЕКОРД</div>
                    <div className="text-xl font-black text-white">{highScore}м</div>
                </div>
                <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase mb-0.5">СОБРАНО</div>
                    <div className="text-xl font-black text-white flex items-center justify-center gap-1">
                        <Zap size={14} fill="currentColor" className="text-yellow-500" />
                        {energy}
                    </div>
                </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl text-xl uppercase italic tracking-tighter"
            >
              <RotateCcw size={24} />
              Заново
            </button>
          </>
        )}
        
        {/* High Score History */}
        {history.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
                <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                    ИСТОРИЯ_ЗАБЕГОВ
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {history.map((rec, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold text-white/50 bg-white/5 p-2 rounded-lg border border-white/5">
                            <span>{rec.date}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white">{rec.score}м</span>
                                <span className="text-yellow-500 flex items-center gap-0.5">
                                    <Zap size={8} fill="currentColor" />
                                    {rec.energy}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;
