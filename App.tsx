
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import Overlay from './components/Overlay';
import { GameState, ScoreRecord } from './types';
import { Zap } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [history, setHistory] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('shumi_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

    const savedTotalEnergy = localStorage.getItem('shumi_total_energy');
    if (savedTotalEnergy) setTotalEnergy(parseInt(savedTotalEnergy, 10));

    const savedHistory = localStorage.getItem('shumi_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const startGame = useCallback(() => {
    setGameState(GameState.RUNNING);
    setScore(0);
    setEnergy(0);
  }, []);

  const onGameOver = useCallback((finalScore: number, collectedEnergy: number) => {
    setGameState(GameState.GAMEOVER);
    setScore(finalScore);
    
    const newTotalEnergy = totalEnergy + collectedEnergy;
    setTotalEnergy(newTotalEnergy);
    localStorage.setItem('shumi_total_energy', newTotalEnergy.toString());

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('shumi_highscore', finalScore.toString());
    }

    const newRecord: ScoreRecord = {
      score: finalScore,
      energy: collectedEnergy,
      date: new Date().toLocaleDateString('ru-RU')
    };
    const newHistory = [newRecord, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('shumi_history', JSON.stringify(newHistory));
  }, [highScore, history, totalEnergy]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f172a] flex flex-col font-sans select-none">
      <GameCanvas 
        gameState={gameState} 
        onGameOver={onGameOver} 
        onScoreUpdate={setScore}
        onEnergyCollect={() => setEnergy(prev => prev + 1)}
      />
      
      <Overlay 
        gameState={gameState} 
        score={score} 
        energy={energy}
        totalEnergy={totalEnergy}
        highScore={highScore} 
        history={history}
        onStart={startGame} 
      />
      
      {gameState === GameState.RUNNING && (
        <div className="absolute top-12 left-0 w-full flex justify-between px-6 pointer-events-none safe-top">
          <div className="flex flex-col items-start bg-black/40 backdrop-blur-md p-2 px-3 rounded-xl border border-white/10 shadow-lg">
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-0.5">Дистанция</span>
            <div className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
              {Math.floor(score)}м
            </div>
          </div>
          
          <div className="flex flex-col items-end bg-black/40 backdrop-blur-md p-2 px-3 rounded-xl border border-white/10 shadow-lg">
             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">Энергия</span>
             <div className="flex items-center gap-1 text-3xl font-black text-yellow-400 tracking-tighter tabular-nums drop-shadow-md">
              <Zap fill="currentColor" size={20} className="text-yellow-500" />
              {energy}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
