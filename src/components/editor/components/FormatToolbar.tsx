'use client'

import type { EditorView } from '@codemirror/view'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  SquareCode,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Sigma,
  GitBranch,
  Minus,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCommands, type FormatCommandName } from '@/lib/editor/formatCommands'
import { cn } from '@/lib/utils'

interface FormatToolbarProps {
  view: EditorView | null
  /** 打开图片管理弹窗（对齐 Pro：上传 / 图片链接 / 图片库 / 图床设置） */
  onOpenImageManager?: () => void
  className?: string
}

type ToolItem = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  command?: FormatCommandName
  action?: () => void
}

const LEFT_GROUP: ToolItem[] = [
  { icon: Bold, title: '粗体 (Ctrl+B)', command: 'bold' },
  { icon: Italic, title: '斜体 (Ctrl+I)', command: 'italic' },
  { icon: Underline, title: '下划线 (Ctrl+U)', command: 'underline' },
  { icon: Strikethrough, title: '删除线 (Ctrl+Shift+X)', command: 'strikethrough' },
  { icon: Code, title: '行内代码 (Ctrl+`)', command: 'inlineCode' },
  { icon: SquareCode, title: '代码块 (Ctrl+Shift+C)', command: 'codeBlock' },
]

const HEADING_GROUP: ToolItem[] = [
  { icon: Heading1, title: '一级标题 (Ctrl+1)', command: 'h1' },
  { icon: Heading2, title: '二级标题 (Ctrl+2)', command: 'h2' },
  { icon: Heading3, title: '三级标题 (Ctrl+3)', command: 'h3' },
]

const LIST_GROUP: ToolItem[] = [
  { icon: List, title: '无序列表 (Ctrl+Shift+8)', command: 'bulletList' },
  { icon: ListOrdered, title: '有序列表 (Ctrl+Shift+7)', command: 'orderedList' },
  { icon: Quote, title: '引用 (Ctrl+Shift+9)', command: 'quote' },
]

const INSERT_GROUP: ToolItem[] = [
  { icon: Link, title: '链接 (Ctrl+K)', command: 'link' },
  { icon: Table, title: '表格 (Ctrl+Shift+T)', command: 'table' },
  { icon: Sigma, title: '数学公式块 (Ctrl+Shift+M)', command: 'mathBlock' },
  { icon: GitBranch, title: '插入 Mermaid 图表', command: 'mermaidBlock' },
  { icon: Minus, title: '分割线', command: 'hr' },
]

const ICON_BUTTON_CLASS =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50'

function ToolButton({
  item,
  view,
}: {
  item: ToolItem
  view: EditorView | null
}) {
  const Icon = item.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            if (item.action) {
              item.action()
            } else if (item.command && view) {
              formatCommands[item.command](view)
            }
          }}
          className={ICON_BUTTON_CLASS}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {item.title}
      </TooltipContent>
    </Tooltip>
  )
}

function GroupDivider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
}

/**
 * 编辑工具条：属于左侧编辑器列，只保留格式化命令。
 * 预览相关的缩放 / 复制 / 手机预览 / HTML 源码 / 新标签页由右侧预览工具条承担。
 */
export function FormatToolbar({
  view,
  onOpenImageManager,
  className,
}: FormatToolbarProps) {
  /** 图片插入独立成 action（打开图片管理弹窗：上传 / 链接 / 图片库 / 图床设置） */
  const insertGroup: ToolItem[] = [
    INSERT_GROUP[0],
    { icon: Image, title: '插入图片 (Ctrl+Shift+I)', action: onOpenImageManager },
    ...INSERT_GROUP.slice(1),
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex h-9 w-full shrink-0 items-center overflow-x-auto border-b bg-background/95 px-2 backdrop-blur',
          className,
        )}
        data-testid="format-toolbar"
      >
        {LEFT_GROUP.map((item) => (
          <ToolButton key={item.title} item={item} view={view} />
        ))}
        <GroupDivider />
        {HEADING_GROUP.map((item) => (
          <ToolButton key={item.title} item={item} view={view} />
        ))}
        <GroupDivider />
        {LIST_GROUP.map((item) => (
          <ToolButton key={item.title} item={item} view={view} />
        ))}
        <GroupDivider />
        {insertGroup.map((item) => (
          <ToolButton key={item.title} item={item} view={view} />
        ))}
      </div>
    </TooltipProvider>
  )
}
