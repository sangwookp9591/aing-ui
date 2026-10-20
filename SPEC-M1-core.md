# M1 — aing core + 기준 컴포넌트 3종

작업 폴더 `/Users/iron/Project/psw/aing-ui` 하나. 커밋·푸시 금지. 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 되묻지 말고 끝까지.

## 먼저 읽을 것 (전부)
1. `docs/ROADMAP.md` — 특히 "결정 기록", §3 아키텍처, §4 테스트 게이트. **이 문서가 기준이다.**
2. `docs/DESIGN-RULES.md`, `docs/QUALITY-GATE.md`
3. `.verify/research-platform-guide.md` — 기능별 브라우저 지원·React 19 코드·폴백·접근성(실측 메모 포함: `showPopover({source})`, `cssVars` 키에 `--` 금지, 모듈 보강 필요 속성, 앵커 폴백 516B·command 폴리필 485B 시안)
4. `.verify/research-shadcn-weaknesses.md`, `.verify/research-shadcn.md`
5. 현재 구현(`registry/aing/**`, `lib/catalog/**`, `components/**`) — 지금 모든 컴포넌트가 `motion` 전체를 import해 Skeleton 46KB·Select 84KB gzip이다.

**사용자 원칙:** "1차적으로 예뻐야 한다", "엄청 가볍고 빨라야 한다, shadcn보다 나아야 한다", "네이티브(플랫폼)에 가장 가깝게, 필요하면 자체 엔진", "복사하는 코드와 컴파일은 최소로".

## 만들 것

### A. `@aing/core` (pnpm workspace 패키지 `packages/core`)
- ROADMAP §3.2의 6모듈: `focus`, `position`, `dismiss`, `motion`, `webmcp`, `id`/`live`. 각각 subpath export(`@aing/core/focus` …), `sideEffects: false`, import 시 window 접근 금지(SSR 안전), 의존성 0, TS 소스 + d.ts.
- `@aing/core/react`: 얇은 훅(`useWebMCPTool`, `useControllable`, `useAnchor`, `useDismiss`, `useFocusTrap` 등 필요한 만큼) + **`<AingTool>` 클라이언트 섬**(서버 컴포넌트 옆에 붙어 도구를 등록, 수백 B). 같은 페이지에 섬이 여러 개여도 코어 한 벌.
- `motion`: 스프링 파라미터 → CSS `linear()` 문자열 생성(빌드 시 상수로 써도 되게 순수 함수), WAAPI 재생·취소, reduced-motion. JS 스프링 런타임 루프 금지.
- `webmcp`: 기존 `registry/aing/lib/webmcp.ts`의 검증된 동작(AbortSignal 해제, 최신 콜백 ref, 이름 slug·충돌 접미사, 네이티브 `document.modelContext`/`navigator.modelContext` + 개발 폴백, 호출 로그, 네이티브 `getTools`/`executeTool`/`ontoolchange` 대응)을 프레임워크 무관 core로 옮긴다.
- 타입 보강 d.ts: `command`, `commandfor`, `interestfor`, `closedby`, input `switch`.
- 크기 예산(ROADMAP §3.2)을 **측정 스크립트로 강제**: `pnpm size`(esbuild + gzip, React 제외)가 예산 초과 시 exit 1. (M4에서 Rust `aing size`로 대체 예정 — 지금은 TS 스크립트로.)

### B. 기준 컴포넌트 3종 — 플랫폼 기반 재작성
Radix·motion·lucide 의존 0. 기존 API(shadcn 호환 이름·variant·size)는 유지.
- **Button**: `<button>`, variant `default|secondary|outline|ghost|destructive|link`, size `sm|default|lg|icon`, loading(스피너 교차), asChild 대체는 `render` prop 또는 Slot 없이 지원하는 방법을 가이드에 따라 결정하고 근거를 보고서에. press 스프링은 CSS `linear()`.
- **Dialog**: `<dialog>` + `showModal`, `closedby`, `command`/`commandfor`(폴리필은 미지원 브라우저에서만 지연 로드), `::backdrop`, `@starting-style` 진입·퇴장, 포커스 복귀. AlertDialog 변형 포함.
- **Select**: 가이드의 판단대로 — customizable select(`appearance: base-select`) 지원 브라우저는 네이티브, 미지원은 네이티브 `<select>` 그대로(점진적 향상) 또는 Popover 기반 listbox 중 근거로 선택. 키보드·typeahead·폼 제출·`name` 동작.
- 각 컴포넌트: **순수 CSS판**(`@layer aing`, CSS 변수 — Tailwind 없이 동작)과 **Tailwind v4판** 두 갈래. 레지스트리 item 각각. 복사 코드 ≤ 120줄.
- 서버 컴포넌트 가능 여부: Button은 상호작용 콜백이 있으면 client — 정적 사용은 서버에서도 렌더되게 설계 가능한지 판단해 보고. WebMCP는 섬 또는 훅.
- `DESIGN-RULES.md` §4의 상태 전부, §5 모션 규칙. Host Grotesk 기준.

### C. 테스트 게이트 인프라 (ROADMAP §4)
- G1 단위: core 모듈 node:test(+ happy-dom 또는 linkedom). 핵심 경로 분기 전부.
- G2·G3·G5: Playwright **chromium·firefox·webkit**(`pnpm exec playwright install` 허용). 3종 시나리오, axe-core(`@axe-core/playwright` devDependency 허용), APG 키보드 표, reduced-motion, 프레임 시간 p90.
- G4: 1440·375·다크 스크린샷 기준 이미지 생성 + 비교 스크립트.
- G6: `pnpm size`.
- G7: `.verify/compat/`에 소비 앱 3개 — Next 16(RSC, 서버 컴포넌트에서 Button 정적 렌더), Vite + React 19.3, React Router 최신 — 각각 3종 설치(레지스트리 JSON으로) → build·tsc·하이드레이션 경고 0. React Compiler 켠 빌드 1회.
- G8: WebMCP 계약 테스트 + Ego Lite 네이티브 `executeTool`(가능하면; `ego-browser skill` 먼저 읽기) 1회 이상.
- G9: 새 앱에 `shadcn add <url>` 설치 후 추가 설정 없이 build.
- `pnpm gate` 한 명령으로 G1–G9 실행, 결과 요약 표 출력. `.github/workflows/gate.yml` 작성(실행은 안 해도 됨).

### D. 기존 것 정리
- 기존 33종은 이번에 고치지 않는다(M2). 단 Button·Dialog·Select의 기존 구현은 새 것으로 교체하고 데모·카탈로그·문서가 새 것을 쓰게.
- 문서 사이트의 기존 기능(복사 메뉴, Agent 패널, 네이티브 도구 목록)이 깨지지 않게.

## 끝내기 전에 (직접)
`pnpm gate` 전부 통과, `pnpm size` 결과 표, 3종의 이전/이후 gzip 비교표(이전: Button 52.5KB, Select 83.9KB, Dialog 63.6KB), 1440·375·다크 스크린샷과 상태별 크롭, 모션 전·중·후 크롭. 결과 `.verify/REPORT-M1.md`. 실패는 실패로 적는다. worker_done 요약 세 문장. 디자인 판정은 코디네이터가 어드바이저로 따로 한다.
