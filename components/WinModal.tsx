import React, { useEffect } from 'react';

interface WinModalProps {
  moves: number;
  bestMoves?: number;
  isNewRecord?: boolean;
  onNext: () => void;
  onStay: () => void;
  hasNextLevel: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({ moves, bestMoves, isNewRecord, onNext, onStay, hasNextLevel }) => {
  
  // Keyboard access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation(); 
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] transition-all animate-in fade-in zoom-in duration-300">
      <div 
        className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border-4 border-slate-200 outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 text-3xl select-none shadow-sm">
          🏆
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Level Complete!</h2>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
           <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 text-sm font-semibold uppercase">This Run</span>
              <span className="font-bold text-2xl text-slate-800">{moves} <span className="text-xs font-normal text-slate-400">moves</span></span>
           </div>
           
           {(bestMoves !== undefined) && (
             <div className={`flex justify-between items-center pt-2 border-t border-slate-200 ${isNewRecord ? 'text-green-600' : 'text-slate-400'}`}>
                <span className="text-xs font-bold uppercase flex items-center gap-1">
                   {isNewRecord && '🌟'} Personal Best
                </span>
                <span className="font-bold font-mono">
                   {isNewRecord ? 'NEW RECORD!' : `${bestMoves} moves`}
                </span>
             </div>
           )}
        </div>

        <div className="flex flex-col gap-3">
          {hasNextLevel ? (
            <button
              onClick={onNext}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-500/50 flex items-center justify-center gap-2"
            >
              Next Level <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">ENTER</span>
            </button>
          ) : (
            <div className="text-green-600 font-bold p-3 bg-green-50 rounded-lg border border-green-100 mb-2">
              All Levels Completed!
            </div>
          )}
          <button
            onClick={onStay}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold py-2 focus:outline-none focus:underline"
          >
            Stay Here <span className="font-normal opacity-70">(Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
