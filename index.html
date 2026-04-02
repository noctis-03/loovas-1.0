<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#0f0e0d">
  <title>∞ Canvas 0.02</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="style.css">
</head>
<body data-tool="select">

<!-- ══ 배경 그리드 ══ -->
<div id="grid"></div>

<!-- ══ 뷰포트 ══ -->
<canvas id="preview-canvas"></canvas>
<div id="sel-rect"></div>
<div id="edit-mode-border"></div>
<div id="edit-mode-badge">편집 모드</div>

<div id="viewport">
  <div id="board">
    <svg id="svg-layer"></svg>
    <svg id="svg-overlay"></svg>
  </div>
</div>

<!-- ══ 상단 HUD ══ -->
<header id="hud">
  <div id="hud-left">
    <div id="logo-mark">∞</div>
    <span id="hud-title">Canvas</span>
  </div>
  <div id="hud-center">
    <button class="hud-btn" id="t-undo" data-tip="실행취소 Ctrl+Z" data-action="undo">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 5H10C12.2 5 14 6.8 14 9C14 11.2 12.2 13 10 13H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M5.5 2.5L3 5L5.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="hud-btn" id="t-redo" data-tip="다시실행 Ctrl+⇧Z" data-action="redo">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13 5H6C3.8 5 2 6.8 2 9C2 11.2 3.8 13 6 13H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M10.5 2.5L13 5L10.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <div id="hud-right">
    <button class="hud-btn" id="zoom-pill" data-tip="줌 리셋">100%</button>
    <button class="hud-btn" data-tip="그리드" data-action="toggleGrid">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 5.5H15M1 10.5H15M5.5 1V15M10.5 1V15" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="hud-btn" data-tip="저장 Ctrl+S" data-action="save">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>
        <path d="M5 2V6H11V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="4" y="9" width="8" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
      </svg>
    </button>
    <button class="hud-btn" data-tip="불러오기" data-action="load">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 9V12C2 13.1 2.9 14 4 14H12C13.1 14 14 13.1 14 12V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M8 2V10M5 7L8 10L11 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</header>

<!-- ══ 컨텍스트 메뉴 ══ -->
<div id="ctx">
  <div class="citem" data-action="front">
    <span class="citem-icon">↑</span> 맨 앞으로
  </div>
  <div class="citem" data-action="back">
    <span class="citem-icon">↓</span> 맨 뒤로
  </div>
  <div class="cdiv"></div>
  <div class="citem" data-action="dup">
    <span class="citem-icon">⊞</span> 복제
  </div>
  <div class="cdiv"></div>
  <div class="citem danger" data-action="del">
    <span class="citem-icon">✕</span> 삭제
  </div>
</div>

<!-- ══ 스낵바 ══ -->
<div id="snack"></div>

<!-- ══ 미니맵 ══ -->
<canvas id="minimap" width="130" height="84"></canvas>

<!-- ══ SLAB DOCK ══ -->
<nav id="slab-dock">

  <!-- 상단: 모드 그룹 -->
  <div class="dock-group" id="dock-modes">
    <button class="dbtn active" id="t-select" data-tip="선택  V" data-tool="select">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 2L3 14L6.5 11L8.5 16L10 15.5L8 10.5L12 10.5L3 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="dBtn" id="t-edit" data-tip="편집  D" data-tool="edit">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M12 3L15 6L6 15H3V12L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M10.5 4.5L13.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="dBtn" id="t-pan" data-tip="이동  H" data-tool="pan">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2V5M9 13V16M2 9H5M13 9H16M4.5 4.5L6.5 6.5M11.5 11.5L13.5 13.5M4.5 13.5L6.5 11.5M11.5 6.5L13.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="dock-divider"></div>

  <!-- 그리기 도구 -->
  <div class="dock-group" id="dock-draw">
    <button class="dBtn" id="t-pen" data-tip="펜  P · 재클릭→설정" data-tool-or-panel="pen">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 14L3 15L4 16L5 15L4 14Z" fill="currentColor"/>
        <path d="M5 13L13 5L15 7L7 15L4 14L5 13Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M11 7L13 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="dBtn" id="t-highlight" data-tip="형광펜  L · 재클릭→설정" data-tool-or-panel="highlight">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="6" y="3" width="6" height="9" rx="3" stroke="currentColor" stroke-width="1.4"/>
        <path d="M9 12V16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M7 14.5H11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="dBtn" id="t-eraser" data-tip="지우개  E · 재클릭→설정" data-tool-or-panel="eraser">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15 15H8L4 11L9 6L15 12" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M4 11L8 15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="dock-divider"></div>

  <!-- 도형 -->
  <div class="dock-group" id="dock-shapes">
    <button class="dBtn" id="t-rect" data-tip="사각형  R" data-tool="rect">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4.5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </button>
    <button class="dBtn" id="t-circle" data-tip="원  C" data-tool="circle">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </button>
    <button class="dBtn" id="t-arrow" data-tip="화살표  A" data-tool="arrow">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 9H14.5M10.5 5L14.5 9L10.5 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="dBtn" id="t-text" data-tip="텍스트  T" data-tool="text">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 4.5H15M9 4.5V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6.5 14.5H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="dock-divider"></div>

  <!-- 오브젝트 추가 -->
  <div class="dock-group" id="dock-objects">
    <button class="dBtn" data-tip="포스트잇  S" data-action="addSticky">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 3H12L15 6V15H3V3Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M12 3V6H15" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M6 9H12M6 12H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="dBtn" data-tip="카드창  W" data-action="addCard">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2.5" stroke="currentColor" stroke-width="1.4"/>
        <path d="M2 6.5H16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="5" cy="4.5" r="0.8" fill="currentColor"/>
        <circle cx="8" cy="4.5" r="0.8" fill="currentColor"/>
      </svg>
    </button>
    <button class="dBtn" data-tip="이미지" data-action="addImage">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/>
        <circle cx="6.5" cy="8" r="1.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M2 12.5L5.5 9.5L8.5 12.5L11.5 9L16 13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <div class="dock-divider"></div>

  <!-- 색상 팔레트 (수직) -->
  <div class="dock-group" id="dock-colors">
    <div class="cdot active" style="--c:#1a1714" data-c="#1a1714"></div>
    <div class="cdot" style="--c:#e05a3a" data-c="#e05a3a"></div>
    <div class="cdot" style="--c:#2e7dd1" data-c="#2e7dd1"></div>
    <div class="cdot" style="--c:#2ea06a" data-c="#2ea06a"></div>
    <div class="cdot" style="--c:#9b44c8" data-c="#9b44c8"></div>
    <div class="cdot" style="--c:#e8a320" data-c="#e8a320"></div>
  </div>

  <div class="dock-divider"></div>

  <!-- 굵기 -->
  <div class="dock-group" id="dock-strokes">
    <button class="swbtn active" data-sw="2">
      <div class="swline" style="height:2px"></div>
    </button>
    <button class="swbtn" data-sw="5">
      <div class="swline" style="height:4px"></div>
    </button>
    <button class="swbtn" data-sw="10">
      <div class="swline" style="height:7px"></div>
    </button>
  </div>

</nav>

<!-- ══ 펜 설정 패널 ══ -->
<div id="pen-panel">
  <div class="pp-title">
    <span id="pp-title-txt">펜 설정</span>
    <button class="pp-x" id="pp-close-btn">✕</button>
  </div>
  <div class="pp-sect">
    <div class="pp-lbl">안정화 (smoothing)</div>
    <div class="pp-row">
      <input type="range" id="pp-smooth" min="0" max="20" step="1" value="0">
      <span class="pp-num" id="pp-smooth-v">0</span>
    </div>
    <div class="pp-chips" id="pp-sc">
      <button class="pp-chip pp-on" data-smooth="0">없음</button>
      <button class="pp-chip" data-smooth="5">약간</button>
      <button class="pp-chip" data-smooth="10">보통</button>
      <button class="pp-chip" data-smooth="18">강함</button>
    </div>
  </div>
  <div class="pp-sect">
    <div class="pp-lbl">불투명도</div>
    <div class="pp-row">
      <input type="range" id="pp-opacity" min="5" max="100" step="5" value="100">
      <span class="pp-num" id="pp-opacity-v">100%</span>
    </div>
  </div>
  <div class="pp-sect" id="pp-cap-sect">
    <div class="pp-lbl">선 끝 모양</div>
    <div class="pp-caps">
      <button class="pp-cap pp-on" data-cap="round">
        <svg width="30" height="10"><line x1="5" y1="5" x2="25" y2="5" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>
        <span>둥글게</span>
      </button>
      <button class="pp-cap" data-cap="square">
        <svg width="30" height="10"><line x1="5" y1="5" x2="25" y2="5" stroke="currentColor" stroke-width="5" stroke-linecap="square"/></svg>
        <span>각지게</span>
      </button>
      <button class="pp-cap" data-cap="butt">
        <svg width="30" height="10"><line x1="7" y1="5" x2="23" y2="5" stroke="currentColor" stroke-width="5" stroke-linecap="butt"/></svg>
        <span>짧게</span>
      </button>
    </div>
  </div>
  <div class="pp-sect" id="pp-pressure-sect">
    <div class="pp-lbl">끝 처리 (taper)</div>
    <div class="pp-chips" id="pp-pc">
      <button class="pp-chip pp-on" data-pressure="none">없음</button>
      <button class="pp-chip" data-pressure="start">시작</button>
      <button class="pp-chip" data-pressure="end">끝</button>
      <button class="pp-chip" data-pressure="both">양쪽</button>
    </div>
  </div>
  <div class="pp-sect">
    <div class="pp-lbl">미리보기</div>
    <div id="pp-preview-wrap">
      <svg id="pp-preview-svg" viewBox="0 0 200 42" preserveAspectRatio="none">
        <path id="pp-preview-path"
          d="M10,30 Q30,10 50,22 Q70,34 90,18 Q110,8 130,22 Q150,34 170,16 Q185,8 192,14"
          fill="none" stroke="#e8e4db" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</div>

<!-- ══ 저장 다이얼로그 ══ -->
<div id="save-overlay">
  <div id="save-dialog">
    <div class="save-dialog-title">저장</div>
    <div class="save-dialog-body">
      <div class="save-dialog-desc">저장 방법을 선택하세요.</div>
      <div class="save-input-row">
        <label class="save-label" for="save-filename">파일 이름</label>
        <input type="text" id="save-filename" class="save-input" placeholder="canvas">
      </div>
    </div>
    <div class="save-dialog-actions">
      <button class="save-btn save-btn-secondary" id="save-cancel-btn">취소</button>
      <button class="save-btn save-btn-primary" id="save-as-btn">다른 이름으로</button>
      <button class="save-btn save-btn-accent" id="save-quick-btn">저장</button>
    </div>
  </div>
</div>

<!-- ══ Tool Orb (터치) ══ -->
<!-- JS가 동적으로 생성 -->

<input type="file" id="img-in"  accept="image/*" style="display:none">
<input type="file" id="load-in" style="display:none">

<script type="module" src="js/main.js"></script>
</body>
</html>
