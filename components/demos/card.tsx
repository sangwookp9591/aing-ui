"use client";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/registry/aing/ui/card";
import { FileCode2,Folder } from "lucide-react";
import { useState } from "react";

export default function ComponentDemo({ compact = false }: {compact?: boolean}) {
  const [saved, setSaved] = useState(false);

  return <div className="w-full max-w-[390px] space-y-3"><Card spotlight toolName="card_demo" actions={[{ id: "save", label: saved ? "저장됨 ✓" : "프로젝트에 저장", onSelect: () => setSaved((old) => !old) }]}>
      <CardHeader><div className="mb-4 flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg border bg-muted/50"><Folder aria-hidden size={17} /></span><span className="rounded-md border px-2 py-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 01</span></div><CardTitle>다음 아이디어를 위한 공간</CardTitle><CardDescription>필요한 코드를 가져와 나만의 제품으로.</CardDescription></CardHeader>
      <CardContent><div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground"><FileCode2 aria-hidden size={13} /><span>5 components</span><span className="ml-auto font-mono text-[10px]">TypeScript</span></div><p role="status" className="mt-3 text-xs">{saved ? "아이디어를 저장했어요." : "아직 저장하지 않았어요."}</p></CardContent>
    </Card>{!compact && <Card toolName="card_readonly"><CardHeader><CardTitle>읽기 전용 카드</CardTitle><CardDescription>작업이 없으면 제목과 설명을 도구로 읽습니다.</CardDescription></CardHeader></Card>}</div>;
}
