'use client'

import { useEffect, useRef } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { tags as t } from '@lezer/highlight'
import { cn } from '@/lib/utils'
import { formatKeymapExtension } from '@/lib/editor/formatCommands'
import '@/styles/code-editor.css'

interface WechatCodeEditorProps {
  value: string
  onChange: (value: string) => void
  /** 编辑器实例就绪后回调，供工具栏执行格式化命令 */
  onReady?: (view: EditorView) => void
  /** 编辑器滚动事件（用于与预览同步） */
  onEditorScroll?: (e: Event) => void
  /** 是否显示行号（编辑器设置） */
  showLineNumbers?: boolean
  className?: string
}

const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, class: 'cm-heading' },
  { tag: t.heading2, class: 'cm-heading' },
  { tag: t.heading3, class: 'cm-heading' },
  { tag: t.heading, class: 'cm-heading' },
  { tag: t.strong, class: 'cm-strong' },
  { tag: t.emphasis, class: 'cm-emphasis' },
  { tag: t.strikethrough, class: 'cm-strikethrough' },
  { tag: t.link, class: 'cm-link' },
  { tag: t.url, class: 'cm-url' },
  { tag: t.monospace, class: 'cm-code' },
  { tag: t.quote, class: 'cm-quote' },
  { tag: t.meta, class: 'cm-meta' },
  { tag: t.keyword, class: 'cm-keyword' },
  { tag: t.string, class: 'cm-string' },
  { tag: t.number, class: 'cm-number' },
  { tag: t.atom, class: 'cm-atom' },
  { tag: t.comment, class: 'cm-comment' },
  { tag: t.definition(t.variableName), class: 'cm-def' },
])

export function WechatCodeEditor({
  value,
  onChange,
  onReady,
  onEditorScroll,
  showLineNumbers = true,
  className,
}: WechatCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const themeCompartment = useRef(new Compartment())
  const lineNumbersCompartment = useRef(new Compartment())

  onChangeRef.current = onChange
  valueRef.current = value

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        lineNumbersCompartment.current.of(lineNumbers()),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter({
          markerDOM(open) {
            const span = document.createElement('span')
            span.textContent = open ? '⌄' : '›'
            span.style.padding = '0 4px'
            return span
          },
        }),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(markdownHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        formatKeymapExtension,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        themeCompartment.current.of(EditorView.theme({})),
        EditorView.domEventHandlers({
          scroll: (event) => {
            onEditorScroll?.(event)
            return false
          },
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    onReady?.(view)

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 外部 value 变化（如切换文档 / AI 改写）时同步进编辑器
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  // 行号显示开关（编辑器设置 → 外观）
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: lineNumbersCompartment.current.reconfigure(
        showLineNumbers ? lineNumbers() : [],
      ),
    })
  }, [showLineNumbers])

  return (
    <div
      ref={containerRef}
      className={cn('pro-code-editor h-full w-full overflow-hidden', className)}
      data-testid="wechat-code-editor"
    />
  )
}
