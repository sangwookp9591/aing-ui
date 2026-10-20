"use client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/registry/aing/ui/accordion";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  return <div className="w-full rounded-xl border bg-card px-5"><div className="border-b py-4"><p className="font-mono text-[10px] text-muted-foreground">GOOD TO KNOW</p><p className="mt-1 text-[18px] font-semibold tracking-tight">작은 질문, 명확한 답.</p></div><Accordion type="single" collapsible defaultValue="ownership" toolName="accordion_demo">{[
    ["ownership", "컴포넌트는 누가 소유하나요?", "설치하면 코드가 내 프로젝트에 들어옵니다. 원하는 스타일과 동작으로 자유롭게 바꿔 보세요."],
    ["agents", "에이전트도 사용할 수 있나요?", "네. 사람이 누르는 버튼과 같은 동작을 WebMCP 도구로 제공합니다. webmcp={false}로 끌 수 있습니다."],
    ["motion", "움직임을 줄일 수 있나요?", "운영체제의 모션 줄이기를 따르며, 키보드 탐색에서는 전환을 즉시 표시합니다."],
  ].slice(0, compact ? 2 : 3).map(([value, title, content]) => <AccordionItem value={value} key={value}><AccordionTrigger>{title}</AccordionTrigger><AccordionContent>{content}</AccordionContent></AccordionItem>)}</Accordion></div>;
}
