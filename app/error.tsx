'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-red-500/30">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Environmental Assistant Error</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error.message || 'An unexpected condition interrupted the air quality session.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-600/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Dashboard</span>
        </button>
      </div>
    </div>
  );
}
