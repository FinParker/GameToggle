import React, { useEffect } from 'react';

interface WinModalProps {
  moves: number;
  onNext: () => void;
  onStay: () => void;
  hasNextLevel: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({ moves, onNext, onStay, hasNextLevel }) => {
  
  // Keyboard access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation(); // Stop propagation so game doesn't react
      if (e.key === 'Enter') {
        if (hasNextLevel) onNext();
        else onStay();
      }
      if (e.key === 'Escape') {
        onStay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNextLevel, onNext, onStay]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-in fade-in duration-300">
      <div 
        className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-xs mx-4 border-4 border-slate-100 outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 text-3xl select-none">
          🏆
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Level Complete!</h2>
        <p className="text-slate-500 mb-6">
          Solved in <span className="font-bold text-slate-800">{moves}</span> moves.
        </p>

        <div className="flex flex-col gap-3">
          {hasNextLevel ? (
            <button
              onClick={onNext}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-500/50"
            >
              Next Level <span className="text-slate-400 font-normal text-xs ml-2">(Enter)</span>
            </button>
          ) : (
            <div className="text-green-600 font-bold p-3 bg-green-50 rounded-lg border border-green-100">
              All Levels Completed!
            </div>
          )}
          <button
            onClick={onStay}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium py-2 focus:outline-none focus:underline"
          >
            Stay here <span className="text-xs opacity-70">(Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};