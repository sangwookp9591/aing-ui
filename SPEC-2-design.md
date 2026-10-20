# aing-ui — 2차: 디자인 재작업

먼저 `SPEC.md`(1차 지시)와 `.verify/REPORT.md`(1차 결과)를 읽는다. 기능·WebMCP 규약·레지스트리 구조·검증 항목은 1차 그대로 유지한다.
이번 작업은 **시각 디자인 전면 재작업**이다. 사용자 평가: 1차 디자인은 "0점".
사용자 지시가 이 문서보다 우선한다. 커밋·푸시는 하지 않는다. 작업 폴더는 `/Users/iron/Project/psw/aing-ui` 하나.
bias towards action: 합리적 가정으로 끝까지 완료한다. 되묻지 말고, 판단이 갈리면 보고서에 근거와 함께 적는다.

## 기준: 레퍼런스

`.verify/refs/*.png` 10장을 **전부 이미지로 열어 본다**. Aceternity UI, Magic UI, Kokonut UI, Animate UI, Cult UI, 21st.dev 화면이다.
목표 수준은 **Kokonut UI / Cult UI의 AI 컴포넌트**(`k-toolapproval.png`, `kokonut.png`, `c-prompt.png`)다. 따라 그리지 말고 같은 품질 기준으로 aing만의 것을 만든다.
필요하면 ego-browser(`ego-browser skill` 먼저 실행)로 레퍼런스 사이트를 직접 열어 인터랙션을 확인해도 된다.

## 1차의 문제 (고칠 것)

| 항목 | 레퍼런스 | 1차 aing-ui |
|---|---|---|
| 색 | zinc 무채색 바탕, 포인트는 아주 작게 | 노랑 로고·하늘 아이콘·분홍 말풍선이 섞여 장난감 같음 |
| 선·반경 | 1px 헤어라인, 반경 8–12px, 아주 옅은 그림자(shadow-xs + ring) | 반경 20px+, 덩어리감 |
| 글자 | 제목 자간 좁게(-0.02em 이하), UI 13–14px, mono 메타 라벨(`AI-06`, 날짜) | 크기 위계 단조, 메타 라벨 없음 |
| 밀도 | 작고 단단한 컴포넌트 | 채팅 창이 크고 대부분 비어 있음 |
| 아이콘·움직임 | lucide 아이콘, motion 스프링·짧은 트윈 | 아이콘·움직임 거의 없음 |
| 테마 | shadcn 토큰 사용 → 설치한 앱 색을 따름 | 자체 `--aing-*` 변수 |
| 문서 | 컴포넌트를 가운데 둔 미리보기 무대 + Preview/Code 탭 + 에이전트용 설치 문구 | 큰 밋밋한 박스 |

## 디자인 규칙

- **토큰:** 컴포넌트는 shadcn 표준 토큰만 쓴다(`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border`, `ring`, `bg-muted`, `bg-primary`, `text-primary-foreground`, `--radius`). 문서 사이트 `globals.css`에 shadcn 기본(neutral/zinc) 라이트·다크 토큰을 정의한다.
  레지스트리 item에 필요한 CSS 변수가 있으면 shadcn 형식(`cssVars`)으로 넣는다.
- **포인트 색:** aing 팔레트(`#FFC0CB` `#87CEEB` `#FFFF00` `#FF99CC` `#33CC33`)는 **상태 점·작은 배지·하이라이트 한 줄** 정도에만. 넓은 면에 쓰지 않는다. 글자색으로 쓰지 않는다.
- **의존성:** `lucide-react`, `motion`(framer-motion 후속, `motion/react`)을 추가한다. 레지스트리 item의 `dependencies`에 적는다. 그 외 추가 금지. 버전은 `npm view`로 확인해 고정.
- **움직임:** 스프링/짧은 ease-out, transform·opacity만, 키보드 조작에는 애니메이션 최소화, `useReducedMotion`으로 끈다.
- **크기:** 컴포넌트 기본 폭은 내용에 맞게(채팅 max-w ~ 420–480px). 375px에서 가로 스크롤 없음.
- 접근성·AA 대비·키보드 조작은 1차 수준을 유지한다(떨어뜨리지 말 것).

## 컴포넌트별 핵심 장면 (각 하나씩 확실하게)

1. **Tool Call** — Kokonut AI Tool Approval급. 헤더(아이콘 + 도구 이름 + mono 종류 라벨), 입력 미리보기(mono, 작은 muted 박스), 한 줄 설명.
   상태: `pending`이면 Deny/Allow, `consequentialHint` 도구는 **길게 눌러야 Allow**(진행 링/바 채움, 키보드는 Enter 길게 또는 확인 단계). `running` 스피너 → `success`/`error`면 **접혀서 trace 한 줄**(체크/엑스 아이콘 + 이름 + 소요 시간), 펼치면 입력·출력.
   WebMCP 연결: 이 컴포넌트가 에이전트의 도구 호출 승인 UI가 된다는 점을 데모로 보인다.
2. **AI Chat** — Kokonut AI Input / Cult Prompt Composer급 입력창(자동 높이, 첨부 버튼 자리, 전송↔정지 전환, 전송 중 상단 진행 선). 메시지는 말풍선을 과하게 칠하지 말고 사용자만 muted 배경, 어시스턴트는 배경 없이 텍스트 + 작은 아바타. 스트리밍 커서.
3. **Progress Tracker** — 세로/가로 단계. 완료 체크가 스프링으로 그려지고, 진행 단계는 은은한 pulse 점(팔레트 한 색), 연결선이 채워짐. 각 단계에 mono 시간/메타.
4. **Card** — shadcn Card 합성 그대로 + 선택적 `spotlight`(Magic Card처럼 커서 따라오는 radial 하이라이트와 테두리 강조, 하나만). 기본은 조용한 카드.
5. **Reaction Bar** — 작은 pill 버튼들, 누르면 숫자가 위/아래로 굴러 바뀌고 이모지가 살짝 튐. 추가 버튼(+)으로 이모지 팝오버.

## 문서 사이트

- 레이아웃은 Kokonut/Cult 문서 수준: 왼쪽 사이드바(그룹 라벨 mono, 항목 옆 `new` 배지), 가운데 본문, 오른쪽 "On this page".
- 각 문서: mono 메타(`AING-01 · WebMCP · Updated 2026-10-20`), 큰 제목(자간 좁게), 한 줄 설명.
  미리보기 무대(얇은 테두리, 은은한 dot/grid 배경, 컴포넌트 가운데) + Preview/Code 탭 + **Agent / pnpm / npm 설치 탭**(Agent 탭은 "이 레지스트리 주소로 shadcn add 해 줘"라는 에이전트용 문장 복사).
- Agent 패널(WebMCP 도구 실행)은 유지하되 무대 아래 작은 접이식 패널로.
- 홈: 한 화면 히어로(짧은 제목 + 한 줄 + 설치 명령) + 5개 컴포넌트를 **실제 동작하는 축소 미리보기**로 보여 주는 그리드.

## 검증 (끝내기 전에 직접)

1. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm registry:build` 통과. 테스트는 바뀐 동작에 맞게 갱신.
2. dev 서버에서 홈 + 문서 5개를 1440px·375px 스크린샷 → `.verify/shots-v2/`. 가로 넘침 0, 콘솔 에러 0.
3. **레퍼런스 비교:** `.verify/refs/k-toolapproval.png` 옆에 aing Tool Call, `c-prompt.png` 옆에 aing AI Chat을 같은 크기로 나란히 붙인 비교 이미지를 만들어 `.verify/compare/`에 저장하고, 스스로 차이를 적는다(보고서에). 부족하면 고치고 다시 찍는다.
4. Agent 패널에서 도구 5종 이상 실행, Tool Call 승인 흐름(길게 누르기 포함) 동작 확인.
5. 다크 모드 스크린샷 1장씩(홈, Tool Call).

## 보고

`.verify/REPORT-v2.md`에 바꾼 점, 검증 결과(실패는 실패로), 비교 이미지 경로, 남은 문제. worker_done 요약 세 문장.
