import React from 'react';
import { GameState } from '../types';

interface ControlPanelProps {
  currentLevelIndex: number;
  totalLevels: number;
  moves: number;
  historyLength: number;
  onLevelSelect: (index: number) => void;
  onUndo: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentLevelIndex,
  totalLevels,
  moves,
  historyLength,
  onLevelSelect,
  onUndo,
  onReset
}) => {
  return (
    <div className="flex flex-col gap-6 w-full md:w-64 bg-slate-900 text-slate-100 p-6 border-r border-slate-800 shadow-2xl z-20 font-mono">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-yellow-400 mb-1">SOKOBAN</h1>
        <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
      </div>

      {/* Level Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Level Select</label>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: totalLevels }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onLevelSelect(idx)}
              className={`
                aspect-square flex items-center justify-center rounded text-sm font-bold border transition-all
                ${currentLevelIndex === idx 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800">
        <div>
          <div className="text-xs uppercase text-slate-500 font-semibold">Moves</div>
          <div className="text-2xl font-mono text-white">{moves}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500 font-semibold">Level</div>
          <div className="text-2xl font-mono text-white">{currentLevelIndex + 1}</div>
        </div>
      </div>

      {/* Instructions / Keybinds */}
      <div className="flex flex-col gap-3 text-sm">
        <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Controls</div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
          </div>
          <span className="text-slate-400">Move</span>
        </div>

        <div className="flex items-center gap-3">
          <Kbd>Z</Kbd>
          <span className="text-slate-400">Undo Move</span>
        </div>

         <div className="flex items-center gap-3">
          <Kbd>R</Kbd>
          <span className="text-slate-400">Reset Level</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={onUndo}
          disabled={historyLength === 0}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-sm font-bold transition flex items-center justify-center gap-2"
        >
          <span>↩</span> Undo (Z)
        </button>
        
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded text-sm font-bold transition"
        >
          Reset Level
        </button>
      </div>
      
      <div className="text-[10px] text-slate-600 text-center font-mono mt-4">
        v2.0.1 • React • Audio API
      </div>
    </div>
  );
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-800 rounded font-bold text-xs border-b-2 border-slate-400">
    {children}
  </kbd>
);
