# aing

복사한 React 컴포넌트는 프로젝트에 남기고, 공통 동작은 `@aing/core`로 관리합니다. 네이티브 Rust CLI와 stdio MCP 서버를 같은 실행 파일로 제공합니다.

이 체크아웃은 **배포 전**입니다. `aing`, 플랫폼 패키지와 `@aing/core@0.1.0`을 공개한 뒤 아래 `npx` 예제가 동작합니다. 이번 작업에서는 publish하지 않았습니다. 현재 로컬 사용법은 아래 개발 절을 따르세요.

```sh
npx aing init
npx aing add button dialog select
npx aing search 버튼
npx aing diff button
npx aing sync
npx aing size --budget
npx aing check
```

React 19 이상, Node 22.22 이상이 필요합니다. Next(App/Pages), Vite, React Router의 진입점·`src`·Tailwind·패키지 매니저를 감지합니다. `init`이 `aing.json`, 토큰 CSS와 진입점의 CSS import를 만들고 core를 설치합니다. CSS가 기본이며 Tailwind 프로젝트에서는 `init --style tailwind` 또는 `add --style tailwind`를 선택할 수 있습니다. TS import는 oxc AST로 읽고 설치 대상에 맞는 상대 경로로 바꾸므로 Vite에 별칭 설정을 추가할 필요가 없습니다.

| 명령 | 결과 |
| --- | --- |
| `init [--registry URL_OR_PATH] [--style css\|tailwind]` | 감지 결과와 설치 경로를 `aing.json`에 저장 |
| `add <name...> [--style css\|tailwind] [--dry-run] [--overwrite]` | 재귀 레지스트리 의존성, 소스, CSS, npm 의존성 설치 |
| `list`, `search <query>` | 이름·카테고리·태그·한글 별칭 검색; 대소문자·띄어쓰기·하이픈 무시 |
| `diff <name>` | 설치 파일과 현재 레지스트리의 unified diff를 JSON으로 출력 |
| `sync` | `.aing/base` 원본·로컬 수정·레지스트리 최신본의 3방향 병합 |
| `size [--budget]` | esbuild 번들·gzip 9, React 제외; 예산 모드에서 초과하면 exit 1 |
| `check` | 로컬 import와 npm 의존성, 토큰, core 버전, 충돌 표식 검사 |
| `mcp` | MCP stdio 서버; stdout에는 JSON-RPC만 출력 |

모든 명령은 `--cwd /absolute/project`를 지원합니다. `add --dry-run`은 파일과 패키지 매니저를 건드리지 않습니다. 수정한 파일은 `add`로 덮어쓰지 않으며 명시적인 `--overwrite`가 필요합니다. 업데이트에는 `sync`를 쓰세요. `.aing/base`와 `.aing/lock.json`을 프로젝트와 함께 보관해야 다음 병합이 가능합니다. 겹친 소스 수정은 충돌 표식을 남기고 exit 1로 종료합니다. 표식을 해결한 뒤 `sync`를 다시 실행하세요. 토큰 CSS의 사용자 수정도 3방향으로 보존하며, CSS 충돌이면 파일 쓰기를 시작하기 전에 실패합니다. 업스트림이 없앤 파일은 자동 삭제하지 않고 `retained_removed_files`로 알립니다.

기본 레지스트리 `embedded://aing`은 빌드 당시 소스·CSS·문서 메타데이터를 포함하므로 문서 서버 없이 설치됩니다. 원격 최신본으로 갱신하려면 `aing.json`의 `registry`를 배포한 `https://your-domain/r...` 인덱스 주소 또는 로컬 `registry.json`으로 지정하세요. `items` 또는 `components` 배열, inline `files[].content`, `css`, `cssVars`, `registryDependencies`를 읽습니다. shadcn 형식의 인덱스에서는 `<origin>/registry.json`과 `<origin>/r/<name>.json` 구성을 사용합니다. 임의 registry 실행 스크립트는 지원하지 않습니다. npm 의존성 설치는 해당 패키지 매니저의 일반 설치 정책을 따릅니다.

`size`는 npm 래퍼에 포함된 `esbuild@0.28.2`를 사용합니다. 저장소에서는 M1과 같은 소스·alias·external·압축 설정으로 측정합니다. 소비 프로젝트에서는 설치된 컴포넌트와 core의 배포 소스를 측정합니다. CLI 실행 파일만 사용할 때는 프로젝트에 esbuild가 있거나 `AING_ESBUILD_PATH`가 Node 모듈 경로를 가리켜야 합니다. MCP의 `get_component.size`는 명확히 표시된 M1 스냅샷이며 현재 크기 검사는 `size` 명령으로 수행합니다.

## MCP 연결

먼저 대상 프로젝트에서 `aing init`을 실행하세요. 서버는 실행 디렉터리에만 설치하며 `--cwd`로 이를 고정할 수 있습니다. `add_component`는 파일을 쓰고 패키지 매니저를 실행하는 도구입니다. `dry_run: true`로 먼저 확인할 수 있습니다. 나머지 도구는 읽기 전용입니다.

Claude Code:

```sh
claude mcp add aing -- npx aing mcp
```

Cursor 프로젝트 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aing": {
      "command": "npx",
      "args": ["-y", "aing", "--cwd", "/absolute/project", "mcp"]
    }
  }
}
```

VS Code Local harness `.vscode/mcp.json`:

```json
{
  "servers": {
    "aing": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "aing", "--cwd", "${workspaceFolder}", "mcp"]
    }
  }
}
```

Codex CLI는 JSON 설정 파일을 읽지 않고 TOML을 사용합니다. 지원되지 않는 JSON 설정 대신 공식 형식을 제공합니다:

```sh
codex mcp add aing -- npx -y aing --cwd /absolute/project mcp
```

`~/.codex/config.toml`의 동등한 설정:

```toml
[mcp_servers.aing]
command = "npx"
args = ["-y", "aing", "--cwd", "/absolute/project", "mcp"]
```

JSON으로 서버 정의를 전달하는 Codex 호스트/SDK에서는 다음 필드에 대응시킵니다. 이 객체는 Codex CLI용 설정 파일이 아닙니다:

```json
{
  "command": "npx",
  "args": ["-y", "aing", "--cwd", "/absolute/project", "mcp"]
}
```

| 도구 | 용도 |
| --- | --- |
| `list_categories` | 카테고리별 컴포넌트 수 |
| `search_components` | `{ "query": "버튼" }`으로 검색 |
| `get_component` | 코드, props, 스타일 변형, WebMCP 도구, 크기 스냅샷 |
| `get_variants` | 스타일 선택과 prop 변형 정의 |
| `get_usage` | import 이름과 React 예제 |
| `add_component` | `{ "names": ["button"], "dry_run": true }`으로 설치 계획; false면 실제 설치 |

공식 자료: [MCP stdio 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio), [Rust SDK](https://github.com/modelcontextprotocol/rust-sdk), [Cursor](https://cursor.com/docs/mcp), [VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers), [Codex MCP](https://developers.openai.com/codex/mcp/).

## 로컬 개발과 배포 아티팩트

저장소 루트에서:

```sh
cargo build --manifest-path cli/Cargo.toml --release --locked
cargo fmt --manifest-path cli/Cargo.toml --check
cargo clippy --manifest-path cli/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path cli/Cargo.toml
node --test npm/wrapper.test.cjs
```

core가 공개되기 전에는 빌드된 core를 tarball로 만들어 임시 앱에서 실제 설치할 수 있습니다:

```sh
npm pack ./packages/core --pack-destination .verify/cli
cd .verify/cli/your-app
AING_CORE_PACKAGE=/absolute/aing-ui/.verify/cli/aing-core-0.1.0.tgz /absolute/aing-ui/cli/target/release/aing init
/absolute/aing-ui/cli/target/release/aing add button dialog select
```

`AING_CORE_PACKAGE`는 로컬 검증용 명시적 설치 경로입니다. 레지스트리가 이 값을 지정할 수는 없습니다. npm 래퍼는 `AING_BINARY`로 로컬 실행 파일을 선택할 수 있습니다.

플랫폼별 optionalDependencies 패키지는 OS·CPU·Linux libc 필터를 가지며, 맞는 실행 파일 하나를 담습니다. `.github/workflows/cli-release.yml`을 수동 실행하면 macOS arm64/x64, Linux arm64/x64 GNU·musl, Windows arm64/x64 패키지 tarball을 만듭니다. 워크플로는 publish하지 않습니다. 현재 로컬에서 만들어 검증한 바이너리는 macOS arm64뿐이며 나머지 디렉터리는 워크플로용 manifest입니다.

shadcn 형식 레지스트리는 기존 shadcn CLI와도 호환됩니다. 기본 설치 도구는 aing입니다.
