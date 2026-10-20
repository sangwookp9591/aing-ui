# aing-ui 디자인 규칙

마지막 수정 2026-10-20. 기준 레퍼런스: `.verify/refs/*.png` (Kokonut UI, Cult UI, Animate UI, Magic UI, Aceternity, 21st.dev).
**원칙: 1차적으로 예뻐야 한다. 기준선은 21st.dev 같은 종류 추천 상위 컴포넌트와 동등 이상(예: https://21st.dev/?qt=ai-chat).** 규칙을 다 지켜도 레퍼런스 옆에 놓고 밀리면 탈락이다.

## 1. 토큰

- 색은 shadcn 표준 이름의 CSS 변수만 쓴다: `--background --foreground --card --muted --muted-foreground --border --input --ring --primary --primary-foreground --destructive`. 컴포넌트에 색 값을 직접 쓰지 않는다.
- 바탕은 무채색(zinc 계열). **포인트 팔레트**(`#FFC0CB #87CEEB #FFFF00 #FF99CC #33CC33`)는 상태 점·작은 배지·하이라이트 한 줄에만. 넓은 면·글자색 금지.
- 대비: 본문 글자 WCAG AA 4.5:1 이상, 큰 글자·아이콘 3:1 이상. 라이트·다크 모두.

## 2. 글자

- 서체: **Host Grotesk**(가변 300–800, uniwidth — 굵기가 바뀌어도 폭이 같아 호버·선택 때 흔들리지 않음). 한글은 시스템(Apple SD Gothic Neo · Malgun Gothic). 코드·메타는 mono.
- 크기 단계(px): 11 · 12 · 13 · **14(UI 기본)** · 16 · 20 · 24 · 32 · 48 · 64. 이 밖의 값 금지.
- 제목은 자간 좁게(-0.02em ~ -0.04em), 본문 0. 메타 라벨(`AING-04 · WebMCP`)은 mono 10–11px 대문자.

## 3. 간격·모양

- 4px 격자. 컴포넌트 안쪽 여백 8 · 12 · 16, 묶음 사이 24 · 32.
- 선은 **1px 헤어라인**(`--border`). 두꺼운 테두리 금지.
- 반경 `--radius`(기본 10px) 기준: sm 6 · md 8 · lg 10 · xl 12. 20px 이상은 쓰지 않는다(알약 버튼 999px 예외).
- 그림자는 아주 옅게: `0 1px 2px rgb(0 0 0 / .05)` + 필요시 1px ring. 큰 그림자는 오버레이에만.
- 터치 대상 최소 44×44px(시각 크기가 작아도 hit area 확보).

## 4. 상태 (변형마다 전부 있어야 함)

기본 · hover · active(press) · **focus-visible(얇은 링 하나 — 3px `--ring`/50%, 이중 링 금지)** · disabled · loading · error/invalid · 선택됨(해당 시) · 빈 상태(해당 시) · 다크.

## 5. 모션

- 바탕은 CSS: `transition` + `@starting-style` + `transition-behavior: allow-discrete`. 스프링은 aing core `motion`이 만든 `linear()` 곡선.
- 시간: 마이크로(press, toggle) 120–180ms · 열고 닫기 180–260ms · 큰 이동 300–400ms. **퇴장은 진입보다 빠르게**(약 70%).
- transform·opacity(·filter blur 소량)만 움직인다. width·height·top·left 애니메이션 금지(높이는 `interpolate-size`/`::details-content` 사용).
- 컴포넌트마다 최소 두 가지: 진입/퇴장 + 상호작용 피드백. 키보드 탐색 이동에는 애니메이션 없음.
- `prefers-reduced-motion: reduce`면 즉시 상태로.

## 6. 아이콘

- 인라인 SVG, 24 그리드, stroke 1.75, `currentColor`, 크기 14 · 16 · 20. 아이콘 패키지 의존 금지.
- 장식 아이콘은 `aria-hidden`, 의미 있는 아이콘 버튼은 `aria-label`.

## 7. 반응형

- 375px에서 가로 스크롤 0. 표·코드는 안쪽 스크롤 또는 줄바꿈.
- 오버레이는 좁은 화면에서 하단 시트로 바뀔 수 있게 변형 제공.

## 8. 글(문서·데모 문구)

- 짧게, 평소 말투. 데모 문구도 실제 쓰임새처럼(lorem ipsum 금지).
- 수치는 측정값만. 측정 전이면 "목표".
