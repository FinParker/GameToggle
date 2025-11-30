import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { soundManager } from '../audio';

// Configuration
const DRUMS = [
  { key: 'Q', label: 'KICK', color: 'bg-rose-600', activeColor: 'bg-rose-400' },
  { key: 'W', label: 'SNARE', color: 'bg-amber-500', activeColor: 'bg-amber-300' },
  { key: 'E', label: 'HI-HAT', color: 'bg-cyan-500', activeColor: 'bg-cyan-300' },
  { key: 'R', label: 'CRASH', color: 'bg-purple-600', activeColor: 'bg-purple-400' },
];

const SPAWN_RATE = 1000; // ms
const FALL_SPEED = 4; // px per tick
const HIT_Y = 450; // Target line Y
const HIT_THRESHOLD = 50; // Tolerance

interface Note {
  id: number;
  drumIndex: number;
  y: number;
  hit: boolean;
}

export default function RhythmGame() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePads, setActivePads] = useState<number[]>([]); // Track which pads are "hit" visually
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo] = useState(120);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);
  const noteIdRef = useRef(0);
  const comboRef = useRef(0);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

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

  const togglePause = useCallback(() => {
    if (isPlaying) stopGame();
    else startGame();
  }, [isPlaying]);

  // Game Loop
  const loop = useCallback((timestamp: number) => {
    if (!lastSpawnRef.current) lastSpawnRef.current = timestamp;

    // Spawn Logic
    if (timestamp - lastSpawnRef.current > (60000 / tempo)) {
      const drumIndex = Math.floor(Math.random() * 4);
      setNotes(prev => [...prev, { id: noteIdRef.current++, drumIndex, y: 0, hit: false }]);
      lastSpawnRef.current = timestamp;
    }

    // Move Logic
    setNotes(prev => {
      return prev
        .map(n => ({ ...n, y: n.y + FALL_SPEED }))
        .filter(n => {
           if (n.y > HIT_Y + 120 && !n.hit) {
             setCombo(0); 
             return false; 
           }
           return n.y < 700;
        });
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

  const triggerPad = useCallback((index: number) => {
    // 1. Play Sound Immediately (Simulator Aspect)
    switch (index) {
      case 0: soundManager.playKick(); break;
      case 1: soundManager.playSnare(); break;
      case 2: soundManager.playHiHat(); break;
      case 3: soundManager.playCrash(); break;
    }

    // 2. Visual Feedback
    setActivePads(prev => [...prev, index]);
    setTimeout(() => {
      setActivePads(prev => prev.filter(i => i !== index));
    }, 100);

    if (!isPlaying) return;

    // 3. Game Logic (Hit Check)
    setNotes(prev => {
      const targetNote = prev.find(n => 
        n.drumIndex === index && 
        !n.hit && 
        Math.abs(n.y - HIT_Y) < HIT_THRESHOLD
      );

      if (targetNote) {
        setScore(s => s + 100 + (comboRef.current * 10));
        setCombo(c => c + 1);
        return prev.map(n => n.id === targetNote.id ? { ...n, hit: true } : n);
      } else {
        // Only reset combo if we are playing and spamming keys (optional, stricter)
        // setCombo(0); 
        return prev;
      }
    });
  }, [isPlaying]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toUpperCase();
      
      if (key === 'P') {
        togglePause();
        return;
      }

      const drumIndex = DRUMS.findIndex(d => d.key === key);
      if (drumIndex !== -1) {
        triggerPad(drumIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerPad, togglePause]);

  const sidebar = (
    <Sidebar
      title="DRUM KIT"
      colorClass="text-purple-400"
      stats={[
        { label: 'Score', value: score },
        { label: 'Combo', value: combo },
        { label: 'Tempo', value: `${tempo} BPM` }
      ]}
      controls={[
        { keys: ['Q','W','E','R'], action: 'Play Drums' },
        { keys: ['P'], action: 'Pause/Resume' }
      ]}
    >
       <button
          onClick={togglePause}
          className={`w-full py-4 px-6 font-bold rounded-xl shadow-lg transition transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400/50 ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
        >
          {isPlaying ? 'Pause Track (P)' : 'Start Track (P)'}
        </button>
    </Sidebar>
  );

  return (
    <GameLayout sidebar={sidebar}>
      <div className="relative w-full max-w-2xl h-[600px] bg-slate-900 border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Falling Notes Area */}
        <div className="flex-1 relative bg-slate-900/50">
          {/* Hit Line */}
          <div 
             className="absolute w-full h-1 bg-white/20"
             style={{ top: HIT_Y }}
          />

          {notes.map(note => {
            if (note.hit) return null;
            return (
              <div
                key={note.id}
                className={`absolute w-12 h-12 rounded-full shadow-lg border-2 border-white/50 ${DRUMS[note.drumIndex].color} opacity-80`}
                style={{
                  left: `${(note.drumIndex * 25) + 12.5}%`,
                  top: note.y,
                  transform: 'translateX(-50%)'
                }}
              />
            );
          })}
        </div>

        {/* Drum Pads Area */}
        <div className="h-48 bg-slate-800 border-t-4 border-slate-700 grid grid-cols-4 gap-2 p-4">
          {DRUMS.map((drum, i) => {
            const isActive = activePads.includes(i);
            return (
              <div 
                key={i}
                className={`
                  relative rounded-lg flex flex-col items-center justify-center transition-all duration-75
                  ${isActive ? `${drum.activeColor} scale-95 shadow-[0_0_20px_white]` : `${drum.color} shadow-lg`}
                  border-b-8 border-black/20
                `}
              >
                {/* Pad Visual */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 border-4 border-white/10 mb-2 shadow-inner" />
                
                <div className="text-white font-black text-2xl tracking-widest">{drum.key}</div>
                <div className="text-white/60 text-xs font-bold mt-1">{drum.label}</div>

                {/* Hit effect overlay */}
                {isActive && <div className="absolute inset-0 bg-white/30 rounded-lg animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}