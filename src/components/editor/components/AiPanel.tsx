'use client'

import { useState } from 'react'
import { Sparkles, X, Loader2, Replace, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { AI_QUICK_ACTIONS, chatCompletion } from '@/lib/ai/service'
import { cn } from '@/lib/utils'

interface AiPanelProps {
  open: boolean
  onClose: () => void
  content: string
  /** AI 结果处理：替换全文或在光标处插入 */
  onReplaceContent: (content: string) => void
}

export function AiPanel({ open, onClose, content, onReplaceContent }: AiPanelProps) {
  const { toast } = useToast()
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (prompt: string) => {
    if (!content.trim()) {
      toast({ description: '当前文档内容为空' })
      return
    }
    setLoading(true)
    setResult('')
    try {
      const text = await chatCompletion(prompt, content)
      setResult(text)
    } catch (error) {
      console.error('AI 调用失败:', error)
      toast({
        variant: 'destructive',
        title: 'AI 调用失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="flex w-[320px] shrink-0 flex-col border-l bg-background"
      data-testid="ai-panel"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI 助手
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 快捷指令 */}
      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
        {AI_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={loading}
            onClick={() => run(action.prompt)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs transition-colors',
              'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 自定义指令 */}
      <div className="border-b px-3 py-2">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="输入自定义指令，例如：把这段话改写成小红书风格…"
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          disabled={loading || !instruction.trim()}
          onClick={() => run(instruction)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? '生成中…' : '执行'}
        </button>
      </div>

      {/* 结果 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!result && !loading && (
          <p className="pt-6 text-center text-xs text-muted-foreground">
            选择上方快捷指令，或输入自定义指令开始使用
          </p>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 正在处理…
          </div>
        )}
        {result && (
          <>
            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs leading-relaxed">
              {result}
            </pre>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onReplaceContent(result)
                  toast({ title: '已应用到文档' })
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-input px-2 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <Replace className="h-3 w-3" />
                替换全文
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result)
                  toast({ title: '已复制结果' })
                }}
                className="flex items-center justify-center gap-1 rounded-md border border-input px-2 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <Copy className="h-3 w-3" />
                复制
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
