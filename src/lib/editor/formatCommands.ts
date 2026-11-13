import { EditorSelection } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import type { KeyBinding } from '@codemirror/view'

/**
 * Pro 同款格式化命令集（对齐 md.newkit.site 工具栏）。
 * 所有命令作用于当前选区 / 光标，返回 boolean 表示是否生效。
 */

type WrapSpec = {
  prefix: string
  suffix?: string
  placeholder?: string
}

/** 行内包裹：**bold**、*italic*、`code`、<u>…</u> 等 */
export function wrapInline({ prefix, suffix = prefix, placeholder = '文本' }: WrapSpec) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    const body = selected || placeholder
    const insert = prefix + body + suffix
    view.dispatch({
      changes: { from, to, insert },
      // 未选中时把光标放到占位文本处便于直接输入
      selection: selected
        ? { anchor: from + prefix.length, head: from + prefix.length + body.length }
        : { anchor: from + prefix.length, head: from + prefix.length + placeholder.length },
      scrollIntoView: true,
    })
    view.focus()
    return true
  }
}

/** 已包裹时反包裹（再次点击取消样式） */
export function toggleWrapInline(spec: WrapSpec) {
  const suffix = spec.suffix ?? spec.prefix
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    if (
      selected.startsWith(spec.prefix) &&
      selected.endsWith(suffix) &&
      selected.length > spec.prefix.length + suffix.length
    ) {
      const body = selected.slice(spec.prefix.length, selected.length - suffix.length)
      view.dispatch({
        changes: { from, to, insert: body },
        selection: { anchor: from, head: from + body.length },
        scrollIntoView: true,
      })
      view.focus()
      return true
    }
    return wrapInline(spec)(view)
  }
}

/** 行前缀切换：标题、列表、引用等 */
export function toggleLinePrefix(prefix: string, ordered = false) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const startLine = view.state.doc.lineAt(from)
    const endLine = view.state.doc.lineAt(to)
    const lineNumbers = []
    for (let i = startLine.number; i <= endLine.number; i++) {
      lineNumbers.push(view.state.doc.line(i))
    }

    const changes = lineNumbers.map((line, index) => {
      const current = ordered ? `${index + 1}. ` : prefix
      if (line.text.startsWith(current)) {
        return { from: line.from, to: line.from + current.length, insert: '' }
      }
      return { from: line.from, to: line.from, insert: current }
    })

    view.dispatch({ changes, selection: EditorSelection.cursor(changes[0].from), scrollIntoView: true })
    view.focus()
    return true
  }
}

/**
 * 插入整块内容（代码块 / 表格 / 公式 / Mermaid）。
 * ensureBlockSpacing=true 时同时在块后补空行，避免表格等块级语法
 * 与后文粘连导致 Markdown 解析失败（预览里看不到表格）。
 */
export function insertBlock(text: string, cursorOffset?: number, ensureBlockSpacing = false) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    const before = from > 0 && !/^\n/.test(view.state.sliceDoc(from - 1, from)) ? '\n\n' : ''
    const after =
      ensureBlockSpacing && to < view.state.doc.length && !/^\n/.test(view.state.sliceDoc(to, to + 1))
        ? '\n\n'
        : ''
    const insert = before + text + after
    view.dispatch({
      changes: { from, to, insert: selected ? insert.replace('{body}', selected) : insert },
      selection: selected
        ? { anchor: from + before.length }
        : { anchor: from + before.length + (cursorOffset ?? text.length) },
      scrollIntoView: true,
    })
    view.focus()
    return true
  }
}

const FENCE = '```'

export const formatCommands = {
  bold: toggleWrapInline({ prefix: '**', placeholder: '粗体文本' }),
  italic: toggleWrapInline({ prefix: '*', placeholder: '斜体文本' }),
  underline: toggleWrapInline({ prefix: '<u>', suffix: '</u>', placeholder: '下划线文本' }),
  strikethrough: toggleWrapInline({ prefix: '~~', placeholder: '删除线文本' }),
  inlineCode: toggleWrapInline({ prefix: '`', placeholder: '代码' }),
  codeBlock: insertBlock(`${FENCE}javascript\n{body}\n${FENCE}\n`, `${FENCE}javascript\n`.length),
  h1: toggleLinePrefix('# '),
  h2: toggleLinePrefix('## '),
  h3: toggleLinePrefix('### '),
  h4: toggleLinePrefix('#### '),
  h5: toggleLinePrefix('##### '),
  h6: toggleLinePrefix('###### '),
  bulletList: toggleLinePrefix('- '),
  orderedList: toggleLinePrefix('1. ', true),
  quote: toggleLinePrefix('> '),
  link: wrapInline({ prefix: '[', suffix: '](https://)', placeholder: '链接文字' }),
  // 插入图片改为打开图片管理弹窗（对齐 Pro），此命令仅作兜底
  image: wrapInline({ prefix: '![', suffix: '](https://)', placeholder: '图片描述' }),
  /** Pro 同款 3 列表格模板（带空格对齐，前后自动留空行保证块级解析） */
  table: insertBlock(
    '| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |',
    2,
    true,
  ),
  mathBlock: insertBlock('$$\nE = mc^2\n$$\n', 3),
  mermaidBlock: insertBlock(`${FENCE}mermaid\ngraph TD;\n    A-->B;\n${FENCE}\n`, `${FENCE}mermaid\n`.length),
  hr: insertBlock('---\n'),
} as const

export type FormatCommandName = keyof typeof formatCommands

/** CodeMirror keymap 形式的快捷键绑定，对齐 Pro 站 tooltip 标注 */
export function formatKeymap(): KeyBinding[] {
  return [
    { key: 'Mod-b', run: formatCommands.bold },
    { key: 'Mod-i', run: formatCommands.italic },
    { key: 'Mod-u', run: formatCommands.underline },
    { key: 'Mod-Shift-x', run: formatCommands.strikethrough },
    { key: 'Mod-`', run: formatCommands.inlineCode },
    { key: 'Mod-Shift-c', run: formatCommands.codeBlock },
    { key: 'Mod-1', run: formatCommands.h1 },
    { key: 'Mod-2', run: formatCommands.h2 },
    { key: 'Mod-3', run: formatCommands.h3 },
    { key: 'Mod-4', run: formatCommands.h4 },
    { key: 'Mod-5', run: formatCommands.h5 },
    { key: 'Mod-6', run: formatCommands.h6 },
    { key: 'Mod-Shift-8', run: formatCommands.bulletList },
    { key: 'Mod-Shift-7', run: formatCommands.orderedList },
    { key: 'Mod-Shift-9', run: formatCommands.quote },
    { key: 'Mod-k', run: formatCommands.link },
    // Mod-Shift-i 交给应用层打开图片管理弹窗（对齐 Pro），不再插入占位 markdown
    { key: 'Mod-Shift-t', run: formatCommands.table },
    { key: 'Mod-Shift-m', run: formatCommands.mathBlock },
  ]
}

/** 扩展形式的快捷键 */
export const formatKeymapExtension = keymap.of(formatKeymap())
