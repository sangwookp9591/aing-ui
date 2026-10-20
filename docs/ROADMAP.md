# aing-ui 로드맵

마지막 수정 2026-10-20. 근거 자료: `.verify/research-shadcn.md`, `.verify/research-shadcn-weaknesses.md`, `.verify/research-platform-guide.md`(작성 중 — 나오면 §3·§4 수치를 갱신).

## 0. 한 줄 정의

**브라우저가 원래 가진 기능 위에 만든, 복사해 쓰는 React 컴포넌트.** 사람이 누르는 동작은 그대로 AI 에이전트의 도구(WebMCP)가 된다.
shadcn처럼 코드를 내 것으로 가져가되, 무거운 외부 라이브러리 대신 플랫폼과 몇 KB짜리 자체 엔진(aing core)을 쓴다.

## 결정 기록 (2026-10-20, 사용자)

- **개발자 문서가 있어야 한다.** 문서 사이트에 컴포넌트 갤러리와 별도로 `/guide` 섹션: 시작하기(설치 3분), CLI 레퍼런스(`aing init·add·sync·size·check·mcp`), MCP 연결(클라이언트별 설정), 테마·토큰(순수 CSS·Tailwind), `@aing/core` API 레퍼런스(모듈별 함수·타입·예제 — TSDoc에서 생성), React 통합(서버 컴포넌트·`<AingTool>` 섬·React Compiler), WebMCP 가이드(도구 이름·스키마·hint·보안), 접근성·브라우저 지원표, shadcn에서 옮겨 오기, 변형 기여 가이드(디자인 규칙·품질 게이트), 변경 기록. 문서의 코드 예제는 테스트로 실제 실행해 깨지지 않게 한다.
- **MCP로 바로 연결해 쓸 수 있어야 한다.** `aing mcp`(Rust CLI 내장, stdio) — Claude Code·Cursor·Codex 등 MCP 클라이언트에 한 줄 설정으로 붙는다. 도구: `list_categories`, `search_components`(이름·태그·별칭, 대소문자 무시), `get_component`(코드·props·변형·WebMCP 도구·크기), `get_variants`, `add_component`(프로젝트에 파일 쓰기, 의존 core 설치), `get_usage`. 원격(HTTP) MCP 엔드포인트는 문서 사이트 배포 시 추가. MCP 서버도 G9 설치 게이트처럼 계약 테스트를 통과해야 한다.
- **WebMCP 기본 켜짐 + 똑똑하게**(어드바이저의 'Button 기본 끔' 제안 대신 사용자 선택): 동작(onClick·submit·onValueChange 등)과 접근 가능한 이름이 있는 컴포넌트만 등록, disabled·loading·hidden이면 자동 해제, destructive·되돌리기 어려운 동작은 consequentialHint 자동 true. 데모에서 `webmcp={false}`를 일일이 붙일 필요가 없어야 한다.
- **복사 코드 줄 수는 '한 줄 ≤ 100자' 포맷 기준으로 센다.** 줄을 합쳐 줄 수를 맞추는 것은 규칙 위반(G6에서 prettier printWidth 100 포맷 후 측정).
- **행동은 core, 모양은 복사 파일**(2026-10-20 2차 검수): 컴포넌트 행동(Dialog 열고 닫기·Select 탐색 등)은 `@aing/core/<component>` 하위 모듈로 두고 CSS판·Tailwind판은 모양만 가진다(두 판 로직 중복 금지). §3.2의 6개 기반 모듈 합계 ≤ 6KB 예산은 그대로, 컴포넌트 행동 모듈은 각 컴포넌트의 'core 포함' 크기와 G6 컴포넌트 예산에 합산.
- **모달이 열리면 그 바깥(inert) 도구는 등록 해제 + 실행 시 재검사 거부**(보안): 사람이 못 누르는 것은 에이전트도 못 누른다.
- **WebMCP 도구 이름은 읽히게**: 한글 라벨을 \u 이스케이프하지 않는다. `toolName` > 라벨의 ASCII 부분 > 컴포넌트 의미 이름(예: choose_region) 순, 의미는 description과 enum 설명에.
- **shadcn을 내세우지 않는다.** 설치·Agent 프롬프트·MCP 설정의 기본은 aing 자체 도구(`npx aing add`, `aing` MCP). shadcn CLI 호환은 각주. Rust CLI를 P0로 올려 M1 직후 착수.

- **React 19 이상**(`peerDependencies: react >=19`). ref-as-prop이 18.3에서 깨짐을 실측. ViewTransition은 19.3 stable.
- **브라우저: 점진적 향상.** 기능·접근성은 Chrome·Firefox·Safari 최신 2개 버전에서 동일. 애니메이션은 지원 브라우저에서만(Firefox 닫힘 애니메이션·anchor 미끄러짐 없음 → 즉시 전환). 이를 위한 JS 폴백은 넣지 않는다.
- **WebMCP × 서버 컴포넌트: 클라이언트 섬.** 정적 컴포넌트 본체는 서버 컴포넌트(JS 0)로 두고, 옆에 붙는 `<AingTool>` 섬(수백 B)이 클라이언트에서 도구를 등록한다. 기본 켜짐 유지. 섬은 `useSyncExternalStore`로 등록 상태를 공유해 같은 페이지에 여러 개여도 코어 한 벌만 로드.
- **Rust 최신 stable**(rustup), TS 파싱은 최신 oxc.
- `@types/react`에 없는 `command`·`commandfor`·`interestfor`·input `switch`는 aing core가 모듈 보강(d.ts)으로 제공. `showPopover({ source })`로 열어 앵커를 잡는다(없으면 (0,0)에 뜸).
- shadcn CLI 4.22.1: `cssVars` 키에 `--`를 붙이지 않는다(`var(----x)` 버그).

## 1. 원칙 (충돌하면 위가 이긴다)

1. **예뻐야 한다.** 동작해도 밋밋하면 출시하지 않는다(`docs/QUALITY-GATE.md`).
2. **플랫폼 먼저.** 브라우저에 있는 기능은 다시 만들지 않는다. 없을 때만 aing core가 채운다.
3. **가볍게.** 크기 예산을 넘으면 빌드가 실패한다.
4. **복사하는 코드는 짧고, 설치 후 추가 설정이 없다.**
5. **React 최신을 따른다.** React 19.3(2026-10 latest) 기준, 서버 컴포넌트로 쓸 수 있는 건 `'use client'`를 붙이지 않는다.
6. **사람과 에이전트가 같은 코드 경로를 쓴다.** 모든 컴포넌트가 WebMCP 도구를 기본 등록한다.

## 2. 개발 우선순위

| 순위 | 무엇 | 왜 먼저인가 |
|---|---|---|
| **P0** | aing core + 기준 컴포넌트 3종(Button, Dialog, Select)이 모든 테스트 게이트 통과 | 나머지 전부가 이 구조를 복제한다. 여기서 틀리면 33개를 다시 고친다 |
| **P0** | 품질 게이트(어드바이저·크기·접근성·호환 테스트) 자동화 | 게이트 없이 만들면 지난 두 번처럼 "0점"이 나온다 |
| **P1** | 기존 33종을 플랫폼 기반으로 전환(Radix·motion 제거) | 지금 Skeleton 46KB·Select 84KB gzip — 가볍다고 말할 수 없는 상태 |
| **P1** | 문서 v2: 카테고리 + 변형 + 스타일 편집 패널 + 복사(코드·Agent·MCP·페이지) | 사용자가 처음 보는 면 |
| **P0** | Rust CLI `aing`(init·add·size·check, 다음에 sync) — **설치는 처음부터 우리 도구로.** 문서·Agent 프롬프트·홈의 설치 안내는 `npx aing add <name>`이 기본이고, shadcn은 '이미 shadcn을 쓰는 프로젝트용 호환' 각주로만 둔다 | shadcn 최대 불만 "업데이트 동기화"(#790)를 푸는 수단 |
| **P2** | shadcn에 없는 요청 상위 컴포넌트: 멀티셀렉트(#66 👍220), 시간 선택(#255 👍239), 파일 업로드(#163 👍188), 캘린더(토론 #3214 추천 268), 타임라인(#949 👍173) | 근거 있는 차별점 |
| **P3** | 나머지 요청 컴포넌트(리치 텍스트, 스테퍼, 색 선택, 트리, 태그 입력, 칸반…), 블록·템플릿 | 핵심이 안정된 뒤 |

## 3. 코어 아키텍처

```
L4  도구        aing CLI (Rust 단일 바이너리) — init · add · sync · build · size · check
                 레지스트리 JSON은 shadcn CLI와 호환
L3  컴포넌트     registry/aing/ui/*.tsx  ← 사용자가 복사해 가는 파일 (짧게)
L2  React 연결   @aing/core/react — 훅 몇 개 (useWebMCPTool, useControllable, useAnchor, useDismiss…)
L1  aing core   @aing/core — 프레임워크 무관 DOM 함수, 의존성 0
L0  플랫폼       <dialog> · Popover API · CSS anchor · <details> · <input> · @starting-style · WAAPI
```

### 3.1 왜 이렇게 나누나
- **core는 npm 패키지, 컴포넌트는 복사.** 버그가 나는 곳(포커스·위치·WebMCP)은 `npm update`로 고쳐지고, 모양을 바꾸는 곳(컴포넌트)은 내 파일로 남는다. shadcn은 둘 다 복사라 고칠 때마다 덮어쓰기 위험이 있다.
- **L1은 React를 모른다.** 순수 DOM 함수라 나중에 Web Components·Vue·Svelte 래퍼를 같은 core 위에 얹을 수 있다. 테스트도 React 없이 된다.
- **L2는 얇게.** L1 함수를 React 생명주기(마운트·언마운트·StrictMode 이중 실행)에 연결만 한다.

### 3.2 aing core 모듈 (각각 따로 import, 부작용 없음, import 시 window 접근 금지)

| 모듈 | 하는 일 | 플랫폼이 이미 하는 것(다시 안 만듦) | 예산(gzip) |
|---|---|---|---|
| `focus` | 포커스 가두기·되돌리기(모달 아닌 곳), roving tabindex, typeahead | `<dialog>` 모달의 포커스 가두기·Esc | ≤ 1.0KB |
| `position` | CSS anchor 미지원 브라우저용 위치 계산 폴백, 화면 밖 뒤집기 | anchor 지원 브라우저는 CSS만 | ≤ 1.5KB |
| `dismiss` | 바깥 클릭·Esc 스택(중첩 레이어 순서) | popover="auto"의 light dismiss | ≤ 0.6KB |
| `motion` | 스프링 → CSS `linear()` 곡선 생성, WAAPI 재생·중단, reduced-motion | CSS transition·@starting-style | ≤ 1.2KB |
| `webmcp` | 도구 등록·해제(AbortSignal), 이름 slug·충돌 접미사, 스키마 검증, 네이티브(`document.modelContext`)·개발 폴백 연결, 호출 기록 | — | ≤ 1.5KB |
| `id` / `live` | SSR 안전 id, 스크린리더 알림 영역 | `useId` | ≤ 0.3KB |
| **합계** | | | **≤ 6KB** (전부 써도) |

### 3.3 컴포넌트 작성 규칙
- 파일 하나 = 컴포넌트 하나. 복사 코드 **≤ 120줄**(복합 컴포넌트 ≤ 250줄).
- import는 React, `@aing/core`, `./utils`뿐. 아이콘은 인라인 SVG(아이콘 패키지 의존 없음).
- 스타일 두 갈래: **순수 CSS**(`@layer aing` + CSS 변수, Tailwind 없이 동작) 기본, **Tailwind v4** 판 선택.
- 서버 컴포넌트 가능 여부를 카탈로그에 표시. 상호작용이 없으면 `'use client'` 금지.
- WebMCP 기본 켜짐, `webmcp={false}`로 끔. 이름은 접근 가능한 라벨에서.

## 4. 테스트 게이트 (전부 통과해야 병합)

| 게이트 | 도구 | 통과 기준 |
|---|---|---|
| G1 단위 | node:test (core는 DOM 없이 + happy-dom) | core 핵심 경로 분기 100%, 실패·해제·중단 경로 포함 |
| G2 브라우저 동작 | Playwright: Chromium·Firefox·WebKit 최신 | 컴포넌트별 시나리오 전부 통과(열기·닫기·키보드·폼 제출) |
| G3 접근성 | axe-core + WAI-ARIA APG 키보드 표 | axe 위반 0, APG 패턴의 키 조작 전부, 포커스 링 하나 |
| G4 시각 회귀 | 스크린샷 1440·375·다크, 변형마다 | 승인된 기준 이미지와 차이 임계값 이하 |
| G5 모션 | Playwright + 프레임 시간 | reduced-motion이면 즉시, **Chromium에서** 주요 상호작용 프레임 p90 ≤ 20ms, 애니메이션 중 레이아웃 이동 0. **WebKit·Firefox는 절대값 대신 같은 실행의 빈 HTML 기준선 대비 p90 증가 ≤ 5ms**(자동화 WebKit은 빈 페이지에서도 p90 58ms — 2026-10-20 M1 실측, 절대값으론 컴포넌트 비용을 못 잼). WebKit은 layout-shift 관측 미지원이라 그 항목은 Chromium 결과로 대신하고 '미측정'으로 표기. **프레임 시간 판정은 하드웨어 GPU에서**(headed Chromium + GPU 또는 Ego Lite) — 자동화 Chromium은 SwiftShader 소프트웨어 렌더링이라 backdrop blur가 과장된다(2026-10-20 실측: SwiftShader Dialog 열기 p90 33.3ms vs Apple M5 Metal 17.6ms). 소프트웨어 렌더링 결과는 참고값으로만 기록 |
| G6 크기 | `aing size` (CI) | §3.2 모듈 예산, 컴포넌트 자체 코드: 단순 ≤ 1KB · 오버레이 ≤ 3KB · 복합 ≤ 6KB (gzip, React 제외) |
| G7 호환 | 소비 앱 매트릭스 | React 19.3 · 19.0 / Next 16(RSC) · Vite · React Router 7 / StrictMode / React Compiler 켬 — 빌드·tsc·하이드레이션 경고 0 |
| G8 WebMCP 계약 | 단위 + Ego Lite 네이티브 | 이름 ASCII ≤128·고유, 스키마 유효, 언마운트 시 해제, 네이티브 `executeTool`로 UI 변화 확인 |
| G9 설치 | 새 앱에 `aing add` / `shadcn add` | 추가 설정 없이 빌드·tsc 통과 |
| G10 디자인 | **aing 어드바이저** (`docs/QUALITY-GATE.md`) | 85점 이상 + 차단 항목 0 → ACCEPT |

## 5. 최종 결과물 (v1.0의 정의)

1. **`@aing/core`** npm 패키지 — 의존성 0, 모듈별 import, 전체 ≤ 6KB gzip, 타입 포함.
2. **레지스트리** — 카테고리 ≥ 20개, 변형 ≥ 100개(카테고리당 평균 5), 각 변형이 G1–G10 통과. 순수 CSS판·Tailwind판.
3. **문서 사이트** — 카테고리 → 변형 카드(실시간 미리보기) → 상세(스타일 편집 패널, 코드·Agent 프롬프트·MCP 설정·페이지 복사, 크기·줄 수·접근성 배지, WebMCP 도구 표). 375px 넘침 0, Lighthouse 성능·접근성 ≥ 95.
4. **`aing` CLI** — macOS·Linux·Windows 바이너리를 npm으로 배포(`npx aing add button`), init·add·sync(3방향 병합)·size·check.
5. **"왜 aing-ui인가" 페이지** — 측정값으로만 비교(같은 기능의 shadcn 컴포넌트 gzip, 의존성 수, 설치 후 설정 단계 수).
6. **공개 벤치마크** — 컴포넌트별 크기·상호작용 프레임 시간을 CI가 매 릴리스 갱신.

## 6. 마일스톤

| M | 이름 | 완료 조건(전부 충족) | 담당 배치(제안) |
|---|---|---|---|
| **M0** | 기준 세우기 | 이 로드맵·디자인 규칙·품질 게이트·어드바이저 확정, 플랫폼 가이드 반영, 디자인 토큰(순수 CSS) | Claude Opus (판단) |
| **M1** | core + 기준 3종 | `@aing/core` 6모듈 + Button·Dialog·Select가 G1–G10 전부 통과, CI 연결 | Codex Sol/high ×1 → 어드바이저 |
| **M2** | 33종 전환 | 기존 33종 플랫폼 기반 재작성, G1–G10 통과, Radix·motion·lucide 의존 0 | Codex Sol/high ×3 병렬(그룹별) |
| **M3** | 문서 v2 + **개발자 문서(/guide)** | **보기 두 가지: 전체 컴포넌트 보기 + 종류별 보기**(종류 그리드 — 각 종류 카드에 대표 미리보기·변형 수 → 종류 페이지에 그 종류의 다양한 디자인 변형 갤러리. 예: Button 종류 = 기본·글로우 테두리·시머·그라데이션·자석·길게 눌러 확인·로딩·아이콘·분할·복사·소셜 로그인 …), 카테고리·변형·스타일 편집 패널·복사 4종, 배지, 375px, **태그 + 태그 검색**(변형마다 태그 여러 개 — 용도·스타일·기능·상태 축, 21st.dev처럼 사이드바 태그 필터·⌘K 검색에서 태그로 찾기, 태그별 URL `?tag=`. 검색은 대소문자·띄어쓰기·하이픈 무시(`Button`·`button`·`BUTTON` 모두 Button 카테고리와 그 변형 전부, `radio group`=`radio-group`), 카테고리 이름·변형 이름·태그·별칭(한글 포함: `버튼`→Button)을 함께 찾는다) | Codex Sol/high ×1 (M2와 병렬 가능) |
| **M2′** | CLI + MCP (M2와 병렬, 순서 앞당김) | `aing` init·add·size·check·**mcp**(MCP 서버, Claude Code·Cursor에서 실제 연결해 검색→설치까지 확인), npm 배포 파이프라인, shadcn JSON 호환 | Codex Sol/high ×1 (Rust) |
| **M5** | 변형 확장 | 카테고리 20 × 변형 평균 5(Button·Input·Card·AI Chat처럼 많이 쓰는 종류는 10개 이상), 각 변형 어드바이저 ACCEPT | Codex 병렬 + 어드바이저 |
| **M6** | 빈자리 컴포넌트 | 멀티셀렉트·시간 선택·파일 업로드·캘린더·타임라인 | Codex Sol/high |
| **M7** | v1.0 | `aing sync`, 벤치마크 공개, "왜 aing-ui" 페이지, 배포 | 전원 |

각 마일스톤 끝에 코디네이터(Claude)가 Ego Lite로 직접 판정하고 사용자에게 화면과 수치를 보여 준 뒤 다음으로 넘어간다.

## 7. 정직하게 남는 위험

- 자체 구현 접근성이 Radix 수준에 못 미칠 위험 → G3 + 릴리스마다 VoiceOver·NVDA 수동 점검표.
- Firefox·Safari의 anchor·customizable select 미지원 → `position` 폴백·네이티브 select 폴백, G2에서 세 엔진 모두 검사.
- Drawer 스와이프·날짜·차트는 자체 구현이 가장 어렵다 → M6 이후로 미루고 범위를 좁게.
- WebMCP는 아직 초안(Chrome·Edge origin trial) → 개발 폴백 유지, 명세 변경 시 core `webmcp`만 고치면 되게 격리.
