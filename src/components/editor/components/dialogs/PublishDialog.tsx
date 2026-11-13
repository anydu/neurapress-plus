'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Check, Copy, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 多平台发布（对齐 Pro 站「多平台发布 - 一键同步到多个内容平台」）。
 * 当前实现：复制对应平台所需格式到剪贴板；远端 API 同步预留接口。
 */
const PLATFORMS = [
  { id: 'wechat', name: '微信公众号', hint: '复制带排版样式的 HTML，粘贴到公众号编辑器' },
  { id: 'zhihu', name: '知乎', hint: '知乎支持粘贴 Markdown 源码' },
  { id: 'juejin', name: '掘金', hint: '粘贴 Markdown 源码' },
  { id: 'toutiao', name: '今日头条', hint: '复制富文本 HTML' },
  { id: 'baijiahao', name: '百家号', hint: '复制富文本 HTML' },
  { id: 'xiaohongshu', name: '小红书', hint: '使用小红书编辑器生成图片笔记' },
] as const

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  markdown: string
  previewHtml: string
}

export function PublishDialog({ open, onOpenChange, markdown, previewHtml }: PublishDialogProps) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<string[]>(['wechat'])

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const copyFor = async (platform: (typeof PLATFORMS)[number]) => {
    const isMarkdown = platform.id === 'zhihu' || platform.id === 'juejin'
    const content = isMarkdown ? markdown : previewHtml
    try {
      if (isMarkdown) {
        await navigator.clipboard.writeText(content)
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([content], { type: 'text/html' }),
            'text/plain': new Blob([content.replace(/<[^>]+>/g, '')], { type: 'text/plain' }),
          }),
        ])
      }
      toast({ title: '复制成功', description: `已复制适配「${platform.name}」的内容` })
    } catch (error) {
      console.error('复制失败:', error)
      toast({ variant: 'destructive', title: '复制失败', description: '请检查浏览器剪贴板权限' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="publish-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            多平台发布
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          选择目标平台后复制适配内容；一键远端同步将在后续版本提供。
        </p>

        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                selected.includes(platform.id) ? 'border-primary/60 bg-primary/5' : 'hover:bg-accent/50',
              )}
              onClick={() => toggle(platform.id)}
            >
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  selected.includes(platform.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input',
                )}
              >
                {selected.includes(platform.id) && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{platform.name}</p>
                <p className="text-xs text-muted-foreground">{platform.hint}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  copyFor(platform)
                }}
                className="flex shrink-0 items-center gap-1 rounded-md border border-input px-2 py-1 text-xs transition-colors hover:bg-accent"
              >
                <Copy className="h-3 w-3" />
                复制
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
