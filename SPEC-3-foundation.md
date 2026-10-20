# aing-ui — 3차 (1단계: 기반)

먼저 `SPEC.md`, `SPEC-2-design.md`, `.verify/REPORT-v2.md`를 읽는다. 1·2차의 규칙(shadcn 토큰, 레지스트리 형식, WebMCP 규약, 검증)은 유지한다.
작업 폴더 `/Users/iron/Project/psw/aing-ui` 하나. 커밋·푸시 금지. 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 끝까지 완료.

**사용자 원칙: "1차적으로 이뻐야 한다."** 예쁨이 기능보다 먼저다. 동작해도 밋밋하면 실패다.

## 사용자 피드백 (이번에 고칠 것)

1. **"애니메이션들이 다 빠져 있어."** 지금 motion 사용이 컴포넌트당 0–4곳뿐이고 등장·호버·페이지 전환이 없다.
2. **채팅 입력 포커스가 이상하다.** 사용자 스크린샷: 입력창을 누르면 두꺼운 회색 테두리가 상자 전체에 생기고, 글 입력 영역 아래에 가로선이 한 줄 더 그어진다.
   원인(코디네이터 진단): `app/globals.css`의 `:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px }`가 **레이어 밖(unlayered)** 이라 Tailwind v4 `@layer utilities`의 `outline-none`을 이긴다 → textarea 자체에 2px 외곽선 + 바깥 컨테이너 `focus-within:ring-2`가 겹친다.
   고칠 것: 전역 포커스 규칙을 `@layer base`로 옮기고, 컴포넌트 포커스는 shadcn처럼 `focus-visible:ring-[3px] ring-ring/50 border-ring` 계열의 얇고 옅은 링 하나로 통일. 채팅 입력은 컨테이너만 `focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20`, textarea는 외곽선 없음. 모든 컴포넌트에서 같은 종류의 이중 링이 없는지 확인.
3. **복사 기능이 있어야 한다**: 코드 복사, MCP 복사, Agent 프롬프트 복사 등.

## A. 애니메이션 체계

`registry/aing/lib/motion.ts`(registry:lib)에 공용 프리셋을 둔다 — 스프링(`{ type: "spring", stiffness: 400~500, damping: 30~35 }`), 짧은 ease-out(0.18–0.25s), `fadeUp`(opacity 0→1, y 6→0, blur 4px→0), stagger 헬퍼. 모든 컴포넌트가 이걸 쓴다. `useReducedMotion`이면 즉시 표시.
레퍼런스 수준 예시(Animate UI 철학: 진입보다 퇴장이 빠름, transform·opacity만, 키보드 탐색엔 애니메이션 없음):

- **기존 5종**
  - AI Chat: 새 메시지 fadeUp(사용자 말풍선은 오른쪽에서 살짝), 스트리밍 글자 부드럽게, 전송 버튼 활성화 시 scale 스프링, 전송↔정지 아이콘 교차 전환(AnimatePresence), 입력창 높이 자동 변화 부드럽게.
  - Tool Call: 상태 변화마다 레이아웃 애니메이션(`layout`), 길게 누르기 진행이 버튼 배경을 왼→오 채움, 승인 시 체크가 그려지며 카드가 trace 한 줄로 접힘(높이 스프링), 펼치기/접기 chevron 회전.
  - Progress Tracker: 단계 전환 시 연결선 채움, 체크 path 그리기(pathLength), 진행 점 pulse, 퍼센트 숫자 카운트업.
  - Card: spotlight가 커서를 부드럽게 따라옴(spring), hover 시 테두리 그라데이션 강조, 등장 fadeUp.
  - Reaction Bar: 숫자 롤링(위/아래), 이모지 pop + 작은 파티클 몇 개, 팝오버 scale-in(origin 기준).
- **문서·홈**: 홈 히어로 텍스트 단어별 blur-in, 컬렉션 카드 stagger 등장(in-view), 카드 hover 시 살짝 lift + 미리보기 확대, 탭 전환 시 밑줄/배경 pill이 `layoutId`로 미끄러짐(Preview/Code, Agent/pnpm/npm, 사이드바 활성 항목), 페이지 진입 fadeUp, 복사 버튼 아이콘 Copy→Check 교차 전환.

## B. 복사 기능 (레퍼런스: Magic UI·Animate UI·Cult UI의 "Copy page ▾", Kokonut의 Agent 탭)

문서 페이지 상단 제목 오른쪽에 **"Copy page ▾" 분할 버튼**:
- Copy page — 이 문서를 Markdown으로(설명, 설치, 사용 예, props, WebMCP 도구 표).
- Copy agent prompt — "다음 레지스트리에서 <name>을 shadcn add 하고, 이 페이지의 사용 예대로 써 줘. WebMCP 도구는 …" 같은 에이전트 지시문.
- Copy MCP config — shadcn MCP 서버에 aing 레지스트리를 붙이는 설정 JSON(`npx shadcn@4.22.1 mcp` 문서를 context7 `/shadcn-ui/ui` 또는 공식 문서로 확인해 정확한 형식으로. 확인 못 하면 보고서에 적고 가장 근접한 형식).
- Copy WebMCP tools — 이 컴포넌트가 등록하는 도구 정의(name, description, inputSchema, annotations) JSON.
- Open in ChatGPT / Open in Claude — 페이지 Markdown을 프롬프트로 연 새 탭(쿼리 길이 제한 고려해 요약 프롬프트 + 페이지 URL).
그 외:
- Code 탭과 "사용 예" 블록마다 우상단 **코드 복사** 버튼(Copy→Check 애니메이션, `aria-live`).
- 설치 블록 Agent/pnpm/npm/**MCP** 탭 각각 복사.
- 홈 히어로 설치 명령 복사.
- 복사 실패 시 텍스트 선택 폴백. 복사 성공은 작은 토스트 또는 버튼 상태로.

## C. 2단계 병렬 작업을 위한 구조 (필수)

2단계에서 작업자 3명이 동시에 각각 폼 / 오버레이 / 표시·탐색 컴포넌트 10개 안팎을 추가한다. **서로 같은 파일을 고치지 않게** 지금 구조를 바꿔 둔다.
- 레지스트리: 그룹별 파일 `registry/groups/{ai,forms,overlays,display}.json`(items 배열)을 두고, 스크립트가 합쳐 `registry.json`을 만든다(`pnpm registry:build`가 합치기 → shadcn build → 후처리). `registry.json`은 생성물.
- 문서 카탈로그: `lib/catalog/{ai,forms,overlays,display}.ts`로 나누고 `lib/catalog/index.ts`가 합친다. 문서 페이지·사이드바·홈은 카탈로그만 읽어 자동 생성(사이드바 그룹: AI / Forms / Overlays / Display & Navigation).
- 데모: `components/demos/<name>.tsx` 한 파일씩, 카탈로그가 dynamic import로 연결.
- 기존 5종을 `ai` 그룹으로 옮긴다.
- `README`에 "새 컴포넌트 추가하는 법"(그룹 파일 3곳만 고치면 된다)을 짧게.
- 2단계에서 쓸 의존성 `radix-ui`(통합 패키지, `npm view`로 버전 고정)를 지금 설치해 둔다. 쓰는 건 2단계.

## D. WebMCP 기본 켜기 (사용자 결정)

**모든 컴포넌트는 기본으로 WebMCP 도구를 등록한다**(`webmcp={false}`로 끔). 그러므로:
- `useWebMCPTool`의 이름 충돌 처리: 지금은 같은 이름이면 폴백에서 조용히 무시한다 → **자동 접미사(`_2`, `_3`)로 등록**하고, 개발 모드에서 console.warn 한 번(에러 아님).
- 도구 이름은 접근 가능한 이름(라벨, aria-label, children 텍스트)에서 slug로 만들고, 없으면 컴포넌트 접두사 + useId. description에도 라벨을 넣어 에이전트가 구분 가능하게.
- 홈의 Agent 패널/개발 폴백 목록이 도구가 많아져도 보기 좋게: 컴포넌트별 그룹 + 검색.

## 검증

1. lint, tsc, test, build, `pnpm registry:build` 통과(그룹 합치기 결과가 이전 6개 JSON과 동일 + motion lib 1개 추가).
2. 채팅 입력 포커스: 1440px에서 클릭 상태 스크린샷 → 이중 링 없음. 전 컴포넌트 포커스 상태 스크린샷 1장씩.
3. 애니메이션: 주요 상호작용 6개 이상(메시지 전송, 길게 눌러 승인, 반응 토글, 단계 진행, 탭 전환, 복사)을 **짧은 GIF/영상 또는 프레임 3장**으로 `.verify/motion/`에 남긴다.
4. 복사 메뉴의 6가지 항목이 실제 클립보드에 올바른 내용을 넣는지(브라우저 clipboard 읽기) 확인.
5. 1440/375/다크 스크린샷 `.verify/shots-v3/`, 가로 넘침·콘솔 에러 0.

## 보고

`.verify/REPORT-v3.md`(바꾼 점, 검증 결과, 실패는 실패로, 2단계 작업자에게 넘길 "컴포넌트 추가 체크리스트"). worker_done 요약 세 문장.
