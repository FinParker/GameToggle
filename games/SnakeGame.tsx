import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { Leaderboard } from '../components/Leaderboard';
import { soundManager } from '../audio';
import { saveSnakeScore, getSnakeScores, ScoreEntry } from '../storage';

const GRID_SIZE = 15;
const INITIAL_SPEED = 150;

type Point = { x: number, y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [dir, setDir] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  
  // Leaderboard State
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);

  // Refs for game loop to avoid closure staleness
  const dirRef = useRef(dir);
  const nextDirRef = useRef(dir); // Prevent 180 degree turns in one tick

  useEffect(() => {
    dirRef.current = dir;
    nextDirRef.current = dir;
  }, [dir]);

  // Load scores on mount
  useEffect(() => {
    setHighScores(getSnakeScores());
  }, []);

  // Save score on Game Over
  useEffect(() => {
    if (status === 'GAME_OVER') {
      const updatedScores = saveSnakeScore(score);
      setHighScores(updatedScores);
    }
  }, [status, score]);

  const generateFood = useCallback((currentSnake: Point[]) => {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const onSnake = currentSnake.some(s => s.x === x && s.y === y);
      if (!onSnake) return { x, y };
    }
  }, []);

  const startGame = useCallback(() => {
    setSnake([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]);
    setFood(generateFood([{ x: 7, y: 7 }]));
    setDir('RIGHT');
    nextDirRef.current = 'RIGHT';
    setScore(0);
    setStatus('PLAYING');
    soundManager.resumeContext();
  }, [generateFood]);

  useEffect(() => {
    if (status !== 'PLAYING') return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const currentDir = nextDirRef.current;
        let newHead = { ...head };

        switch (currentDir) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Collision Check (Walls)
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          soundManager.playGameOver();
          setStatus('GAME_OVER');
          return prevSnake;
        }

        // Collision Check (Self)
        if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          soundManager.playGameOver();
          setStatus('GAME_OVER');
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat Food
        if (newHead.x === food.x && newHead.y === food.y) {
          soundManager.playBite();
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail
          // Play Slither Sound on normal move (if not eating)
          soundManager.playSlither();
        }

        // Update Ref direction for next input check
        dirRef.current = currentDir;
        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(intervalId);
  }, [status, food, generateFood]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();
      
      const key = e.key.toLowerCase();
      
      // Restart
      if (key === 'r') {
        startGame();
        return;
      }

      const current = dirRef.current;
      if ((key === 'arrowup' || key === 'w') && current !== 'DOWN') nextDirRef.current = 'UP';
      if ((key === 'arrowdown' || key === 's') && current !== 'UP') nextDirRef.current = 'DOWN';
      if ((key === 'arrowleft' || key === 'a') && current !== 'RIGHT') nextDirRef.current = 'LEFT';
      if ((key === 'arrowright' || key === 'd') && current !== 'LEFT') nextDirRef.current = 'RIGHT';
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame]);

  // Rendering Cells
  const renderCell = (x: number, y: number) => {
    const isFood = food.x === x && food.y === y;
    const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
    const isHead = snakeIndex === 0;
    const isBody = snakeIndex > 0;

    let content = null;
    let className = "w-full h-full bg-slate-900/50 rounded-[2px]"; // Floor

    if (isFood) {
      content = <div className="w-[60%] h-[60%] bg-red-500 rounded-full shadow-[0_0_10px_red] animate-pulse" />;
      className += " flex items-center justify-center";
    } else if (isHead) {
      content = (
        <div className="w-[90%] h-[90%] bg-green-400 rounded-sm relative">
           <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full opacity-50" />
           <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full opacity-50" />
        </div>
      );
      className += " flex items-center justify-center";
    } else if (isBody) {
       // Gradient opacity for body
       const opacity = Math.max(0.3, 1 - (snakeIndex / (snake.length + 5)));
       content = <div className="w-[85%] h-[85%] bg-green-600 rounded-sm" style={{ opacity }} />;
       className += " flex items-center justify-center";
    }

    return (
      <div key={`${x}-${y}`} className={className}>
        {content}
      </div>
    );
  };

  const sidebar = (
    <Sidebar
      title="SNAKE"
      colorClass="text-green-400"
      stats={[
        { label: 'Score', value: score },
        { label: 'Status', value: status === 'PLAYING' ? 'ALIVE' : status }
      ]}
      controls={[
        { keys: ['W','A','S','D'], action: 'Steer' },
        { keys: ['R'], action: 'Restart' },
      ]}
    >
       <button
          onClick={startGame}
          className="w-full py-4 px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-400/50"
        >
          {status === 'IDLE' ? 'Start Game' : 'Restart (R)'}
        </button>
    </Sidebar>
  );

  return (
    <GameLayout sidebar={sidebar}>
       <div className="relative">
        <div 
          className="bg-slate-800 p-2 border-8 border-slate-700 rounded-lg shadow-2xl grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: 'min(90vw, 500px)',
            aspectRatio: '1/1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
             const x = i % GRID_SIZE;
             const y = Math.floor(i / GRID_SIZE);
             return renderCell(x, y);
          })}
        </div>

        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-lg z-20">
             <div className="flex flex-col gap-4 items-center p-6 bg-slate-900 border-2 border-red-500 rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in duration-300">
               <h2 className="text-3xl font-bold text-red-500">GAME OVER</h2>
               <p className="text-white text-lg">Final Score: <span className="font-bold text-yellow-400">{score}</span></p>
               
               {/* Leaderboard */}
               <Leaderboard title="High Scores" scores={highScores} recentScore={score} />

               <button 
                  onClick={startGame} 
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-colors shadow-lg mt-2"
                  autoFocus
                >
                  Try Again
               </button>
             </div>
          </div>
        )}
       </div>
    </GameLayout>
  );
}
