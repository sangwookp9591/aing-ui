import type { CatalogItem } from "./index";
export const display: CatalogItem[] = [
{
  "name": "tabs",
  "title": "Tabs",
  "ko": "관점을 바꾸는 작은 전환",
  "imports": "Tabs, TabsList, TabsTrigger, TabsContent",
  "description": "스프링 활성 표시와 부드러운 패널 전환. 방향키·Home·End 탐색을 지원합니다.",
  "props": [
    [
      "value? / defaultValue?",
      "string",
      "제어 / 비제어 활성 탭"
    ],
    [
      "onValueChange?",
      "(value: string) => void",
      "사람과 도구가 공유하는 선택 콜백"
    ],
    [
      "orientation? / activationMode?",
      "horizontal | vertical / automatic | manual",
      "Radix 탐색 옵션"
    ],
    [
      "TabsTrigger.value / disabled?",
      "string / boolean",
      "값과 비활성 탭"
    ]
  ],
  "tools": [
    [
      "select_<label>",
      "value: 활성화된 TabsTrigger.value enum",
      "탭 선택. 비활성·알 수 없는 값 거부"
    ]
  ],
  "code": "<Tabs defaultValue=\"account\" aria-label=\"Settings\">\n  <TabsList><TabsTrigger value=\"account\">Account</TabsTrigger><TabsTrigger value=\"activity\">Activity</TabsTrigger></TabsList>\n  <TabsContent value=\"account\">내 계정</TabsContent>\n  <TabsContent value=\"activity\">최근 활동</TabsContent>\n</Tabs>"
, "demo": () => import("@/components/demos/tabs")},
{
  "name": "accordion",
  "title": "Accordion",
  "ko": "필요한 만큼, 차분히 펼치기",
  "imports": "Accordion, AccordionItem, AccordionTrigger, AccordionContent",
  "description": "높이 스프링과 화살표 회전. 단일·다중 펼치기를 그대로 지원합니다.",
  "props": [
    [
      "type",
      "single | multiple",
      "단일 또는 다중 항목"
    ],
    [
      "value? / defaultValue?",
      "string | string[]",
      "제어 / 비제어 펼친 값"
    ],
    [
      "onValueChange?",
      "(value: string | string[]) => void",
      "type에 맞는 콜백"
    ],
    [
      "collapsible? / disabled?",
      "boolean",
      "single 접기 허용 / 전체 비활성"
    ],
    [
      "AccordionItem.value / disabled?",
      "string / boolean",
      "항목 값 / 비활성"
    ]
  ],
  "tools": [
    [
      "toggle_<label>_<item>",
      "없음",
      "각 항목 펼치기·접기. 비활성 항목 거부"
    ]
  ],
  "code": "<Accordion type=\"single\" collapsible defaultValue=\"ownership\">\n  <AccordionItem value=\"ownership\">\n    <AccordionTrigger>코드는 누가 소유하나요?</AccordionTrigger>\n    <AccordionContent>설치한 프로젝트가 소유합니다.</AccordionContent>\n  </AccordionItem>\n</Accordion>"
, "demo": () => import("@/components/demos/accordion")},
{
  "name": "badge",
  "title": "Badge",
  "ko": "한눈에 읽히는 작은 상태",
  "imports": "Badge, badgeVariants",
  "description": "작은 배지에 진입과 hover 모션을 더했습니다.",
  "props": [
    [
      "variant?",
      "default | secondary | destructive | outline",
      "shadcn 변형 이름"
    ],
    [
      "asChild?",
      "boolean",
      "링크 등 자식 요소로 합성"
    ],
    [
      "children / className?",
      "ReactNode / string",
      "표시 내용 / 스타일"
    ]
  ],
  "tools": [
    [
      "read_badge_<label>",
      "없음",
      "label·variant 읽기 · readOnly, untrustedContent"
    ]
  ],
  "code": "<div className=\"flex gap-2\">\n  <Badge>Published</Badge>\n  <Badge variant=\"secondary\">In review</Badge>\n  <Badge variant=\"outline\">React 19</Badge>\n</div>"
, "demo": () => import("@/components/demos/badge")},
{
  "name": "avatar",
  "title": "Avatar",
  "ko": "함께하는 사람들의 얼굴",
  "imports": "Avatar, AvatarImage, AvatarFallback, AvatarGroup",
  "description": "로드 시 fade와 스프링 hover. 그룹에 포인터를 올리면 겹침이 펼쳐집니다.",
  "props": [
    [
      "Avatar.children / aria-label?",
      "ReactNode / string",
      "프로필 합성과 접근 가능한 이름"
    ],
    [
      "AvatarImage.src / alt",
      "string / string",
      "이미지와 대체 텍스트"
    ],
    [
      "AvatarFallback.delayMs?",
      "number",
      "Radix 폴백 지연"
    ],
    [
      "AvatarGroup.children",
      "ReactNode",
      "겹친 아바타 그룹"
    ]
  ],
  "tools": [
    [
      "read_avatar_<label>",
      "없음",
      "프로필 라벨 읽기 · readOnly, untrustedContent"
    ]
  ],
  "code": "<AvatarGroup>\n  <Avatar aria-label=\"Min Kim\"><AvatarImage src=\"/avatar.png\" alt=\"Min Kim\" /><AvatarFallback>MK</AvatarFallback></Avatar>\n  <Avatar aria-label=\"Jin Lee\"><AvatarFallback>JL</AvatarFallback></Avatar>\n</AvatarGroup>"
, "demo": () => import("@/components/demos/avatar")},
{
  "name": "separator",
  "title": "Separator",
  "ko": "내용 사이, 작은 숨표",
  "imports": "Separator",
  "description": "1px 구분선이 opacity와 scale로 드러납니다. 장식용 선은 도구를 등록하지 않습니다.",
  "props": [
    [
      "orientation?",
      "horizontal | vertical",
      "기본 horizontal; vertical은 부모 높이 필요"
    ],
    [
      "decorative?",
      "boolean",
      "기본 true. false면 읽기 도구 등록"
    ],
    [
      "aria-label? / className?",
      "string",
      "구역 의미 / 스타일"
    ]
  ],
  "tools": [
    [
      "read_separator_<label>",
      "없음",
      "decorative=false일 때 orientation·label 읽기 · readOnly"
    ]
  ],
  "code": "<div>\n  <p>Project details</p>\n  <Separator decorative={false} aria-label=\"Project details\" className=\"my-4\" />\n  <p>Design · Develop · Share</p>\n</div>"
, "demo": () => import("@/components/demos/separator")},
{
  "name": "skeleton",
  "title": "Skeleton",
  "ko": "기다림도 자연스럽게",
  "imports": "Skeleton",
  "description": "진입 fade와 은은한 shimmer. reduced-motion에서는 정지합니다. 접근성에서 숨긴 로딩 자리라 도구를 등록하지 않습니다.",
  "props": [
    [
      "className?",
      "string",
      "크기·형태 지정"
    ],
    [
      "HTMLMotionProps<div>",
      "object",
      "표준 div·모션 속성"
    ]
  ],
  "tools": [
    [
      "등록하지 않음",
      "해당 없음",
      "표시 전용 로딩 자리. 부모 aria-busy와 role=status를 사용"
    ]
  ],
  "code": "<div aria-busy=\"true\" className=\"space-y-3\">\n  <span role=\"status\" className=\"sr-only\">불러오는 중</span>\n  <Skeleton className=\"h-32 w-full\" />\n  <Skeleton className=\"h-4 w-3/4\" />\n</div>"
, "demo": () => import("@/components/demos/skeleton")},
{
  "name": "progress",
  "title": "Progress",
  "ko": "완성에 한 걸음 더 가까이",
  "imports": "Progress",
  "description": "채움은 스프링으로, 미정 상태는 이동·opacity로. 보이는 진행률만 읽기 도구로 제공합니다.",
  "props": [
    [
      "value?",
      "number | null",
      "기본 null: indeterminate. 유한 수는 0~max로 보정"
    ],
    [
      "max?",
      "number",
      "기본 100. 양의 유한 수"
    ],
    [
      "aria-label? / getValueLabel?",
      "string / (value, max) => string",
      "접근 가능한 이름 / 안내"
    ]
  ],
  "tools": [
    [
      "read_progress_<label>",
      "없음",
      "value·max·indeterminate 읽기 · readOnly"
    ]
  ],
  "code": "<div className=\"space-y-4\">\n  <Progress value={42} aria-label=\"Release readiness\" />\n  <Progress value={null} aria-label=\"Preparing files\" />\n</div>"
, "demo": () => import("@/components/demos/progress")},
{
  "name": "breadcrumb",
  "title": "Breadcrumb",
  "ko": "지나온 길을 자연스럽게",
  "imports": "Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis",
  "description": "경로 진입과 구분자 이동. 현재 위치와 실제 링크 목록을 읽습니다.",
  "props": [
    [
      "Breadcrumb.children / aria-label?",
      "ReactNode / string",
      "nav 합성과 라벨"
    ],
    [
      "BreadcrumbLink.href / asChild?",
      "string / boolean",
      "기본 링크 또는 Next Link 합성"
    ],
    [
      "BreadcrumbPage.children",
      "ReactNode",
      "aria-current=page 현재 위치"
    ]
  ],
  "tools": [
    [
      "read_breadcrumb_<label>",
      "없음",
      "현재 경로 label·href·current 읽기 · readOnly, untrustedContent. 이동하지 않음"
    ]
  ],
  "code": "<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href=\"/\">Home</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>Components</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>"
, "demo": () => import("@/components/demos/breadcrumb")},
{
  "name": "pagination",
  "title": "Pagination",
  "ko": "다음 페이지로, 가볍게",
  "imports": "Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis",
  "description": "활성 표시가 이동하고 링크가 반응합니다. 기본 앵커와 제어 상태 방식을 모두 지원합니다.",
  "props": [
    [
      "page? / pageCount?",
      "number / number",
      "제어 모드 현재 페이지 / 전체 수(기본 1)"
    ],
    [
      "onPageChange?",
      "(page: number) => void",
      "있으면 go_to_page 도구 등록"
    ],
    [
      "PaginationLink.page? / isActive?",
      "number / boolean",
      "상태 콜백 이동 / 활성 표시"
    ],
    [
      "PaginationLink.href / asChild? / size?",
      "string / boolean / default | sm | lg | icon",
      "앵커·합성·크기. 수정키 클릭 보존"
    ]
  ],
  "tools": [
    [
      "go_to_page_<label>",
      "page: integer 1~pageCount",
      "onPageChange가 있을 때 페이지 이동. 경계·소수 거부"
    ]
  ],
  "code": "<Pagination page={page} pageCount={5} onPageChange={setPage}>\n  <PaginationContent>\n    {[1, 2, 3, 4, 5].map(n => <PaginationItem key={n}>\n      <PaginationLink href={`?page=${n}`} page={n}>{n}</PaginationLink>\n    </PaginationItem>)}\n  </PaginationContent>\n</Pagination>"
, "demo": () => import("@/components/demos/pagination")},
{
  "name": "table",
  "title": "Table",
  "ko": "정보가 제자리를 찾는 곳",
  "imports": "Table, TableHeader, TableHead, TableBody, TableCell, TableRow, TableCaption, TableFooter",
  "description": "헤어라인 표에 셀 진입·hover 모션. 표 영역 안에서만 가로 스크롤합니다.",
  "props": [
    [
      "Table.children / aria-label?",
      "ReactNode / string",
      "표 합성과 접근 가능한 라벨"
    ],
    [
      "TableCell.colSpan / TableHead.scope",
      "number / col | row",
      "표준 HTML 표 속성. scope 기본 col"
    ],
    [
      "TableCaption.children",
      "ReactNode",
      "표 설명"
    ]
  ],
  "tools": [
    [
      "read_table_<label>",
      "없음",
      "caption·현재 렌더링된 rows 읽기 · readOnly, untrustedContent. hidden/aria-hidden 행 제외"
    ]
  ],
  "code": "<Table aria-label=\"Invoices\">\n  <TableCaption>최근 결제 내역</TableCaption>\n  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>\n  <TableBody><TableRow><TableCell>INV-001</TableCell><TableCell>$250.00</TableCell></TableRow></TableBody>\n</Table>"
, "demo": () => import("@/components/demos/table")},
{
  "name": "kbd",
  "title": "Kbd",
  "ko": "흐름을 이어 주는 단축키",
  "imports": "Kbd, KbdGroup",
  "description": "키캡 진입과 hover 모션. 키 입력을 실행하지 않고 설명만 읽습니다.",
  "props": [
    [
      "children / aria-label?",
      "ReactNode / string",
      "키 표시 / 읽을 이름"
    ],
    [
      "KbdGroup.children",
      "ReactNode",
      "키 조합을 묶는 span"
    ]
  ],
  "tools": [
    [
      "read_shortcut_<label>",
      "없음",
      "shortcut 읽기 · readOnly, untrustedContent. 키 바인딩·실행 없음"
    ]
  ],
  "code": "<KbdGroup>\n  <Kbd aria-label=\"Command\">⌘</Kbd><Kbd>K</Kbd>\n</KbdGroup>"
, "demo": () => import("@/components/demos/kbd")},
];
