// ═══════════════════════════════════════════════════
//  toolbar.js — Slab Dock 버전
//  드래그·위성 위치 로직 제거, 독 내 색상 트레이 가시성 관리
// ═══════════════════════════════════════════════════

const DRAW_TOOLS = ['pen','highlight','eraser','rect','circle','arrow','text'];

export function initToolbar() {
  // Slab Dock은 CSS 레이아웃으로 고정되므로
  // JS 위치 계산 불필요 — 이벤트 바인딩만 유지
  window.addEventListener('resize', () => updateSatellitePositions());
}

/** 하위 호환 — 호출되더라도 아무것도 안 함 */
export function updateSatellitePositions() {}

export function showColorBar() {
  // Slab Dock에서는 색상/굵기가 항상 노출됨
  // 모바일 셸프에서도 항상 표시 — 별도 토글 불필요
}
export function hideColorBar() {}
export function updateColorBarPosition() {}

export function isDrawTool(t) {
  return DRAW_TOOLS.includes(t);
}
