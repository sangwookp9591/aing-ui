"use client";
import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/aing/ui/breadcrumb";
import { FolderOpen } from "lucide-react";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  const [replay, setReplay] = useState(0);
  return <div className="w-full rounded-xl border bg-card p-5"><Breadcrumb key={replay} toolName="breadcrumb_demo"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/docs/tabs">Components</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><div className="mt-5 border-t pt-5"><FolderOpen size={24} strokeWidth={1.3} className="mb-3 text-muted-foreground" /><h3 className="text-[21px] font-semibold tracking-tight">Always find your way.</h3><p className="mt-2 text-[13px] leading-6 text-muted-foreground">지금 위치와 지나온 경로를 자연스럽게 연결합니다.</p>{!compact && <p className="mt-5 font-mono text-[10px] text-muted-foreground">HOME / COMPONENTS / BREADCRUMB</p>}</div>{!compact && <button type="button" className="mt-4 rounded-md border px-3 py-2 text-[12px] hover:bg-muted" onClick={() => setReplay(value => value + 1)}>Replay reveal</button>}</div>;
}
