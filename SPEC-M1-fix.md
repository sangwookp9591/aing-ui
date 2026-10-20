# M1 수정 — 어드바이저 반려 반영 (Button·Dialog·Select)

작업 폴더 `/Users/iron/Project/psw/aing-ui`. 커밋·푸시 금지. **`cli/`·`npm/`은 다른 작업자가 작업 중이니 건드리지 마라.** 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 끝까지.

## 먼저 읽을 것
- 어드바이저 보고서 3개 — **고칠 목록을 빠짐없이 전부 처리**:
  `.verify/advisor/button/REPORT.md`(REJECT 68), `.verify/advisor/dialog/REPORT.md`(REVISE 74), `.verify/advisor/select/REPORT.md`(REJECT 70)
  각 폴더의 `compare.png`(21st.dev 추천 상위와 나란히 비교)를 이미지로 열어 무엇이 밀리는지 직접 본다.
- `docs/ROADMAP.md` 결정 기록(특히 새로 추가된 두 항목), `docs/DESIGN-RULES.md`, `docs/QUALITY-GATE.md`(차단 항목 추가됨), `SPEC-M1-core.md`, `.verify/REPORT-M1.md`.

**기준선: 21st.dev 같은 종류 추천 상위와 동등 이상. 원칙: 1차적으로 예뻐야 한다.**

## 결정 사항 (사용자)
1. **WebMCP 기본 켜짐 + 똑똑하게** — 어드바이저의 Button 8번("기본 끔")은 **따르지 않는다.** 대신: 동작(onClick·type=submit·onValueChange·open 제어 등)과 접근 가능한 이름이 있을 때만 등록, disabled·loading·hidden(display:none 또는 언마운트)이면 자동 해제, `variant="destructive"`·Alert의 확정 동작은 `consequentialHint: true` 자동. 데모에서 `webmcp={false}`를 일일이 붙일 필요가 없어야 하고, 같은 화면의 여러 버튼이 이름으로 구분돼야 한다. core `webmcp`/`react` 쪽 공용 로직으로 구현(컴포넌트마다 복제 금지), core 예산 유지.
2. **줄 수는 한 줄 ≤ 100자 포맷 기준.** prettier(printWidth 100)로 포맷한 뒤 센다. 줄 압축 금지. `pnpm size`가 포맷 후 줄 수를 보고하게. 한도(단순 120·복합 250)는 그대로.
3. **Tailwind판은 진짜 Tailwind판**: 모양을 유틸리티 클래스로 표현하고, 별도 CSS는 플랫폼 의사 요소(::backdrop, ::picker, @starting-style 등)처럼 유틸리티로 못 쓰는 것만. 그게 불가능하면 Tailwind판을 없애고 하나로 합친 뒤 근거를 보고서에.

## 특히 확인할 것 (보고서 요약)
- Button: 시각 높이 sm 32·default 36·lg 40·icon 36×36(44px 터치는 ::before), loading ≠ disabled(원래 색 + 스피너 + 라벨, aria-disabled, 포커스 유지), secondary hover 변화, link는 밑줄만, 포커스 링 대비 3:1 이상·두 판 동일, 마운트 진입 애니메이션 제거, hover는 `@media (hover:hover)`, outline 테두리 `--border`.
- Dialog: 퇴장 시 gap 튐 수정, ::backdrop 검정 계열 + blur(라이트·다크), 제목 20px + 그림자 ring, 640px 이하 하단 시트 변형, 긴 내용 header·footer 고정, Props 표 실제 API, WebMCP 설명·annotations, aria-describedby 조건부·closeLabel prop.
- Select: 콘솔 에러 원인(구분자 option) 제거, 단일 포커스 링, 열린 목록 강조 한 종류(배경)·선택은 ✓, SVG chevron, optgroup 라벨 12px muted 정렬, placeholder 처리, 열림 비침 원인 확인·수정, open/onOpenChange 정직하게, 아이템 children 보존, 문서 데모 라벨(aria-label 제거, label for), loading 상태.
- 문서 사이트에 **Tailwind판을 실제로 렌더하는 미리보기**(스타일 토글)를 둬서 검수할 수 있게.

## 끝내기 전에
`pnpm gate` 재실행(G5는 ROADMAP의 새 기준 — Chromium 절대 20ms, WebKit은 빈 페이지 기준선 대비 +5ms 이하로 스크립트도 고친다), `pnpm size`(포맷 후 줄 수 포함), 각 컴포넌트 1440·375·다크·상태별 크롭과 **같은 21st 레퍼런스(각 advisor/*/refs)와 나란히 놓은 새 compare 이미지**를 `.verify/fix/<name>/`에. 보고서 `.verify/REPORT-M1-fix.md`에 어드바이저 항목 번호별로 "어떻게 고쳤는지/못 고쳤으면 왜". worker_done 요약 세 문장. 판정은 어드바이저가 다시 한다.
