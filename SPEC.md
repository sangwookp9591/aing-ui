# aing-ui — 첫 샘플 작업 지시

작업 폴더: `/Users/iron/Project/psw/aing-ui` (빈 git 저장소, git user는 local로 설정됨). 이 폴더 밖은 건드리지 않는다.
사용자 지시가 이 문서보다 우선한다. 커밋·푸시는 하지 않는다(코디네이터가 확인 후 한다).

## 목표

shadcn/ui처럼 "코드를 복사해 가는" 개인 컴포넌트 레지스트리 **aing-ui**를 만든다.
모든 컴포넌트는 **WebMCP 컴포넌트**다 — 사람이 쓰는 UI이면서, 같은 동작을 페이지의 AI 에이전트에게 도구(tool)로 노출한다.

샘플 5종: **AI Chat, Reaction Bar, Card, Tool Call, Progress Tracker**.

## 스택 (버전 고정, 설치 전 `npm view`로 확인)

- Next.js 16 App Router + React 19 + TypeScript strict, pnpm. `create-next-app`으로 시작 가능.
  Next 16은 학습 데이터와 다를 수 있으니 API를 쓰기 전에 `node_modules/next/dist/docs/`에서 확인한다.
- Tailwind CSS v4 (shadcn 기본과 같은 방식). 외부 UI 의존성은 최소 — 필요하면 `clsx` + `tailwind-merge`의 `cn()` 하나.
- shadcn CLI 4.x (`npx shadcn@4.22.1 build`)로 레지스트리 JSON을 만든다.

## 레지스트리 구조 (shadcn 공식 형식)

```
registry.json                         # $schema: https://ui.shadcn.com/schema/registry.json, name: "aing-ui"
registry/aing/lib/webmcp.ts           # registry:lib — 공용 WebMCP 훅
registry/aing/ui/ai-chat.tsx          # registry:ui
registry/aing/ui/reaction-bar.tsx
registry/aing/ui/card.tsx
registry/aing/ui/tool-call.tsx
registry/aing/ui/progress-tracker.tsx
public/r/*.json                       # `shadcn build` 결과물 (커밋 대상)
```

- 각 item은 `registryDependencies`로 `webmcp` lib item을 참조한다(URL 형태 또는 같은 레지스트리 이름).
- 설치 확인: 빌드 후 임시 폴더에 새 Next 앱을 만들어 `npx shadcn@4.22.1 add http://localhost:<port>/r/card.json` 이 성공하는지 실제로 돌려 본다. 결과를 보고한다.

## WebMCP 규약 (context7 `/webmachinelearning/webmcp` 기준, 2026-10)

API:
```ts
await document.modelContext.registerTool({
  name, description,
  inputSchema: { type: 'object', properties: {...}, required: [...] },
  annotations: { readOnlyHint?: boolean, consequentialHint?: boolean, untrustedContentHint?: boolean },
  async execute(input, { signal }) { ...; return { content: [{ type: 'text', text }] } },
}, { signal: controller.signal });   // 해제는 controller.abort()
```

`registry/aing/lib/webmcp.ts`에 훅 하나:
```ts
useWebMCPTool(tool: AingTool | null)   // null이면 등록 안 함
```
- 마운트 시 등록, 언마운트·tool 변경 시 abort로 해제. execute는 최신 상태를 보도록 ref로 감싼다(재등록 폭주 금지).
- 기능 감지: `document.modelContext ?? (navigator as any).modelContext`. 없으면 **조용히 개발용 폴백**:
  `window.__aingTools` (Map) 에 등록/해제하고 `aing:tools` 이벤트를 쏜다. 콘솔 에러 금지.
- 이름 충돌: 같은 컴포넌트가 여러 개면 props `toolName`(기본값은 컴포넌트별 접두사 + `id`)으로 구분.
- 모든 컴포넌트는 `webmcp?: false | { name?: string; description?: string }` prop으로 끄거나 이름을 바꿀 수 있다.

## 컴포넌트별 요구

공통: `'use client'`, forwardRef 불필요(React 19 ref prop), `className` 병합, 키보드 조작, focus-visible, 375px에서 가로 스크롤 없음, 본문 대비 WCAG AA, `prefers-reduced-motion` 존중, 다크 모드는 CSS 변수로.

1. **AI Chat** — 메시지 목록 + 입력창. props: `messages`, `onSend(text)`, `pending?`.
   스트리밍 중 표시, 자동 스크롤(사용자가 위로 올렸으면 멈춤), Enter 전송 / Shift+Enter 줄바꿈, `aria-live`.
   WebMCP 도구: `chat_send_message`(text; consequentialHint), `chat_read_messages`(limit; readOnlyHint, untrustedContentHint).
2. **Reaction Bar** — 이모지 반응 토글 + 개수. props: `reactions: {emoji,count,active}[]`, `onToggle(emoji)`.
   `role="group"`, 각 버튼 `aria-pressed`.
   도구: `reaction_toggle`(emoji, enum은 현재 이모지 목록), `reaction_list`(readOnly).
3. **Card** — Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter 합성(shadcn과 같은 이름).
   선택적 `actions: {id,label,onSelect}[]`가 있으면 도구 `card_<id>_action`(action enum)으로 노출, 없으면 `card_<id>_read`(readOnly, 제목·설명 반환).
4. **Tool Call** — 에이전트의 도구 호출 하나를 보여 주는 블록. props: `name`, `input`, `output?`, `status: 'pending'|'running'|'success'|'error'`, 접고 펴기.
   JSON은 `<pre>`에서 줄바꿈되어 375px에서 넘치지 않게. status는 색 + 글자(색만으로 구분 금지).
   도구: `toolcall_get_result`(readOnly). 추가로 `useWebMCPToolLog()` 훅 하나 — 폴백 레지스트리를 통한 호출을 ToolCall 목록으로 보여 줄 수 있게(데모용).
5. **Progress Tracker** — 단계 목록(`steps: {id,label,status:'todo'|'active'|'done'|'error'}[]`), 가로/세로, `aria-current="step"`, 퍼센트 `role="progressbar"`.
   도구: `progress_get_status`(readOnly), 선택적 `onAdvance`가 있으면 `progress_advance`(consequentialHint).

## 디자인 토큰 (aing 고유 색)

흰 바탕, 깔끔. 팔레트: `#D4D4D4`(선), `#FFC0CB`, `#87CEEB`, `#FFFF00`, `#FF99CC`, `#33CC33`.
밝은 팔레트 색 위의 글자는 대비가 낮으니 **글자색은 진한 잉크(#16181d 계열)**, 팔레트는 배경·테두리·점에만.
`app/globals.css`에 `--aing-*` CSS 변수로 정의하고 컴포넌트는 변수만 쓴다. 둥근 모서리 크게(16~24px), 얇은 선.

## 문서 사이트

- `/` : aing-ui 소개 한 화면 + 컴포넌트 5개 카드 링크 + 설치 명령.
- `/docs/[name]` : 미리보기(실제 동작), 설치 명령(`npx shadcn add <origin>/r/<name>.json`), 사용 예 코드, props 표, **이 컴포넌트가 노출하는 WebMCP 도구 표**.
- 데모 하나에 **"Agent 패널"**: 폴백 레지스트리(`window.__aingTools`)에 등록된 도구 목록을 보여 주고, 버튼으로 실행 → 결과를 Tool Call 컴포넌트로 표시. 이걸로 WebMCP 연결이 실제로 동작함을 보인다.
- 문서 문장은 한국어, 짧게.

## 검증 (끝내기 전에 직접)

1. `pnpm build`, `pnpm lint`, `tsc --noEmit` 통과.
2. `npx shadcn@4.22.1 build` 성공, `public/r/`에 6개 JSON(lib 1 + ui 5).
3. dev 서버 띄워 브라우저(Playwright 등)로 `/`와 5개 `/docs/*`를 1440px·375px에서 스크린샷, 가로 스크롤 없음 확인. 스크린샷은 `.verify/`에 저장(gitignore).
4. Agent 패널에서 각 컴포넌트의 도구를 최소 1번씩 실행해 UI가 바뀌는지 확인.
5. 임시 앱에 `shadcn add`로 설치 1건 성공.
6. 콘솔 에러 0.

## 보고 (worker_done 요약에)

만든 파일 목록, 각 검증 단계 결과(실패는 실패로), 남은 문제. `.verify/REPORT.md`에 상세.
