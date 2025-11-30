import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { soundManager } from '../audio';

// Configuration
const LANES = ['Q', 'W', 'E', 'R'];
const LANE_COLORS = ['bg-pink-500', 'bg-cyan-500', 'bg-lime-500', 'bg-purple-500'];
const SPAWN_RATE = 800; // ms
const FALL_SPEED = 3; // px per tick
const HIT_Y = 500; // The vertical position of the hit line
const HIT_THRESHOLD = 40; // Pixels +/- to count as a hit

interface Note {
  id: number;
  laneIndex: number;
  y: number;
  hit: boolean;
}

export default function RhythmGame() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo] = useState(120);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);
  const noteIdRef = useRef(0);

  // Audio start
  useEffect(() => {
    if (isPlaying) {
      soundManager.startRhythmMusic();
    } else {
      soundManager.stopAllMusic();
    }
    return () => soundManager.stopAllMusic();
  }, [isPlaying]);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCombo(0);
    setNotes([]);
    soundManager.resumeContext();
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  };

  // Game Loop
  const loop = useCallback((timestamp: number) => {
    if (!lastSpawnRef.current) lastSpawnRef.current = timestamp;

    // Spawn Logic
    if (timestamp - lastSpawnRef.current > (60000 / tempo)) {
      const laneIndex = Math.floor(Math.random() * 4);
      setNotes(prev => [...prev, { id: noteIdRef.current++, laneIndex, y: 0, hit: false }]);
      lastSpawnRef.current = timestamp;
    }

    // Move Logic
    setNotes(prev => {
      const nextNotes = prev
        .map(n => ({ ...n, y: n.y + FALL_SPEED }))
        .filter(n => {
           if (n.y > HIT_Y + 100 && !n.hit) {
             setCombo(0); // Missed note resets combo
             return false; // Remove from screen
           }
           return n.y < 700; // Cleanup far off screen
        });
      return nextNotes;
    });

    gameLoopRef.current = requestAnimationFrame(loop);
  }, [tempo]);

  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, loop]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const key = e.key.toUpperCase();
      const laneIndex = LANES.indexOf(key);
      
      if (laneIndex !== -1) {
        soundManager.playDrumHit();
        
        // Check for hit
        setNotes(prev => {
          // Find the lowest unhit note in this lane
          const targetNote = prev.find(n => 
            n.laneIndex === laneIndex && 
            !n.hit && 
            Math.abs(n.y - HIT_Y) < HIT_THRESHOLD
          );

          if (targetNote) {
            setScore(s => s + 100 + (combo * 10));
            setCombo(c => c + 1);
            // Mark as hit (visually hide or animate)
            return prev.map(n => n.id === targetNote.id ? { ...n, hit: true } : n);
          } else {
            // Miss input (pressed but no note)
            setCombo(0);
            return prev;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, combo]);

  const sidebar = (
    <Sidebar
      title="RHYTHM"
      colorClass="text-purple-400"
      stats={[
        { label: 'Score', value: score },
        { label: 'Combo', value: combo },
        { label: 'Tempo', value: `${tempo} BPM` }
      ]}
      controls={[
        { keys: ['Q','W','E','R'], action: 'Hit Pads' },
      ]}
    >
       <button
          onClick={isPlaying ? stopGame : startGame}
          className={`w-full py-4 px-6 font-bold rounded-xl shadow-lg transition transform active:scale-95 ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
        >
          {isPlaying ? 'Stop Music' : 'Start Track'}
        </button>
    </Sidebar>
  );

  return (
    <GameLayout sidebar={sidebar}>
      <div className="relative w-full max-w-md h-[600px] bg-slate-900 border-4 border-slate-700 rounded-lg overflow-hidden flex shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Lanes Background */}
        <div className="absolute inset-0 grid grid-cols-4 divide-x divide-slate-800">
          {[0, 1, 2, 3].map(i => (
             <div key={i} className="relative bg-slate-900/50">
                {/* Hit Line Marker */}
                <div className="absolute bottom-[80px] left-0 right-0 h-2 bg-white/10" />
                {/* Key Label */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-slate-500 font-bold text-2xl">
                  {LANES[i]}
                </div>
             </div>
          ))}
        </div>

        {/* Hit Line Global */}
        <div 
           className="absolute w-full h-1 bg-white/30 shadow-[0_0_10px_white]"
           style={{ top: HIT_Y }}
        />

        {/* Notes */}
        {notes.map(note => {
          if (note.hit) return null; // Don't render hit notes
          return (
            <div
              key={note.id}
              className={`absolute w-[20%] h-8 rounded-sm shadow-lg ${LANE_COLORS[note.laneIndex]}`}
              style={{
                left: `${note.laneIndex * 25 + 2.5}%`,
                top: note.y,
              }}
            >
               <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          );
        })}

        {/* Lane Press Effects (Visual only, could be added later) */}
      </div>
    </GameLayout>
  );
}