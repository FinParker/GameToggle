import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
}

interface KeyControl {
  keys: string[];
  action: string;
}

interface SidebarProps {
  title: string;
  colorClass: string; // e.g., 'text-yellow-400'
  stats: StatItem[];
  controls: KeyControl[];
  children?: React.ReactNode; // For extra buttons like Undo/Reset
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  title, 
  colorClass, 
  stats, 
  controls, 
  children 
}) => {
  return (
    <div className="flex flex-col gap-4 h-full bg-slate-900 text-slate-100 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-800 shadow-2xl font-mono overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tighter mb-1 ${colorClass}`}>{title}</h1>
        <div className="h-1 w-12 bg-slate-700 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-1 gap-4 py-4 border-y border-slate-800">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div className="text-xs uppercase text-slate-500 font-semibold">{stat.label}</div>
            <div className="text-xl md:text-2xl font-mono text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Controls Legend */}
      <div className="flex flex-col gap-3 text-sm flex-1">
        <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Controls</div>
        
        {controls.map((ctrl, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex gap-1 flex-wrap">
              {ctrl.keys.map(k => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </div>
            <span className="text-slate-400 text-xs">{ctrl.action}</span>
          </div>
        ))}
      </div>

      {/* Custom Actions (Buttons) */}
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-slate-800">
        {children}
      </div>
      
      <div className="text-[10px] text-slate-600 text-center font-mono hidden md:block">
        React Game Hub v1.0
      </div>
    </div>
  );
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-slate-200 text-slate-800 rounded font-bold text-xs border-b-2 border-slate-400">
    {children}
  </kbd>
);
