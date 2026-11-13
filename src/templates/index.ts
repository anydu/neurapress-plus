/**
 * 模板注册表：分类 + 搜索辅助。
 * 各模板定义在同目录的 classic / collections / colors 中。
 */
import type { Template, TemplateCategory } from './types'
import { getTemplateCategory } from './types'
import { classicTemplates } from './classic'
import { techTemplates, businessTemplates, miscTemplates } from './collections'
import { blueTemplates, macaronTemplates, darkTemplates } from './colors'

export type { Template, TemplateCategory }
export { TEMPLATE_CATEGORIES, getTemplateCategory } from './types'

export const templates: Template[] = [
  ...classicTemplates,
  ...techTemplates,
  ...businessTemplates,
  ...miscTemplates,
  ...blueTemplates,
  ...macaronTemplates,
  ...darkTemplates,
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: TemplateCategory | 'all'): Template[] {
  if (category === 'all') return templates
  return templates.filter((t) => getTemplateCategory(t) === category)
}

export function searchTemplates(query: string): Template[] {
  const q = query.trim().toLowerCase()
  if (!q) return templates
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      getTemplateCategory(t).includes(q),
  )
}

export function categoryCount(category: TemplateCategory | 'all'): number {
  return getTemplatesByCategory(category).length
}
