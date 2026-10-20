# M1 3차 수정 — 마지막 다듬기 (Button ACCEPT 86 · Dialog 84 · Select 83, 통과선 85)

작업 폴더 `/Users/iron/Project/psw/aing-ui`. 커밋·푸시 금지. `cli/`·`npm/`은 건드리지 마라. `.codex/config.toml`(fast 모드 끔) 바꾸지 마라. 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 끝까지.

## 먼저 읽을 것
`.verify/advisor/dialog/r3/REPORT.md`, `.verify/advisor/select/r3/REPORT.md`, `.verify/advisor/button/r3/REPORT.md`(ACCEPT 후 권고), 각 r3 폴더의 증거(json·compare.png), `docs/ROADMAP.md` 결정 기록, `.verify/REPORT-M1-fix2.md`.
Button은 이미 통과했다 — **Button 점수를 떨어뜨리는 변경 금지**(회귀 확인 필수).

## Dialog (84 → 목표 ≥ 88)
1. 열 때마다 콘솔 warning("already open Dialog as a modal") — React showModal과 네이티브 command 이중 열기. **여는 경로 하나로**(비제어면 네이티브 command, 상태는 toggle/close 이벤트로 동기화 — 또는 반대로 React만). 회귀 테스트: 두 판 × 1440·375 열기 후 console warning 0.
2. Tailwind판 easing: opacity·display·overlay는 ease-out, translate·scale만 spring(CSS판과 같은 속성별 분리). 닫힘 시간·backdrop 페이드가 CSS판과 같아야 함(프레임 비교로 확인).
3. 640px 이하 시트 safe-area: `padding-bottom: max(24px, env(safe-area-inset-bottom) + 16px)` 두 판.
4. 문서 WebMCP 표 보강(AlertDialogAction 확정 도구 consequential, 한글 라벨 기본 이름 open_dialog/close_dialog, destructive 트리거면 열기도 consequential, destructiveHint는 네이티브로 안 감 각주).
5. m1-fixture AlertDialog를 AlertDialogAction/AlertDialogCancel로. core: AlertDialog의 **열기** 도구는 consequential을 상속하지 않고, **확정(Action)** 도구가 consequential.
6. 낮음: `[@media(width<=640px)]:` 반복 → Tailwind v4 `@custom-variant` 하나(레지스트리 css로 전달), 도구 설명의 제목·라벨 중복 정리, CSS판 `.aing-dialog-x:focus-visible`을 복사 파일 CSS에 포함, Tailwind판 backdrop/진입 상태가 `platform-tailwind.css`(transform)와 복사 파일(translate·scale)로 갈라진 숨은 결합 해소.
7. **보안 일관성**: `useWebMCPTool`로 앱이 직접 등록한 도구도 열린 modal dialog·inert 바깥이면 해제·실행 거부(같은 core 경로). 의도적으로 모달 위에서도 살아야 하는 도구는 명시 옵션(`allowWhileModal`)으로만. 단위 테스트 추가.

## Select (83 → 목표 ≥ 88)
1. 옵션 hover 강조: 마우스만 쓸 때도 포인터 아래 한 줄이 칠해지고, 키보드 이동 후 hover하면 강조가 한 줄만(포인터 우선) — 예: `option:hover{background:var(--muted)}` + `:has(option:hover) option:focus-visible:not(:hover){background:transparent}`, 두 판. 회귀 테스트 두 경우.
2. 트리거 세로 정렬: 글자·chevron·스피너 중심 차 ≤ 0.5px(픽셀 측정, 2x 캡처) — 두 판, 44px 높이 유지.
3. 스피너 주기 두 판 통일, 쓰지 않는 `--aing-spinner` 토큰 정리(제거 또는 사용).
4. `SelectLabel` className 정리, core select.tsx 100자 초과 줄 정리.
5. 낮음: 문서 WebMCP 표의 "기본 이름"을 toolName 없을 때 실제 값으로, loading을 `aria-disabled` 방식으로 바꿔 Tab 가능·aria-busy 노출 검토(바꾸면 변경 차단 보장), 데모 옵션 이모지 정렬.

## Button 권고(회귀 없이)
1. `packages/core/src/webmcp.ts` 등 core 소스 100자 포맷(최대 513자 줄 존재). 크기는 minify 후 gzip이라 영향 없어야 함 — `pnpm size`로 확인.
2. 한글만 있는 라벨 도구 이름 `click_button`/`_2` → 버튼의 `name`·`value`·폼·aria 정보로 의미 있는 ASCII 이름, 없으면 지금처럼 하되 문서에 `toolName` 권장 명시.
3. invalid 상태에 `aria-invalid` 링(destructive 20%) 추가, 두 판.
4. 전환 시간 두 판 통일.

## 예산
core 기반 6모듈 합계 ≤ 6000B(지금 5999). 이번 변경으로 넘으면 **포맷 정리가 아니라 로직 중복 제거로** 줄여라. 넘길 수밖에 없으면 멈추고 근거와 함께 보고(예산 재설계는 코디네이터 판단).

## 끝내기 전에
`pnpm gate`, `pnpm size`, `cargo test`(영향 확인만). 각 컴포넌트 새 compare·상태 크롭 → `.verify/fix3/<name>/`. 보고서 `.verify/REPORT-M1-fix3.md`에 r3 항목 번호별 처리. worker_done 요약 세 문장. 판정은 어드바이저가 한다.
