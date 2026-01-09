import React from 'react';
import { MousePointer2, CheckCircle2, Circle } from 'lucide-react';

interface Config {
  pattern: string;
  interval: number;
  distance: number;
  enabled: boolean;
}

interface StatusIndicatorProps {
  isRunning: boolean;
  config: Config;
}

const patternNames: { [key: string]: string } = {
  circular: 'Circular Motion',
  random: 'Random Movement',
  figure8: 'Figure-8 Pattern',
  horizontal: 'Horizontal Line',
  vertical: 'Vertical Line',
  zigzag: 'Zig-Zag Pattern'
};

export function StatusIndicator({ isRunning, config }: StatusIndicatorProps) {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-300 ${
        isRunning ? 'bg-purple-950/30 border-purple-800/50' : 'bg-zinc-800/50 border-zinc-700/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${isRunning ? 'bg-purple-600/20' : 'bg-zinc-700/50'}`}>
          <MousePointer2 className={`w-6 h-6 ${isRunning ? 'text-purple-400' : 'text-zinc-400'}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isRunning ? (
              <>
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span className="text-green-300">Active</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-400">Inactive</span>
              </>
            )}
          </div>

          {isRunning && (
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>
                  Pattern: <span className="text-white">{patternNames[config.pattern]}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Moving every {config.interval} seconds</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Distance: {config.distance} pixels</span>
              </div>
            </div>
          )}

          {!isRunning && <p className="text-sm text-zinc-500 mt-2">Configure your settings and click Start to begin</p>}
        </div>
      </div>
    </div>
  );
}
