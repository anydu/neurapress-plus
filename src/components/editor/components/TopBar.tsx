'use client'

import { PanelLeft, PanelRight, FileDown, FileText, FileCode, FileType2, Printer, Send, FileUp, ImageIcon, Keyboard, Settings, Moon, Sun, HelpCircle, Copy, Wand2, Palette, ChevronDown, Eye } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getTemplateById, templates } from '@/templates'
import type { SaveState } from '../store/EditorStore'

interface TopBarProps {
  title: string
  saveState: SaveState
  previewVisible: boolean
  linkToRefs: boolean
  currentTemplateId: string
  onToggleSidebar: () => void
  onToggleTemplatePanel: () => void
  onRename: (title: string) => void
  onToggleLinkToRefs: () => void
  onSelectTemplate: (id: string) => void
  onOpenStyleConfig: () => void
  onCopyWechat: () => void
  onExportHtml: () => void
  onExportWord: () => void
  onExportMarkdown: () => void
  onPrint: () => void
  onOpenPublish: () => void
  onOpenNotionImport: () => void
  onOpenImageManager: () => void
  onTogglePreview: () => void
  onOpenShortcuts: () => void
  onOpenSettings: () => void
}

function IconAction({
  icon: Icon,
  title,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            active
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}

export function TopBar({
  title,
  saveState,
  previewVisible,
  linkToRefs,
  currentTemplateId,
  onToggleSidebar,
  onToggleTemplatePanel,
  onRename,
  onToggleLinkToRefs,
  onSelectTemplate,
  onOpenStyleConfig,
  onCopyWechat,
  onExportHtml,
  onExportWord,
  onExportMarkdown,
  onPrint,
  onOpenPublish,
  onOpenNotionImport,
  onOpenImageManager,
  onTogglePreview,
  onOpenShortcuts,
  onOpenSettings,
}: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const currentTemplate = getTemplateById(currentTemplateId)

  return (
    <TooltipProvider delayDuration={300}>
      <header
        className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3"
        data-testid="top-bar"
      >
        {/* 左区：侧边栏 + 文档标题 + 保存状态 */}
        <IconAction icon={PanelLeft} title="显示/隐藏侧边栏" onClick={onToggleSidebar} />
        <input
          value={title}
          onChange={(e) => onRename(e.target.value)}
          className="min-w-0 max-w-[260px] flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none transition-colors hover:border-input focus:border-input focus:bg-background"
          aria-label="文档标题"
        />
        <span
          className={cn(
            'flex items-center gap-1 text-xs',
            saveState === 'saved' ? 'text-emerald-500' : saveState === 'saving' ? 'text-amber-500' : 'text-destructive',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-60',
                saveState === 'saved' ? 'animate-ping bg-emerald-400' : 'bg-current',
              )}
            />
            <span
              className={cn(
                'relative inline-flex h-1.5 w-1.5 rounded-full',
                saveState === 'saved' ? 'bg-emerald-500' : 'bg-current',
              )}
            />
          </span>
          {saveState === 'saved' ? '已自动保存' : saveState === 'saving' ? '保存中…' : '保存失败'}
        </span>

        <div className="flex-1" />

        {/* 右区：微信设置 / 样式配置 / 模板 / 动作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              <Wand2 className="h-3.5 w-3.5" />
              快速设置
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>微信导出快速设置</DropdownMenuLabel>
            <DropdownMenuItem onClick={onToggleLinkToRefs} className="justify-between">
              <span>微信外链转底部引用</span>
              <span
                className={cn(
                  'flex h-4 w-7 items-center rounded-full px-0.5 transition-colors',
                  linkToRefs ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'h-3 w-3 rounded-full bg-white transition-transform',
                    linkToRefs ? 'translate-x-3' : 'translate-x-0',
                  )}
                />
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenImageManager}>
              <ImageIcon className="mr-2 h-3.5 w-3.5" />
              图片管理 / 图床配置
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onOpenStyleConfig}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground"
        >
          <Palette className="h-3.5 w-3.5" />
          样式配置
        </button>

        {/* 模板下拉 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="text-muted-foreground">模板:</span>
              <span className="font-medium">{currentTemplate?.name ?? '默认'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 w-52 overflow-y-auto">
            {templates.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => onSelectTemplate(t.id)}
                className={cn(t.id === currentTemplateId && 'bg-accent')}
              >
                <div className="min-w-0">
                  <p className="text-sm">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-4 w-px bg-border" aria-hidden />

        {/* 主操作 */}
        <button
          type="button"
          onClick={onCopyWechat}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Copy className="h-3.5 w-3.5" />
          复制到公众号
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="导出文档"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              <FileDown className="h-3.5 w-3.5" />
              导出
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>选择导出格式</DropdownMenuLabel>
            <DropdownMenuItem onClick={onExportHtml}>
              <div className="flex items-start gap-2">
                <FileCode className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm">HTML</p>
                  <p className="text-xs text-muted-foreground">网页格式，包含完整样式</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm">PDF</p>
                  <p className="text-xs text-muted-foreground">便携式文档格式</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportWord}>
              <div className="flex items-start gap-2">
                <FileType2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm">Word</p>
                  <p className="text-xs text-muted-foreground">Microsoft Word 文档</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportMarkdown}>
              <div className="flex items-start gap-2">
                <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm">Markdown</p>
                  <p className="text-xs text-muted-foreground">原始 Markdown 格式</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenPublish}>
              <Send className="mr-2 h-3.5 w-3.5" />
              多平台发布
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenNotionImport}>
              <FileUp className="mr-2 h-3.5 w-3.5" />
              导入 Notion
            </DropdownMenuItem>
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              💡 PDF 格式将打开打印对话框，请选择「另存为 PDF」
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-4 w-px bg-border" aria-hidden />

        <IconAction
          icon={PanelRight}
          title="收起/展开模版选择面板"
          onClick={onToggleTemplatePanel}
        />
        <IconAction
          icon={Eye}
          title={previewVisible ? '隐藏预览 (Ctrl+Shift+P)' : '显示预览 (Ctrl+Shift+P)'}
          onClick={onTogglePreview}
          active={previewVisible}
        />
        <IconAction icon={Keyboard} title="键盘快捷键 (Ctrl+/)" onClick={onOpenShortcuts} />
        <IconAction
          icon={theme === 'dark' ? Sun : Moon}
          title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <IconAction icon={Settings} title="设置" onClick={onOpenSettings} />
        <IconAction icon={HelpCircle} title="使用帮助" onClick={() => window.open('/help', '_blank')} />
      </header>
    </TooltipProvider>
  )
}
