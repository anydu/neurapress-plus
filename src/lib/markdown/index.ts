import type { RendererOptions } from './types'
import { MarkdownParser } from './parser'
import { getCodeThemeStyles } from './styles'

// 预处理函数
function preprocessMarkdown(markdown: string): string {
  return markdown
    // 处理 ** 语法，但排除已经是 HTML 的部分
    .replace(/(?<!<[^>]*)\*\*([^*]+)\*\*(?![^<]*>)/g, '<strong>$1</strong>')
    // 处理无序列表的 - 标记，但排除代码块内的部分
    .replace(/^(?!\s*```)([ \t]*)-\s+/gm, '$1• ')
}

export const defaultOptions: RendererOptions = {
  base: {
    themeColor: '#1a1a1a',
    fontSize: '15px',
    lineHeight: '1.75',
    textAlign: 'left'
  },
  block: {
    code_pre: {
      fontSize: '14px',
      overflowX: 'auto',
      borderRadius: '8px',
      padding: '1em',
      lineHeight: '1.5',
      margin: '10px 8px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '20px 0',
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      fontSize: '15px'
    },
    // th 背景不写死：由渲染器按模板/用户主题色注入（切换模板表格即跟随变化）
    th: {
      color: '#fff',
      fontWeight: 'bold',
      padding: '15px 12px',
      textAlign: 'left',
      fontSize: '15px'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #eee',
      fontSize: '15px'
    },
    footnotes: {
      marginTop: '2em',
      paddingTop: '1em',
      borderTop: '1px solid #eee',
      fontSize: '0.9em',
      color: '#666'
    },
    latex: {
      margin: '1em 0',
      fontSize: '1.1em',
      textAlign: 'center'
    }
  },
  inline: {
    link: { color: '#576b95' },
    codespan: { color: '#333333' },
    em: { color: '#666666' },
    del: { color: '#999999', textDecoration: 'line-through' },
    checkbox: {
      marginRight: '0.5em',
      verticalAlign: 'middle'
    },
    latex: {
      fontSize: '1.1em'
    }
  }
}

/** 表格相关样式键：逐键合并，避免模板只定义 td 时 th/table 丢掉默认属性 */
const TABLE_STYLE_KEYS = ['table', 'thead', 'th', 'td'] as const

export function convertToWechat(markdown: string, options: RendererOptions = defaultOptions): string {
  const block: NonNullable<RendererOptions['block']> = {
    ...defaultOptions.block,
    ...options.block,
  }
  for (const key of TABLE_STYLE_KEYS) {
    block[key] = { ...defaultOptions.block?.[key], ...options.block?.[key] }
  }
  const mergedOptions = {
    base: { ...defaultOptions.base, ...options.base },
    block,
    inline: { ...defaultOptions.inline, ...options.inline },
    codeTheme: options.codeTheme || 'github'
  }

  const parser = new MarkdownParser(mergedOptions)
  return parser.parse(markdown)
}

export { getCodeThemeStyles }
export type { RendererOptions }
export * from './types' 