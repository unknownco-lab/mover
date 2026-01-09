import React from 'react';
import { Settings, Play, Square } from 'lucide-react';
import { Select, useId } from '@fluentui/react-components';

interface Config {
  pattern: string;
  interval: number;
  distance: number;
  enabled: boolean;
}

interface ControlsProps {
  config: Config;
  setConfig: (config: Config) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function Controls({ config, setConfig, isRunning, onStart, onStop }: ControlsProps) {
  const selectId = useId();
  return (
    <div className="flex flex-col flex-1 justify-between">
      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white mb-4">
          <Settings className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg">Configuration</h2>
        </div>

        {/* Movement Pattern */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 block">Movement Pattern</label>
          <Select
            id={selectId}
            value={config.pattern}
            onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
            disabled={isRunning}
            className="w-full bg-zinc-800 text-white disabled:bg-zinc-800/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="circular">Circular Motion</option>
            <option value="random">Random Movement</option>
            <option value="figure8">Figure-8 Pattern</option>
            <option value="horizontal">Horizontal Line</option>
            <option value="vertical">Vertical Line</option>
            <option value="zigzag">Zig-Zag Pattern</option>
          </Select>
        </div>

        {/* Movement Interval */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 block">
            Movement Interval: <span className="text-purple-400">{config.interval} seconds</span>
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={config.interval}
            onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) })}
            disabled={isRunning}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-purple-500"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>1s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Movement Distance */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 block">
            Movement Distance: <span className="text-purple-400">{config.distance} pixels</span>
          </label>
          <input
            type="range"
            min="10"
            max="500"
            value={config.distance}
            onChange={(e) => setConfig({ ...config, distance: parseInt(e.target.value) })}
            disabled={isRunning}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-purple-500"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>10px</span>
            <span>200px</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex pt-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Start Mover
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 bg-gray-800 bg-gray-900 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <Square className="w-5 h-5" fill="red" />
            Stop Mover
          </button>
        )}
      </div>
    </div>
  );
}
