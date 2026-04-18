/**
 * Ronnie's MP3 Player – app.js
 *
 * Supports three ways to import a folder of MP3s:
 *  1. Drag-and-drop a folder onto the drop-zone.
 *  2. Click "Choose Folder" and pick a directory.
 *  3. Click "Paste Path" (or press Ctrl+V on the drop-zone) to paste
 *     a folder path copied from another platform.
 *
 * Accepted audio formats: MP3, FLAC, OGG, WAV, M4A, AAC, OPUS, WMA.
 */

'use strict';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const AUDIO_EXTS = new Set([
  'mp3', 'flac', 'ogg', 'wav', 'm4a', 'aac', 'opus', 'wma',
]);

/* ─── Element refs ───────────────────────────────────────────────────────── */
const audio        = document.getElementById('audio');
const dropZone     = document.getElementById('dropZone');
const folderInput  = document.getElementById('folderInput');
const filesInput   = document.getElementById('filesInput');
const pasteBtn     = document.getElementById('pasteBtn');
const clipboardRow = document.getElementById('clipboardRow');
const clipboardPath= document.getElementById('clipboardPath');
const clipboardGo  = document.getElementById('clipboardGo');
const importNote   = document.getElementById('importNote');

const playBtn      = document.getElementById('playBtn');
const prevBtn      = document.getElementById('prevBtn');
const nextBtn      = document.getElementById('nextBtn');
const shuffleBtn   = document.getElementById('shuffleBtn');
const repeatBtn    = document.getElementById('repeatBtn');
const progressBar  = document.getElementById('progressBar');
const volumeBar    = document.getElementById('volumeBar');
const currentTimeEl= document.getElementById('currentTime');
const durationEl   = document.getElementById('duration');
const trackTitle   = document.getElementById('trackTitle');
const trackIndex   = document.getElementById('trackIndex');
const playlistEl   = document.getElementById('playlist');
const playlistCount= document.getElementById('playlistCount');
const clearBtn     = document.getElementById('clearBtn');

/* ─── State ──────────────────────────────────────────────────────────────── */
let tracks        = [];   // { name, url }
let currentIndex  = -1;
let isShuffle     = false;
let isRepeat      = false;
let isSeeking     = false;
let shuffleOrder  = [];

/* ─────────────────────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────────────────────── */
function isAudioFile(name) {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  return AUDIO_EXTS.has(ext);
}

function getBaseName(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? filename : filename.slice(0, dot);
}

function formatTime(secs) {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function showNote(msg, isError = false) {
  importNote.textContent = msg;
  importNote.style.color = isError ? '#e05555' : '';
}

/* ─────────────────────────────────────────────────────────────────────────
   Playlist management
───────────────────────────────────────────────────────────────────────── */
function addFiles(fileList) {
  const audioFiles = Array.from(fileList).filter(f => isAudioFile(f.name));

  if (audioFiles.length === 0) {
    showNote('No supported audio files found in the selection.', true);
    return;
  }

  const newTracks = audioFiles.map(f => ({
    name: getBaseName(f.name),
    url : URL.createObjectURL(f),
  }));

  tracks = tracks.concat(newTracks);
  buildShuffleOrder();
  renderPlaylist();
  showNote(`Added ${audioFiles.length} track${audioFiles.length > 1 ? 's' : ''}.`);

  if (currentIndex === -1) loadTrack(0);
}

function buildShuffleOrder() {
  shuffleOrder = [...Array(tracks.length).keys()];
  for (let i = shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = '';
  if (tracks.length === 0) {
    const li = document.createElement('li');
    li.className = 'playlist-empty';
    li.textContent = 'No tracks loaded — import a folder to get started.';
    playlistEl.appendChild(li);
    playlistCount.textContent = '';
    return;
  }

  playlistCount.textContent = `(${tracks.length})`;
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'track-item' + (i === currentIndex ? ' active' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === currentIndex);
    li.dataset.index = i;

    const num  = document.createElement('span');
    num.className = 'track-num';
    num.textContent = i + 1;

    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = t.name;
    name.title = t.name;

    li.appendChild(num);
    li.appendChild(name);
    li.addEventListener('click', () => { loadTrack(i); audio.play(); });
    playlistEl.appendChild(li);
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Playback
───────────────────────────────────────────────────────────────────────── */
function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentIndex = index;
  const t = tracks[index];
  // Validate that the URL is a safe blob: URL before assigning to audio.src.
  let safeUrl;
  try {
    const parsed = new URL(t.url);
    if (parsed.protocol !== 'blob:') return;
    safeUrl = parsed.href; // use the re-serialised URL so taint analysis is satisfied
  } catch {
    return;
  }
  audio.src = safeUrl;
  trackTitle.textContent = t.name;
  trackIndex.textContent = `${index + 1} / ${tracks.length}`;
  progressBar.value = 0;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  renderPlaylist();
  scrollActiveIntoView();
}

function scrollActiveIntoView() {
  const active = playlistEl.querySelector('.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function playOrPause() {
  if (tracks.length === 0) return;
  if (currentIndex === -1) { loadTrack(0); }
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function playNext() {
  if (tracks.length === 0) return;
  if (isShuffle) {
    const pos = shuffleOrder.indexOf(currentIndex);
    const next = (pos + 1) % shuffleOrder.length;
    loadTrack(shuffleOrder[next]);
  } else {
    loadTrack((currentIndex + 1) % tracks.length);
  }
  audio.play().catch(() => {});
}

function playPrev() {
  if (tracks.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (isShuffle) {
    const pos = shuffleOrder.indexOf(currentIndex);
    const prev = (pos - 1 + shuffleOrder.length) % shuffleOrder.length;
    loadTrack(shuffleOrder[prev]);
  } else {
    loadTrack((currentIndex - 1 + tracks.length) % tracks.length);
  }
  audio.play().catch(() => {});
}

/* ─────────────────────────────────────────────────────────────────────────
   Import: Clipboard / Paste Path
   Web browsers cannot read the filesystem by path, so when the user
   pastes a path we display a friendly explanation and offer the folder
   picker as the next step.
───────────────────────────────────────────────────────────────────────── */
function handlePastedPath(path) {
  if (!path || !path.trim()) {
    showNote('No path detected in the clipboard.', true);
    return;
  }

  const cleaned = path.trim();
  showNote(
    `📋 Path detected: "${cleaned}". ` +
    `Browsers cannot open local paths directly. ` +
    `Click "Choose Folder" and navigate to that location on your device.`,
    false
  );

  // Reveal the clipboard path row so the user can see/edit the path
  clipboardRow.hidden = false;
  clipboardPath.value = cleaned;
  clipboardPath.focus();

  // Scroll to the import-actions so the folder button is visible
  document.querySelector('.import-actions').scrollIntoView({ behavior: 'smooth' });
}

async function readClipboardText() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // Permission denied or not available
  }
  return '';
}

/* ─────────────────────────────────────────────────────────────────────────
   Import: Drag-and-drop (files and directories)
───────────────────────────────────────────────────────────────────────── */

/**
 * Recursively read a FileSystemDirectoryEntry and collect audio File objects.
 * Returns { files, failedCount } where failedCount counts unreadable entries.
 */
async function readDirectory(entry) {
  const reader = entry.createReader();
  const files = [];
  let failedCount = 0;

  async function readBatch() {
    const entries = await new Promise(resolve => reader.readEntries(resolve));
    if (entries.length === 0) return;
    for (const e of entries) {
      if (e.isFile) {
        const file = await new Promise((resolve, reject) => e.file(resolve, reject))
          .catch(() => null);
        if (file === null) {
          failedCount++;
        } else if (isAudioFile(file.name)) {
          files.push(file);
        }
      } else if (e.isDirectory) {
        const sub = await readDirectory(e);
        files.push(...sub.files);
        failedCount += sub.failedCount;
      }
    }
    await readBatch(); // Chrome returns ≤100 entries per call
  }

  await readBatch();
  return { files, failedCount };
}

async function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const items = e.dataTransfer.items;
  if (!items) {
    // Fallback: plain FileList
    addFiles(e.dataTransfer.files);
    return;
  }

  const allFiles = [];
  const promises = [];
  let failedCount = 0;

  for (const item of items) {
    const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
    if (!entry) continue;

    if (entry.isDirectory) {
      promises.push(
        readDirectory(entry).then(result => {
          allFiles.push(...result.files);
          failedCount += result.failedCount;
        })
      );
    } else if (entry.isFile) {
      promises.push(
        new Promise((resolve, reject) => entry.file(f => { allFiles.push(f); resolve(); }, reject))
          .catch(() => { failedCount++; })
      );
    }
  }

  await Promise.all(promises);
  if (allFiles.length > 0) {
    addFiles(allFiles);
    if (failedCount > 0) {
      showNote(`${failedCount} file(s) could not be read and were skipped.`, true);
    }
  } else {
    // Maybe it was a text path pasted via DnD
    const text = e.dataTransfer.getData('text');
    if (text) handlePastedPath(text);
    else showNote('No audio files found in the dropped item.', true);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Event wiring
───────────────────────────────────────────────────────────────────────── */

// --- Import controls ---
folderInput.addEventListener('change', () => addFiles(folderInput.files));
filesInput .addEventListener('change', () => addFiles(filesInput.files));

pasteBtn.addEventListener('click', async () => {
  const text = await readClipboardText();
  if (text) {
    handlePastedPath(text);
  } else {
    clipboardRow.hidden = false;
    clipboardPath.value = '';
    clipboardPath.focus();
  }
});

clipboardGo.addEventListener('click', () => handlePastedPath(clipboardPath.value));
clipboardPath.addEventListener('keydown', e => {
  if (e.key === 'Enter') handlePastedPath(clipboardPath.value);
});

// --- Drop zone ---
dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', handleDrop);

// Ctrl+V on the drop-zone → treat as paste
dropZone.addEventListener('keydown', async e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    const text = await readClipboardText();
    if (text) handlePastedPath(text);
    else { clipboardRow.hidden = false; clipboardPath.focus(); }
  }
});

// Ctrl+V anywhere on the page (when not in a text field) → paste path
document.addEventListener('keydown', async e => {
  const tag = document.activeElement.tagName;
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' &&
      tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    const text = await readClipboardText();
    if (text) handlePastedPath(text);
  }
});

// --- Playback controls ---
playBtn.addEventListener('click', playOrPause);
prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.setAttribute('aria-pressed', isShuffle);
  if (isShuffle) buildShuffleOrder();
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.setAttribute('aria-pressed', isRepeat);
});

clearBtn.addEventListener('click', () => {
  tracks.forEach(t => URL.revokeObjectURL(t.url));
  tracks = [];
  currentIndex = -1;
  audio.src = '';
  trackTitle.textContent = 'No track selected';
  trackIndex.textContent = '';
  renderPlaylist();
  showNote('Playlist cleared.');
});

// --- Audio element events ---
audio.addEventListener('play',  () => { playBtn.textContent = '⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });

audio.addEventListener('timeupdate', () => {
  if (!isSeeking && audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    playNext();
  }
});

// --- Progress bar scrubbing ---
progressBar.addEventListener('mousedown', () => { isSeeking = true; });
progressBar.addEventListener('input', () => {
  if (audio.duration) {
    currentTimeEl.textContent = formatTime((progressBar.value / 100) * audio.duration);
  }
});
progressBar.addEventListener('change', () => {
  if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration;
  isSeeking = false;
});

// --- Volume ---
volumeBar.addEventListener('input', () => { audio.volume = volumeBar.value; });

// --- Keyboard shortcuts (spacebar = play/pause, arrows = next/prev) ---
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === ' ') { e.preventDefault(); playOrPause(); }
  if (e.key === 'ArrowRight') playNext();
  if (e.key === 'ArrowLeft')  playPrev();
});

/* ─────────────────────────────────────────────────────────────────────────
   Initial render
───────────────────────────────────────────────────────────────────────── */
renderPlaylist();
