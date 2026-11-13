import type { RendererOptions } from '@/lib/markdown'

export type TemplateCategory =
  | 'classic'
  | 'tech'
  | 'business'
  | 'literary'
  | 'press'
  | 'finance'
  | 'life'
  | 'education'
  | 'dark'
  | 'blue'
  | 'macaron'

export const TEMPLATE_CATEGORIES: Array<{ id: TemplateCategory; label: string }> = [
  { id: 'classic', label: '经典' },
  { id: 'tech', label: '技术' },
  { id: 'business', label: '商务' },
  { id: 'literary', label: '文艺' },
  { id: 'press', label: '报刊' },
  { id: 'finance', label: '财经' },
  { id: 'life', label: '生活' },
  { id: 'education', label: '教育' },
  { id: 'dark', label: '暗色' },
  { id: 'blue', label: '蓝色系' },
  { id: 'macaron', label: '马卡龙' },
]

export interface Template {
  id: string
  name: string
  description: string
  /** 缺省视为 classic（自定义模板可不填） */
  category?: TemplateCategory
  /** 预览容器附加的 CSS class（对应 styles/code-themes.css 等全局样式） */
  styles: string
  options: RendererOptions
  transform?: (html: string) => string
}

export function getTemplateCategory(t: Template): TemplateCategory {
  return t.category ?? 'classic'
}
