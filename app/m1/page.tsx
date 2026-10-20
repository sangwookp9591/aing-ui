import { Button } from '@/registry/aing/ui/button';
import { M1Fixture } from '@/components/m1-fixture';
export default function M1() {
  return <main id="main" className="mx-auto grid max-w-5xl gap-8 px-5 py-12"><header><p className="font-mono text-xs text-muted-foreground">AING / PLATFORM PRIMITIVES</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">작은 동작, 선명한 흐름.</h1><p className="mt-3 text-sm text-muted-foreground">버튼을 누르고, 선택하고, 필요한 대화만 열어보세요.</p></header><div data-testid="server-button"><Button variant="link">서버에서 렌더한 버튼</Button></div><M1Fixture /></main>;
}
