import React from 'react';

export default function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto py-8">
      <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4">
        <div className="w-48 h-48 rounded-full bg-slate-800" />
        <div className="h-6 w-32 bg-slate-800 rounded-full" />
        <div className="h-4 w-72 bg-slate-800 rounded-full" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="h-4 w-16 bg-slate-800 rounded" />
            <div className="h-8 w-20 bg-slate-800 rounded" />
            <div className="h-2 w-full bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
