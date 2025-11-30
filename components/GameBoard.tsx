import React from 'react';
import { Grid, CellType } from '../types';

// Visual Components 
const Wall = () => (
  <div className="w-full h-full bg-slate-700 rounded-sm shadow-inner border border-slate-600/50" />
);

const Box = () => (
  <div className="w-[90%] h-[90%] bg-blue-600 rounded-md border-b-4 border-r-4 border-blue-800 shadow-lg relative flex items-center justify-center z-10 transition-transform">
    <div className="absolute inset-2 border-2 border-blue-800/20 rounded-sm"></div>
    <div className="w-2 h-2 bg-blue-400/30 rounded-full"></div>
  </div>
);

const BoxOnTarget = () => (
  <div className="w-[90%] h-[90%] bg-green-500 rounded-md border-b-4 border-r-4 border-green-700 shadow-[0_0_15px_rgba(34,197,94,0.6)] relative flex items-center justify-center z-10">
    <div className="absolute inset-2 border-2 border-green-800/20 rounded-sm"></div>
    <div className="w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
  </div>
);

const Target = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500/50 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-400" />
  </div>
);

const Player = () => (
  <div className="w-[85%] h-[85%] bg-emerald-500 rounded-full border-2 border-emerald-300 shadow-xl relative flex items-center justify-center z-20">
    {/* Eyes */}
    <div className="flex gap-2 mb-1">
       <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
       <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
    </div>
  </div>
);

const Floor = () => null; 

interface GameBoardProps {
  grid: Grid;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid }) => {
  if (!grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0].length;

  return (
    <div 
      className="bg-slate-800 p-1"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: '2px',
        width: 'fit-content'
      }}
    >
      {grid.flatMap((row, y) => 
        row.map((cell, x) => (
          <Cell key={`${x}-${y}`} type={cell as CellType} />
        ))
      )}
    </div>
  );
};

const Cell = React.memo(({ type }: { type: CellType }) => {
  // Responsive cell sizing
  const cellClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-900/50 rounded-[2px]";

  let content = <Floor />;

  switch (type) {
    case CellType.Wall:
      return <div className={cellClass}><Wall /></div>;
    case CellType.Box:
      content = <Box />;
      break;
    case CellType.BoxOnTarget:
      content = <BoxOnTarget />;
      break;
    case CellType.Target:
      content = <Target />;
      break;
    case CellType.Player:
      content = <Player />;
      break;
    case CellType.PlayerOnTarget:
      return (
        <div className={`${cellClass} relative`}>
          <div className="absolute inset-0"><Target /></div>
          <div className="relative w-full h-full flex items-center justify-center"><Player /></div>
        </div>
      );
    default:
      break;
  }

  return <div className={cellClass}>{content}</div>;
});