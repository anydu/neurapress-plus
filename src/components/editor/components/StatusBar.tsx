'use client'

import { useEffect, useState } from 'react'
import { Check, CloudUpload, Loader2, Sparkles, History, Wifi, WifiOff } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SaveState } from '../store/EditorStore'

interface StatusBarProps {
  saveState: SaveState
  charCount: number
  wordCount: number
  readingMinutes: number
  versionCount: number
  lastSavedAt: number | null
  aiOpen: boolean
  onToggleAi: () => void
  onToggleVersionHistory: () => void
}

/** 简易分词统计：CJK 按字、其余按空白分词 */
export function computeTextStats(text: string) {
  const plain = text.replace(/[#*`>\-\[\]()!~_|]/g, '').trim()
  const cjk = plain.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)?.length ?? 0
  const latinWords =
    plain
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length ?? 0
  const charCount = plain.length
  const wordCount = cjk + latinWords
  const readingMinutes = Math.max(1, Math.ceil(charCount / 400))
  return { charCount, wordCount, readingMinutes }
}

function SaveIndicator({ saveState }: { saveState: SaveState }) {
  const map = {
    saved: { icon: Check, text: '已保存', className: 'text-emerald-500' },
    saving: { icon: Loader2, text: '保存中…', className: 'text-amber-500' },
    error: { icon: CloudUpload, text: '保存失败', className: 'text-destructive' },
  } as const
  const { icon: Icon, text, className } = map[saveState]
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <Icon className={cn('h-3.5 w-3.5', saveState === 'saving' && 'animate-spin')} />
      <span>{text}</span>
    </div>
  )
}

export function StatusBar({
  saveState,
  charCount,
  wordCount,
  readingMinutes,
  versionCount,
  lastSavedAt,
  aiOpen,
  onToggleAi,
  onToggleVersionHistory,
}: StatusBarProps) {
  const [timeText, setTimeText] = useState('--:--:--')
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (!lastSavedAt) {
      setTimeText('--:--:--')
      return
    }
    const update = () =>
      setTimeText(new Date(lastSavedAt).toLocaleTimeString('zh-CN', { hour12: false }))
    update()
    const timer = setInterval(update, 30_000)
    return () => clearInterval(timer)
  }, [lastSavedAt])

  // 网络状态指示（对齐 Pro 状态栏的「在线」）
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return (
    <div
      className="flex h-7 items-center justify-between border-t bg-background px-3 text-xs text-muted-foreground"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4">
        <SaveIndicator saveState={saveState} />
        <span className="hidden sm:inline">{charCount} 字符</span>
        <span className="hidden sm:inline">{wordCount} 词</span>
        <span className="hidden md:inline">{readingMinutes} 分钟阅读</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleVersionHistory}
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <History className="h-3.5 w-3.5" />
                <span>版本 {versionCount}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>查看版本历史</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="hidden md:inline">最后更新 {timeText}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleAi}
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors',
            aiOpen
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent hover:text-foreground',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </button>
        <span
          className={cn(
            'hidden items-center gap-1 sm:flex',
            online ? 'text-emerald-500' : 'text-destructive',
          )}
          title={online ? '网络连接正常' : '网络已断开，内容仍会保存在本地'}
        >
          {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {online ? '在线' : '离线'}
        </span>
      </div>
    </div>
  )
}
