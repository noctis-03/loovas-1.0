// ═══════════════════════════════════════════════════
//  main.js — 애플리케이션 진입점 (FIXED)
// ═══════════════════════════════════════════════════

import { initDomRefs } from './state.js';
import { resetView, toggleGrid } from './transform.js';
import { initLayout } from './layout.js';
import { setTool, setToolOrPanel, setColor, setStroke, activatePending, revertToPan } from './tools.js';
import { initPenPanel } from './penPanel.js';
import { initMouseEvents } from './mouse.js';
import { initTouchEvents } from './touch.js';
import { initKeyboard } from './keyboard.js';
import { initContextMenu } from './contextMenu.js';
import { initImageInput } from './image.js';
import { initPersistence, saveBoard, clearAll, autoSave, persistence, restoreBoard } from './persistence.js';
import { addSticky } from './sticky.js';
import { addCardWindow } from './card.js';
import { createStartupWindow } from './startup.js';
import { mkSvg, setAttrs } from './svg.js';
import { initToolbar, updateSatellitePositions } from './toolbar.js';
import { initHistory, undo, redo } from './history.js';
import { initToolOrb, notifyToolChanged } from './toolOrb.js';
import { registerToolFunctions, registerNotifyToolChanged } from './toolBridge.js';

persistence._svg = { mkSvg, setAttrs };

function init() {
  initDomRefs();

  registerToolFunctions(setTool, activatePending, revertToPan);
  registerNotifyToolChanged(notifyToolChanged);

  initLayout();
  initPenPanel();
  initMouseEvents();
  initTouchEvents();
  initKeyboard();
  initContextMenu();
  initImageInput();
  initPersistence();
  initToolbar();
  requestAnimationFrame(() => updateSatellitePositions());
  initToolOrb();

  // 줌 리셋
  document.getElementById('zoom-pill').addEventListener('click', resetView);

  // ✅ FIX: '#toolbar', '#mode-bar' → '[data-tool]' (전체 DOM에서 탐색)
  // Slab Dock의 버튼들은 #slab-dock 안에 있으므로 범위를 제한하지 않음
  document.querySelectorAll('[data-tool]').forEach(btn => {
    // 중복 바인딩 방지
    if (btn.dataset.toolBound) return;
    btn.dataset.toolBound = '1';
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  // ✅ FIX: '#toolbar [data-tool-or-panel]' → '[data-tool-or-panel]'
  document.querySelectorAll('[data-tool-or-panel]').forEach(btn => {
    if (btn.dataset.toolOrPanelBound) return;
    btn.dataset.toolOrPanelBound = '1';
    btn.addEventListener('click', () => setToolOrPanel(btn.dataset.toolOrPanel));
  });

  // 액션 버튼
  const actions = {
    addSticky:   () => addSticky(),
    addCard:     () => addCardWindow(),
    addImage:    () => document.getElementById('img-in').click(),
    toggleGrid:  () => toggleGrid(),
    save:        () => saveBoard(),
    load:        () => document.getElementById('load-in').click(),
    clearAll:    () => clearAll(),
    undo:        () => undo(),
    redo:        () => redo(),
  };
  document.querySelectorAll('[data-action]').forEach(btn => {
    const fn = actions[btn.dataset.action];
    if (fn) btn.addEventListener('click', fn);
  });

  // 색상 선택 — Slab Dock의 .cdot
  document.querySelectorAll('#dock-colors .cdot').forEach(el => {
    el.addEventListener('click', () => setColor(el));
  });

  // 선 굵기 선택 — Slab Dock의 .swbtn
  document.querySelectorAll('#dock-strokes .swbtn').forEach(el => {
    el.addEventListener('click', () => setStroke(el, parseInt(el.dataset.sw)));
  });

  // ✅ FIX: 자동저장 복원
  let hasAutosave = false;
  try {
    const saved = localStorage.getItem('canvas-autosave');
    if (saved) {
      const data = JSON.parse(saved);
      if ((data.elements && data.elements.length > 0) || (data.strokes && data.strokes.length > 0)) {
        restoreBoard(data);
        hasAutosave = true;
      }
    }
  } catch (e) { /* ignore */ }

  if (!hasAutosave) {
    createStartupWindow();
  }

  setTimeout(() => initHistory(), 100);

  console.log('∞ Canvas 0.02 — loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
