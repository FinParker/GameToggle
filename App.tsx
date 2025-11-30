import React, { useState, useEffect } from 'react';
import { GameType } from './types';
import SokobanGame from './games/SokobanGame';
import SnakeGame from './games/SnakeGame';
import RhythmGame from './games/RhythmGame';
import { soundManager } from './audio';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>('sokoban');

  // Ensure audio context is ready on first interaction
  useEffect(() => {
    const unlockAudio = () => soundManager.resumeContext();
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('click', unlockAudio);
    return () => {
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* Top Navigation Bar */}
      <nav 
        className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-center gap-2 md:gap-8 shadow-lg z-50"
        role="navigation"
        aria-label="Game Selection"
      >
         <NavButton 
           label="Sokoban" 
           active={activeGame === 'sokoban'} 
           onClick={() => setActiveGame('sokoban')} 
           icon="📦"
         />
         <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
         <NavButton 
           label="Snake" 
           active={activeGame === 'snake'} 
           onClick={() => setActiveGame('snake')} 
           icon="🐍"
         />
         <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
         <NavButton 
           label="Rhythm" 
           active={activeGame === 'rhythm'} 
           onClick={() => setActiveGame('rhythm')} 
           icon="🥁"
         />
      </nav>

      {/* Main Game Container */}
      <main className="flex-1 overflow-hidden relative">
        {activeGame === 'sokoban' && <SokobanGame />}
        {activeGame === 'snake' && <SnakeGame />}
        {activeGame === 'rhythm' && <RhythmGame />}
      </main>

    </div>
  );
}

// Nav Helper
const NavButton = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: string }) => (
  <button
    onClick={onClick}
    tabIndex={0}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-bold text-sm md:text-base outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50
      ${active 
        ? 'bg-slate-100 text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'}
    `}
    aria-pressed={active}
  >
    <span className="text-lg" aria-hidden="true">{icon}</span>
    <span>{label}</span>
  </button>
);