# aing-ui — 3차 2단계: 웹 기본 구성요소

작업자 3명이 **각자 별도 복사본 폴더**에서 동시에 일한다. 너의 폴더와 그룹은 dispatch 지시에 적혀 있다. 그 폴더 밖은 건드리지 않는다. 커밋·푸시 금지.
먼저 이 폴더의 `SPEC.md`, `SPEC-2-design.md`, `SPEC-3-foundation.md`, `.verify/REPORT-v3.md`(특히 "2단계 작업자에게 넘길 컴포넌트 추가 체크리스트")를 읽는다.
사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 되묻지 말고 끝까지.

**사용자 원칙: "1차적으로 이뻐야 한다."** 동작해도 밋밋하면 실패다. 애니메이션이 빠져도 실패다.
기준 레퍼런스: `.verify/refs/*.png`(Kokonut·Cult·Magic·Aceternity·Animate UI). 특히 **Animate UI**(animate-ui.com)가 기본 요소에 모션을 입힌 방식이 이번 작업의 기준이다 — 필요하면 `ego-browser skill`을 읽고 ego-browser로 animate-ui.com/docs 의 해당 컴포넌트를 직접 열어 인터랙션을 본다.

## 그룹별 범위

- **forms** — Button, Input, Textarea, Label, Checkbox, Radio Group, Switch, Select, Slider, Combobox
  + **공용 결함 2건도 이 작업자가 고친다(다른 작업자는 이 파일들을 건드리지 않는다):**
    1. `registry/aing/ui/ai-chat.tsx` 133행 근처: "Each child in a list should have a unique key prop … passed a child from AIChat"(motion.div) 콘솔 에러. 메시지를 입력·전송하면 Next dev 오버레이에 "1 Issue"로 뜬다.
    2. Agent 패널(`components/demo.tsx` 등)이 개발 폴백 `window.__aingTools`만 읽어서, **네이티브 WebMCP 브라우저(Ego Lite는 `document.modelContext`가 있다: `registerTool`/`getTools`/`executeTool(registeredTool, jsonString)`/`ontoolchange`)에서는 "0 tools"로 보인다.** 네이티브면 `getTools()` + `ontoolchange`로 목록을 읽고 `executeTool(tool, JSON.stringify(input))`로 실행하게 한다(결과는 JSON 문자열). 폴백과 둘 다 지원. Ego Lite에서 실제로 실행되는지 확인한다(코디네이터가 ai-chat의 send_message를 네이티브 executeTool로 실행해 성공한 것을 확인함).
- **overlays** — Dialog, Sheet, Dropdown Menu, Popover, Tooltip, Toast, Hover Card
- **display** — Tabs, Accordion, Badge, Avatar, Separator, Skeleton, Progress, Breadcrumb, Pagination, Table, Kbd

## 공통 규칙

- 접근성 바탕은 `radix-ui`(이미 설치, 통합 패키지) — shadcn과 같은 구조·같은 export 이름(`Button`, `DialogContent` 등). API는 shadcn과 호환되게(variant/size 이름 포함: button `default | secondary | outline | ghost | destructive | link`, size `sm | default | lg | icon`).
- 스타일: shadcn 토큰만, 1px 헤어라인, 반경은 `--radius` 기반, UI 글자 13–14px, 포커스는 SPEC-3의 단일 링. 팔레트 색은 작은 강조에만.
- **모션(필수, 컴포넌트마다 최소 2가지):** `registry/aing/lib/motion.ts` 프리셋을 쓴다. 예 —
  Button: press scale 0.97 스프링, loading 시 스피너 교차 전환, 아이콘 hover nudge. Checkbox: 체크 path 그리기. Radio: 점 scale 스프링. Switch: thumb 스프링 + 누르는 동안 살짝 늘어남. Select/Combobox/Dropdown/Popover/Hover Card/Tooltip: origin 기준 scale+fade+blur-in, 항목 hover 하이라이트가 `layoutId`로 미끄러짐. Slider: thumb 확대, 값 툴팁. Dialog/Sheet: 오버레이 fade + 패널 스프링(Sheet는 방향별 slide). Toast: 쌓임(stack) + 스와이프 닫기. Tabs: 활성 배경/밑줄 `layoutId`. Accordion: 높이 스프링 + chevron 회전. Progress: 채움 스프링 + indeterminate shimmer. Skeleton: shimmer. Pagination: 활성 표시 이동. Avatar: 로드 시 fade, 그룹 겹침 hover 펼침.
  퇴장은 진입보다 빠르게, transform/opacity만, reduced-motion이면 즉시.
- **WebMCP 기본 켜기**(사용자 결정): 모든 컴포넌트가 기본으로 도구를 등록, `webmcp={false}`로 끔. 의미 있는 동작만 도구로 — 예: Button `click_<label>`(consequential은 prop으로), Checkbox/Switch `set_<label>`(checked boolean), Radio/Select/Combobox `choose_<label>`(enum = 옵션), Slider `set_<label>`(min/max), Input/Textarea `fill_<label>`, Dialog/Sheet/Popover `open_/close_`, Tabs `select_<label>`, Accordion `toggle_<item>`, Toast `show_toast`, Table `read_<caption>`(readOnly), Pagination `go_to_page`. 표시 전용(Badge, Separator, Skeleton, Kbd, Label, Avatar, Breadcrumb 링크 목록 등)은 readOnly 읽기 도구 하나 또는 의미가 없으면 등록하지 않고 문서에 이유를 적는다. 이름은 공용 `toolName` 헬퍼(라벨 slug, 충돌 시 `_2` 접미사).
- 각 컴포넌트 문서는 자동 생성되므로 카탈로그 항목(props 표, WebMCP 도구 표, 사용 예 코드)을 정확히.

## 수정 가능한 파일 (충돌 방지 — 반드시 지킬 것)

- `registry/aing/ui/<새 컴포넌트>.tsx`
- `registry/groups/<내 그룹>.json`, `lib/catalog/<내 그룹>.ts`, `components/demos/<새 컴포넌트>.tsx`
- `tests/<내 그룹>.test.tsx`
- forms 작업자만 추가로: `registry/aing/ui/ai-chat.tsx`, `components/demo.tsx`(및 Agent 패널 관련 파일), `registry/aing/lib/webmcp.ts`
- 그 외 공용 파일(`app/**`, `components/*.tsx` 공용, `registry/aing/lib/motion.ts`, `package.json`, `globals.css`)은 **고치지 않는다.** 꼭 필요하면 고치지 말고 보고서에 "통합 시 필요한 변경"으로 diff를 적는다. 새 npm 패키지 추가 금지(radix-ui, motion, lucide-react로 해결).
- 생성물(`registry.json`, `public/r/*.json`)은 검증용으로 생성해도 되지만 통합 때 코디네이터가 다시 만든다.

## 검증 (내 폴더에서)

1. lint, tsc, test, `pnpm registry:build`, build 통과.
2. dev 서버는 **포트: forms 3221, overlays 3222, display 3223**. 새 컴포넌트 문서 전부를 1440/375/다크로 스크린샷 → `.verify/shots-<그룹>/`. 가로 넘침·콘솔 에러 0(Next dev 오버레이 "Issue" 0 포함).
3. 컴포넌트마다 모션 증거: 상호작용 전·중·후 **컴포넌트 부분만 잘라낸** 프레임 3장 → `.verify/motion-<그룹>/`(전체 페이지 축소 금지 — 움직임이 보이게).
4. 각 컴포넌트 WebMCP 도구를 Ego Lite 네이티브 `executeTool` 또는 폴백으로 1회 이상 실행해 UI가 바뀌는지.
5. 레퍼런스 비교 1장: 내 그룹 대표 컴포넌트 2개를 animate-ui.com 또는 shadcn 같은 컴포넌트 옆에 나란히 → `.verify/compare-<그룹>/`.

## 보고

`.verify/REPORT-<그룹>.md`: 만든 파일 목록, 검증 결과(실패는 실패로), 통합 시 필요한 공용 변경, 남은 문제. worker_done 요약 세 문장.
