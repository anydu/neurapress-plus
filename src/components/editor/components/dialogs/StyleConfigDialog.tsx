'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RotateCcw } from 'lucide-react'
import { type RendererOptions } from '@/lib/markdown'
import { codeThemes, type CodeThemeId } from '@/config/code-themes'
import { cn } from '@/lib/utils'

/** 与 Pro 对齐的 30 色主题色板 */
const THEME_COLORS = [
  '#000000', '#374151', '#1a1a1a', '#0f172a', '#1d4ed8', '#2563eb',
  '#0284c7', '#0891b2', '#0d9488', '#059669', '#16a34a', '#22c55e',
  '#65a30d', '#ca8a04', '#d97706', '#ea580c', '#dc2626', '#e11d48',
  '#db2777', '#c026d3', '#9333ea', '#7c3aed', '#6366f1', '#4f46e5',
  '#3b82f6', '#14b8a6', '#84cc16', '#f59e0b', '#f97316', '#ef4444',
]

interface StyleConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: RendererOptions
  codeTheme: CodeThemeId
  onChange: (options: RendererOptions) => void
  onCodeThemeChange: (theme: CodeThemeId) => void
}

export function StyleConfigDialog({
  open,
  onOpenChange,
  value,
  codeTheme,
  onChange,
  onCodeThemeChange,
}: StyleConfigDialogProps) {
  const [hexInput, setHexInput] = useState(value.base?.themeColor ?? '#000000')

  useEffect(() => {
    setHexInput(value.base?.themeColor ?? '#000000')
  }, [value.base?.themeColor, open])

  const setThemeColor = (color: string) => {
    onChange({ ...value, base: { ...value.base, themeColor: color } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="style-config-dialog">
        <DialogHeader>
          <DialogTitle>样式配置</DialogTitle>
        </DialogHeader>

        {/* 主题颜色 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">主题颜色（标题）</p>
          <div className="grid grid-cols-10 gap-1.5">
            {THEME_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => setThemeColor(color)}
                className={cn(
                  'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                  value.base?.themeColor === color
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    : 'border-border',
                )}
                style={{ background: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : '#000000'}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
              aria-label="自定义颜色选择器"
            />
            <input
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value)
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  setThemeColor(e.target.value)
                }
              }}
              placeholder="#000000"
              className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">此颜色将应用于一级到三级标题</p>
        </div>

        {/* 字体大小 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">字体大小</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={12}
              max={24}
              value={parseInt(value.base?.fontSize ?? '15', 10) || 15}
              onChange={(e) => {
                const size = Math.min(24, Math.max(12, Number(e.target.value) || 15))
                onChange({ ...value, base: { ...value.base, fontSize: `${size}px` } })
              }}
              className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">px</span>
            <input
              type="range"
              min={12}
              max={24}
              value={parseInt(value.base?.fontSize ?? '15', 10) || 15}
              onChange={(e) => {
                onChange({ ...value, base: { ...value.base, fontSize: `${e.target.value}px` } })
              }}
              className="flex-1"
            />
          </div>
        </div>

        {/* 文本对齐（对齐 Pro 的样式配置） */}
        <div className="space-y-2">
          <p className="text-sm font-medium">文本对齐</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'left', label: '左对齐' },
              { value: 'center', label: '居中' },
              { value: 'justify', label: '两端对齐' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    base: { ...value.base, textAlign: opt.value as 'left' | 'center' | 'justify' },
                  })
                }
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs transition-colors',
                  (value.base?.textAlign ?? 'left') === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 行高 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">行高</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1.2}
              max={3}
              step={0.1}
              value={Number(value.base?.lineHeight ?? 2)}
              onChange={(e) => {
                const lh = Math.min(3, Math.max(1.2, Number(e.target.value) || 2))
                onChange({ ...value, base: { ...value.base, lineHeight: String(lh) } })
              }}
              className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="range"
              min={1.2}
              max={3}
              step={0.1}
              value={Number(value.base?.lineHeight ?? 2)}
              onChange={(e) =>
                onChange({ ...value, base: { ...value.base, lineHeight: e.target.value } })
              }
              className="flex-1"
            />
          </div>
        </div>

        {/* 代码主题 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">代码主题</p>
          <div className="flex flex-wrap gap-1.5">
            {codeThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onCodeThemeChange(theme.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  codeTheme === theme.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        {/* 恢复默认 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              onChange({})
              onCodeThemeChange('github')
            }}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            恢复默认
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
