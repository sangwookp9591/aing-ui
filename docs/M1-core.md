# M1 플랫폼 컴포넌트

기준은 [ROADMAP](./ROADMAP.md), 상태·모션은 [DESIGN-RULES](./DESIGN-RULES.md)입니다. M1은 Button·Dialog·Select만 바꿉니다. 나머지 컴포넌트의 Radix·motion 의존성은 M2 범위입니다.

## 코어와 설치

`packages/core`는 의존성이 없는 DOM 패키지입니다. React 연결만 선택적 `react >=19` peer를 사용합니다. `pnpm core:build`가 subpath별 JS·d.ts를 만들고 소스도 패키지에 포함합니다. import 시 브라우저 전역을 읽지 않습니다. DOM 함수는 브라우저에서 호출하세요.

```ts
import { spring, play } from '@aing/core/motion';
import { place } from '@aing/core/position';
import { registerTool } from '@aing/core/webmcp';
import { useControllable } from '@aing/core/react';
```

기본 레지스트리 항목 `button`, `dialog`, `select`는 순수 CSS를 `@layer aing`으로 설치합니다. `button-tailwind`, `dialog-tailwind`, `select-tailwind`는 Tailwind v4 유틸리티를 사용하는 별도 항목이며 의사 요소·starting-style 외의 모양과 상태는 유틸리티로 표현합니다. Tailwind판은 색상 토큰을 `@theme inline`에 연결합니다. CSS 변수에는 기존 shadcn 토큰을 사용합니다. 패키지 배포 전 소비자 검증은 `pnpm pack` 산출물을 로컬 HTTP로 설치합니다. 공개 npm 배포는 수행하지 않았습니다.

## Button의 서버 경계

Button 본체에는 클라이언트 지시문·훅이 없습니다. 정적 사용은 서버 컴포넌트에서 렌더되고, 기본 WebMCP 등록만 옆의 `<AingTool>` 클라이언트 섬이 맡습니다. `webmcp={false}`면 등록 섬을 생략합니다. loading일 때는 클릭 차단을 위한 섬을 유지합니다. 동작이 없는 정적 버튼도 등록 섬을 만들지 않습니다. 등록 상태는 공유 스냅샷을 `useSyncExternalStore`로 구독합니다. `onClick` 같은 이벤트 콜백은 클라이언트에서 전달하세요.

```tsx
// 서버 컴포넌트
<Button webmcp={false}>안내</Button>
<Button render={<a href="/settings">설정</a>} variant="outline" />
```

`render`는 단일 DOM 루트로 렌더되는 버튼·링크 요소를 받아 Slot 패키지 없이 클래스를 합성합니다. 함수형 render prop은 서버 경계를 넘길 수 없어 받지 않습니다. 기존 `asChild`도 호환하지만 새 코드는 `render`를 권장합니다. disabled 링크는 포커스 진입·클릭·도구 실행을 막습니다. loading 링크는 포커스와 라벨을 유지하고 클릭·도구 실행만 차단합니다. 실제 파괴 동작에는 `consequential`을 지정하고 서버 권한 검증을 연결하세요.

## Dialog와 AlertDialog

기존 합성 이름을 유지하되 실제 패널은 `<dialog>`입니다. `showModal()`이 top layer·문서 inert·포커스 복귀·Esc를 처리합니다. 비제어 트리거/닫기는 `command`·`commandfor`의 네이티브 동작으로 즉시 실행하고 toggle/close로 React 상태를 동기화합니다. 제어형은 command 기본 동작을 막고 React 상태 경로에서 실행하여 부모의 변경 거부를 존중합니다. 미지원 브라우저에서만 invoker/closedby 폴백을 동적으로 불러옵니다. 여러 인스턴스도 위임 리스너 한 벌을 공유합니다. 닫힘 애니메이션 미지원 브라우저는 즉시 닫힙니다. 제어형 상태에서 부모가 변경을 거부하면 트리거·Esc·바깥 클릭·닫기 버튼·네이티브 폼 닫기도 상태와 일치하도록 유지합니다.

`AlertDialog`는 `role="alertdialog"`, `closedby="closerequest"`로 바깥 클릭을 허용하지 않습니다. `AlertDialogCancel`은 기본 autofocus입니다. 제목과 설명은 `DialogTitle`, `DialogDescription`으로 연결하세요. 네이티브 dialog의 Tab 순서는 macOS에서 브라우저 chrome·dialog 자체를 포함할 수 있으며, 페이지의 다른 컨트롤은 inert 상태입니다.

## Select의 점진적 향상

`<select>`·`<option>`으로 폼 제출, `name`, `required`, 방향키와 typeahead를 브라우저에 맡깁니다. `appearance: base-select` 지원 브라우저는 CSS picker로 향상되고 나머지는 OS select를 씁니다. 별도 listbox·포커스·키보드 엔진을 복사하지 않습니다. 기존 `SelectTrigger`·`SelectContent`·`SelectItem` 이름은 네이티브 옵션 구조로 변환됩니다.

`open`·`defaultOpen`·`onOpenChange`는 제공하지 않습니다. 네이티브 picker는 사용자 활성화 없이 강제로 열 수 없고 OS picker의 열림을 일관되게 관측할 수 없으므로, 클릭/blur를 열림 알림으로 가장하지 않습니다. 사용자 활성화 없이 `showPicker()`를 호출할 수 없으므로 WebMCP는 값 선택만 제공합니다. 숨은 input 대신 실제 select가 FormData에 참여합니다.

## 검증과 증거

`pnpm test:core`, `pnpm size`, `pnpm gate`를 실행합니다. `pnpm exec playwright test --update-snapshots`는 기준 이미지 갱신 명령이며 디자인 승인을 대신하지 않습니다. `scripts/compat.ts`는 레지스트리 JSON을 실제 shadcn CLI로 설치해 Next(RSC·Compiler), Vite, React Router 소비 앱을 재생성합니다. `scripts/ego-native.ts`는 Ego Lite의 실제 native executeTool로 화면 변화를 확인합니다. 결과와 실패 원인은 `.verify/REPORT-M1.md`에 기록합니다.

플랫폼 근거: [MDN select](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select), [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [Apple Safari 키보드](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac), [shadcn registry item](https://ui.shadcn.com/docs/registry/registry-item-json).

macOS Darwin 27의 Firefox 프로필·sandbox 실행 실패는 코디네이터 확인 후 로컬 게이트에서 명시적으로 보류하고 Ubuntu CI로 이관했습니다. Linux 시각 기준은 workflow_dispatch의 후보 생성 후 디자인 승인·저장 절차가 필요하며, macOS 기준을 Linux 승인 이미지로 취급하지 않습니다.


## M1 어드바이저 수정

- Button은 sm 32px, 기본 36px, lg 40px, icon 36×36px입니다. 투명 `::before`가 44px 터치 영역을 확보합니다. loading은 원래 색과 라벨·스피너를 유지하고 `aria-disabled`로 클릭만 차단합니다.
- Button의 변하지 않는 렌더·이벤트·ref 병합은 `@aing/core/button`에서 공유합니다. 복사하는 파일은 스타일만 소유하며 CSS·Tailwind판이 같은 행동을 사용합니다. 이 렌더러의 크기도 `pnpm size`의 core 합계에 포함합니다.
- WebMCP는 기본 활성입니다. 동작과 접근 가능한 이름이 있는 실제 DOM 컨트롤만 등록되며, hidden·닫힌 dialog·disabled·loading·언마운트 때 해제됩니다. `aria-labelledby`, `aria-label`, 연결된 label, 버튼 텍스트 순으로 이름을 읽습니다. destructive Button과 AlertDialogAction은 consequentialHint=true입니다. 힌트는 서버 권한 검증을 대신하지 않습니다.
- DialogContent는 `closeLabel`로 닫기 버튼을 번역할 수 있습니다. Description이 있을 때만 aria-describedby가 자동 연결됩니다. 긴 내용은 Header / **DialogBody** / Footer로 나눠 Body만 스크롤하세요. 640px 이하에서는 하단 시트가 됩니다.
- Select의 `loading`은 aria-busy와 스피너를 표시하고 선택·도구 등록을 잠시 중단합니다. 서버와 첫 hydration은 텍스트 option으로 일치시킵니다. 이후 base-select 지원을 확인하면 option children과 hr 구분자를 추가하고, OS 폴백은 텍스트를 유지합니다. 아이콘·이모지가 있는 option도 hydration 경고 없이 사용할 수 있습니다.
- 문서의 스타일 라디오에서 실제 순수 CSS판과 Tailwind v4판을 전환할 수 있습니다. Tailwind판은 유틸리티로 모양을 표현하며 추가 CSS는 브라우저 의사 요소와 starting-style 전환에만 사용합니다.
- 줄 수는 Prettier printWidth=100으로 포맷한 결과입니다. Button 120줄, 복합 Dialog·Select 250줄, 포맷 후에도 100자를 넘는 줄은 크기 게이트가 거부합니다.

## 2차 수정 계약

Dialog·Select의 행동과 입력 검증은 각각 `@aing/core/dialog`, `@aing/core/select`에서 공유합니다. 복사 파일의 클래스 맵만 바꿔 모양을 소유합니다. G6는 공유 기반 합계와 별도로 복사 코드 + 해당 컴포넌트 행동 모듈을 합산하고, 전체 의존 core까지 묶은 값도 공개합니다. Button 렌더러는 기존대로 기반 합계에 포함합니다.

열린 modal dialog 바깥과 명시적 inert 안의 컨트롤은 도구 등록을 해제합니다. 보관했던 도구도 실행 직전에 같은 DOM 경계를 검사해 이유를 포함한 오류로 거절합니다. DialogTrigger·DialogClose와 X는 root의 열기/닫기 도구를 공유하며 Button 도구를 추가하지 않습니다. AlertDialogAction의 확정 도구는 별도 consequentialHint=true입니다.

이름 우선순위는 `toolName` → `webmcp.name` → 접근 가능한 라벨의 ASCII 부분 → `click_button` / `open_dialog` / `choose_select` 같은 동작·요소 이름입니다. 충돌은 `_2`, `_3`으로 구별합니다. Dialog의 toolName에는 `_open`, `_close`가 붙습니다. 한글 전용 Button은 `name`, `value`, 연결된 form의 id 순으로 ASCII 의미 이름을 찾고, 없으면 `click_button`을 사용합니다. 안정적인 외부 계약에는 `toolName` 명시를 권장합니다. 예제는 `save_changes`, `workspace_dialog_open`·`workspace_dialog_close`, `choose_region`을 실제 등록하며 표와 일치합니다. 원문 라벨과 Select의 `value = 화면 이름` 대응은 description에 유지합니다.

SelectContent는 children만 받습니다. 제거한 position·sideOffset·className은 네이티브 picker에 적용할 수 없던 props입니다. Root/Trigger className으로 트리거를 꾸미세요.

소비 앱은 `@layer theme, base, aing, components, utilities;` 순서를 선언하고 기본 button cursor 같은 리셋을 `@layer base`에 두세요. 레이어 밖의 일반 CSS는 layered 컴포넌트 규칙보다 우선합니다. Tailwind v4판만 새로 설치해도 플랫폼 토큰이 함께 설치되며 CSS판의 선행 설치가 필요하지 않습니다.


## 3차 수정 계약

AlertDialog 열기는 consequentialHint를 상속하지 않습니다. 확정은 AlertDialogAction의 별도 도구에서 consequentialHint=true로 표시합니다. 일반 Dialog에서 destructive 트리거로 여는 작업은 consequentialHint=true입니다. destructiveHint는 aing 로컬 정의에 보존되지만 현재 네이티브 getTools에는 노출되지 않습니다.

`useWebMCPTool(tool, { target: () => ref.current })`로 앱 도구를 실제 DOM 영역에 연결할 수 있습니다. 생략하면 document.body를 대상으로 하여 모달 중 해제합니다. 등록 해제 전 보관한 도구도 실행 시 같은 검사를 거칩니다. 모달과 별개로 유지해야 하는 도구에만 `{ allowWhileModal: true }`를 명시하세요. 이 옵션도 명시적 inert·hidden·disabled 검사를 우회하지 않습니다.

Select loading은 disabled 대신 aria-disabled와 aria-busy를 사용합니다. Tab과 포커스는 유지하고 포인터·키보드 선택·변경 콜백·도구 실행을 차단합니다. SelectLabel의 className은 향상된 picker의 legend에 적용하고, OS 폴백에서는 텍스트 그룹 이름을 유지합니다.

Tailwind Dialog의 sheet 변형은 레지스트리가 전달하는 `@custom-variant sheet` 하나를 사용합니다. 두 판 모두 opacity/display/overlay는 ease-out, translate/scale은 spring이며 starting-style도 같은 속성을 씁니다. 하단 시트는 safe-area padding을 포함합니다.
