'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, Star, X } from 'lucide-react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'
import {
  TEMPLATE_CATEGORIES,
  categoryCount,
  getTemplateCategory,
  templates,
  type Template,
  type TemplateCategory,
} from '@/templates'
import { convertToWechat } from '@/lib/markdown'

/** 卡片迷你预览使用的示例内容 */
const SAMPLE_MARKDOWN = `## 二级标题示例

### 三级标题示例

这是一段**预览正文**，用于展示排版效果。`

const miniPreviewCache = new Map<string, string>()

function getMiniPreview(template: Template): string {
  const cached = miniPreviewCache.get(template.id)
  if (cached) return cached
  try {
    const html = convertToWechat(SAMPLE_MARKDOWN, template.options)
    miniPreviewCache.set(template.id, html)
    return html
  } catch (error) {
    console.error('生成模板迷你预览失败:', error)
    return SAMPLE_MARKDOWN
  }
}

interface TemplatePanelProps {
  currentTemplateId: string
  onSelectTemplate: (id: string) => void
  className?: string
}

export function TemplatePanel({
  currentTemplateId,
  onSelectTemplate,
  className,
}: TemplatePanelProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all')
  const [favoriteIds, setFavoriteIds] = useLocalStorage<string[]>('favorite-templates', [])

  const filtered = useMemo(() => {
    let list = templates
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
    }
    if (category !== 'all') {
      list = list.filter((t) => getTemplateCategory(t) === category)
    }
    // 收藏优先，其余保持注册顺序
    return [...list].sort(
      (a, b) => Number(favoriteIds.includes(b.id)) - Number(favoriteIds.includes(a.id)),
    )
  }, [query, category, favoriteIds])

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  return (
    <aside
      className={cn('flex w-[300px] shrink-0 flex-col border-l bg-background/60', className)}
      data-testid="template-panel"
    >
      {/* 搜索 */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索模版..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 分类 chips */}
      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
        <CategoryChip
          label="全部"
          count={templates.length}
          active={category === 'all'}
          onClick={() => setCategory('all')}
        />
        {TEMPLATE_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.label}
            count={categoryCount(c.id)}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">没有匹配的模板</p>
        )}
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            active={template.id === currentTemplateId}
            favorite={favoriteIds.includes(template.id)}
            onSelect={() => onSelectTemplate(template.id)}
            onToggleFavorite={() => toggleFavorite(template.id)}
          />
        ))}
      </div>
    </aside>
  )
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('text-[10px]', active ? 'opacity-80' : 'opacity-60')}>{count}</span>
    </button>
  )
}

function TemplateCard({
  template,
  active,
  favorite,
  onSelect,
  onToggleFavorite,
}: {
  template: Template
  active: boolean
  favorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-sm',
        active ? 'border-primary ring-1 ring-primary/40' : 'border-border hover:border-primary/40',
      )}
    >
      {/* 迷你预览 */}
      <div className="pointer-events-none relative h-24 overflow-hidden border-b bg-white">
        <div
          className="origin-top-left p-2"
          style={{ transform: 'scale(0.62)', width: '161%', minHeight: '155%' }}
          dangerouslySetInnerHTML={{ __html: getMiniPreview(template) }}
        />
        <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground/50" />
      </div>
      <div className="flex items-start gap-1.5 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{template.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {template.description}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="rounded p-0.5 transition-colors"
          aria-label={favorite ? '取消收藏' : '收藏模板'}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50 hover:text-amber-400',
            )}
          />
        </button>
      </div>
    </div>
  )
}
