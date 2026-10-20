import { CopyPage } from "@/components/copy-page";
import { CodeBlock } from "@/components/copy-button";
import { Sidebar } from "@/components/site-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, getComponent } from "@/lib/catalog";
import { Demo } from "@/components/demo";
import { InstallCommand } from "@/components/install-command";
export function generateStaticParams() {
  return catalog.map((item) => ({ name: item.name }));
}
export const dynamicParams = false;
export default async function Docs({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const item = getComponent(name);
  if (!item) notFound();
  return (
    <main
      id="main"
      className="mx-auto grid max-w-[1440px] gap-8 px-5 pt-9 sm:px-10 lg:grid-cols-[180px_minmax(0,1fr)_150px] lg:gap-12"
    >
      <aside
        aria-label="컴포넌트 목록"
        className="lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2 [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        <Link href="/" className="mb-8 hidden text-[11px] text-muted-foreground lg:inline-block">
          ← 모든 컴포넌트
        </Link>
        <Sidebar name={name} />
        <div className="mt-12 hidden border-t pt-5 lg:block">
          <p className="text-xs font-medium">내 앱의 색을 그대로.</p>
          <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
            shadcn 표준 토큰으로 기존 테마와 자연스럽게 연결됩니다.
          </p>
        </div>
      </aside>
      <article className="min-w-0">
        <div className="mb-9">
          <p className="mb-4 font-mono text-[9px] leading-5 tracking-wide text-muted-foreground">
            AING-0{catalog.findIndex((c) => c.name === name) + 1} · WebMCP · Updated 2026-10-20
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-[-.055em] sm:text-[44px]">
              {item.title}
            </h1>
            <CopyPage name={name} />
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {item.ko}. {item.description}
          </p>
        </div>
        {item.platform && (
          <p className="mb-5 text-xs text-muted-foreground">
            {item.serverComponent
              ? "정적 본체: 서버 컴포넌트 · WebMCP: 클라이언트 섬. 이벤트 콜백은 클라이언트에서 사용하세요."
              : "상태·콜백 연결: 클라이언트 컴포넌트. 브라우저 내장 입력과 모달 동작을 사용합니다."}
          </p>
        )}
        <section id="preview" aria-label="미리보기">
          <Demo key={name} name={name} />
        </section>
        <section id="installation" className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">설치</h2>
          <InstallCommand name={name} />
          <p className="text-sm leading-7 text-muted-foreground">
            {item.platform
              ? "React 19 이상. 기본판은 순수 CSS로 동작하며 -tailwind 항목은 Tailwind v4판입니다. 공유 @aing/core 패키지를 사용합니다."
              : "Tailwind CSS v4 프로젝트에 설치하세요. 공용 WebMCP 훅이 함께 설치되며, 앱의 shadcn 테마 토큰을 사용합니다."}
          </p>
        </section>
        <section id="usage" className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">사용 예</h2>
          <CodeBlock
            code={`'use client';\nimport { ${item.imports} } from '@/components/ui/${name}';\n\n${item.code}`}
          />
          <p className="text-xs leading-6 text-muted-foreground">
            이 예시는 JSX 사용법입니다. 상태와 콜백은 앱에서 정의하세요. 실제 동작은 위 미리보기에서
            확인할 수 있어요.
          </p>
        </section>
        <Table
          title="Props"
          headings={["속성", "타입", "설명"]}
          rows={[
            ...item.props,
            [
              "webmcp?",
              "false | {name?, description?}",
              "동작·이름이 있으면 자동 등록 · false로 해제",
            ],
            ["toolName?", "string", "도구 이름의 기준값 · 충돌 시 자동 접미사"],
            ["className / ref", "string / React.Ref", "스타일 확장과 DOM 참조"],
          ]}
        />
        <Table
          title="WebMCP 도구"
          headings={["도구 이름", "입력", "동작·힌트"]}
          rows={item.tools}
        />
        {name === "dialog" && (
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            일반 Dialog의 destructive 트리거는 열기도 consequentialHint:true입니다. AlertDialog는
            열기에 이를 상속하지 않고 AlertDialogAction의 확정 도구에만 적용합니다. *
            destructiveHint는 aing 정의에만 보관되며 현재 네이티브 getTools에는 노출되지 않습니다.
          </p>
        )}
        {name === "button" && (
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            한글 전용 라벨은 name·value·연결된 form의 id에서 ASCII 의미 이름을 찾습니다. 없으면
            click_button과 충돌 접미사를 사용합니다. 안정적인 이름은 toolName=&quot;save_changes&quot;처럼
            명시하세요.
          </p>
        )}
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          도구 이름은 toolName, webmcp.name, 라벨의 ASCII 부분, 컴포넌트 의미 이름 순입니다. 원문
          라벨과 Select의 value = 화면 이름 대응은 설명에 유지합니다. Button·Dialog·Select는 동작과
          이름이 있을 때 등록되고 disabled·loading·hidden·inert와 열린 모달 바깥에서는 해제됩니다.
          Dialog는 열기·닫기 접미사를 붙입니다. 힌트는 권한 검증을 대체하지 않습니다.
        </p>
      </article>
      <aside
        aria-label="현재 페이지 목차"
        className="hidden self-start xl:sticky xl:top-9 xl:max-h-[calc(100dvh-4.5rem)] xl:overflow-y-auto xl:overscroll-contain lg:block"
      >
        <p className="mb-5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          On this page
        </p>
        <nav
          aria-label="페이지 목차"
          className="space-y-4 border-l pl-4 text-[11px] text-muted-foreground"
        >
          <a className="block hover:text-foreground" href="#preview">
            미리보기
          </a>
          <a className="block hover:text-foreground" href="#installation">
            설치
          </a>
          <a className="block hover:text-foreground" href="#usage">
            사용 예
          </a>
          <a className="block hover:text-foreground" href="#props">
            Props
          </a>
          <a className="block hover:text-foreground" href="#webmcp">
            WebMCP 도구
          </a>
        </nav>
        <p className="mt-8 border-t pt-4 font-mono text-[9px] leading-6 text-muted-foreground">
          SOURCE OWNED.
          <br />
          AGENT CONNECTED.
        </p>
      </aside>
    </main>
  );
}
function Table({
  title,
  headings,
  rows,
}: {
  title: string;
  headings: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <section id={title === "Props" ? "props" : "webmcp"} className="mt-10">
      <h2 className="mb-5 text-lg font-semibold tracking-tight">{title}</h2>
      <table className="w-full table-fixed border-collapse text-left text-xs leading-6">
        <thead>
          <tr>
            {headings.map((h) => (
              <th key={h} className="border-b border-border p-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className="break-words border-b border-border p-2 align-top [overflow-wrap:anywhere]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
