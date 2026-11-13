'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
} from 'react'
import {
  DEFAULT_UI_STATE,
  createDocument,
  loadDocuments,
  loadRecentFiles,
  loadVersionHistory,
  migrateLegacyArticles,
  migrateLegacyDraft,
  pushVersion,
  saveDocuments,
  saveRecentFiles,
  saveVersionHistory,
  shouldSnapshot,
  touchRecentFile,
  type DocumentMap,
  type DocumentVersion,
  type EditorDocument,
  type EditorUIState,
  type RecentFile,
} from '@/lib/storage'
import type { RendererOptions } from '@/lib/markdown'
import type { CodeThemeId } from '@/config/code-themes'

const WELCOME_CONTENT = `# 欢迎使用 NeuraPress

专业的公众号 Markdown 编辑器，开始编写你的文章吧！

## 快速上手

- **实时预览** — 左侧编辑，右侧即时预览
- **丰富格式** — 支持表格、代码高亮、数学公式、流程图
- **一键导出** — 复制到微信公众号或导出 HTML
- **精美模板** — 右侧模板面板可选择多种排版风格

> 在左侧编辑区输入 Markdown 内容，右侧会自动显示预览效果。

\`\`\`javascript
// 示例代码
console.log('Hello, NeuraPress!');
\`\`\`

---
`

export type SaveState = 'saved' | 'saving' | 'error'

interface EditorStoreState {
  documents: DocumentMap
  currentDocId: string | null
  ui: EditorUIState
  saveState: SaveState
  lastSavedAt: number | null
  versionHistory: Record<string, DocumentVersion[]>
  recentFiles: RecentFile[]
  hydrated: boolean
}

type EditorStoreAction =
  | { type: 'HYDRATE'; documents: DocumentMap; currentDocId: string | null; ui: EditorUIState; versionHistory: Record<string, DocumentVersion[]>; recentFiles: RecentFile[] }
  | { type: 'SELECT_DOC'; id: string }
  | { type: 'ADD_DOC'; doc: EditorDocument }
  | { type: 'DELETE_DOC'; id: string }
  | { type: 'UPDATE_DOC'; id: string; patch: Partial<Omit<EditorDocument, 'id' | 'createdAt'>> }
  | { type: 'UPDATE_CONTENT'; content: string }
  | { type: 'SET_UI'; patch: Partial<EditorUIState> }
  | { type: 'SET_SAVE_STATE'; saveState: SaveState; at?: number }
  | { type: 'PUSH_VERSION'; version: DocumentVersion }

const AUTOSAVE_DELAY = 1500

function reducer(state: EditorStoreState, action: EditorStoreAction): EditorStoreState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action, hydrated: true }
    case 'SELECT_DOC':
      return { ...state, currentDocId: action.id }
    case 'ADD_DOC':
      return {
        ...state,
        documents: { ...state.documents, [action.doc.id]: action.doc },
        currentDocId: action.doc.id,
      }
    case 'DELETE_DOC': {
      const documents = { ...state.documents }
      delete documents[action.id]
      const remaining = Object.values(documents)
      return {
        ...state,
        documents,
        currentDocId:
          state.currentDocId === action.id ? remaining[0]?.id ?? null : state.currentDocId,
      }
    }
    case 'UPDATE_DOC': {
      const doc = state.documents[action.id]
      if (!doc) return state
      return {
        ...state,
        documents: {
          ...state.documents,
          [action.id]: { ...doc, ...action.patch, updatedAt: Date.now() },
        },
      }
    }
    case 'UPDATE_CONTENT': {
      const id = state.currentDocId
      const doc = id ? state.documents[id] : null
      if (!id || !doc) return state
      return {
        ...state,
        saveState: 'saving',
        documents: { ...state.documents, [id]: { ...doc, content: action.content, updatedAt: Date.now() } },
      }
    }
    case 'SET_UI':
      return { ...state, ui: { ...state.ui, ...action.patch } }
    case 'SET_SAVE_STATE':
      return { ...state, saveState: action.saveState, lastSavedAt: action.at ?? state.lastSavedAt }
    case 'PUSH_VERSION':
      return { ...state, versionHistory: pushVersion(state.versionHistory, action.version) }
    default:
      return state
  }
}

function createWelcomeDoc(): EditorDocument {
  return createDocument({ title: '欢迎使用 NeuraPress', content: WELCOME_CONTENT })
}

interface EditorStoreContextValue {
  state: EditorStoreState
  currentDocument: EditorDocument | null
  selectDocument: (id: string) => void
  createNewDocument: (partial?: Partial<EditorDocument>) => EditorDocument
  deleteDocument: (id: string) => void
  renameDocument: (id: string, title: string) => void
  updateContent: (content: string) => void
  updateUI: (patch: Partial<EditorUIState>) => void
  setTemplate: (templateId: string) => void
  setStyleOptions: (options: RendererOptions) => void
  setCodeTheme: (theme: CodeThemeId) => void
  restoreVersion: (version: DocumentVersion) => void
  createManualSnapshot: () => void
  /** 立即把未保存的文档写入 localStorage（Ctrl+S / 切换文档前调用） */
  flushSave: () => void
}

const EditorStoreContext = createContext<EditorStoreContextValue | null>(null)

export function EditorStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    documents: {},
    currentDocId: null,
    ui: DEFAULT_UI_STATE,
    saveState: 'saved',
    lastSavedAt: null,
    versionHistory: {},
    recentFiles: [],
    hydrated: false,
  })

  const currentDocument = state.currentDocId ? state.documents[state.currentDocId] ?? null : null
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstDocumentsRender = useRef(true)

  // 初始化：加载持久化数据 + 旧键迁移
  useEffect(() => {
    let documents = loadDocuments()
    const ui: EditorUIState = { ...DEFAULT_UI_STATE }
    try {
      const rawUi = window.localStorage.getItem('markdown-editor-ui')
      if (rawUi) Object.assign(ui, JSON.parse(rawUi).state?.ui ?? JSON.parse(rawUi))
    } catch {
      /* 忽略损坏的 UI 数据 */
    }

    let docs = Object.values(documents)
    if (docs.length === 0) {
      // 旧版数据迁移
      const legacyDocs = migrateLegacyArticles()
      if (legacyDocs.length) {
        docs = legacyDocs
      }
      if (docs.length === 0) {
        const legacy = migrateLegacyDraft()
        docs = [legacy ? createDocument(legacy) : createWelcomeDoc()]
      }
    }

    const recentFiles = loadRecentFiles()
    const currentDocId = recentFiles.find((f) => documents[f.id])?.id || docs[0]?.id || null

    // 保证 documents map 完整（迁移出的文档可能还没写入 map）
    for (const doc of docs) {
      if (!documents[doc.id]) documents[doc.id] = doc
    }
    saveDocuments(documents)

    dispatch({
      type: 'HYDRATE',
      documents,
      currentDocId,
      ui,
      versionHistory: loadVersionHistory(),
      recentFiles,
    })
  }, [])

  // 自动保存：documents 变化后防抖持久化
  useEffect(() => {
    if (!state.hydrated) return
    if (isFirstDocumentsRender.current) {
      isFirstDocumentsRender.current = false
      return
    }
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      const ok = saveDocuments(state.documents)
      dispatch({ type: 'SET_SAVE_STATE', saveState: ok ? 'saved' : 'error', at: Date.now() })
    }, AUTOSAVE_DELAY)
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [state.documents, state.hydrated])

  // 版本历史：满足间隔/差异阈值时自动快照
  useEffect(() => {
    if (!state.hydrated || !state.currentDocId) return
    const doc = state.documents[state.currentDocId]
    if (!doc) return
    if (!shouldSnapshot(state.versionHistory, doc.id, doc.content)) return
    const version: DocumentVersion = {
      id: `version_${Date.now()}`,
      documentId: doc.id,
      title: doc.title,
      content: doc.content,
      createdAt: Date.now(),
    }
    dispatch({ type: 'PUSH_VERSION', version })
    saveVersionHistory(pushVersion(state.versionHistory, version))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated, state.currentDocId, state.documents])

  // 最近文件
  useEffect(() => {
    if (!state.hydrated || !currentDocument) return
    const files = touchRecentFile(currentDocument, state.recentFiles)
    if (files !== state.recentFiles) {
      saveRecentFiles(files)
      // 不派发 action，避免循环；展示时直接读 state.recentFiles，下次 hydrate 时同步
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated, state.currentDocId, currentDocument?.title])

  // UI 状态持久化
  useEffect(() => {
    if (!state.hydrated) return
    try {
      window.localStorage.setItem('markdown-editor-ui', JSON.stringify({ state: { ui: state.ui } }))
    } catch (error) {
      console.error('保存 UI 状态失败:', error)
    }
  }, [state.ui, state.hydrated])

  const actions = useMemo<EditorStoreContextValue>(() => {
    return {
      state,
      currentDocument,
      selectDocument: (id) => dispatch({ type: 'SELECT_DOC', id }),
      createNewDocument: (partial) => {
        const doc = createDocument(partial)
        dispatch({ type: 'ADD_DOC', doc })
        return doc
      },
      deleteDocument: (id) => dispatch({ type: 'DELETE_DOC', id }),
      renameDocument: (id, title) => dispatch({ type: 'UPDATE_DOC', id, patch: { title } }),
      updateContent: (content) => dispatch({ type: 'UPDATE_CONTENT', content }),
      updateUI: (patch) => dispatch({ type: 'SET_UI', patch }),
      setTemplate: (templateId) => {
        if (!state.currentDocId) return
        dispatch({ type: 'UPDATE_DOC', id: state.currentDocId, patch: { template: templateId, styleOptions: {} } })
      },
      setStyleOptions: (options) => {
        if (!state.currentDocId) return
        dispatch({ type: 'UPDATE_DOC', id: state.currentDocId, patch: { styleOptions: options } })
      },
      setCodeTheme: (theme) => {
        if (!state.currentDocId) return
        dispatch({ type: 'UPDATE_DOC', id: state.currentDocId, patch: { codeTheme: theme } })
      },
      restoreVersion: (version) => {
        dispatch({ type: 'UPDATE_CONTENT', content: version.content })
      },
      createManualSnapshot: () => {
        if (!currentDocument) return
        const version: DocumentVersion = {
          id: `version_${Date.now()}`,
          documentId: currentDocument.id,
          title: currentDocument.title,
          content: currentDocument.content,
          createdAt: Date.now(),
        }
        dispatch({ type: 'PUSH_VERSION', version })
        saveVersionHistory(pushVersion(state.versionHistory, version))
      },
      flushSave: () => {
        if (!state.hydrated) return
        if (persistTimer.current) {
          clearTimeout(persistTimer.current)
          persistTimer.current = null
        }
        const ok = saveDocuments(state.documents)
        dispatch({ type: 'SET_SAVE_STATE', saveState: ok ? 'saved' : 'error', at: Date.now() })
      },
    }
  }, [state, currentDocument])

  return <EditorStoreContext.Provider value={actions}>{children}</EditorStoreContext.Provider>
}

export function useEditorStore(): EditorStoreContextValue {
  const ctx = useContext(EditorStoreContext)
  if (!ctx) {
    throw new Error('useEditorStore 必须在 <EditorStoreProvider> 内使用')
  }
  return ctx
}

/** 便捷读取当前文档 */
export function useCurrentDocument(): EditorDocument | null {
  return useEditorStore().currentDocument
}
