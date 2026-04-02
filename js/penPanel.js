// ═══════════════════════════════════════════════════
//  penPanel.js — Slab Dock 디자인 대응 버전
//
//  변경 사항:
//    - positionPenPanel: #toolbar BoundingRect 기준 제거
//      → 버튼(#t-pen 등) BoundingRect 기준으로 단순화
//    - 데스크탑: 버튼 오른쪽에 패널 표시
//    - 모바일 셸프: 버튼 위로 패널 표시
//    - pp-preview-path 기본 stroke 색상: 다크 테마(#e8e4db) 유지
// ═══════════════════════════════════════════════════

import { penCfg, penPanelOpen, setPenPanelOpen, tool, color, sw } from './state.js';
import { pts2path, buildTaperOutlinePath } from './svg.js';

export function togglePenPanel(t) {
  if (penPanelOpen) { closePenPanel(); return; }
  openPenPanel(t);
}

export function openPenPanel(t) {
  const pp = document.getElementById('pen-panel');

  // 제목
  const titles = {
    pen:       '펜 설정',
    highlight: '형광펜 설정',
    eraser:    '지우개 설정',
  };
  document.getElementById('pp-title-txt').textContent = titles[t] || '설정';

  // 지우개일 때 불필요한 섹션 숨김
  const isEraser = (t === 'eraser');
  document.getElementById('pp-smooth').closest('.pp-sect').style.display    = isEraser ? 'none' : '';
  document.getElementById('pp-opacity').closest('.pp-sect').style.display   = isEraser ? 'none' : '';
  document.getElementById('pp-cap-sect').style.display                      = isEraser ? 'none' : '';
  document.getElementById('pp-pressure-sect').style.display                 = isEraser ? 'none' : '';
  document.querySelector('#pp-preview-wrap').parentElement.style.display    = isEraser ? 'none' : '';

  // 현재 값 반영
  document.getElementById('pp-smooth').value           = penCfg.smooth;
  document.getElementById('pp-smooth-v').textContent   = penCfg.smooth;
  document.getElementById('pp-opacity').value          = penCfg.opacity;
  document.getElementById('pp-opacity-v').textContent  = penCfg.opacity + '%';

  document.querySelectorAll('.pp-cap').forEach(c =>
    c.classList.toggle('pp-on', c.dataset.cap === penCfg.cap)
  );
  document.querySelectorAll('#pp-pc .pp-chip').forEach(c =>
    c.classList.toggle('pp-on', c.dataset.pressure === penCfg.pressure)
  );

  // 위치 계산 후 표시
  positionPenPanel(t);
  pp.style.display = 'flex';
  requestAnimationFrame(() => pp.classList.add('pp-open'));
  setPenPanelOpen(true);
  updatePPPreview();
}

export function closePenPanel() {
  const pp = document.getElementById('pen-panel');
  pp.classList.remove('pp-open');
  setPenPanelOpen(false);
  setTimeout(() => {
    if (!penPanelOpen) pp.style.display = 'none';
  }, 160);
}

// ── 패널 위치 계산 ──
function positionPenPanel(t) {
  const pp  = document.getElementById('pen-panel');
  const btn = document.getElementById('t-' + t);
  if (!btn) return;

  const br   = btn.getBoundingClientRect();
  const ppW  = 228;
  const ppH  = 420;
  const isMobile = window.innerWidth <= 767;

  let x, y;

  if (isMobile) {
    // 모바일 셸프: 패널을 버튼 바로 위로
    x = br.left + br.width / 2 - ppW / 2;
    y = br.top - ppH - 10;

    // 화면 위로 넘어가면 버튼 아래로 내림 (극단적 케이스 방어)
    if (y < 8) y = br.bottom + 10;
    x = Math.max(8, Math.min(x, window.innerWidth - ppW - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - ppH - 8));
  } else {
    // 데스크탑 독: 버튼 오른쪽에, 수직 중앙 정렬
    x = br.right + 10;
    y = br.top + br.height / 2 - ppH / 2;

    // 화면 오른쪽 초과 방어
    if (x + ppW > window.innerWidth - 8) x = br.left - ppW - 10;
    x = Math.max(8, x);
    y = Math.max(8, Math.min(y, window.innerHeight - ppH - 8));
  }

  pp.style.left = x + 'px';
  pp.style.top  = y + 'px';
  // CSS의 left 고정 override 해제
  pp.style.removeProperty('transform');
}

// ── 슬라이더/칩 변경 핸들러 ──
export function onPPChange() {
  penCfg.smooth  = parseInt(document.getElementById('pp-smooth').value);
  penCfg.opacity = parseInt(document.getElementById('pp-opacity').value);
  document.getElementById('pp-smooth-v').textContent  = penCfg.smooth;
  document.getElementById('pp-opacity-v').textContent = penCfg.opacity + '%';

  const chips   = [...document.querySelectorAll('#pp-sc .pp-chip')];
  const presets = [0, 5, 10, 18];
  chips.forEach((c, i) => c.classList.toggle('pp-on', presets[i] === penCfg.smooth));

  updatePPPreview();
}

export function setPPSmooth(v, el) {
  document.querySelectorAll('#pp-sc .pp-chip').forEach(c => c.classList.remove('pp-on'));
  el.classList.add('pp-on');
  penCfg.smooth = v;
  document.getElementById('pp-smooth').value          = v;
  document.getElementById('pp-smooth-v').textContent  = v;
  updatePPPreview();
}

export function setPPCap(el) {
  document.querySelectorAll('.pp-cap').forEach(c => c.classList.remove('pp-on'));
  el.classList.add('pp-on');
  penCfg.cap = el.dataset.cap;
  updatePPPreview();
}

export function setPPPressure(el) {
  document.querySelectorAll('#pp-pc .pp-chip').forEach(c => c.classList.remove('pp-on'));
  el.classList.add('pp-on');
  penCfg.pressure = el.dataset.pressure;
  updatePPPreview();
}

// ── 미리보기 SVG 업데이트 ──
export function updatePPPreview() {
  const p = document.getElementById('pp-preview-path');
  if (!p) return;

  const demoPts = [
    { x: 10,  y: 30 }, { x: 30,  y: 10 }, { x: 50,  y: 22 },
    { x: 70,  y: 34 }, { x: 90,  y: 18 }, { x: 110, y: 8  },
    { x: 130, y: 22 }, { x: 150, y: 34 }, { x: 170, y: 16 },
    { x: 192, y: 14 },
  ];

  const baseW   = (tool === 'highlight') ? sw * 4 : sw;
  // 다크 테마: 현재 선택 색상 그대로 사용, highlight는 반투명
  const col     = (tool === 'highlight') ? color + '99' : color;
  const opacity = penCfg.opacity / 100;

  if (penCfg.pressure && penCfg.pressure !== 'none') {
    p.setAttribute('d',            buildTaperOutlinePath(demoPts, Math.max(2, baseW), penCfg.pressure));
    p.setAttribute('fill',         col);
    p.setAttribute('fill-opacity', opacity);
    p.setAttribute('stroke',       'none');
    p.removeAttribute('stroke-opacity');
    p.removeAttribute('stroke-width');
    p.removeAttribute('stroke-linecap');
  } else {
    p.setAttribute('stroke',         col);
    p.setAttribute('stroke-opacity', opacity);
    p.setAttribute('stroke-linecap', penCfg.cap);
    p.setAttribute('stroke-linejoin','round');
    p.setAttribute('stroke-width',   Math.max(1, baseW));
    p.setAttribute('fill',           'none');
    p.removeAttribute('fill-opacity');
    p.setAttribute('d',              pts2path(demoPts));
  }
}

// ── 초기화 ──
export function initPenPanel() {
  document.getElementById('pp-close-btn').addEventListener('click', closePenPanel);
  document.getElementById('pp-smooth').addEventListener('input', onPPChange);
  document.getElementById('pp-opacity').addEventListener('input', onPPChange);

  document.querySelectorAll('#pp-sc .pp-chip').forEach(el => {
    el.addEventListener('click', () => setPPSmooth(parseInt(el.dataset.smooth), el));
  });
  document.querySelectorAll('.pp-cap').forEach(el => {
    el.addEventListener('click', () => setPPCap(el));
  });
  document.querySelectorAll('#pp-pc .pp-chip').forEach(el => {
    el.addEventListener('click', () => setPPPressure(el));
  });
}
