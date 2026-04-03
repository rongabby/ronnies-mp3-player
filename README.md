# Ronnie's MP3 Player

A lightweight, browser-based MP3 player. Open `index.html` in any modern browser — no server required.

## Features

- 🎵 Plays MP3, FLAC, OGG, WAV, M4A, AAC, OPUS, and WMA files
- 📂 **Import a whole folder** in three ways (see below)
- 🔀 Shuffle and 🔁 Repeat modes
- ⌨️ Keyboard shortcuts: **Space** = play/pause, **← →** = previous/next track

## How to import a folder from another platform

### Option 1 — Paste a folder path from your clipboard (recommended when moving from another platform)

1. On your other platform, copy the folder path to your clipboard  
   *(e.g. right-click the folder → "Copy as path", or `Ctrl+C` on the address bar)*
2. Open `index.html` in your browser.
3. Click **📋 Paste Path** — the player reads the path from your clipboard and guides you.
4. Because browsers cannot open local paths directly, click **📁 Choose Folder** and navigate to that location on your device.
5. Select the folder — all audio files are loaded into the playlist automatically.

*You can also press **Ctrl+V** (or **⌘V** on macOS) anywhere on the player page to trigger the same paste flow.*

### Option 2 — Drag and drop a folder

Drag a folder from your file manager and drop it onto the **drop zone** in the center of the page.  
The player recursively finds every audio file inside, including sub-folders.

### Option 3 — Choose files or folder with the file picker

- Click **📁 Choose Folder** to open a folder picker (picks all audio files in the folder).
- Click **🎵 Choose Files** to pick individual audio files.

## Running locally

Simply open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).  
No build step or server is required.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| ← | Previous track (or restart if > 3 s in) |
| → | Next track |
| Ctrl+V | Paste folder path from clipboard |
