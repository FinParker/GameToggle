import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LEVELS } from '../levels';
import { parseLevel, movePlayer, checkWin, gridToStrings, cloneGrid } from '../logic';
import { GameState, Direction, CellType, Grid } from '../types';
import { GameBoard } from '../components/GameBoard';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { WinModal } from '../components/WinModal';
import { soundManager } from '../audio';

const MAX_HISTORY = 100;
const EDITOR_SIZE = 10;

// Default empty level for editor
const createEmptyGrid = (size: number): Grid => {
  return Array(size).fill(null).map(() => Array(size).fill(CellType.Floor));
};

export default function SokobanGame() {
  // Modes: 'PLAY' (campaign/custom) or 'EDIT' (creator)
  const [mode, setMode] = useState<'PLAY' | 'EDIT'>('PLAY');
  
  // -- PLAY MODE STATE --
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [customLevels, setCustomLevels] = useState<string[][]>([]);
  const historyRef = useRef<GameState[]>([]);
  const [historyLength, setHistoryLength] = useState(0);

  // -- EDIT MODE STATE --
  const [editorGrid, setEditorGrid] = useState<Grid>(createEmptyGrid(EDITOR_SIZE));
  const [activeTool, setActiveTool] = useState<CellType>(CellType.Wall);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Load custom levels from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sokoban_custom_levels');
    if (saved) {
      try {
        setCustomLevels(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load custom levels");
      }
    }
  }, []);

  // -- PLAY MODE LOGIC --

  // Combine campaign levels + custom levels
  const allLevels = [...LEVELS, ...customLevels];

  const loadLevel = useCallback((index: number) => {
    // Safety check
    if (index < 0 || index >= allLevels.length) {
       index = 0;
       setCurrentLevelIndex(0);
    }
    
    const rawLevel = allLevels[index];
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
  }, [allLevels]);

  // Load level whenever index changes (and we are in play mode)
  useEffect(() => {
    if (mode === 'PLAY') {
      loadLevel(currentLevelIndex);
    }
    return () => soundManager.stopAllMusic();
  }, [currentLevelIndex, loadLevel, mode]);

  const handleMove = useCallback((dir: Direction) => {
    if (mode !== 'PLAY' || !gameState || gameState.levelCompleted || showWinModal) return;

    soundManager.resumeContext();
    const result = movePlayer(gameState.grid, gameState.playerPos, dir);

    if (result) {
      const newHistory = [...historyRef.current, gameState];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      historyRef.current = newHistory;
      setHistoryLength(newHistory.length);

      if (result.pushed) soundManager.playPush();
      else soundManager.playStep();

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
  }, [gameState, showWinModal, mode]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0 || !gameState || gameState.levelCompleted) return;
    const previousState = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryLength(historyRef.current.length);
    setGameState(previousState);
    setShowWinModal(false);
  }, [gameState]);

  // -- EDITOR MODE LOGIC --

  const handleEditorCellClick = (x: number, y: number) => {
    if (mode !== 'EDIT') return;
    setEditorError(null);

    setEditorGrid(prev => {
      const newGrid = cloneGrid(prev);
      const currentCell = newGrid[y][x];
      
      // Smart placement logic
      let newCell = activeTool;

      // Logic: If placing 'Target' on 'Box', make 'BoxOnTarget' (*)
      // Logic: If placing 'Box' on 'Target', make 'BoxOnTarget' (*)
      // Logic: If placing 'Player' on 'Target', make 'PlayerOnTarget' (+)
      
      const isTargetUnder = currentCell === CellType.Target || currentCell === CellType.BoxOnTarget || currentCell === CellType.PlayerOnTarget;
      
      if (activeTool === CellType.Box && isTargetUnder) newCell = CellType.BoxOnTarget;
      else if (activeTool === CellType.Player && isTargetUnder) newCell = CellType.PlayerOnTarget;
      else if (activeTool === CellType.Target) {
         if (currentCell === CellType.Box) newCell = CellType.BoxOnTarget;
         else if (currentCell === CellType.Player) newCell = CellType.PlayerOnTarget;
         else if (currentCell === CellType.Floor) newCell = CellType.Target;
         // If already target-like, keep it (or toggle off? let's stick to additive)
         else newCell = CellType.Target; 
      }
      
      // Enforce Single Player Rule: Remove player from old pos if placing new player
      if (activeTool === CellType.Player || newCell === CellType.PlayerOnTarget) {
         for(let py=0; py<newGrid.length; py++) {
           for(let px=0; px<newGrid[0].length; px++) {
             if (newGrid[py][px] === CellType.Player) newGrid[py][px] = CellType.Floor;
             if (newGrid[py][px] === CellType.PlayerOnTarget) newGrid[py][px] = CellType.Target;
           }
         }
      }

      newGrid[y][x] = newCell;
      return newGrid;
    });
  };

  const saveLevel = () => {
    // Validation
    let playerCount = 0;
    let boxCount = 0;
    let targetCount = 0;

    editorGrid.forEach(row => row.forEach(cell => {
      if (cell === CellType.Player || cell === CellType.PlayerOnTarget) playerCount++;
      if (cell === CellType.Box || cell === CellType.BoxOnTarget) boxCount++;
      if (cell === CellType.Target || cell === CellType.BoxOnTarget || cell === CellType.PlayerOnTarget) targetCount++;
    }));

    if (playerCount !== 1) {
      setEditorError("Level must have exactly one player (@).");
      return;
    }
    if (boxCount === 0) {
      setEditorError("Level must have at least one box ($).");
      return;
    }
    if (boxCount !== targetCount) {
      setEditorError(`Mismatch: ${boxCount} boxes and ${targetCount} targets.`);
      return;
    }

    // Save
    const levelStrings = gridToStrings(editorGrid);
    const newCustomLevels = [...customLevels, levelStrings];
    setCustomLevels(newCustomLevels);
    localStorage.setItem('sokoban_custom_levels', JSON.stringify(newCustomLevels));
    
    // Switch to Play
    setEditorError(null);
    setMode('PLAY');
    setCurrentLevelIndex(LEVELS.length + newCustomLevels.length - 1); // Select the new level
  };

  const clearEditor = () => {
    setEditorGrid(createEmptyGrid(EDITOR_SIZE));
    setEditorError(null);
  }

  // -- INPUT HANDLING --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'PLAY') {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleUndo, loadLevel, currentLevelIndex, showWinModal, mode]);


  // -- RENDER --
  
  // 1. Editor Sidebar
  const editorSidebar = (
    <Sidebar
      title="LEVEL EDITOR"
      colorClass="text-blue-400"
      stats={[]}
      controls={[]}
    >
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: CellType.Wall, label: 'Wall', icon: '#' },
          { id: CellType.Player, label: 'Player', icon: '@' },
          { id: CellType.Box, label: 'Box', icon: '$' },
          { id: CellType.Target, label: 'Target', icon: '.' },
          { id: CellType.Floor, label: 'Erase', icon: ' ' },
        ].map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as CellType)}
            className={`p-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTool === tool.id ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <span className="font-mono text-lg">{tool.icon}</span> {tool.label}
          </button>
        ))}
      </div>

      {editorError && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded text-xs mb-4">
          {editorError}
        </div>
      )}

      <button onClick={saveLevel} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg mb-2">
        Save & Play
      </button>
      <button onClick={clearEditor} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg mb-2">
        Clear Grid
      </button>
      <button onClick={() => setMode('PLAY')} className="w-full py-2 text-slate-400 hover:text-white text-sm">
        Cancel / Exit
      </button>
    </Sidebar>
  );

  // 2. Play Sidebar
  const playSidebar = gameState ? (
    <Sidebar
      title="SOKOBAN"
      colorClass="text-yellow-400"
      stats={[
        { label: 'Level', value: currentLevelIndex < LEVELS.length ? `${currentLevelIndex + 1}` : `C-${currentLevelIndex - LEVELS.length + 1}` },
        { label: 'Moves', value: gameState.moves }
      ]}
      controls={[
        { keys: ['W','A','S','D'], action: 'Move / Push' },
        { keys: ['Z'], action: 'Undo Move' },
        { keys: ['R'], action: 'Reset Level' }
      ]}
    >
       <button onClick={handleUndo} disabled={historyLength === 0} className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded text-sm font-bold text-white mb-2">
          Undo
       </button>
       <button onClick={() => loadLevel(currentLevelIndex)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded text-sm font-bold mb-4">
          Reset
       </button>

       <div className="border-t border-slate-700 pt-4">
          <button onClick={() => setMode('EDIT')} className="w-full py-3 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800 rounded font-bold transition flex items-center justify-center gap-2">
             <span>✎</span> Open Level Editor
          </button>
       </div>

       {/* Level Selector */}
       <div className="mt-4">
         <div className="text-xs font-bold text-slate-500 mb-2">CAMPAIGN</div>
         <div className="grid grid-cols-5 gap-1 mb-4">
            {LEVELS.map((_, idx) => (
              <LevelBtn key={idx} idx={idx} current={currentLevelIndex} onClick={() => setCurrentLevelIndex(idx)} label={`${idx+1}`} />
            ))}
         </div>
         
         {customLevels.length > 0 && (
           <>
             <div className="text-xs font-bold text-slate-500 mb-2">CUSTOM LEVELS</div>
             <div className="grid grid-cols-5 gap-1">
               {customLevels.map((_, idx) => {
                 const realIdx = LEVELS.length + idx;
                 return <LevelBtn key={realIdx} idx={realIdx} current={currentLevelIndex} onClick={() => setCurrentLevelIndex(realIdx)} label={`C${idx+1}`} />;
               })}
             </div>
           </>
         )}
       </div>
    </Sidebar>
  ) : null;

  const LevelBtn = ({idx, current, onClick, label}: any) => (
    <button
      onClick={onClick}
      className={`h-6 text-[10px] font-bold border rounded ${current === idx ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
    >
      {label}
    </button>
  );

  return (
    <GameLayout sidebar={mode === 'EDIT' ? editorSidebar : playSidebar}>
      <div className={`relative shadow-2xl rounded-lg overflow-hidden border-8 ${mode === 'EDIT' ? 'border-blue-900/50' : 'border-slate-800'}`}>
        {/* Editor Grid Overlay/Hint */}
        {mode === 'EDIT' && (
           <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow opacity-80 pointer-events-none">
              EDITING MODE
           </div>
        )}
        
        <GameBoard 
          grid={mode === 'EDIT' ? editorGrid : (gameState?.grid || [])} 
          onCellClick={mode === 'EDIT' ? handleEditorCellClick : undefined}
        />
      </div>

      {showWinModal && mode === 'PLAY' && (
        <WinModal 
          moves={gameState?.moves || 0}
          onNext={() => currentLevelIndex < allLevels.length - 1 && setCurrentLevelIndex(c => c + 1)}
          onStay={() => setShowWinModal(false)}
          hasNextLevel={currentLevelIndex < allLevels.length - 1}
        />
      )}
    </GameLayout>
  );
}