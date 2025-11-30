import React from 'react';
import { ScoreEntry } from '../storage';

interface LeaderboardProps {
  title: string;
  scores: ScoreEntry[];
  recentScore?: number; // Highlight this score if present
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ title, scores, recentScore }) => {
  return (
    <div className="w-full bg-slate-900/80 rounded-xl p-4 border border-slate-700 shadow-inner">
      <h3 className="text-yellow-400 font-bold text-center mb-3 text-xs uppercase tracking-widest border-b border-slate-700 pb-2">
        {title}
      </h3>
      <div className="space-y-1.5">
        {scores.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-2 italic">No scores recorded yet</div>
        ) : (
          scores.map((entry, idx) => {
            // Simple check to highlight the "just achieved" score if it matches the top entry of that value
            const isRecent = recentScore === entry.score; 
            
            return (
              <div 
                key={`${idx}-${entry.date}`} 
                className={`flex justify-between items-center px-3 py-2 rounded text-sm transition-colors ${
                  isRecent 
                    ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' 
                    : 'bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold w-4 text-center ${idx < 3 ? 'text-yellow-500' : 'text-slate-600'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="font-mono font-bold text-white">{entry.score}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
