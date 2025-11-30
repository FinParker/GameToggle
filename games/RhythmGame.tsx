
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GameLayout } from '../components/Layout';
import { soundManager } from '../audio';

// Drum Configuration
interface DrumComponent {
  key: string;
  id: string;
  label: string;
  color: string;
  activeColor: string;
  play: () => void;
  gridArea: string; // CSS Grid Area name
  shape: 'circle' | 'rect';
}

const DRUM_KIT: DrumComponent[] = [
  // Cymbals (Top)
  { key: 'Q', id: 'crash', label: 'CRASH', color: 'bg-yellow-600', activeColor: 'bg-yellow-300', play: () => soundManager.playCrash(), gridArea: 'crash', shape: 'circle' },
  { key: 'W', id: 'hitom', label: 'HI TOM', color: 'bg-blue-700', activeColor: 'bg-blue-400', play: () => soundManager.playHighTom(), gridArea: 'hitom', shape: 'circle' },
  { key: 'E', id: 'midtom', label: 'MID TOM', color: 'bg-blue-700', activeColor: 'bg-blue-400', play: () => soundManager.playMidTom(), gridArea: 'midtom', shape: 'circle' },
  { key: 'R', id: 'ride', label: 'RIDE', color: 'bg-yellow-700', activeColor: 'bg-yellow-400', play: () => soundManager.playRide(), gridArea: 'ride', shape: 'circle' },
  
  // Middle Row
  { key: 'A', id: 'hhclosed', label: 'HH (CL)', color: 'bg-cyan-600', activeColor: 'bg-cyan-300', play: () => soundManager.playClosedHiHat(), gridArea: 'hhc', shape: 'circle' },
  { key: 'S', id: 'snare', label: 'SNARE', color: 'bg-slate-300', activeColor: 'bg-white', play: () => soundManager.playSnare(), gridArea: 'snare', shape: 'circle' },
  { key: 'D', id: 'lowtom', label: 'LOW TOM', color: 'bg-blue-800', activeColor: 'bg-blue-500', play: () => soundManager.playLowTom(), gridArea: 'lowtom', shape: 'circle' },
  { key: 'F', id: 'hhopen', label: 'HH (OP)', color: 'bg-cyan-500', activeColor: 'bg-cyan-200', play: () => soundManager.playOpenHiHat(), gridArea: 'hho', shape: 'circle' },
  
  // Bottom (Kick)
  { key: ' ', id: 'kick', label: 'KICK', color: 'bg-rose-900', activeColor: 'bg-rose-600', play: () => soundManager.playKick(), gridArea: 'kick', shape: 'rect' },
];

export default function RhythmGame() {
  const [activeDrums, setActiveDrums] = useState<string[]>([]);
  const [backingTrack, setBackingTrack] = useState(false);

  // Toggle Backing Track
  useEffect(() => {
    if (backingTrack) {
      soundManager.startBackingTrack();
    } else {
      soundManager.stopBackingTrack();
    }
    return () => soundManager.stopBackingTrack();
  }, [backingTrack]);

  const triggerDrum = useCallback((drum: DrumComponent) => {
    // Audio
    drum.play();

    // Visual
    setActiveDrums(prev => [...prev, drum.id]);
    setTimeout(() => {
      setActiveDrums(prev => prev.filter(id => id !== drum.id));
    }, 100);
  }, []);

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toUpperCase();
      
      // Spacebar mapping check
      const drum = DRUM_KIT.find(d => d.key === key || (key === ' ' && d.key === ' '));
      
      if (drum) {
        e.preventDefault(); // Prevent scrolling on Space
        triggerDrum(drum);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDrum]);

  const sidebar = (
    <Sidebar
      title="DRUM SIM"
      colorClass="text-purple-400"
      stats={[
        { label: 'Mode', value: 'Free Play' },
        { label: 'Track', value: backingTrack ? 'ON' : 'OFF' }
      ]}
      controls={[
        { keys: ['Q','W','E','R'], action: 'Cymbals/Toms' },
        { keys: ['A','S','D','F'], action: 'HH/Snare/Tom' },
        { keys: ['SPACE'], action: 'Kick Drum' },
      ]}
    >
       <button
          onClick={() => setBackingTrack(!backingTrack)}
          className={`w-full py-4 px-6 font-bold rounded-xl shadow-lg transition transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400/50 ${backingTrack ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
        >
          {backingTrack ? 'Stop Backing Track' : 'Play Backing Track'}
        </button>
    </Sidebar>
  );

  return (
    <GameLayout sidebar={sidebar}>
      <div className="w-full max-w-4xl h-[600px] bg-slate-800 rounded-xl shadow-2xl p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden border-4 border-slate-700">
        
        {/* Floor Texture */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Drum Kit Grid Layout */}
        <div className="relative z-10 w-full max-w-2xl aspect-square md:aspect-video grid gap-4"
             style={{
               gridTemplateAreas: `
                 "crash hitom midtom ride"
                 "hhc snare lowtom hho"
                 "kick kick kick kick"
               `,
               gridTemplateRows: '2fr 2fr 1.5fr',
               gridTemplateColumns: '1fr 1fr 1fr 1fr'
             }}
        >
          {DRUM_KIT.map((drum) => {
            const isActive = activeDrums.includes(drum.id);
            return (
              <div
                key={drum.id}
                onMouseDown={() => triggerDrum(drum)}
                style={{ gridArea: drum.gridArea }}
                className={`
                  relative flex flex-col items-center justify-center cursor-pointer transition-all duration-75 select-none
                  ${drum.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}
                  ${isActive ? `${drum.activeColor} scale-95 shadow-[0_0_30px_white]` : `${drum.color} shadow-xl`}
                  border-b-8 border-black/20
                `}
              >
                {/* Drum Head Detail */}
                <div className={`
                   ${drum.shape === 'circle' ? 'w-[70%] h-[70%] rounded-full' : 'w-[90%] h-[60%] rounded-lg'}
                   bg-white/10 border-4 border-white/5 pointer-events-none
                `} />

                {/* Labels */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                    {drum.key === ' ' ? 'SPACE' : drum.key}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
                    {drum.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
