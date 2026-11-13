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
  Copy,
  Smartphone,
  FileCode2,
  ExternalLink,
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
  onUploadImage?: () => void
  /** 打开图片管理弹窗（对齐 Pro：上传 / 图片链接 / 图片库 / 图床设置） */
  onOpenImageManager?: () => void
  onCopyWechat?: () => void
  onMobilePreview?: () => void
  onShowHtml?: () => void
  onOpenInNewTab?: () => void
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

function ToolButton({
  item,
  view,
  disabled,
}: {
  item: ToolItem
  view: EditorView | null
  disabled?: boolean
}) {
  const Icon = item.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (item.action) {
              item.action()
            } else if (item.command && view) {
              formatCommands[item.command](view)
            }
          }}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
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

export function FormatToolbar({
  view,
  onUploadImage,
  onOpenImageManager,
  onCopyWechat,
  onMobilePreview,
  onShowHtml,
  onOpenInNewTab,
  className,
}: FormatToolbarProps) {
  /** 图片插入独立成 action（打开图片管理弹窗） */
  const insertGroup: ToolItem[] = [
    INSERT_GROUP[0],
    { icon: Image, title: '插入图片 (Ctrl+Shift+I)', action: onOpenImageManager },
    ...INSERT_GROUP.slice(1),
  ]

  const rightGroup: ToolItem[] = [
    {
      icon: UploadIconWrap,
      title: '上传图片',
      action: onUploadImage,
    },
    { icon: Copy, title: '复制到公众号 - 生成适合微信公众号的格式', action: onCopyWechat },
    { icon: Smartphone, title: '移动预览模式', action: onMobilePreview },
    { icon: FileCode2, title: '显示 HTML 源码', action: onShowHtml },
    { icon: ExternalLink, title: '在新标签页中打开', action: onOpenInNewTab },
  ].filter((i) => i.action)

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex h-9 w-full items-center border-b bg-background/95 px-2 backdrop-blur',
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
        <GroupDivider />
        <div className="flex-1" />
        {rightGroup.map((item) => (
          <ToolButton key={item.title} item={item} view={view} disabled={!item.action} />
        ))}
      </div>
    </TooltipProvider>
  )
}

/* 上传按钮的占位图标（真实上传逻辑由外部注入） */
function UploadIconWrap({ className }: { className?: string }) {
  return <Image className={className} />
}
