'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { useToast } from '@/components/ui/use-toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { EditorStoreProvider, useEditorStore } from './store/EditorStore'
import { TopBar } from './components/TopBar'
import { FormatToolbar } from './components/FormatToolbar'
import { WechatCodeEditor } from './components/WechatCodeEditor'
import { PreviewPane } from './components/PreviewPane'
import { ResizableSplitter } from './components/ResizableSplitter'
import { TemplatePanel } from './components/TemplatePanel'
import { DocumentSidebar } from './components/DocumentSidebar'
import { StatusBar, computeTextStats } from './components/StatusBar'
import { AiPanel } from './components/AiPanel'
import { StyleConfigDialog } from './components/dialogs/StyleConfigDialog'
import { SettingsDialog } from './components/dialogs/SettingsDialog'
import { PublishDialog } from './components/dialogs/PublishDialog'
import { NotionImportDialog } from './components/dialogs/NotionImportDialog'
import { ImageManagerDialog } from './components/dialogs/ImageManagerDialog'
import { VersionHistoryDialog } from './components/dialogs/VersionHistoryDialog'
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog'
import { usePreviewContent } from './hooks/usePreviewContent'
import { useCopy } from './hooks/useCopy'
import { normalizeSplitRatio, uploadImage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { convertLinksToReferences } from '@/lib/markdown/linkReferences'
import { exportHtmlFile, exportMarkdownFile, exportWordFile, printWithStyles, wrapStandaloneHtml } from '@/lib/export/exportUtils'

/** 编辑器设置（对齐 Pro 的「编辑器设置」弹窗） */
interface EditorSettings {
  showLineNumbers: boolean
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = { showLineNumbers: true }

function ProEditorInner() {
  const { toast } = useToast()
  const store = useEditorStore()
  const { state, currentDocument } = store

  const [view, setView] = useState<EditorView | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [linkToRefs, setLinkToRefs] = useLocalStorage<boolean>('link-to-refs', false)
  const [editorSettings, setEditorSettings] = useLocalStorage<EditorSettings>(
    'markdown-editor-settings',
    DEFAULT_EDITOR_SETTINGS,
  )
  const importInputRef = useRef<HTMLInputElement>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  /** 拖拽中的临时比例：避免拖拽期间其它状态更新把分屏弹回旧值 */
  const dragRatioRef = useRef<number | null>(null)

  const applySplitColumns = useCallback((r: number) => {
    const el = splitContainerRef.current
    if (el) el.style.gridTemplateColumns = `minmax(0, ${r}fr) 6px minmax(0, ${1 - r}fr)`
  }, [])

  const handleSplitRatioChange = useCallback(
    (r: number, phase: 'drag' | 'commit') => {
      if (phase === 'drag') {
        dragRatioRef.current = r
        applySplitColumns(r)
        return
      }
      dragRatioRef.current = null
      store.updateUI({ editorPaneRatio: r })
      // 宽度变化后让 CodeMirror 重新测量行号、换行与搜索面板
      view?.requestMeasure()
    },
    [store, view, applySplitColumns],
  )

  const [dialog, setDialog] = useState<
    null | 'style' | 'settings' | 'publish' | 'notion' | 'imageManager' | 'versions' | 'shortcuts'
  >(null)
  const [imageManagerTab, setImageManagerTab] = useState<'upload' | 'host'>('upload')

  /** 在编辑器光标处插入 markdown（图片管理弹窗用） */
  const handleInsertMarkdown = useCallback(
    (markdown: string) => {
      if (!view) return
      const { from, to } = view.state.selection.main
      view.dispatch({
        changes: { from, to, insert: markdown },
        selection: { anchor: from + markdown.length },
        scrollIntoView: true,
      })
      view.focus()
    },
    [view],
  )

  const previewRef = useRef<HTMLDivElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const { isConverting, previewContent } = usePreviewContent({
    value: currentDocument?.content ?? '',
    selectedTemplate: currentDocument?.template ?? 'default',
    styleOptions: currentDocument?.styleOptions ?? {},
    codeTheme: currentDocument?.codeTheme ?? 'github',
  })

  const finalPreviewHtml = linkToRefs
    ? convertLinksToReferences(previewContent)
    : previewContent

  const { copyToClipboard } = useCopy()

  // ---------- 复制到公众号 ----------
  const handleCopyWechat = useCallback(async () => {
    const contentElement = previewRef.current?.querySelector('.preview-body') as HTMLElement | null
    if (!contentElement) return
    const success = await copyToClipboard(contentElement)
    toast(
      success
        ? { title: '复制成功', description: '内容已复制，可直接粘贴到公众号编辑器' }
        : { variant: 'destructive', title: '复制失败', description: '无法访问剪贴板，请检查浏览器权限' },
    )
  }, [copyToClipboard, toast])

  // ---------- 编辑器滚动同步 ----------
  const handleEditorScroll = useCallback(() => {
    const scroller = document.querySelector('.pro-code-editor .cm-scroller') as HTMLElement | null
    const preview = previewScrollRef.current
    if (!scroller || !preview) return
    const ratio = scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight)
    preview.scrollTop = ratio * Math.max(0, preview.scrollHeight - preview.clientHeight)
  }, [])

  // ---------- 图片上传 ----------
  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        const url = await uploadImage(file)
        if (view) {
          const { from, to } = view.state.selection.main
          view.dispatch({
            changes: { from, to, insert: `![${file.name}](${url})` },
            selection: { anchor: from + `![${file.name}](${url})`.length },
          })
          view.focus()
        }
        toast({ title: '图片已插入', description: file.name })
      } catch (error) {
        console.error('图片上传失败:', error)
        toast({
          variant: 'destructive',
          title: '图片上传失败',
          description: error instanceof Error ? error.message : '请重试',
        })
      }
    },
    [view, toast],
  )

  // ---------- 导入 .md 文件（⌘O / 侧边栏「导入」） ----------
  const handleImportMarkdown = useCallback(
    async (file: File) => {
      const { importMarkdownDocument } = await import('@/lib/storage')
      const { title, content } = await importMarkdownDocument(file)
      store.createNewDocument({ title, content })
      toast({ title: '导入成功', description: `已创建文档「${title}」` })
    },
    [store, toast],
  )

  // ---------- 全局快捷键（对齐 Pro） ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      // 保存（⌘S）与另存为（⌘⇧S）
      if (mod && key === 's' && !e.shiftKey) {
        e.preventDefault()
        store.flushSave()
        toast({ title: '已保存', description: '内容已保存到本地' })
        return
      }
      if (mod && key === 's' && e.shiftKey) {
        e.preventDefault()
        if (currentDocument) {
          exportMarkdownFile(currentDocument.content, currentDocument.title)
          toast({ title: '另存为', description: 'Markdown 文件已下载' })
        }
        return
      }
      // 新建文档 ⌘N
      if (mod && key === 'n' && !e.shiftKey) {
        e.preventDefault()
        store.createNewDocument()
        toast({ title: '新建文档' })
        return
      }
      // 打开文档（导入 .md）⌘O
      if (mod && key === 'o' && !e.shiftKey) {
        e.preventDefault()
        importInputRef.current?.click()
        return
      }
      // 导出文档 ⌘E
      if (mod && key === 'e' && !e.shiftKey) {
        e.preventDefault()
        exportHtmlFile(finalPreviewHtml, currentDocument?.title ?? '文档')
        return
      }
      // 导入文档 ⌘⇧O
      if (mod && key === 'o' && e.shiftKey) {
        e.preventDefault()
        importInputRef.current?.click()
        return
      }
      // 插入图片 ⌘⇧I → 打开图片管理弹窗（对齐 Pro）
      if (mod && e.shiftKey && key === 'i') {
        e.preventDefault()
        setImageManagerTab('upload')
        setDialog('imageManager')
        return
      }
      if (mod && e.shiftKey && key === 'p') {
        e.preventDefault()
        store.updateUI({ previewVisible: !state.ui.previewVisible })
        return
      }
      if (mod && e.key === '/') {
        e.preventDefault()
        setDialog('shortcuts')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store, state.ui.previewVisible, currentDocument, finalPreviewHtml, toast])

  // 卸载前确保落盘
  useEffect(() => {
    const onUnload = () => store.flushSave()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state.hydrated || !currentDocument) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        正在加载编辑器…
      </div>
    )
  }

  const stats = computeTextStats(currentDocument.content)
  const versionCount = state.versionHistory[currentDocument.id]?.length ?? 0
  const { ui } = state
  const showSplitter = ui.previewVisible && !ui.mobilePreviewMode
  const splitRatio = normalizeSplitRatio(dragRatioRef.current ?? ui.editorPaneRatio)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar
        title={currentDocument.title}
        saveState={state.saveState}
        previewVisible={ui.previewVisible}
        linkToRefs={linkToRefs}
        currentTemplateId={currentDocument.template}
        onToggleSidebar={() => store.updateUI({ sidebarVisible: !ui.sidebarVisible })}
        onToggleTemplatePanel={() => store.updateUI({ templatePanelOpen: !ui.templatePanelOpen })}
        onRename={(title) => store.renameDocument(currentDocument.id, title)}
        onToggleLinkToRefs={() => setLinkToRefs(!linkToRefs)}
        onSelectTemplate={(id) => store.setTemplate(id)}
        onOpenStyleConfig={() => setDialog('style')}
        onCopyWechat={handleCopyWechat}
        onExportHtml={() =>
          exportHtmlFile(finalPreviewHtml, currentDocument.title)
        }
        onExportWord={() => exportWordFile(finalPreviewHtml, currentDocument.title)}
        onExportMarkdown={() => exportMarkdownFile(currentDocument.content, currentDocument.title)}
        onPrint={() => printWithStyles(finalPreviewHtml, currentDocument.title)}
        onOpenPublish={() => setDialog('publish')}
        onOpenNotionImport={() => setDialog('notion')}
        onOpenImageManager={() => {
          setImageManagerTab('host')
          setDialog('imageManager')
        }}
        onTogglePreview={() => store.updateUI({ previewVisible: !ui.previewVisible })}
        onOpenShortcuts={() => setDialog('shortcuts')}
        onOpenSettings={() => setDialog('settings')}
      />

      <div className="flex min-h-0 flex-1">
        {ui.sidebarVisible && (
          <DocumentSidebar
            className="hidden md:flex"
            view={view}
            onSave={() => toast({ title: '已保存', description: '内容已保存到本地' })}
            onExportHtml={() => exportHtmlFile(finalPreviewHtml, currentDocument.title)}
            onExportMarkdown={() => exportMarkdownFile(currentDocument.content, currentDocument.title)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <FormatToolbar
            view={view}
            onUploadImage={() => uploadInputRef.current?.click()}
            onOpenImageManager={() => {
              setImageManagerTab('upload')
              setDialog('imageManager')
            }}
            onCopyWechat={handleCopyWechat}
            onMobilePreview={() => store.updateUI({ mobilePreviewMode: !ui.mobilePreviewMode })}
            onShowHtml={() => store.updateUI({ showHtmlSource: !ui.showHtmlSource })}
            onOpenInNewTab={() => {
              const blob = new Blob([wrapStandaloneHtml(finalPreviewHtml, currentDocument.title)], {
                type: 'text/html;charset=utf-8',
              })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
              setTimeout(() => URL.revokeObjectURL(url), 10_000)
            }}
          />

          <div
            ref={splitContainerRef}
            className={cn('grid min-h-0 flex-1', !showSplitter && 'grid-cols-1')}
            style={
              showSplitter
                ? { gridTemplateColumns: `minmax(0, ${splitRatio}fr) 6px minmax(0, ${1 - splitRatio}fr)` }
                : undefined
            }
          >
            {!ui.mobilePreviewMode && (
              <div className="min-h-0 min-w-0">
                <WechatCodeEditor
                  value={currentDocument.content}
                  onChange={store.updateContent}
                  onReady={setView}
                  onEditorScroll={handleEditorScroll}
                  showLineNumbers={editorSettings.showLineNumbers}
                />
              </div>
            )}
            {showSplitter && (
              <ResizableSplitter
                ratio={splitRatio}
                onRatioChange={handleSplitRatioChange}
                containerRef={splitContainerRef}
              />
            )}
            {ui.previewVisible && (
              <PreviewPane
                previewRef={previewRef}
                previewScrollRef={previewScrollRef}
                previewContent={finalPreviewHtml}
                isConverting={isConverting}
                templateId={currentDocument.template}
                codeTheme={currentDocument.codeTheme}
                zoom={ui.previewZoom}
                mobileMode={ui.mobilePreviewMode}
                showHtmlSource={ui.showHtmlSource}
                onZoomChange={(zoom) => store.updateUI({ previewZoom: zoom })}
                onCopyWechat={handleCopyWechat}
                onToggleMobileMode={() => store.updateUI({ mobilePreviewMode: !ui.mobilePreviewMode })}
                onToggleHtmlSource={() => store.updateUI({ showHtmlSource: !ui.showHtmlSource })}
                className="min-h-0 min-w-0 border-l-0"
              />
            )}
          </div>
        </div>

        {ui.templatePanelOpen && (
          <TemplatePanel
            currentTemplateId={currentDocument.template}
            onSelectTemplate={(id) => store.setTemplate(id)}
            className="hidden lg:flex"
          />
        )}
        <AiPanel
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          content={currentDocument.content}
          onReplaceContent={store.updateContent}
        />
      </div>

      <StatusBar
        saveState={state.saveState}
        charCount={stats.charCount}
        wordCount={stats.wordCount}
        readingMinutes={stats.readingMinutes}
        versionCount={versionCount}
        lastSavedAt={state.lastSavedAt}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen(!aiOpen)}
        onToggleVersionHistory={() => setDialog('versions')}
      />

      {/* 隐藏的图片上传入口 */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUploadImage(file)
          e.target.value = ''
        }}
      />

      {/* 隐藏的 Markdown 导入入口（⌘O / 侧边栏「导入」） */}
      <input
        ref={importInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportMarkdown(file)
          e.target.value = ''
        }}
      />

      {/* 弹窗 */}
      <StyleConfigDialog
        open={dialog === 'style'}
        onOpenChange={(open) => !open && setDialog(null)}
        value={currentDocument.styleOptions}
        codeTheme={currentDocument.codeTheme}
        onChange={store.setStyleOptions}
        onCodeThemeChange={store.setCodeTheme}
      />
      <SettingsDialog
        open={dialog === 'settings'}
        onOpenChange={(open) => !open && setDialog(null)}
        codeTheme={currentDocument.codeTheme}
        onCodeThemeChange={store.setCodeTheme}
        showLineNumbers={editorSettings.showLineNumbers}
        onShowLineNumbersChange={(show) => setEditorSettings({ ...editorSettings, showLineNumbers: show })}
      />
      <PublishDialog
        open={dialog === 'publish'}
        onOpenChange={(open) => !open && setDialog(null)}
        markdown={currentDocument.content}
        previewHtml={finalPreviewHtml}
      />
      <NotionImportDialog
        open={dialog === 'notion'}
        onOpenChange={(open) => !open && setDialog(null)}
        onImport={(name, content) => {
          store.createNewDocument({ title: name, content })
          toast({ title: '导入成功', description: `已创建文档「${name}」` })
        }}
      />
      <ImageManagerDialog
        open={dialog === 'imageManager'}
        onOpenChange={(open) => !open && setDialog(null)}
        onInsert={handleInsertMarkdown}
        initialTab={imageManagerTab}
      />
      <VersionHistoryDialog open={dialog === 'versions'} onOpenChange={(open) => !open && setDialog(null)} />
      <ShortcutsDialog open={dialog === 'shortcuts'} onOpenChange={(open) => !open && setDialog(null)} />
      </div>
    </TooltipProvider>
  )
}

export default function ProEditor() {
  return (
    <EditorStoreProvider>
      <ProEditorInner />
    </EditorStoreProvider>
  )
}
