'use client'

import { useMemo } from 'react'
import { Loader2, ZoomIn, ZoomOut, Copy, Smartphone, FileCode2, ExternalLink } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getTemplateById } from '@/templates'
import { type CodeThemeId } from '@/config/code-themes'
import { cn } from '@/lib/utils'
import { wrapStandaloneHtml } from '@/lib/export/exportUtils'

interface PreviewPaneProps {
  previewRef: React.RefObject<HTMLDivElement>
  previewScrollRef: React.RefObject<HTMLDivElement>
  previewContent: string
  isConverting: boolean
  templateId: string
  codeTheme: CodeThemeId
  zoom: number
  mobileMode: boolean
  showHtmlSource: boolean
  onZoomChange: (zoom: number) => void
  onCopyWechat: () => void
  onToggleMobileMode: () => void
  onToggleHtmlSource: () => void
  className?: string
}

/** 手机预览容器宽度（模拟公众号正文宽度） */
const MOBILE_WIDTH = 390

/**
 * 预览区：与编辑区平级的独立右列。
 * 自带工具条（缩放 / 复制 / 手机预览 / HTML 源码 / 新标签页），
 * 高度用 h-9 与左侧 FormatToolbar 对齐，保证两列内容区从同一高度开始。
 */
export function PreviewPane({
  previewRef,
  previewScrollRef,
  previewContent,
  isConverting,
  templateId,
  codeTheme,
  zoom,
  mobileMode,
  showHtmlSource,
  onZoomChange,
  onCopyWechat,
  onToggleMobileMode,
  onToggleHtmlSource,
  className,
}: PreviewPaneProps) {
  const template = getTemplateById(templateId)
  const htmlSource = useMemo(
    () => previewContent.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    [previewContent],
  )

  const toolbarActions = [
    { icon: Copy, title: '复制到公众号 - 生成适合微信公众号的格式', onClick: onCopyWechat },
    {
      icon: Smartphone,
      title: mobileMode ? '退出移动预览模式' : '移动预览模式',
      onClick: onToggleMobileMode,
    },
    {
      icon: FileCode2,
      title: showHtmlSource ? '返回预览' : '显示 HTML 源码',
      onClick: onToggleHtmlSource,
    },
    {
      icon: ExternalLink,
      title: '在新标签页中打开',
    },
  ]

  const openInNewTab = () => {
    const blob = new Blob([wrapStandaloneHtml(previewContent, document.title)], {
      type: 'text/html;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <div
      ref={previewRef}
      className={cn('preview-container flex h-full min-w-0 flex-col bg-background', className)}
      data-testid="preview-pane"
    >
      {/* 预览工具条：与左侧编辑工具条等高（h-9）并排 */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur">
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-medium text-muted-foreground">预览</span>
        </div>
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1">
            <div className="mr-1 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onZoomChange(Math.max(50, zoom - 10))}
                    disabled={zoom <= 50}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>缩小</TooltipContent>
              </Tooltip>
              <span className="w-9 text-center text-xs text-muted-foreground">{zoom}%</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onZoomChange(Math.min(150, zoom + 10))}
                    disabled={zoom >= 150}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>放大</TooltipContent>
              </Tooltip>
            </div>
            {toolbarActions.map((action) => (
              <Tooltip key={action.title}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={action.onClick ?? openInNewTab}
                    className={cn(
                      'rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      (action.icon === Smartphone && mobileMode) ||
                        (action.icon === FileCode2 && showHtmlSource)
                        ? 'bg-accent text-foreground'
                        : '',
                    )}
                  >
                    <action.icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{action.title}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* 预览内容 */}
      <div ref={previewScrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {isConverting ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">正在生成预览…</span>
          </div>
        ) : showHtmlSource ? (
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
            {htmlSource}
          </pre>
        ) : (
          <div className="flex h-full justify-center bg-muted/30 px-4 py-6">
            <div
              className={cn(
                'preview-content h-fit bg-background shadow-sm transition-all duration-200',
                !mobileMode && 'rounded-lg border',
                template?.styles,
                `code-theme-${codeTheme}`,
              )}
              style={{
                width: mobileMode ? MOBILE_WIDTH : '100%',
                maxWidth: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <div
                className="preview-body"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
