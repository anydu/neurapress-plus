'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { KeyRound, Globe, Bot, Code2, Palette, Eye, Check } from 'lucide-react'
import { codeThemes, type CodeThemeId } from '@/config/code-themes'
import {
  loadAiSettings,
  saveAiSettings,
  type AiSettings,
} from '@/lib/ai/service'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 当前文档代码主题 */
  codeTheme: CodeThemeId
  onCodeThemeChange: (theme: CodeThemeId) => void
  /** 编辑器行号开关（外观） */
  showLineNumbers: boolean
  onShowLineNumbersChange: (show: boolean) => void
}

type Tab = 'code' | 'appearance' | 'preview' | 'ai'

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'code', label: '代码块', icon: Code2 },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'preview', label: '预览', icon: Eye },
  { id: 'ai', label: 'AI 助手', icon: Bot },
]

/** 迷你代码预览卡（用主题色渲染示例代码，对齐 Pro 的设置面板） */
function CodeThemeCard({
  id,
  name,
  colors,
  active,
  onClick,
}: {
  id: CodeThemeId
  name: string
  colors: { background: string; text: string; keyword: string; string: string; comment: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-lg border text-left transition-all',
        active
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border hover:border-primary/50',
      )}
      aria-pressed={active}
      data-code-theme={id}
    >
      <div
        className="px-3 py-2 font-mono text-[11px] leading-relaxed"
        style={{ background: colors.background, color: colors.text }}
      >
        <div><span style={{ color: colors.keyword }}>function</span> hello() {'{'}</div>
        <div>
          {'  '}
          <span style={{ color: colors.comment }}>// Hello World</span>
        </div>
        <div>
          {'  '}
          <span style={{ color: colors.keyword }}>return</span>{' '}
          <span style={{ color: colors.string }}>&apos;你好，NeuraPress&apos;</span>
        </div>
        <div>{'}'}</div>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-sm font-medium">{name}</span>
        {active && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
    </button>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
  codeTheme,
  onCodeThemeChange,
  showLineNumbers,
  onShowLineNumbersChange,
}: SettingsDialogProps) {
  const [tab, setTab] = useState<Tab>('code')
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    apiKey: '',
    baseUrl: '',
    model: '',
  })

  useEffect(() => {
    if (open) {
      setAiSettings(loadAiSettings())
      setTab('code')
    }
  }, [open])

  const handleSaveAi = () => {
    saveAiSettings(aiSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle>编辑器设置</DialogTitle>
        </DialogHeader>

        {/* Tab 切换 */}
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* 代码块 */}
        {tab === 'code' && (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            <div>
              <p className="text-sm font-medium">代码块样式</p>
              <p className="text-xs text-muted-foreground">
                自定义代码块的外观，包括主题配色。选择后立即应用到当前文档预览。
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">主题选择</p>
            <div className="grid grid-cols-2 gap-2">
              {codeThemes.map((theme) => (
                <CodeThemeCard
                  key={theme.id}
                  id={theme.id}
                  name={theme.name}
                  colors={{
                    background: theme.theme.background,
                    text: theme.theme.text,
                    keyword: theme.theme.keyword,
                    string: theme.theme.string,
                    comment: theme.theme.comment,
                  }}
                  active={codeTheme === theme.id}
                  onClick={() => onCodeThemeChange(theme.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 外观 */}
        {tab === 'appearance' && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">外观设置</p>
              <p className="text-xs text-muted-foreground">调整编辑器的整体外观和主题。</p>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">编辑器行号</p>
                <p className="text-xs text-muted-foreground">在编辑器左侧显示行号</p>
              </div>
              <span
                className={cn(
                  'flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
                  showLineNumbers ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow transition-transform',
                    showLineNumbers ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </span>
              <input
                type="checkbox"
                className="hidden"
                checked={showLineNumbers}
                onChange={(e) => onShowLineNumbersChange(e.target.checked)}
                aria-label="编辑器行号"
              />
            </label>
            <p className="text-xs text-muted-foreground">更多外观设置即将推出…</p>
          </div>
        )}

        {/* 预览 */}
        {tab === 'preview' && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">预览设置</p>
              <p className="text-xs text-muted-foreground">配置预览功能和显示选项。</p>
            </div>
            <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              更多预览设置即将推出…
            </div>
          </div>
        )}

        {/* AI 助手 */}
        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              AI 助手基于 OpenAI 兼容协议，配置后可在状态栏点击「AI」使用润色、翻译等快捷指令。
              API Key 仅保存在本地浏览器，不会上传。
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="ai-api-key">
                <KeyRound className="h-3.5 w-3.5" />
                API Key
              </label>
              <input
                id="ai-api-key"
                type="password"
                value={aiSettings.apiKey}
                onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                placeholder="sk-..."
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="ai-base-url">
                <Globe className="h-3.5 w-3.5" />
                Base URL
              </label>
              <input
                id="ai-base-url"
                type="text"
                value={aiSettings.baseUrl}
                onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="ai-model">
                模型
              </label>
              <input
                id="ai-model"
                type="text"
                value={aiSettings.model}
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveAi}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {tab !== 'ai' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
            >
              完成
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
