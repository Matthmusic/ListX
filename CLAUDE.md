# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Vite dev server (http://localhost:5173) — browser only, no Electron
npm run electron:dev      # Full Electron app in dev mode with DevTools
npm run build             # Vite production build → dist/
npm run electron:build:win # Build Windows .exe installer → release/
npm run lint              # ESLint (flat config)
npm run preview           # Preview production build
```

There is no test suite. Linting (`npm run lint`) is the only automated check.

## Architecture

**ListX** is an Electron + React desktop app for generating and managing technical document listings for engineering firms. Data flows from a user-configured shared folder (network or local) through Electron IPC into React state.

### State Management (3 React Contexts)

- **AppContext** (`src/context/AppContext.jsx`) — navigation: `currentView` (`'clients' | 'projects' | 'listings' | 'editor'`), `selectedClient`, `selectedProject`, `selectedListing`
- **TemplateContext** (`src/context/TemplateContext.jsx`) — field configuration: `fieldsOrderDisplay`, `fieldsOrderFilename`, `activeFields`, custom fields
- **NaturesContext** (`src/context/NaturesContext.jsx`) — document types (NOT, NDC, PLN, SYN, SCH, LST, etc.)

All three wrap the app in `src/main.jsx`.

### Navigation Pattern

No routing library. `src/App.jsx` switches between page components based on `currentView` from AppContext. Pages call `useApp()` to push navigation. The editor view is `src/DocumentListingApp.jsx` (the core, ~3400 lines), loaded via `src/pages/EditorWrapper.jsx`.

### Data / Storage

- **Storage:** A `data.json` file in a user-selected folder (local or shared network path), containing `{ clients, templates }`
- **Service layer:** `src/services/storageService.js` — CRUD functions (loadData, saveData, getAllClients, createProject, saveListing, etc.) that call Electron IPC
- **IPC bridge:** `electron/preload.js` exposes a safe API to the renderer; `electron/main.js` handles filesystem operations
- **Auto-backup:** 5 rolling backups on each save

### Electron IPC API (preload.js → main.js)

Key channels: `getAppVersion`, `checkForUpdates`, `downloadUpdate`, `installUpdate`, `isStorageConfigured`, `getStoragePath`, `selectStorageFolder`, `readSharedData`, `writeSharedData`. DevTools and right-click context menu are disabled in production.

### Export System

- **Excel:** `ExcelJS` — styled with rainbow colors per category, client + BET logos, autocol widths
- **PDF:** `jsPDF` + `jspdf-autotable` — A4 landscape, same column/color logic as Excel
- **Folder tree:** Generates folder structure per document type
- Export UI is in `src/components/ExportPreview.jsx`; export logic lives in `DocumentListingApp.jsx`

### Auto-Numbering

Two modes (set per-listing): **by-category** (`1XX`, `2XX` per nature) or **sequential** (`001`, `002`, …). Logic is in `src/utils/filename.js` alongside filename generation.

## Release Pipeline

Releases are triggered by pushing a git tag matching `v*` (e.g., `v1.3.20`). The GitHub Actions workflow (`.github/workflows/build.yml`) runs on `windows-latest`, does `npm ci`, then `npm run electron:build`, and uploads the `.exe` + `.yml` to a GitHub Release. `electron-updater` polls GitHub Releases for in-app auto-updates.

To release: bump `version` in `package.json`, update `CHANGELOG.md`, commit, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
