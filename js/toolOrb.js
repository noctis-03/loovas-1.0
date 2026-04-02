// ═══════════════════════════════════════════════════
//  toolOrb.js — Slab Dock 디자인 대응 버전 (v5.0)
//
//  변경 사항:
//    - 셀렉터: #tb-tools .tbtn → #slab-dock .dBtn
//    - 툴바 확대 클래스: toolbar#tb-orb-zoom → #slab-dock.tb-orb-zoom
//    - 색상: #color-tray .cdot → #dock-colors .cdot
//    - 굵기: #color-tray .sbtn → #dock-strokes .swbtn
//    - highlightColorBar: ct-visible 제거 (독은 항상 표시)
//    - orbFollowLoop: 순간이동 조건에 거리 임계값 추가 (v4.3 버그 수정)
//    - previewToolHighlight: 모바일 셸프 수평 스크롤 대응
//    - LABEL_MAP: SVG 아이콘 대신 텍스트 심볼 유지 (Orb 내부)
// ═══════════════════════════════════════════════════

import { tool, pendingTool } from './state.js';
import { bridgeSetTool, bridgeActivatePending, bridgeRevertToPan } from './toolBridge.js';

// ── 설정 ──
const NO_ORB_TOOLS       = new Set(['text', 'edit', 'pan', 'select']);
const ORB_SIZE            = 48;
const SPAWN_OFFSET_X      = -40;
const SPAWN_OFFSET_Y      = -50;
const DRAG_THRESH         = 28;
const DIR_LOCK_DIST       = 14;
const LONGPRESS_MS        = 400;
const TAP_TIME_THRESH     = 280;
const COLOR_DRAG_THRESH   = 60;
const STROKE_DRAG_THRESH  = 60;

// Orb ↔ 터치 포인트 간 원형 경계
const ORB_MIN_DIST        = 80;
const ORB_MAX_DIST        = 180;
const ORB_FOLLOW_SPEED    = 0.12;
const ORB_PUSH_SPEED      = 0.4;

// ★ 수정: 순간이동 조건 — 오른쪽 AND 거리 < 이 값 일 때만
const TELEPORT_TRIGGER_DIST = ORB_MIN_DIST * 1.5; // 120px
const TELEPORT_OFFSET_X     = -40;
const TELEPORT_OFFSET_Y     = -50;

// 더블탭
const DOUBLE_TAP_INTERVAL = 350;
let lastTapTime           = 0;
let toolBeforeEraser      = null;

// 터치 추적
let lastTouchX    = -9999;
let lastTouchY    = -9999;
let orbFollowRAF  = null;

// ── FSM ──
const State = Object.freeze({
  HIDDEN:     'hidden',
  SHOWN:      'shown',
  HOLD:       'hold',
  RELOCATING: 'relocating',
  TOOL_DRAG:  'toolDrag',
});

let fsm = State.HIDDEN;
let ctx = {};

// ── 도구 순서 캐시 ──
let toolOrderCache = null;

function getToolOrder() {
  if (toolOrderCache) return toolOrderCache;
  // ★ 변경: #tb-tools .tbtn → #slab-dock .dBtn
  const btns = document.querySelectorAll(
    '#slab-dock .dBtn[data-tool], #slab-dock .dBtn[data-tool-or-panel]'
  );
  const order = [];
  btns.forEach(btn => {
    const t = btn.dataset.tool || btn.dataset.toolOrPanel;
    if (t && !order.includes(t) && !NO_ORB_TOOLS.has(t)) order.push(t);
  });
  toolOrderCache = order;
  return order;
}

export function invalidateToolOrderCache() {
  toolOrderCache = null;
}

// ── DOM ──
let orb      = null;
let orbLabel = null;

// ── 고정 위치 ──
let orbX = -200;
let orbY = -200;

// ── 타이머 ──
let longPressTimer = null;

// ── 외부 상태 ──
let _orbLock       = false;
let _toolActivated = false;

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function isOrbVisible() {
  return fsm === State.SHOWN    ||
         fsm === State.HOLD     ||
         fsm === State.RELOCATING ||
         fsm === State.TOOL_DRAG;
}

// ═══════════════════════════════════════════════════
//  편집 모드 화면 테두리 강조
// ═══════════════════════════════════════════════════

let badgeTimer = null;

function showEditModeBorder() {
  const border = document.getElementById('edit-mode-border');
  const badge  = document.getElementById('edit-mode-badge');
  if (border) border.classList.add('active');
  if (badge) {
    badge.classList.add('active');
    if (badgeTimer) clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      badge.classList.remove('active');
      badgeTimer = null;
    }, 3000);
  }
}

function hideEditModeBorder() {
  const border = document.getElementById('edit-mode-border');
  const badge  = document.getElementById('edit-mode-badge');
  if (border) border.classList.remove('active');
  if (badge)  badge.classList.remove('active');
  if (badgeTimer) { clearTimeout(badgeTimer); badgeTimer = null; }
}

// ═══════════════════════════════════════════════════
//  Orb ↔ 터치 포인트 원형 경계 (수정된 순간이동 조건)
// ═══════════════════════════════════════════════════

export function updateTouchPosition(sx, sy) {
  lastTouchX = sx;
  lastTouchY = sy;

  if (!_toolActivated || !isOrbVisible()) return;
  if (fsm === State.HOLD || fsm === State.RELOCATING || fsm === State.TOOL_DRAG) return;

  startOrbFollow();
}

function startOrbFollow() {
  if (orbFollowRAF) return;
  orbFollowRAF = requestAnimationFrame(orbFollowLoop);
}

function stopOrbFollow() {
  if (orbFollowRAF) {
    cancelAnimationFrame(orbFollowRAF);
    orbFollowRAF = null;
  }
}

function orbFollowLoop() {
  orbFollowRAF = null;

  if (!_toolActivated || !isOrbVisible()) return;
  if (fsm === State.HOLD || fsm === State.RELOCATING || fsm === State.TOOL_DRAG) return;
  if (lastTouchX < -9000) return;

  const half = ORB_SIZE / 2;
  const dx   = orbX - lastTouchX;
  const dy   = orbY - lastTouchY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // ★ 수정: 오른쪽 AND 거리 < TELEPORT_TRIGGER_DIST(120px) 일 때만 순간이동
  // 기존(v4.3): orbX > lastTouchX 이면 거리 무관 순간이동 → 사용자가 Orb 오른쪽에
  // 위치시킨 뒤 그리기 시작하면 예기치 않게 왼쪽으로 날아가는 버그 수정
  if (orbX > lastTouchX && dist < TELEPORT_TRIGGER_DIST) {
    orbX = Math.max(half, Math.min(lastTouchX + TELEPORT_OFFSET_X, window.innerWidth  - half));
    orbY = Math.max(half, Math.min(lastTouchY + TELEPORT_OFFSET_Y, window.innerHeight - half));
    applyPosition();
    return;
  }

  let targetX   = orbX;
  let targetY   = orbY;
  let needsMove = false;

  if (dist < ORB_MIN_DIST && dist > 0.1) {
    // 너무 가까움 → 밀어냄
    const angle = Math.atan2(dy, dx);
    targetX = lastTouchX + Math.cos(angle) * ORB_MIN_DIST;
    targetY = lastTouchY + Math.sin(angle) * ORB_MIN_DIST;
    orbX += (targetX - orbX) * ORB_PUSH_SPEED;
    orbY += (targetY - orbY) * ORB_PUSH_SPEED;
    needsMove = true;
  } else if (dist > ORB_MAX_DIST) {
    // 너무 멀어짐 → 따라옴
    const angle = Math.atan2(dy, dx);
    targetX = lastTouchX + Math.cos(angle) * ORB_MAX_DIST;
    targetY = lastTouchY + Math.sin(angle) * ORB_MAX_DIST;
    orbX += (targetX - orbX) * ORB_FOLLOW_SPEED;
    orbY += (targetY - orbY) * ORB_FOLLOW_SPEED;
    needsMove = true;
  }
  // MIN ~ MAX 사이 → 정지

  if (needsMove) {
    orbX = Math.max(half, Math.min(orbX, window.innerWidth  - half));
    orbY = Math.max(half, Math.min(orbY, window.innerHeight - half));
    applyPosition();

    const remDx = targetX - orbX;
    const remDy = targetY - orbY;
    if (Math.abs(remDx) > 1 || Math.abs(remDy) > 1) {
      orbFollowRAF = requestAnimationFrame(orbFollowLoop);
    }
  }
}

// ═══════════════════════════════════════════════════
//  외부 API
// ═══════════════════════════════════════════════════

export function isOrbLocked()     { return _orbLock; }
export { _orbLock as orbLock };

export function isToolActivated() { return _toolActivated; }
export { _toolActivated as toolActivated };

export function notifyToolChanged(t) {
  updateLabel(t);

  if (NO_ORB_TOOLS.has(t)) {
    _toolActivated = false;
    if (orb) orb.classList.remove('orb-tool-active');
    hideEditModeBorder();
    stopOrbFollow();
    transition(State.HIDDEN);
    return;
  }

  if (isOrbVisible()) {
    if (orb) orb.classList.toggle('orb-tool-active', _toolActivated);
    return;
  }

  _toolActivated = false;
  if (orb) orb.classList.remove('orb-tool-active');
}

export function tryActivateByTap(tx, ty) {
  if (!pendingTool)    return false;
  if (_toolActivated)  return true;

  bridgeActivatePending();
  _toolActivated = true;
  showEditModeBorder();

  if (isOrbVisible()) {
    if (orb) orb.classList.add('orb-tool-active');
    updateLabel(pendingTool);
  } else {
    spawnOrbAt(tx + SPAWN_OFFSET_X, ty + SPAWN_OFFSET_Y);
  }

  return true;
}

export function deactivateByTap() {
  if (!_toolActivated) return;
  bridgeRevertToPan();
  _toolActivated = false;
  hideEditModeBorder();
  stopOrbFollow();
  transition(State.HIDDEN);
}

// 하위 호환 스텁
export function scheduleRevertAfterUse() { return; }
export function ensureRevertIfNeeded()   { return; }
export function resetOrbTimer()          { return; }
export function restartOrbTimer()        { return; }

// ═══════════════════════════════════════════════════
//  초기화
// ═══════════════════════════════════════════════════

export function initToolOrb() {
  if (!isTouchDevice()) return;

  orb = document.createElement('div');
  orb.id = 'tool-orb';
  orb.style.width  = ORB_SIZE + 'px';
  orb.style.height = ORB_SIZE + 'px';
  orb.setAttribute('role', 'status');
  orb.setAttribute('aria-label', '도구 선택 Orb');

  orbLabel = document.createElement('span');
  orbLabel.id = 'tool-orb-label';
  orb.appendChild(orbLabel);

  document.body.appendChild(orb);

  orb.addEventListener('pointerdown', onOrbPointerDown);
  window.addEventListener('pointermove',   onGlobalMove, true);
  window.addEventListener('pointerup',     onGlobalUp,   true);
  window.addEventListener('pointercancel', onGlobalUp,   true);

  updateLabel(tool);
}

// ═══════════════════════════════════════════════════
//  Orb 스폰
// ═══════════════════════════════════════════════════

function spawnOrbAt(x, y) {
  const half = ORB_SIZE / 2;
  orbX = Math.max(half, Math.min(x, window.innerWidth  - half));
  orbY = Math.max(half, Math.min(y, window.innerHeight - half));
  applyPosition();
  transition(State.SHOWN);
}

// ═══════════════════════════════════════════════════
//  FSM
// ═══════════════════════════════════════════════════

function transition(newState, data) {
  exitState(fsm);
  fsm = newState;
  ctx = data || {};
  enterState(fsm);
}

function exitState(s) {
  switch (s) {
    case State.HOLD:
      cancelLongPress();
      break;

    case State.TOOL_DRAG:
      _orbLock = false;
      if (orb) {
        orb.classList.remove('orb-active');
        orb.classList.remove('orb-color-mode');
        orb.classList.remove('orb-stroke-mode');
      }
      clearPreviewHighlight();
      clearColorHighlight();
      clearStrokeHighlight();
      highlightColorBar(false);
      // ★ 변경: #toolbar → #slab-dock
      const dock = document.getElementById('slab-dock');
      if (dock) dock.classList.remove('tb-orb-zoom');
      break;
  }
}

function enterState(s) {
  switch (s) {
    case State.HIDDEN:
      hideOrbNow();
      stopOrbFollow();
      if (_toolActivated) {
        bridgeRevertToPan();
        _toolActivated = false;
        hideEditModeBorder();
      }
      break;

    case State.SHOWN:
      showOrb();
      break;

    case State.HOLD:
      break;

    case State.RELOCATING:
      break;

    case State.TOOL_DRAG: {
      _orbLock = true;
      if (orb) orb.classList.add('orb-active');

      const baseTool = pendingTool || tool;
      const order    = getToolOrder();

      ctx.baseIdx            = order.indexOf(baseTool);
      if (ctx.baseIdx === -1) ctx.baseIdx = 0;
      ctx.steps              = 0;
      ctx.previewTool        = baseTool;
      ctx.colorMode          = false;
      ctx.colorBaseResolved  = false;
      ctx.colorSteps         = 0;
      ctx.previewColorIdx    = -1;
      ctx.strokeMode         = false;
      ctx.strokeBaseResolved = false;
      ctx.strokeSteps        = 0;
      ctx.previewStrokeIdx   = -1;

      updateLabel(baseTool);
      // ★ 변경: #toolbar → #slab-dock
      const dockEl = document.getElementById('slab-dock');
      if (dockEl) dockEl.classList.add('tb-orb-zoom');
      previewToolHighlight(baseTool);
      break;
    }
  }
}

// ═══════════════════════════════════════════════════
//  Orb 포인터 이벤트
// ═══════════════════════════════════════════════════

function onOrbPointerDown(e) {
  if (fsm === State.HIDDEN)    return;
  if (fsm === State.TOOL_DRAG) return;
  e.stopPropagation();
  e.preventDefault();

  try { orb.setPointerCapture(e.pointerId); } catch (_) {}

  transition(State.HOLD, {
    startX:    e.clientX,
    startY:    e.clientY,
    orbStartX: orbX,
    orbStartY: orbY,
    pointerId: e.pointerId,
    downTime:  Date.now(),
    dirLocked: false,
  });

  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    if (fsm === State.HOLD && !ctx.dirLocked) {
      transition(State.TOOL_DRAG, { startX: ctx.startX, startY: ctx.startY });
    }
  }, LONGPRESS_MS);
}

// ═══════════════════════════════════════════════════
//  전역 포인터 이벤트
// ═══════════════════════════════════════════════════

function onGlobalMove(e) {
  if (!orb) return;

  switch (fsm) {
    case State.TOOL_DRAG: {
      e.stopPropagation();
      e.preventDefault();
      handleToolDragMove(e);
      break;
    }

    case State.HOLD: {
      e.stopPropagation();
      e.preventDefault();
      const dx   = e.clientX - ctx.startX;
      const dy   = e.clientY - ctx.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!ctx.dirLocked && dist > DIR_LOCK_DIST) {
        ctx.dirLocked = true;
        cancelLongPress();

        if (Math.abs(dx) > Math.abs(dy)) {
          // 수평 드래그 → 도구 순환
          transition(State.TOOL_DRAG, { startX: ctx.startX, startY: ctx.startY });
        } else {
          // 수직 드래그 → Orb 재배치
          transition(State.RELOCATING, {
            startX:    ctx.startX,
            startY:    ctx.startY,
            orbStartX: ctx.orbStartX,
            orbStartY: ctx.orbStartY,
            pointerId: ctx.pointerId,
          });
        }
      }
      break;
    }

    case State.RELOCATING: {
      e.stopPropagation();
      e.preventDefault();
      const dx = e.clientX - ctx.startX;
      const dy = e.clientY - ctx.startY;
      orbX = ctx.orbStartX + dx;
      orbY = ctx.orbStartY + dy;

      const half = ORB_SIZE / 2;
      orbX = Math.max(half, Math.min(orbX, window.innerWidth  - half));
      orbY = Math.max(half, Math.min(orbY, window.innerHeight - half));

      applyPosition();
      break;
    }
  }
}

function onGlobalUp(e) {
  if (!orb) return;
  cancelLongPress();

  switch (fsm) {
    case State.TOOL_DRAG: {
      e.stopPropagation();
      e.preventDefault();
      finishToolDrag();
      break;
    }

    case State.HOLD: {
      try { orb.releasePointerCapture(ctx.pointerId); } catch (_) {}
      const elapsed = Date.now() - (ctx.downTime || 0);

      if (elapsed < TAP_TIME_THRESH) {
        handleOrbSingleTap();
      } else {
        transition(_toolActivated ? State.SHOWN : State.HIDDEN);
      }
      break;
    }

    case State.RELOCATING: {
      try { orb.releasePointerCapture(ctx.pointerId || e.pointerId); } catch (_) {}
      transition(_toolActivated ? State.SHOWN : State.HIDDEN);
      break;
    }
  }
}

// ═══════════════════════════════════════════════════
//  싱글탭 + 더블탭
// ═══════════════════════════════════════════════════

function handleOrbSingleTap() {
  const now         = Date.now();
  const isDoubleTap = (now - lastTapTime) < DOUBLE_TAP_INTERVAL;
  lastTapTime = now;

  if (isDoubleTap) { handleOrbDoubleTap(); return; }

  if (!pendingTool) { transition(State.HIDDEN); return; }

  if (_toolActivated) {
    // 탭 → 비활성화
    bridgeRevertToPan();
    _toolActivated = false;
    if (orb) orb.classList.remove('orb-tool-active');
    hideEditModeBorder();
    stopOrbFollow();
    updateLabel(pendingTool);
    transition(State.HIDDEN);
  } else {
    // 탭 → 활성화
    bridgeActivatePending();
    _toolActivated = true;
    if (orb) orb.classList.add('orb-tool-active');
    showEditModeBorder();
    updateLabel(pendingTool);
    transition(State.SHOWN);
  }
}

function handleOrbDoubleTap() {
  const currentPending = pendingTool;

  if (currentPending === 'eraser') {
    if (toolBeforeEraser) {
      bridgeSetTool(toolBeforeEraser);
      updateLabel(toolBeforeEraser);
      toolBeforeEraser = null;
    }
  } else {
    toolBeforeEraser = currentPending || tool;
    bridgeSetTool('eraser');
    updateLabel('eraser');
  }

  if (!_toolActivated) {
    bridgeActivatePending();
    _toolActivated = true;
    showEditModeBorder();
  }

  if (orb) orb.classList.toggle('orb-tool-active', _toolActivated);
  transition(State.SHOWN);
}

// ═══════════════════════════════════════════════════
//  도구 순환 드래그 + 색상/굵기 모드
// ═══════════════════════════════════════════════════

function handleToolDragMove(e) {
  const totalDx = e.clientX - ctx.startX;
  const totalDy = e.clientY - ctx.startY;

  // ── 굵기 모드 진입: 위로 드래그 ──
  if (!ctx.colorMode && !ctx.strokeMode && totalDy < -STROKE_DRAG_THRESH) {
    ctx.strokeMode         = true;
    ctx.strokeStartX       = e.clientX;
    ctx.strokeSteps        = 0;
    ctx.previewStrokeIdx   = -1;
    ctx.strokeBaseResolved = false;
    clearPreviewHighlight();
    if (orb) orb.classList.add('orb-stroke-mode');
    updateLabel('📏');
    highlightColorBar(true);
    return;
  }

  // ── 굵기 모드 중 ──
  if (ctx.strokeMode) {
    if (totalDy > -STROKE_DRAG_THRESH + 20) {
      // 굵기 모드 탈출
      ctx.strokeMode         = false;
      ctx.strokeBaseResolved = false;
      if (orb) orb.classList.remove('orb-stroke-mode');
      clearStrokeHighlight();
      updateLabel(ctx.previewTool || pendingTool || tool);
      if (ctx.previewTool) previewToolHighlight(ctx.previewTool);
      return;
    }
    const strokeSteps = Math.trunc((e.clientX - ctx.strokeStartX) / DRAG_THRESH);
    if (strokeSteps !== ctx.strokeSteps) {
      ctx.strokeSteps = strokeSteps;
      selectStrokeByStep(strokeSteps);
    }
    return;
  }

  // ── 색상 모드 진입: 아래로 드래그 ──
  if (!ctx.colorMode && totalDy > COLOR_DRAG_THRESH) {
    ctx.colorMode         = true;
    ctx.colorStartX       = e.clientX;
    ctx.colorSteps        = 0;
    ctx.previewColorIdx   = -1;
    ctx.colorBaseResolved = false;
    clearPreviewHighlight();
    if (orb) orb.classList.add('orb-color-mode');
    updateLabel('🎨');
    highlightColorBar(true);
    return;
  }

  // ── 색상 모드 중 ──
  if (ctx.colorMode) {
    if (totalDy < COLOR_DRAG_THRESH - 20) {
      // 색상 모드 탈출
      ctx.colorMode         = false;
      ctx.colorBaseResolved = false;
      if (orb) orb.classList.remove('orb-color-mode');
      highlightColorBar(false);
      clearColorHighlight();
      updateLabel(ctx.previewTool || pendingTool || tool);
      if (ctx.previewTool) previewToolHighlight(ctx.previewTool);
      return;
    }
    const colorSteps = Math.trunc((e.clientX - ctx.colorStartX) / DRAG_THRESH);
    if (colorSteps !== ctx.colorSteps) {
      ctx.colorSteps = colorSteps;
      selectColorByStep(colorSteps);
    }
    return;
  }

  // ── 도구 순환: 수평 드래그 ──
  const newSteps = Math.trunc(totalDx / DRAG_THRESH);
  if (newSteps !== ctx.steps) {
    ctx.steps = newSteps;
    const order   = getToolOrder();
    const idx     = Math.max(0, Math.min(ctx.baseIdx + newSteps, order.length - 1));
    const newTool = order[idx];

    if (newTool !== ctx.previewTool) {
      ctx.previewTool = newTool;
      previewToolHighlight(newTool);
      updateLabel(newTool);
      if (navigator.vibrate) navigator.vibrate(8);
    }
  }
}

function finishToolDrag() {
  const wasColorMode  = ctx.colorMode;
  const wasStrokeMode = ctx.strokeMode;
  const selectedTool  = ctx.previewTool;

  if (wasColorMode || wasStrokeMode) {
    updateLabel(pendingTool || tool);
    transition(State.SHOWN);
    return;
  }

  const isDrawing = selectedTool && !NO_ORB_TOOLS.has(selectedTool);
  if (selectedTool) bridgeSetTool(selectedTool);

  if (isDrawing) {
    bridgeActivatePending();
    _toolActivated = true;
    showEditModeBorder();
    if (orb) orb.classList.add('orb-tool-active');
    updateLabel(selectedTool);
    transition(State.SHOWN);
  } else {
    _toolActivated = false;
    hideEditModeBorder();
    stopOrbFollow();
    if (orb) orb.classList.remove('orb-tool-active');
    transition(State.HIDDEN);
  }
}

// ═══════════════════════════════════════════════════
//  굵기 선택 헬퍼
// ═══════════════════════════════════════════════════

let strokeBtns    = null;
let strokeBaseIdx = 0;

function getStrokeBtns() {
  // ★ 변경: #color-tray .sbtn → #dock-strokes .swbtn
  if (!strokeBtns) strokeBtns = [...document.querySelectorAll('#dock-strokes .swbtn')];
  return strokeBtns;
}

function selectStrokeByStep(step) {
  const btns = getStrokeBtns();
  if (btns.length === 0) return;

  if (!ctx.strokeBaseResolved) {
    ctx.strokeBaseResolved = true;
    const active = btns.findIndex(b => b.classList.contains('active'));
    strokeBaseIdx = active >= 0 ? active : 0;
  }

  const idx = Math.max(0, Math.min(strokeBaseIdx + step, btns.length - 1));
  clearStrokeHighlight();
  // ★ 변경: sbtn-orb-highlight 클래스명 유지 (CSS에 동일하게 정의)
  btns[idx].classList.add('sbtn-orb-highlight');

  if (ctx.previewStrokeIdx !== idx) {
    ctx.previewStrokeIdx = idx;
    btns[idx].click();
    if (navigator.vibrate) navigator.vibrate(8);
    if (orbLabel) orbLabel.textContent = `${btns[idx].dataset.sw}px`;
  }
}

function clearStrokeHighlight() {
  getStrokeBtns().forEach(b => b.classList.remove('sbtn-orb-highlight'));
}

// ═══════════════════════════════════════════════════
//  도구 프리뷰 하이라이트 (Ghost)
// ═══════════════════════════════════════════════════

let orbGhost = null;

function ensureGhost() {
  if (!orbGhost) {
    orbGhost = document.createElement('div');
    orbGhost.id = 'orb-preview-ghost';
    document.body.appendChild(orbGhost);
  }
  return orbGhost;
}

function previewToolHighlight(t) {
  clearPreviewHighlight();

  // ★ 변경: #tb-tools .tbtn → #slab-dock .dBtn
  const btn = document.querySelector(
    `#slab-dock .dBtn[data-tool="${t}"], #slab-dock .dBtn[data-tool-or-panel="${t}"]`
  );
  if (!btn) return;

  // 모바일 셸프(수평) 스크롤로 버튼 보이기
  const dock = document.getElementById('slab-dock');
  if (dock && window.innerWidth <= 767) {
    dock.scrollLeft = btn.offsetLeft - (dock.offsetWidth - btn.offsetWidth) / 2;
  }
  // 데스크탑 독(수직) 스크롤로 버튼 보이기
  if (dock && window.innerWidth > 767) {
    dock.scrollTop = btn.offsetTop - (dock.offsetHeight - btn.offsetHeight) / 2;
  }

  requestAnimationFrame(() => {
    const r = btn.getBoundingClientRect();
    if (r.right < 0 || r.left > window.innerWidth) return;

    const ghost = ensureGhost();
    // SVG 아이콘을 그대로 복제해 Ghost에 표시
    ghost.innerHTML   = btn.innerHTML;
    ghost.className   = 'orb-preview-ghost-active';
    ghost.style.left  = (r.left + r.width  / 2) + 'px';
    ghost.style.top   = (r.top  + r.height / 2) + 'px';
    ghost.style.width  = r.width  + 'px';
    ghost.style.height = r.height + 'px';
  });
}

function clearPreviewHighlight() {
  document.querySelectorAll('.orb-preview').forEach(b => b.classList.remove('orb-preview'));
  if (orbGhost) { orbGhost.className = ''; orbGhost.innerHTML = ''; }
}

// ═══════════════════════════════════════════════════
//  Orb 표시 / 숨김
// ═══════════════════════════════════════════════════

function showOrb() {
  if (!orb) return;
  orb.classList.add('orb-visible');
  if (_toolActivated) orb.classList.add('orb-tool-active');
  applyPosition();
}

function hideOrbNow() {
  if (!orb) return;
  orb.classList.remove('orb-visible');
  orb.classList.remove('orb-tool-active');
  orb.classList.remove('orb-color-mode');
  orb.classList.remove('orb-stroke-mode');
  clearPreviewHighlight();
  clearColorHighlight();
  clearStrokeHighlight();
  highlightColorBar(false);
  stopOrbFollow();
}

function cancelLongPress() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
}

// ═══════════════════════════════════════════════════
//  라벨 & 접근성
// ═══════════════════════════════════════════════════

const LABEL_MAP = {
  select:    '⊹',
  edit:      '✎',
  pan:       '✋',
  pen:       '✏️',
  highlight: '🖊️',
  eraser:    '◻',
  text:      'T',
  rect:      '□',
  circle:    '○',
  arrow:     '→',
};

const ARIA_MAP = {
  select:    '선택',
  edit:      '편집',
  pan:       '이동',
  pen:       '펜',
  highlight: '형광펜',
  eraser:    '지우개',
  text:      '텍스트',
  rect:      '사각형',
  circle:    '원',
  arrow:     '화살표',
};

function updateLabel(t) {
  if (!orbLabel) return;
  orbLabel.textContent = LABEL_MAP[t] || t;
  if (orb) orb.setAttribute('aria-label', `현재 도구: ${ARIA_MAP[t] || t}`);
}

// ═══════════════════════════════════════════════════
//  위치 적용
// ═══════════════════════════════════════════════════

function applyPosition() {
  if (!orb) return;
  const half = ORB_SIZE / 2;
  orb.style.transform = `translate(${orbX - half}px, ${orbY - half}px)`;
}

// ═══════════════════════════════════════════════════
//  색상 선택 헬퍼
// ═══════════════════════════════════════════════════

let colorDots    = null;
let colorBaseIdx = 0;

function getColorDots() {
  // ★ 변경: #color-tray .cdot → #dock-colors .cdot
  if (!colorDots) colorDots = [...document.querySelectorAll('#dock-colors .cdot')];
  return colorDots;
}

function selectColorByStep(step) {
  const dots = getColorDots();
  if (dots.length === 0) return;

  if (!ctx.colorBaseResolved) {
    ctx.colorBaseResolved = true;
    const active = dots.findIndex(d => d.classList.contains('active'));
    colorBaseIdx = active >= 0 ? active : 0;
  }

  const idx = Math.max(0, Math.min(colorBaseIdx + step, dots.length - 1));
  clearColorHighlight();
  dots[idx].classList.add('cdot-orb-highlight');

  if (ctx.previewColorIdx !== idx) {
    ctx.previewColorIdx = idx;
    dots[idx].click();
    if (navigator.vibrate) navigator.vibrate(8);

    if (orb && orbLabel) {
      orbLabel.style.color = dots[idx].dataset.c;
      orbLabel.textContent = '●';
    }
  }
}

function clearColorHighlight() {
  getColorDots().forEach(d => d.classList.remove('cdot-orb-highlight'));
  if (orbLabel) orbLabel.style.color = '';
}

function highlightColorBar(show) {
  // ★ 변경: ct-visible 토글 제거 (독은 항상 노출)
  // 독 전체에 강조 테두리 효과만 적용
  const dock = document.getElementById('slab-dock');
  if (!dock) return;
  if (show) dock.classList.add('cb-orb-highlight');
  else      dock.classList.remove('cb-orb-highlight');
}
