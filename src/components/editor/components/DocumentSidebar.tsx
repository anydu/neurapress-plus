'use client'

import { useMemo, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import {
  FileText,
  FilePlus2,
  Trash2,
  Clock,
  Pencil,
  Search,
  Save,
  Download,
  Upload,
  ListTree,
  History,
  FolderOpen,
  RotateCcw,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/EditorStore'
import type { RecentFile, DocumentVersion } from '@/lib/storage'

type SidebarTab = 'files' | 'outline' | 'history'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface HeadingItem {
  level: number
  text: string
  line: number
}

interface DocumentSidebarProps {
  className?: string
  /** CodeMirror 实例：Outline 点击跳转用 */
  view?: EditorView | null
  /** 当前文档卡片动作 */
  onSave?: () => void
  onExportHtml?: () => void
  onExportMarkdown?: () => void
}

export function DocumentSidebar({
  className,
  view,
  onSave,
  onExportHtml,
  onExportMarkdown,
}: DocumentSidebarProps) {
  const {
    state,
    currentDocument,
    selectDocument,
    createNewDocument,
    deleteDocument,
    renameDocument,
    restoreVersion,
    flushSave,
  } = useEditorStore()
  const [tab, setTab] = useState<SidebarTab>('files')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [search, setSearch] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)

  const documents = useMemo(() => {
    const list = Object.values(state.documents).sort((a, b) => b.updatedAt - a.updatedAt)
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((d) => d.title.toLowerCase().includes(q))
  }, [state.documents, search])

  const recentFiles = useMemo(() => {
    const list = [...state.recentFiles].sort((a, b) => b.lastOpened - a.lastOpened)
    if (!search.trim()) return list.slice(0, 10)
    const q = search.trim().toLowerCase()
    return list.filter((f) => f.title.toLowerCase().includes(q)).slice(0, 10)
  }, [state.recentFiles, search])

  /** 标题大纲（Files → Outline tab） */
  const outline = useMemo<HeadingItem[]>(() => {
    if (!currentDocument) return []
    const items: HeadingItem[] = []
    currentDocument.content.split('\n').forEach((line, index) => {
      const m = line.match(/^(#{1,6})\s+(.+?)\s*$/)
      if (m) {
        items.push({ level: m[1].length, text: m[2].replace(/[#*`]/g, ''), line: index + 1 })
      }
    })
    return items
  }, [currentDocument])

  /** 当前文档版本历史（History tab） */
  const versions = useMemo<DocumentVersion[]>(() => {
    if (!currentDocument) return []
    return [...(state.versionHistory[currentDocument.id] ?? [])].sort(
      (a, b) => b.createdAt - a.createdAt,
    )
  }, [state.versionHistory, currentDocument])

  const scrollToLine = (line: number) => {
    if (!view) return
    const target = Math.min(line, view.state.doc.lines)
    const pos = view.state.doc.line(target).from
    view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    })
    view.focus()
  }

  const startRename = (id: string, title: string) => {
    setEditingId(id)
    setEditingTitle(title)
  }

  const commitRename = () => {
    if (editingId && editingTitle.trim()) {
      renameDocument(editingId, editingTitle.trim())
    }
    setEditingId(null)
  }

  const renderDocRow = (
    id: string,
    title: string,
    time: number,
    active: boolean,
    canDelete: boolean,
    extra?: React.ReactNode,
  ) => (
    <div
      key={id}
      role="button"
      tabIndex={0}
      onClick={() => selectDocument(id)}
      onKeyDown={(e) => e.key === 'Enter' && selectDocument(id)}
      className={cn(
        'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {editingId === id ? (
        <input
          autoFocus
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditingId(null)
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded border border-input bg-background px-1 text-sm outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{title}</span>
      )}
      {extra}
      <span className="hidden shrink-0 text-[10px] text-muted-foreground group-hover:hidden sm:inline">
        {timeAgo(time)}
      </span>
      {canDelete && (
        <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  startRename(id, title)
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>重命名</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`确定删除「${title}」吗？`)) deleteDocument(id)
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>删除文档</TooltipContent>
          </Tooltip>
        </span>
      )}
    </div>
  )

  const handleImportFile = async (file: File) => {
    const { importMarkdownDocument } = await import('@/lib/storage')
    const { title, content } = await importMarkdownDocument(file)
    createNewDocument({ title, content })
  }

  return (
    <aside
      className={cn('flex w-64 shrink-0 flex-col border-r bg-background/60', className)}
      data-testid="document-sidebar"
    >
      {/* 三 Tab：Files / Outline / History（对齐 Pro） */}
      <div className="flex shrink-0 border-b px-2 pt-1.5">
        {(
          [
            { id: 'files', label: 'Files', icon: FolderOpen },
            { id: 'outline', label: 'Outline', icon: ListTree },
            { id: 'history', label: 'History', icon: History },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Files tab */}
      {tab === 'files' && (
        <>
          <div className="space-y-2 border-b px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索文件..."
                className="h-8 w-full rounded-md border border-input bg-transparent pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                文件
              </span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => createNewDocument()}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>新建文档</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* 当前文档卡片 */}
            {currentDocument && (
              <div className="rounded-lg border bg-muted/30 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  当前文档
                </p>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {currentDocument.title}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      flushSave()
                      onSave?.()
                    }}
                    className="flex items-center justify-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    <Save className="h-3 w-3" />
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={onExportMarkdown}
                    className="flex items-center justify-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    <Download className="h-3 w-3" />
                    另存为
                  </button>
                  <button
                    type="button"
                    onClick={onExportHtml}
                    className="flex items-center justify-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    <Download className="h-3 w-3" />
                    导出
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="flex items-center justify-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    <Upload className="h-3 w-3" />
                    导入
                  </button>
                </div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {/* 最近文件 */}
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                最近文件
              </p>
              <Clock className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <div className="space-y-0.5">
              {recentFiles.map((file: RecentFile) =>
                renderDocRow(
                  file.id,
                  file.title,
                  file.lastOpened,
                  file.id === currentDocument?.id,
                  true,
                  <span className="shrink-0 text-[10px] text-muted-foreground/70">
                    {formatSize(file.size)}
                  </span>,
                ),
              )}
              {recentFiles.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">暂无记录</p>
              )}
            </div>
            <p className="mt-1 px-2 text-[10px] text-muted-foreground/70">
              {recentFiles.length} 个最近文件
            </p>

            {/* 全部文档 */}
            <div className="mb-1 mt-4 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                全部文档
              </p>
            </div>
            <div className="space-y-0.5 pb-3">
              {documents.map((doc) =>
                renderDocRow(doc.id, doc.title, doc.updatedAt, doc.id === currentDocument?.id, true),
              )}
              {documents.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {search ? '没有匹配的文档' : '点击上方按钮新建文档'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Outline tab */}
      {tab === 'outline' && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {outline.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              当前文档没有标题，使用 # 开头的行生成大纲
            </p>
          )}
          <div className="space-y-0.5">
            {outline.map((item, index) => (
              <button
                key={`${item.line}-${index}`}
                type="button"
                onClick={() => scrollToLine(item.line)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60',
                  item.level === 1 && 'font-medium',
                )}
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              >
                <span className="min-w-0 flex-1 truncate">{item.text}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground/70">
                  L{item.line}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              版本历史
            </p>
            <span className="text-[10px] text-muted-foreground/70">{versions.length} 个版本</span>
          </div>
          <div className="space-y-1">
            {versions.map((version) => (
              <div
                key={version.id}
                className="group flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
              >
                <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{new Date(version.createdAt).toLocaleString('zh-CN')}</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {version.content.length} 字符
                  </p>
                </div>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => restoreVersion(version)}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>恢复此版本</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                编辑时会自动创建版本快照，也可从版本历史弹窗手动创建
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
