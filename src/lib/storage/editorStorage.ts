/**
 * 编辑器统一持久化层。
 * localStorage 键名对齐 NeuraPress Pro（md.newkit.site）：
 *  - markdown-editor-documents         多文档
 *  - markdown-editor-recent-files      最近文件
 *  - markdown-editor-version-history   版本历史
 *  - markdown-editor-ui                UI 状态
 *  - image_host_configs / default_image_host_config_id  图床配置
 */

import type { RendererOptions } from '@/lib/markdown'
import type { CodeThemeId } from '@/config/code-themes'

export interface EditorDocument {
  id: string
  title: string
  content: string
  template: string
  styleOptions: RendererOptions
  codeTheme: CodeThemeId
  createdAt: number
  updatedAt: number
}

export interface RecentFile {
  id: string
  title: string
  lastOpened: number
  size: number
}

export interface DocumentVersion {
  id: string
  documentId: string
  title: string
  content: string
  createdAt: number
}

export interface EditorUIState {
  sidebarVisible: boolean
  previewVisible: boolean
  toolbarVisible: boolean
  templatePanelOpen: boolean
  previewZoom: number
  mobilePreviewMode: boolean
  showHtmlSource: boolean
  /** 编辑区在「编辑+预览」分屏中的宽度占比（0.25~0.75，默认 0.5） */
  editorPaneRatio: number
}

export const MIN_SPLIT_RATIO = 0.25
export const MAX_SPLIT_RATIO = 0.75
export const DEFAULT_SPLIT_RATIO = 0.5

/** 规整持久化的分屏比例：旧数据缺失、非数字或越界时回落到默认值 */
export function normalizeSplitRatio(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SPLIT_RATIO
  if (value < MIN_SPLIT_RATIO || value > MAX_SPLIT_RATIO) return DEFAULT_SPLIT_RATIO
  return value
}

export const DEFAULT_UI_STATE: EditorUIState = {
  sidebarVisible: false,
  previewVisible: true,
  toolbarVisible: true,
  templatePanelOpen: true,
  previewZoom: 100,
  mobilePreviewMode: false,
  showHtmlSource: false,
  editorPaneRatio: DEFAULT_SPLIT_RATIO,
}

export const STORAGE_KEYS = {
  documents: 'markdown-editor-documents',
  recentFiles: 'markdown-editor-recent-files',
  versionHistory: 'markdown-editor-version-history',
  ui: 'markdown-editor-ui',
} as const

/** 安全读取 JSON，损坏时返回 fallback */
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (error) {
    console.error(`读取 localStorage "${key}" 失败:`, error)
    return fallback
  }
}

function safeSet(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`写入 localStorage "${key}" 失败:`, error)
    return false
  }
}

// ---------- 多文档 ----------

export type DocumentMap = Record<string, EditorDocument>

export function loadDocuments(): DocumentMap {
  return safeGet<DocumentMap>(STORAGE_KEYS.documents, {})
}

export function saveDocuments(documents: DocumentMap): boolean {
  return safeSet(STORAGE_KEYS.documents, documents)
}

export function createDocument(partial?: Partial<EditorDocument>): EditorDocument {
  const now = Date.now()
  return {
    id: `doc_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: partial?.title || '未命名文档',
    content: partial?.content || '',
    template: partial?.template || 'default',
    styleOptions: partial?.styleOptions || {},
    codeTheme: partial?.codeTheme || 'github',
    createdAt: now,
    updatedAt: now,
  }
}

/** 旧版（textarea 时代）键迁移：wechat_editor_content / wechat_editor_draft */
export function migrateLegacyDraft(): { content: string; title: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const draft = window.localStorage.getItem('wechat_editor_draft')
    const saved = window.localStorage.getItem('wechat_editor_content')
    const content = draft || saved
    if (!content || !content.trim()) return null
    const firstLine = content.split('\n').find((l) => l.trim())
    const title = firstLine?.replace(/^#+\s*/, '').slice(0, 30) || '导入的旧文章'
    return { content, title }
  } catch (error) {
    console.error('迁移旧草稿失败:', error)
    return null
  }
}

/** 迁移 ArticleList 的 wechat_articles 键为多文档 */
export function migrateLegacyArticles(): EditorDocument[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('wechat_articles')
    if (!raw) return []
    const articles = JSON.parse(raw) as Array<{
      id?: string
      title?: string
      content?: string
      template?: string
      updatedAt?: number
    }>
    if (!Array.isArray(articles)) return []
    return articles
      .filter((a) => typeof a.content === 'string' && a.content.trim())
      .map((a, index) =>
        createDocument({
          title: a.title || `旧文章 ${index + 1}`,
          content: a.content,
          template: a.template,
        }),
      )
  } catch (error) {
    console.error('迁移旧文章列表失败:', error)
    return []
  }
}

// ---------- 最近文件 ----------

export function loadRecentFiles(): RecentFile[] {
  return safeGet<RecentFile[]>(STORAGE_KEYS.recentFiles, [])
}

export function saveRecentFiles(files: RecentFile[]): boolean {
  return safeSet(STORAGE_KEYS.recentFiles, files)
}

export function touchRecentFile(doc: EditorDocument, files: RecentFile[]): RecentFile[] {
  const others = files.filter((f) => f.id !== doc.id)
  return [
    {
      id: doc.id,
      title: doc.title,
      lastOpened: Date.now(),
      size: doc.content.length,
    },
    ...others,
  ].slice(0, 20)
}

// ---------- 版本历史 ----------

const MAX_VERSIONS_PER_DOC = 30

export function loadVersionHistory(): Record<string, DocumentVersion[]> {
  return safeGet<Record<string, DocumentVersion[]>>(STORAGE_KEYS.versionHistory, {})
}

export function saveVersionHistory(history: Record<string, DocumentVersion[]>): boolean {
  return safeSet(STORAGE_KEYS.versionHistory, history)
}

export function pushVersion(
  history: Record<string, DocumentVersion[]>,
  version: DocumentVersion,
): Record<string, DocumentVersion[]> {
  const list = [version, ...(history[version.documentId] || [])].slice(0, MAX_VERSIONS_PER_DOC)
  return { ...history, [version.documentId]: list }
}

/** 是否值得记录一个版本：内容变化超过阈值或距上次记录超过间隔 */
export function shouldSnapshot(
  history: Record<string, DocumentVersion[]>,
  documentId: string,
  content: string,
  intervalMs = 60_000,
  minDiffChars = 50,
): boolean {
  const list = history[documentId] || []
  const last = list[0]
  if (!last) return content.trim().length > 0
  if (Date.now() - last.createdAt < intervalMs) return false
  return Math.abs(last.content.length - content.length) >= minDiffChars
}

// ---------- Markdown 文件导入 ----------

/** 解析导入的 Markdown 文件：标题取文件名（去扩展名），内容为文件文本 */
export async function importMarkdownDocument(
  file: File,
): Promise<{ title: string; content: string }> {
  const text = await file.text()
  const title = file.name.replace(/\.(md|markdown|txt)$/i, '').trim() || '导入的文档'
  return { title, content: text }
}
