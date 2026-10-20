# M1 2차 수정 — 재검수 반려 반영 (Button 83 · Dialog 75 · Select 81, 통과선 85)

작업 폴더 `/Users/iron/Project/psw/aing-ui`. 커밋·푸시 금지. `cli/`·`npm/`은 건드리지 마라(단, core API가 바뀌어 CLI 테스트가 깨지면 보고만). 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 끝까지.
이 저장소의 `.codex/config.toml`이 fast 모드를 끈다 — 바꾸지 마라.

## 먼저 읽을 것
- 재검수 보고서 3개(**고칠 목록 전부 처리**): `.verify/advisor/button/r2/REPORT.md`, `.verify/advisor/dialog/r2/REPORT.md`, `.verify/advisor/select/r2/REPORT.md`, 그리고 상세 증거 폴더 `.verify/advisor/button/r2/`, `.verify/advisor2/dialog/`, `.verify/advisor/select/r2/`의 compare.png·frames.json·metrics.json.
- `docs/ROADMAP.md` 결정 기록 — **새로 추가된 세 항목**(행동은 core·모양은 복사 파일 / 모달 바깥 도구 해제 / 읽히는 도구 이름)이 이번 작업의 설계 기준.
- 1차: `SPEC-M1-fix.md`, `.verify/REPORT-M1-fix.md`.

**기준선: 21st.dev 같은 종류 추천 상위와 동등 이상. 원칙: 1차적으로 예뻐야 한다.** 이번이 Dialog 두 번째 반려라 모델 등급을 올렸다. 깊게 원인을 보고 고쳐라.

## 최우선 (보안·구조)
1. **모달 바깥 도구 차단** (Dialog 1): 열린 modal `<dialog>`나 `inert` 바깥의 도구는 등록 해제, `executeTool` 시점에도 다시 검사해 거부(에러 메시지에 이유). core `webmcp`/`react` 공용 로직. 회귀 테스트: AlertDialog가 열린 동안 바깥 도구 목록 0·실행 거부, 닫히면 복귀.
2. **읽히는 도구 이름** (Button 2, Dialog 4, Select N4): `\u` 이스케이프 금지. 우선순위 `toolName` > 라벨의 ASCII 부분 > 컴포넌트 의미 이름(`open_dialog`, `choose_region` 형태 — 라벨이 한글뿐이면 컴포넌트 종류 + 짧은 slug/순번). 의미는 description에 원문 라벨 그대로, Select enum은 `value = 보이는 이름` 대응을 description에. 문서 표와 실제 이름 일치.
3. **중복 도구 제거** (Dialog 5): DialogTrigger·DialogClose(X 포함)는 Button click 도구를 따로 등록하지 않고 open/close 하나로.
4. **행동을 core로** (Dialog 8, Select N5): Dialog·Select의 로직(두 판에 ~180–190줄 중복)을 `@aing/core/dialog`, `@aing/core/select` 하위 모듈로 옮기고 CSS판·Tailwind판은 모양(클래스 매핑)만. Button처럼. 기반 6모듈 합계 ≤ 6KB 유지(지금 5872B — webmcp 1498/1500B라 여유 없음: 이름 로직 바꾸며 **반드시 줄여라**), 컴포넌트 행동 모듈은 컴포넌트 'core 포함' 크기에 합산해 G6 예산 내.

## 시각·모션
- Button: CSS판 :active scale이 hover translate에 덮이는 회귀(개별 `translate`/`scale` 속성으로), 두 판 hover·aria-disabled 결과 일치, 다크 destructive 진한 빨강+흰 글자(4.5:1), 레이어 밖 `button{cursor}` 리셋을 `@layer base`로(+ 소비 앱 레이어 순서 안내), CSS 원본 100자 포맷.
- Dialog: 640px 이하 시트 폭 꽉(`max-width:none`/`max-sm:max-w-none`) + 아래에서 올라오는 진입(퇴장과 대칭), Tailwind판 transition에 translate·scale 추가(닫을 때 튐), 긴 내용 스크롤 경계(스크롤 중일 때만 1px 선 또는 페이드), 640 기준 두 판 동일, annotations와 문서 일치, 데모 footer 버튼 44px.
- Select: Tailwind 레지스트리 css에 토큰 포함 + compat에 "Tailwind판만 새 설치" 경우 추가(N1), 열린 목록 강조 하나(N2 — hover가 포커스를 옮기거나 focus-visible에만 배경, 생성기 빈 @media 정리), 로딩 스피너 회전·색·정렬(N3), SelectContent의 무시되는 props 정리(N6).
- 공통: CSS 원본도 100자 포맷, 데모 heading-order 해소.

## 끝내기 전에
`pnpm gate`(G5 프레임은 ROADMAP대로 하드웨어 GPU 판정 — 자동화 SwiftShader 값은 참고로만 기록), `pnpm size`(기반 6모듈 합계, 컴포넌트별 core 포함), `cargo test`(cli, core API 변경 영향 확인만). 각 컴포넌트 1440·375·다크·상태 크롭 + **재검수 때와 같은 21st 레퍼런스로 새 compare** → `.verify/fix2/<name>/`. 보고서 `.verify/REPORT-M1-fix2.md`에 재검수 항목 번호별 처리. worker_done 요약 세 문장. 판정은 어드바이저가 다시 한다.
