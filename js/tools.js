// ═══════════════════════════════════════════════════
//  tools.js — Slab Dock 디자인 대응 버전
//
//  변경 사항:
//    - applyVisual: .tbtn[id^="t-"] → .dBtn[id^="t-"]
//    - setColor: #color-tray .cdot → #dock-colors .cdot
//    - setStroke: #color-tray .sbtn → #dock-strokes .swbtn
//    - showColorBar / hideColorBar: Slab Dock은 항상 노출이므로 스텁 유지
// ═══════════════════════════════════════════════════

import {
  tool, pendingTool,
  setToolState, setColorState, setSwState, setPendingTool,
} from './state.js';
import { deselectAll }                     from './selection.js';
import { closeCtx }                        from './contextMenu.js';
import { closePenPanel, togglePenPanel }   from './penPanel.js';
import { showColorBar, hideColorBar, isDrawTool } from './toolbar.js';
import { bridgeNotifyToolChanged }         from './toolBridge.js';

// 터치에서도 즉시 적용되는 도구 (pendingTool 경유 안 함)
const DIRECT_TOOLS = new Set(['pan', 'select', 'edit']);

const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ── 내부 상태 적용 ──
function applyInternal(t) {
  setToolState(t);
  document.body.setAttribute('data-tool', t);
}

// ── 시각적 활성화 표시 ──
function applyVisual(t) {
  // ★ 변경: .tbtn[id^="t-"] → .dBtn[id^="t-"]
  // Slab Dock의 버튼은 모두 .dBtn 클래스 사용
  document.querySelectorAll('.dBtn[id^="t-"]').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('t-' + t);
  if (btn) btn.classList.add('active');
}

// ── 도구 전환 ──
export function setTool(t) {
  const prev = tool;

  if (isTouch() && !DIRECT_TOOLS.has(t)) {
    // 터치: pendingTool 예약 → 실제 도구는 tap 후 활성화
    setPendingTool(t);
    applyVisual(t);
    applyInternal('pan');
    bridgeNotifyToolChanged(t);
    closeCtx();
    closePenPanel();
    if (isDrawTool(t)) showColorBar(); else hideColorBar();
    return;
  }

  // 데스크탑: 즉시 전환
  setPendingTool(null);
  applyInternal(t);
  applyVisual(t);
  bridgeNotifyToolChanged(t);

  if (t !== 'select' && t !== 'edit') deselectAll();

  // 편집 모드 탈출 시 포커스 해제
  if (prev === 'edit' && t !== 'edit') {
    const active = document.activeElement;
    if (
      active &&
      (active.isContentEditable ||
       active.tagName === 'TEXTAREA' ||
       active.tagName === 'INPUT')
    ) {
      active.blur();
    }
  }

  closeCtx();
  closePenPanel();
  if (isDrawTool(t)) showColorBar(); else hideColorBar();
}

// ── pendingTool 활성화 (터치 tap 후 호출) ──
export function activatePending() {
  if (!pendingTool) return false;
  applyInternal(pendingTool);
  if (pendingTool !== 'select' && pendingTool !== 'edit') deselectAll();
  closeCtx();
  closePenPanel();
  if (isDrawTool(pendingTool)) showColorBar(); else hideColorBar();
  return true;
}

// ── pan 상태로 되돌리기 ──
export function revertToPan() {
  if (!pendingTool) return;
  applyInternal('pan');
}

// ── 도구 or 패널 토글 (펜/형광펜/지우개 재클릭 시) ──
export function setToolOrPanel(t) {
  if (isTouch() && pendingTool === t) {
    // 터치: 이미 같은 도구 선택 → 펜 설정 패널 토글
    togglePenPanel(t);
    return;
  }
  if (tool === t) {
    // 데스크탑: 같은 도구 재클릭 → 패널 토글
    togglePenPanel(t);
  } else {
    setTool(t);
  }
}

// ── 색상 선택 ──
export function setColor(el) {
  // ★ 변경: #color-tray .cdot → #dock-colors .cdot
  document.querySelectorAll('#dock-colors .cdot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
  setColorState(el.dataset.c);
}

// ── 선 굵기 선택 ──
export function setStroke(el, v) {
  // ★ 변경: #color-tray .sbtn → #dock-strokes .swbtn
  document.querySelectorAll('#dock-strokes .swbtn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  setSwState(v);
}
