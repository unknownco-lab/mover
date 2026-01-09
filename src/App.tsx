import React, { useState, useEffect, useRef } from 'react';
import { Controls } from './components/controls';
import { StatusIndicator } from './components/status-indicator';
import { Activity } from 'lucide-react';

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState({
    pattern: 'circular',
    interval: 5,
    distance: 50,
    enabled: true
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Remove loading screen - with fallback if preload script didn't load
    try {
      if (window.Main && typeof window.Main.removeLoading === 'function') {
        window.Main.removeLoading();
      } else {
        // Fallback: manually remove loading elements if preload failed
        console.warn('window.Main not available, using fallback to remove loading screen');
        const loadingStyle = document.getElementById('app-loading-style');
        const loadingDiv = document.getElementById('loading-to-remove');
        if (loadingStyle) loadingStyle.remove();
        if (loadingDiv) loadingDiv.remove();
      }
    } catch (error) {
      console.error('Failed to remove loading screen:', error);
      // Fallback: manually remove loading elements
      const loadingStyle = document.getElementById('app-loading-style');
      const loadingDiv = document.getElementById('loading-to-remove');
      if (loadingStyle) loadingStyle.remove();
      if (loadingDiv) loadingDiv.remove();
    }
  }, []);

  const executePattern = async (pattern: string, distance: number, signal: AbortSignal) => {
    // Helper to check cancellation before each movement
    const moveWithCancel = async (direction: 'left' | 'right' | 'up' | 'down', pixels: number) => {
      if (signal.aborted) {
        throw new Error('Aborted');
      }
      await window.Main.moveMouse(direction, pixels);
    };

    switch (pattern) {
      case 'circular':
        await moveWithCancel('right', distance);
        await moveWithCancel('down', distance);
        await moveWithCancel('left', distance);
        await moveWithCancel('up', distance);
        break;
      case 'random': {
        const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        await moveWithCancel(randomDir, distance);
        break;
      }
      case 'figure8':
        await moveWithCancel('right', distance);
        await moveWithCancel('down', distance);
        await moveWithCancel('left', distance * 2);
        await moveWithCancel('up', distance);
        await moveWithCancel('right', distance * 2);
        await moveWithCancel('down', distance);
        await moveWithCancel('left', distance);
        await moveWithCancel('up', distance);
        break;
      case 'horizontal':
        await moveWithCancel('right', distance);
        await moveWithCancel('left', distance * 2);
        await moveWithCancel('right', distance);
        break;
      case 'vertical':
        await moveWithCancel('down', distance);
        await moveWithCancel('up', distance * 2);
        await moveWithCancel('down', distance);
        break;
      case 'zigzag':
        await moveWithCancel('right', distance);
        await moveWithCancel('down', distance / 2);
        await moveWithCancel('left', distance);
        await moveWithCancel('down', distance / 2);
        await moveWithCancel('right', distance);
        break;
      default:
        await moveWithCancel('right', distance);
    }
  };

  const handleStart = async () => {
    // Abort any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      window.Main.cancelMouseOperation();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsRunning(true);

    try {
      // Store initial config at start to avoid changes mid-pattern execution
      let currentConfig = { ...config };

      // Continuous loop that respects the interval
      while (!abortController.signal.aborted) {
        // Check if disabled
        if (!currentConfig.enabled) {
          break;
        }

        // Use current config values (will pick up changes on next iteration)
        currentConfig = { ...config };

        await executePattern(currentConfig.pattern, currentConfig.distance, abortController.signal);

        // Wait for the interval duration, but check for abort during wait
        const startTime = Date.now();
        while (Date.now() - startTime < currentConfig.interval * 1000 && !abortController.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Check every 100ms
        }
      }
    } catch (error) {
      // Handle abort - this is expected when stopping
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('Jiggling error:', error);
      }
    } finally {
      // Only update state if this is still the current operation
      if (abortControllerRef.current === abortController) {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStop = () => {
    // Cancel the abort controller to stop the loop
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Notify the main process to cancel any in-flight operations
    window.Main.cancelMouseOperation();
    setIsRunning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex">
      <div className="w-full bg-zinc-900 overflow-hidden flex flex-col flex-1">
        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-xl">
            <Activity className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl text-white">Mover</h1>
            <p className="text-sm text-zinc-400">Keep your system active</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 h-full flex flex-col flex-1">
          <StatusIndicator isRunning={isRunning} config={config} />
          <Controls
            config={config}
            setConfig={setConfig}
            isRunning={isRunning}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}
