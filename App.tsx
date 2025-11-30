import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LEVELS } from './levels';
import { parseLevel, movePlayer, checkWin } from './logic';
import { GameState, Direction } from './types';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { WinModal } from './components/WinModal';
import { soundManager } from './audio';

// Max stack size for undo
const MAX_HISTORY = 100;

export default function App() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  
  // History is stored in Ref to satisfy technical requirement, 
  // but we also keep a length state to update the UI (Undo button disabled state).
  const historyRef = useRef<GameState[]>([]);
  const [historyLength, setHistoryLength] = useState(0);

  // Initialize Level
  const loadLevel = useCallback((index: number) => {
    const rawLevel = LEVELS[index];
    const { grid, playerPos } = parseLevel(rawLevel);
    
    // Stop any playing music/effects
    soundManager.stopMusic(); 
    // soundManager.startMusic(); // Uncomment to auto-start music on load

    setGameState({
      grid,
      playerPos,
      moves: 0,
      levelCompleted: false,
    });
    
    // Reset History
    historyRef.current = [];
    setHistoryLength(0);
    setShowWinModal(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  // Handle Movement
  const handleMove = useCallback((dir: Direction) => {
    if (!gameState || gameState.levelCompleted) return;

    // Ensure audio context is ready on user interaction
    soundManager.resumeContext();

    const result = movePlayer(gameState.grid, gameState.playerPos, dir);

    if (result) {
      // 1. Push current state to history Ref
      const newHistory = [...historyRef.current, gameState];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      historyRef.current = newHistory;
      setHistoryLength(newHistory.length);

      // 2. Play Sound
      if (result.pushed) {
        soundManager.playPush();
      }

      // 3. Check for win
      const isWin = checkWin(result.grid);
      if (isWin) {
        soundManager.playWin();
        setShowWinModal(true);
      }

      // 4. Update State
      setGameState({
        grid: result.grid,
        playerPos: result.playerPos,
        moves: gameState.moves + 1,
        levelCompleted: isWin,
      });
    }
  }, [gameState]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0 || !gameState || gameState.levelCompleted) return;

    const previousState = historyRef.current[historyRef.current.length - 1];
    
    // Pop from stack
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryLength(historyRef.current.length);
    
    setGameState(previousState);
    setShowWinModal(false);
  }, [gameState]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Movement
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleMove('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMove('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMove('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMove('RIGHT');
          break;
        case 'z':
        case 'Z':
          // Undo on Z
          handleUndo();
          break;
        case 'r':
        case 'R':
          loadLevel(currentLevelIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleUndo, loadLevel, currentLevelIndex]);

  // Level Navigation
  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    }
  };

  if (!gameState) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-mono">Loading assets...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 overflow-hidden">
      
      {/* Left Control Panel */}
      <ControlPanel 
        currentLevelIndex={currentLevelIndex}
        totalLevels={LEVELS.length}
        moves={gameState.moves}
        historyLength={historyLength}
        onLevelSelect={setCurrentLevelIndex}
        onUndo={handleUndo}
        onReset={() => loadLevel(currentLevelIndex)}
      />

      {/* Main Game Area */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 p-4 md:p-10">
        
        <div className="relative shadow-2xl rounded-lg overflow-hidden border-8 border-slate-800">
           <GameBoard grid={gameState.grid} />
        </div>

        {/* Win Modal Overlay */}
        {showWinModal && (
          <WinModal 
            moves={gameState.moves}
            onNext={handleNextLevel}
            onStay={() => setShowWinModal(false)}
            hasNextLevel={currentLevelIndex < LEVELS.length - 1}
          />
        )}
      </div>

    </div>
  );
}