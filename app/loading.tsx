import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin" />
        <span className="text-2xl absolute">🌬️</span>
      </div>
      <p className="mt-4 text-xs font-mono uppercase tracking-widest text-slate-400">
        Connecting to Continuous Air Quality Monitoring Network...
      </p>
    </div>
  );
}
