# M2′ — `aing` CLI + MCP 서버 (Rust)

작업 폴더 `/Users/iron/Project/psw/aing-ui` 안의 **`cli/`(새 Rust 크레이트)와 `npm/`(배포 래퍼 패키지)만** 만든다. 그 밖의 파일은 읽기만 한다 — 같은 시간에 디자인 검수가 dev 서버(3210)로 문서 사이트를 보고 있으니 `app/`, `components/`, `registry/`, `packages/`를 고치지 마라. 커밋·푸시 금지. 사용자 지시가 이 문서·skill보다 우선한다. bias towards action — 끝까지.

## 먼저 읽을 것
`docs/ROADMAP.md`(결정 기록 — 특히 "shadcn을 내세우지 않는다", "MCP로 바로 연결", §4 G6·G9), `.verify/research-platform-guide.md` §11(Rust CLI 배포·oxc·npm optionalDependencies), `.verify/research-shadcn-weaknesses.md`(업데이트 동기화 불만 #790), 현재 `registry.json`·`registry/groups/*.json`·`public/r/*.json` 형식, `packages/core`(M1 결과), `scripts/size*`(M1 크기 측정).

Rust: 폴더의 `rust-toolchain.toml`이 1.99.1을 고정한다. 크레이트는 최신 안정 버전을 `cargo search`/crates.io로 확인해 고정. TS 파싱은 oxc(최신) — import 경로 변환에만 필요하면 정규식보다 oxc AST를 우선(정확성).

## 사용자 요구
- 설치는 처음부터 **우리 도구**로: `npx aing add <name>`. shadcn CLI는 호환 각주일 뿐.
- **MCP로 바로 연결해 쓸 수 있어야 한다.**
- 엄청 가볍고 빠르게. 코드 복사·컴파일 최소.

## 명령
| 명령 | 동작 |
|---|---|
| `aing init` | 프로젝트 감지(Next/Vite/React Router, src 유무, Tailwind 유무, 패키지 매니저) → `aing.json` 생성(별칭 `@/components/ui`, 스타일 `css`|`tailwind`, 레지스트리 주소), 토큰 CSS 설치, `@aing/core` 설치 |
| `aing add <name...>` | 레지스트리 JSON(자체 형식 + shadcn 형식 둘 다 읽기)에서 파일을 받아 별칭에 맞게 import 경로를 고쳐 쓰고, 의존(`@aing/core` 등)을 프로젝트의 패키지 매니저로 설치, CSS 변수 병합(중복 없이). `--style css|tailwind`, `--dry-run`, `--overwrite`. 이름은 대소문자·하이픈 무시(`Button`=`button`, `radio group`=`radio-group`) |
| `aing list` / `aing search <q>` | 카테고리·태그·별칭(한글 포함)으로 검색 |
| `aing diff <name>` | 설치본과 레지스트리 최신본 비교 |
| `aing sync` | **3방향 병합**: 설치 당시 원본(`.aing/base/`에 보관) · 내 수정본 · 최신본 → 내 수정을 지키며 갱신, 충돌은 표시 |
| `aing size [--budget]` | 컴포넌트·core gzip 측정(React 제외), 예산 초과 시 exit 1 — M1의 TS 측정과 같은 결과가 나와야 함 |
| `aing check` | 설치본의 import·토큰·core 버전 점검 |
| `aing mcp` | **stdio MCP 서버**(아래) |

## MCP 서버 (`aing mcp`)
- MCP 최신 사양(context7로 Model Context Protocol 사양·Rust SDK `rmcp` 최신 확인)대로 stdio. 도구:
  `list_categories`, `search_components`(이름·태그·별칭, 대소문자 무시), `get_component`(코드·props·변형·WebMCP 도구·크기), `get_variants`, `get_usage`, `add_component`(현재 작업 디렉터리 프로젝트에 설치 — `aing add`와 같은 코드 경로, `dry_run` 지원).
- 도구 설명은 에이전트가 고르기 쉽게. 쓰기 동작(`add_component`)은 명확히 표시.
- 연결 예시 설정을 README에: Claude Code(`claude mcp add aing -- npx aing mcp`), Cursor·Codex·VS Code의 JSON.
- **실제 연결 검증**: Claude Code CLI가 있으면 임시 프로젝트에서 `claude mcp add`로 붙여 `search_components` → `add_component` 한 번(가능하면 `claude -p` 비대화형으로). 없으면 MCP Inspector 또는 직접 JSON-RPC로 검증하고 그 사실을 보고.

## 배포 형태
- `npm/aing`(메타 패키지, `bin` 래퍼) + `npm/aing-darwin-arm64` 등 플랫폼 패키지(optionalDependencies) 구조를 만든다. 지금은 로컬 macOS arm64 빌드만 실제로 만들고, 다른 플랫폼은 GitHub Actions 크로스 빌드 워크플로(`.github/workflows/cli-release.yml`)로 — 실행은 안 해도 됨. npm publish 금지.
- 바이너리 크기·`aing add button` 실행 시간(콜드) 측정해 보고.

## 검증
1. `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`(이름 정규화, 경로 변환, CSS 병합, 3방향 병합 충돌, MCP 도구 스키마).
2. 새 Next 16 앱과 Vite 앱(`.verify/cli/` 아래, 끝나면 node_modules 삭제 — 디스크 여유가 적다)에 `aing init` → `aing add button dialog select` → build·tsc 통과, 추가 설정 0.
3. `aing sync`: 설치 후 Button을 손으로 고치고 레지스트리 쪽을 바꾼 뒤 sync → 내 수정 보존 확인.
4. `aing size` 결과가 `.verify/m1-size.json`과 일치(±2%).
5. MCP 실제 연결 검증(위).
결과 `.verify/REPORT-CLI.md`. 실패는 실패로. worker_done 요약 세 문장.
