import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const GameLayout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-900">
      {/* Sidebar Container */}
      <div className="w-full md:w-64 flex-shrink-0 z-20">
        {sidebar}
      </div>
      
      {/* Game Screen Container */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 p-2 md:p-6 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
