import React, { useState, useEffect } from 'react';

import Icon from './assets/icons/app-icon.png';

function AppBar() {
  const [isMaximize, setMaximize] = useState(false);
  const [isMainAvailable, setIsMainAvailable] = useState(false);

  useEffect(() => {
    // Check if window.Main is available, with retry for production timing issues
    const checkMain = () => {
      if (typeof window !== 'undefined' && window.Main !== undefined) {
        setIsMainAvailable(true);
        return true;
      }
      return false;
    };

    // Immediate check
    if (checkMain()) {
      return;
    }

    // Retry after a short delay (for production builds where preload might load slightly later)
    const timeout = setTimeout(() => {
      checkMain();
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const handleMinimize = () => {
    if (window.Main?.Minimize) {
      window.Main.Minimize();
    }
  };

  const handleToggle = () => {
    if (isMaximize) {
      setMaximize(false);
    } else {
      setMaximize(true);
    }
    if (window.Main?.Maximize) {
      window.Main.Maximize();
    }
  };

  const handleClose = () => {
    if (window.Main?.Close) {
      window.Main.Close();
    }
  };

  // Always render the AppBar - buttons will be disabled if window.Main isn't available
  return (
    <div className="bg-slate-800 py-0.5 flex justify-between draggable text-white" style={{ zIndex: 1000 }}>
      <div className="inline-flex">
        <p className="text-xs ml-1">Mover</p>
      </div>
      <div className="inline-flex -mt-1">
        <button
          onClick={handleMinimize}
          disabled={!isMainAvailable}
          className="undraggable md:px-4 lg:px-3 pt-1 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &#8211;
        </button>
        <button
          onClick={handleToggle}
          disabled={!isMainAvailable}
          className="undraggable px-6 lg:px-5 pt-1 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMaximize ? '\u2752' : '⃞'}
        </button>
        <button
          onClick={handleClose}
          disabled={!isMainAvailable}
          className="undraggable px-4 pt-1 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}

export default AppBar;
