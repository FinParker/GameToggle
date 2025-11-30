import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LEVELS } from '../levels';
import { parseLevel, movePlayer, checkWin } from '../logic';
import { GameState, Direction } from '../types';
import { GameBoard } from '../components/GameBoard';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { WinModal } from '../components/WinModal';
import { soundManager } from '../audio';

const MAX_HISTORY = 100;

export default function SokobanGame() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  
  const historyRef = useRef<GameState[]>([]);
  const [historyLength, setHistoryLength] = useState(0);

  // Initialize
  const loadLevel = useCallback((index: number) => {
    const rawLevel = LEVELS[index];
    const { grid, playerPos } = parseLevel(rawLevel);
    
    setGameState({
      grid,
      playerPos,
      moves: 0,
      levelCompleted: false,
    });
    
    historyRef.current = [];
    setHistoryLength(0);
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIndex);
    return () => soundManager.stopAllMusic();
  }, [currentLevelIndex, loadLevel]);

  // Movement Logic
  const handleMove = useCallback((dir: Direction) => {
    if (!gameState || gameState.levelCompleted || showWinModal) return;

    soundManager.resumeContext();

    const result = movePlayer(gameState.grid, gameState.playerPos, dir);

    if (result) {
      const newHistory = [...historyRef.current, gameState];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      historyRef.current = newHistory;
      setHistoryLength(newHistory.length);

      // Sound Feedback
      if (result.pushed) {
        soundManager.playPush();
      } else {
        soundManager.playStep();
      }

      const isWin = checkWin(result.grid);
      if (isWin) {
        soundManager.playWin();
        setShowWinModal(true);
      }

      setGameState({
        grid: result.grid,
        playerPos: result.playerPos,
        moves: gameState.moves + 1,
        levelCompleted: isWin,
      });
    }
  }, [gameState, showWinModal]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0 || !gameState || gameState.levelCompleted) return;
    const previousState = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryLength(historyRef.current.length);
    setGameState(previousState);
    setShowWinModal(false);
  }, [gameState]);

  // Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow navigation keys if modal is open (handled by Modal) or generic navigation
      if (showWinModal) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': handleMove('UP'); break;
        case 'ArrowDown': case 's': case 'S': handleMove('DOWN'); break;
        case 'ArrowLeft': case 'a': case 'A': handleMove('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D': handleMove('RIGHT'); break;
        case 'z': case 'Z': handleUndo(); break;
        case 'r': case 'R': loadLevel(currentLevelIndex); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleUndo, loadLevel, currentLevelIndex, showWinModal]);

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) setCurrentLevelIndex(prev => prev + 1);
  };

  if (!gameState) return null;

  const sidebar = (
    <Sidebar
      title="SOKOBAN"
      colorClass="text-yellow-400"
      stats={[
        { label: 'Level', value: currentLevelIndex + 1 },
        { label: 'Moves', value: gameState.moves }
      ]}
      controls={[
        { keys: ['W','A','S','D'], action: 'Move / Push' },
        { keys: ['Z'], action: 'Undo Move' },
        { keys: ['R'], action: 'Reset Level' }
      ]}
    >
       <button
          onClick={handleUndo}
          disabled={historyLength === 0}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded text-sm font-bold transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <span>↩</span> Undo
        </button>
        <button
          onClick={() => loadLevel(currentLevelIndex)}
          className="w-full py-3 px-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Reset
        </button>
        
        {/* Level Select Mini-Grid */}
        <div className="mt-4 grid grid-cols-5 gap-1" role="group" aria-label="Level Selector">
          {LEVELS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentLevelIndex(idx)}
              aria-label={`Select Level ${idx + 1}`}
              aria-current={currentLevelIndex === idx}
              className={`h-6 text-[10px] font-bold border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:z-10 ${currentLevelIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
    </Sidebar>
  );

  return (
    <GameLayout sidebar={sidebar}>
      <div className="relative shadow-2xl rounded-lg overflow-hidden border-8 border-slate-800">
        <GameBoard grid={gameState.grid} />
      </div>
      {showWinModal && (
        <WinModal 
          moves={gameState.moves}
          onNext={handleNextLevel}
          onStay={() => setShowWinModal(false)}
          hasNextLevel={currentLevelIndex < LEVELS.length - 1}
        />
      )}
    </GameLayout>
  );
}