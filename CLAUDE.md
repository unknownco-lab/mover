# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mover is an Electron-based desktop application that keeps your computer active during legitimate work scenarios by simulating mouse movement with customizable patterns. Built with React, TypeScript, Vite, and uses `@nut-tree/nut-js` for mouse control.

## Development Commands

### Running the Application
```bash
npm run dev                    # Run Vite dev server only
npm run dev:electron           # Run Vite + Electron in dev mode
npm run dev:electron:debug     # Run with DevTools automatically opened
```

### Building
```bash
npm run build                  # Build both Vite and Electron
npm run build:vite            # Build Vite renderer only
npm run build:electron        # Compile TypeScript for Electron main process

npm run dist                   # Create distribution packages for current platform
npm run dist:win              # Build for Windows
npm run dist:mac              # Build for macOS
npm run dist:linux            # Build for Linux
```

### Code Quality
```bash
npm run type-check            # Run TypeScript type checking
npm run lint                  # Run ESLint
npm run lint:fix              # Run ESLint with auto-fix
npm run format                # Format code with Prettier
npm run format:check          # Check code formatting
```

### Cleanup
```bash
npm run clean                 # Remove all build artifacts
```

## Architecture

### Multi-Process Electron Architecture

Mover uses Electron's standard multi-process architecture with context isolation:

**Main Process** (`electron/index.ts`):
- Creates the BrowserWindow with frameless design
- Manages IPC handlers for mouse control via `@nut-tree/nut-js`
- Handles window controls (minimize, maximize, close) for custom AppBar
- Lazy-loads `@nut-tree/nut-js` to avoid permission checks on startup
- Implements macOS accessibility permission checking
- Configures CSP (Content Security Policy) differently for dev/prod
- Manages auto-updater with 10-second delayed startup

**Preload Script** (`electron/preload.ts`):
- Exposes safe IPC API to renderer via `contextBridge` as `window.Main`
- Provides mouse control functions: `moveMouse()`, `cancelMouseOperation()`
- Handles custom window controls for frameless window
- Manages loading screen removal

**Renderer Process** (`src/`):
- React app with FluentUI components and Tailwind CSS styling
- Main app logic in `src/App.tsx` with pattern execution engine
- Uses `AbortController` for cancellable mouse movement operations
- Supports 6 movement patterns: circular, random, figure-8, horizontal, vertical, zigzag

### Key Components

**`src/App.tsx`**:
- Main application logic and state management
- `executePattern()`: Implements all mouse movement patterns with cancellation support
- `handleStart()`: Continuous loop that executes patterns at configured intervals
- `handleStop()`: Cancels operations using `AbortController`

**`src/components/controls.tsx`**:
- Configuration UI for pattern, interval (1-60s), and distance (10-500px)
- Start/Stop buttons with state management
- FluentUI Select with custom event handling for dropdown state tracking

**`src/components/status-indicator.tsx`**:
- Displays current status (active/inactive) and configuration

**`src/AppBar.tsx`**:
- Custom frameless window controls (minimize, maximize, close)
- Required because `frame: false` is set in BrowserWindow

### IPC Communication

The main process exposes these IPC handlers:

- `mouse:move` - Moves mouse in specified direction by pixel amount, returns `{success, error?}`
- `mouse:cancel` - Sets cancellation flag to interrupt ongoing operations
- `minimize`, `maximize`, `close` - Window control handlers

### Build System

**Vite Configuration** (`vite.config.ts`):
- Uses `vite-plugin-electron` to build both main and preload scripts
- Dev server runs on port 3000 (configurable via PORT env var)
- Outputs: `dist-vite/` (renderer), `dist-electron/` (main process)
- Production base path is `./` for proper file:// URL loading

**TypeScript**:
- Root `tsconfig.json` for renderer process (ESNext, React JSX)
- `electron/tsconfig.json` for main process (CommonJS, outputs to `dist-electron/`)

### Electron Builder Configuration

Configured in `package.json` under `"build"`:
- ASAR archive enabled for file compression
- Includes `dist-electron` and `dist-vite` directories
- Build resources in `resources/` folder
- Platform-specific icon handling: `.icns` (macOS), `.ico` (Windows), `.png` (Linux)

## macOS Permissions

The app requires **Accessibility permissions** on macOS to control the mouse. The main process checks permissions before mouse operations to prevent repeated system prompts. Users must manually enable in System Settings > Privacy & Security > Accessibility.

## Important Patterns

### Mouse Movement Cancellation
All mouse operations support cancellation via `AbortController`:
1. Renderer creates `AbortController` and stores in ref
2. Pattern execution checks `signal.aborted` before each movement
3. Stop button calls `abort()` and sends `mouse:cancel` IPC
4. Main process sets `currentOperationCancelled` flag to interrupt in-flight movements

### Pattern Execution Loop
The continuous movement loop in `App.tsx` picks up config changes between pattern executions but maintains operation atomicity during individual pattern runs.

### Lazy Loading nut-js
`@nut-tree/nut-js` is imported dynamically in main process to avoid triggering macOS permission dialogs on app startup. First mouse operation triggers the import.

## Internationalization

i18next is configured in `src/plugins/i18n.ts` with English and Spanish translations in `src/locales/`. Currently minimal usage in the app.

## Styling

- Tailwind CSS for utility-first styling
- FluentUI React Components for Select component
- Custom dark theme (zinc/purple color scheme)
- All styling in className attributes, no separate CSS modules
