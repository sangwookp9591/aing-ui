# aing Rust CLI

사용법·MCP 연결·로컬 개발은 [npm 패키지 README](../npm/aing/README.md)를 확인하세요. 작업 결과와 실제 검증 기록은 [CLI 보고서](../.verify/REPORT-CLI.md)에 있습니다.

`build.rs`는 저장소 레지스트리와 현재 컴포넌트 소스를 실행 파일에 포함합니다. `catalog.json`은 문서 카탈로그에서 가져온 릴리스 메타데이터 스냅샷이고 `m1-size.json`은 표시용 크기 스냅샷입니다. 현재 번들 크기는 `aing size`로 측정합니다. 네트워크 없이도 기본 검색·코드 조회가 가능하며 core npm 의존성 설치에는 패키지 레지스트리 또는 명시적 로컬 tarball이 필요합니다.
