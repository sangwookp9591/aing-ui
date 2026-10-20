# aing-ui

[웹사이트](https://aing-ui.vercel.app)

사람과 페이지의 AI 에이전트가 같은 동작을 사용하는 개인 컴포넌트 레지스트리입니다. UI 소스를 설치해 소유하고 공통 동작은 `@aing/core` 패키지로 공유합니다.

## 로컬 실행

전체 게이트는 Node.js 22.22 이상과 pnpm 10이 필요합니다(CI는 Node.js 24). Next 앱만 실행하는 경우 Next의 하한은 Node.js 20.9입니다. UI는 `lucide-react@1.59.0`, `motion@14.4.0`을 사용하며, 다음 단계의 컴포넌트를 위해 `radix-ui@1.8.1`도 고정 설치했습니다. 버전은 `package.json`과 `pnpm-lock.yaml`에 고정했습니다.

```sh
pnpm install --frozen-lockfile
pnpm registry:build
pnpm dev --port 3210
```

`http://localhost:3210`에서 소개와 다섯 문서를 볼 수 있습니다. 빈 저장소에서 시작했으며, 기능 요구사항은 [SPEC.md](./SPEC.md), 디자인 요구사항은 [SPEC-2-design.md](./SPEC-2-design.md)에 있습니다.

## 가져오기

Tailwind CSS v4와 shadcn이 설정된 Next/React 프로젝트에서 실행합니다.

Button·Dialog·Select가 사용하는 `@aing/core`와 CLI의 npm 공개 배포는 아직 수행하지 않았습니다. 로컬 패키지를 설치한 소비 앱에서 검증했으며, 웹사이트 배포와 npm 패키지 공개는 별도로 진행합니다.

```sh
npx shadcn@4.22.1 add http://localhost:3210/r/card.json
```

`components/ui/card.tsx`와 공용 훅과 모션(`lib/webmcp.ts`, `lib/motion.ts`)이 설치됩니다. 컴포넌트는 설치한 앱의 shadcn 표준 토큰을 사용합니다. 나머지는 `ai-chat`, `reaction-bar`, `tool-call`, `progress-tracker`입니다. `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`를 합성해 사용하세요. 컴포넌트는 React 19의 ref prop을 지원합니다.

## WebMCP

`registry/aing/lib/webmcp.ts`의 `useWebMCPTool(tool | null, { target?, allowWhileModal? })`은 `document.modelContext`, 다음으로 `navigator.modelContext`를 감지합니다. 미지원 환경에서는 `window.__aingTools` Map과 `aing:tools` 이벤트를 사용합니다. 네이티브 등록 실패도 콘솔 오류 없이 개발용 폴백으로 전환합니다. 네이티브 등록은 AbortSignal로 해제되며, 실행 함수는 최신 props를 참조합니다.

- 앱이 직접 등록한 도구도 모달 바깥이면 해제하고 보관한 실행도 거부합니다. `target: () => ref.current`로 DOM 범위를 지정하고, 필요한 도구에만 `allowWhileModal: true`를 명시하세요. inert 검사는 항상 유지합니다.
- `webmcp={false}`: 등록하지 않습니다.
- `toolName="unique_card"`: 인스턴스의 기본 이름을 지정합니다.
- `webmcp={{ name: 'unique_card', description: '설명' }}`: 이름과 설명을 지정합니다. 이름은 `toolName` 다음 순위입니다.
- 여러 도구를 내보내는 컴포넌트는 `_send_message`, `_read_messages`, `_toggle` 같은 접미사를 붙입니다. Card는 `_action` 또는 `_read`를 붙입니다.
- 기본으로 모든 컴포넌트가 도구를 등록합니다. 기본 이름은 접근 가능한 이름(`aria-label`, Card의 children 텍스트)의 slug이며, 이름은 WebMCP의 ASCII·128자 제한에 맞춥니다. `toolName` → `webmcp.name` → 라벨의 ASCII 부분 → 컴포넌트 종류와 순번 순이며 원문 라벨은 description에 유지합니다. 이름이 없으면 접두사 + React `useId()`를 씁니다. 같은 이름은 네이티브·폴백 모두 `_2`, `_3`으로 각각 등록합니다. `aria-label`로 인스턴스의 용도를 알려 주세요.
- `useWebMCPToolLog()`는 폴백 호출을 최대 50건 보관합니다. 문서 Agent 패널은 실제 도구를 실행하고 최근 5건을 Tool Call로 보여 줍니다. consequentialHint 도구는 900ms 길게 누르기 또는 키보드 2단계 확인 후 실행합니다.

힌트는 권한 제어가 아닙니다. 실제 서비스의 인증·권한 검증은 서버에서 수행하세요. 샘플은 로컬 상태만 바꾸며, 채팅 답변은 외부 AI 호출 없는 스트리밍 데모입니다. 입력 메시지는 1~10,000자, 읽기 limit은 1~100으로 검증합니다. 반응과 카드 작업은 현재 enum에 있는 값만 실행합니다.

문서 사이트 색상은 `app/globals.css`의 shadcn 표준 토큰으로 정의합니다. `.dark`를 루트 또는 상위 요소에 주면 다크 모드입니다. 컴포넌트는 `bg-card`, `text-foreground`, `border`, `--radius` 같은 표준 토큰을 사용하며, 작은 상태 점에만 포인트 색을 씁니다. 전환 효과는 reduced-motion 환경에서 생략합니다.

## 레지스트리 배포

기본 레지스트리는 로컬 주소를 가리킵니다. 배포 전 공개 origin으로 의존성 URL을 다시 생성하세요.

```sh
AING_REGISTRY_ORIGIN=https://your-domain.example pnpm registry:build
pnpm build
```

`registry.json`은 생성물입니다. `pnpm registry:build`가 플랫폼 CSS·Tailwind 항목 생성 → 그룹 합치기 → shadcn build → origin 후처리 순서로 설치용 JSON 38개(UI 33 + 공용 lib 2 + Tailwind판 3)를 생성합니다. 직접 실행할 때는 `pnpm exec tsx scripts/platform-registry.ts`, `pnpm exec tsx scripts/merge-registry.ts`, `pnpm exec shadcn build`, `pnpm exec tsx scripts/registry-origin.ts` 순서를 지키세요. origin 환경변수를 지정하지 않으면 의존성 주소는 `registry.json`의 로컬 기본값입니다. 비공개 호스트나 실제 배포는 이번 샘플 범위에 포함하지 않았습니다.

## 검증

```sh
pnpm build
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm verify:browser
pnpm verify:foundation
```

브라우저 검사는 3210 포트 서버와 설치된 Chrome을 사용합니다. `VERIFY_ORIGIN`과 `PLAYWRIGHT_CHANNEL`로 주소와 채널을 바꿀 수 있습니다. 홈·문서 5종을 1440px/375px에서 캡처하고 가로 넘침, 도구 호출, 키보드 승인·길게 누르기·조기 해제·거절·채팅 중지·반응 추가·다크 모드·콘솔을 검사합니다. `.verify/`는 gitignore 대상이며 3차 보고서는 `.verify/REPORT-v3.md`, 화면은 `.verify/shots-v3/`, 인터랙션별 전·중·후 프레임은 `.verify/motion/`에 있습니다. `verify:foundation`은 실제 클립보드·복사 실패의 텍스트 선택·포커스·홈 도구 검색도 검사합니다.

훅 단위 테스트는 네이티브 등록 모의 객체와 개발용 폴백을 검증합니다. React 공식 deprecated 안내가 있는 `react-test-renderer`를 테스트에만 사용합니다. 실제 브라우저 WebMCP 에이전트 연결을 증명하는 테스트는 아닙니다.

## 확인한 공식 자료

- [WebMCP 제안과 API](https://github.com/webmachinelearning/webmcp): registerTool, AbortSignal, annotations
- [shadcn registry.json](https://ui.shadcn.com/docs/registry/registry-json): 공식 레지스트리 형식
- 설치된 Next 16의 `node_modules/next/dist/docs/`: 비동기 params와 App Router API

Context7 조회는 서비스의 월간 할당량 초과로 실패해 WebMCP 저장소의 공식 원문을 직접 확인했습니다.

## 인터랙션 연결

- `AIChat`: `onStop`에서 앱의 스트림을 취소하세요. `onAttach`를 연결하면 첨부 버튼이 활성화됩니다. 데모의 첨부 버튼은 연결되지 않아 비활성입니다.
- `ToolCall`: `pending`에서 `onApprove` / `onDeny`를 실행하고, 부모가 `status`와 `output`을 갱신합니다. `consequentialHint`는 포인터 900ms 승인, 키보드 Enter/Space 2회 확인을 요구합니다. 완료·실패는 자동으로 접히며 `durationMs`를 trace에 표시합니다.
- `ReactionBar`: `onAdd`에서 부모의 반응 목록을 갱신하면 이모지 선택 팝오버를 사용할 수 있습니다.
- `Card`: `spotlight`로 커서 하이라이트를 켭니다. 기본은 일반 카드이며 reduced-motion에서는 하이라이트를 생략합니다.
- `ProgressTracker`: 단계의 `meta`에 시간·파일 수 같은 정보를 표시하고 `orientation`으로 세로·가로를 선택합니다.

승인 UI는 서버 권한 검증이 아닙니다. 문서의 파일 쓰기 장면은 로컬 상태만 변경하며 실제 파일을 수정하지 않습니다. Agent 패널은 개발용 폴백 도구의 실제 호출을 보여 줍니다.

## 새 컴포넌트 추가하는 법

구현 소스 `registry/aing/ui/<name>.tsx`를 만든 뒤 **연결 파일 3곳만** 수정합니다. 다른 그룹의 파일이나 공용 프레임을 고칠 필요가 없습니다.

1. `registry/groups/{forms,overlays,display}.json`: 해당 그룹의 `items`에 shadcn 항목을 추가합니다. 공용 WebMCP·motion URL을 `registryDependencies`에 연결하고 사용하는 직접 패키지의 고정 버전을 적습니다.
2. `lib/catalog/{forms,overlays,display}.ts`: 이름·제목·설명·`imports`·props·tools·사용 예와 `demo: () => import("@/components/demos/<name>")`를 추가합니다. 홈·사이드바·문서 경로가 자동 반영됩니다.
3. `components/demos/<name>.tsx`: `default` export로 실제 상태·콜백이 동작하는 데모를 만듭니다. `{ compact?: boolean }`을 받아 홈 미리보기도 지원합니다.

기존 5종과 공용 lib는 `ai` 그룹에 있습니다. 각 작업자는 자기 그룹 파일과 새 구현·데모 파일만 소유하세요. `registry.json`과 `public/r/`은 직접 편집하지 말고 통합 시 재생성합니다.

`useWebMCPTool`에 `webmcp === false ? null : tool`을 전달해 기본 등록하고, 라벨을 이름과 description에 포함하세요. 공용 모션 프리셋을 사용하고 reduced-motion과 키보드 조작을 존중하세요. 등록을 원치 않는 내부 호출 로그에는 `webmcp={false}`를 명시합니다. `pnpm registry:build`, lint, tsc, test, build와 실제 브라우저 검증 후 그룹을 통합합니다.

## 복사와 MCP

문서의 **Copy page ▾**에서 Markdown, 에이전트 프롬프트, MCP 설정, 실제 등록 도구 정의를 복사하거나 ChatGPT/Claude를 새 탭으로 열 수 있습니다. 코드·사용 예·Agent/pnpm/npm/MCP 설치 탭도 각각 복사합니다. 실패하면 텍스트가 선택되어 직접 복사할 수 있습니다.

MCP 복사 JSON의 `.mcp.json` 부분은 MCP 클라이언트 설정에, `components.json` 부분은 프로젝트의 기존 설정에 병합하세요. 서로 다른 두 설정 파일을 구분하기 위한 묶음이며, 묶음 전체를 하나의 설정 파일에 붙이지 않습니다. MCP 서버는 `npx shadcn@4.22.1 mcp`, 레지스트리는 `registries: { "@aing": "<origin>/r/{name}.json" }`입니다. [shadcn 공식 MCP 문서](https://ui.shadcn.com/docs/mcp)에서 이 형식을 확인했습니다. 이 문서는 설치 설정을 제공하며, 실제 MCP 클라이언트 연결과 외부 AI 서비스 응답까지 검증하지는 않습니다.

## M1 플랫폼 기준

Button·Dialog·Select는 Radix·motion·lucide 없이 브라우저 내장 기능과 `packages/core`를 사용합니다. 기본 레지스트리는 순수 CSS, `*-tailwind` 항목은 Tailwind v4판입니다. 정적 Button은 서버에서 렌더되고 WebMCP만 클라이언트 섬으로 등록합니다. 기존 33종 전환은 M2 범위입니다.

```sh
pnpm core:build
pnpm test:core
pnpm size
pnpm gate
```

[설계·호환 범위](./docs/M1-core.md), [게이트 명세](./SPEC-M1-core.md), 실행 증거 `.verify/REPORT-M1.md`를 참고하세요. `@aing/core` 공개 배포 전에는 소비 앱 검증 스크립트가 로컬 pack 산출물로 설치합니다. 브라우저 기준 이미지는 `tests/browser/baselines/`, 상태·모션 크롭은 `.verify/m1-shots/`에 생성됩니다. 이미지 생성과 비교는 디자인 승인과 별개입니다.
