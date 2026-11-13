import type { Template } from './types'

/** 蓝色系模板 */
export const blueTemplates: Template[] = [
  {
    id: 'blue-gradient',
    name: '蔚蓝渐变',
    description: '深浅蓝渐变标题，清爽大气',
    category: 'blue',
    styles: '',
    options: {
      base: { themeColor: '#0284c7', fontSize: '15px', lineHeight: '1.85' },
      block: {
        h1: {
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          margin: '2em 0 1.2em',
        },
        h2: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#0369a1',
          margin: '1.6em 0 0.8em',
          paddingBottom: '4px',
          borderBottom: '2px solid #bae6fd',
        },
        h3: { fontSize: '16px', fontWeight: 'bold', color: '#075985', margin: '1.4em 0 0.6em' },
        p: { margin: '1em 0', lineHeight: 1.85, color: '#334155', textAlign: 'justify' },
        blockquote: {
          borderLeft: '4px solid #0ea5e9',
          background: 'linear-gradient(90deg, #f0f9ff, #eef2ff)',
          padding: '1em',
          color: '#0c4a6e',
          margin: '1.2em 0',
          borderRadius: '0 8px 8px 0',
        },
      },
      inline: {
        strong: { color: '#0284c7', fontWeight: 'bold' },
        link: { color: '#0284c7', textDecoration: 'underline' },
        em: { color: '#64748b' },
      },
    },
  },
  {
    id: 'blue-deep',
    name: '深海蓝',
    description: '深邃沉静，适合深度长文',
    category: 'blue',
    styles: '',
    options: {
      base: { themeColor: '#1e3a8a', fontSize: '15px', lineHeight: '1.9' },
      block: {
        h1: {
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#172554',
          margin: '2em 0 1em',
          letterSpacing: '1px',
        },
        h2: {
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '1.6em 0 0.8em',
          padding: '6px 14px',
          background: '#1e3a8a',
          color: '#eff6ff',
          borderRadius: '4px',
          display: 'table',
        },
        h3: { fontSize: '16px', fontWeight: 'bold', color: '#1e40af', margin: '1.4em 0 0.6em' },
        p: { margin: '1em 0', lineHeight: 1.9, color: '#1e293b', textAlign: 'justify' },
        blockquote: {
          borderLeft: '4px solid #1e3a8a',
          background: '#f1f5f9',
          padding: '1em',
          color: '#334155',
          margin: '1.2em 0',
        },
      },
      inline: {
        strong: { color: '#1e3a8a', fontWeight: 'bold' },
        link: { color: '#1d4ed8', textDecoration: 'underline' },
        em: { color: '#64748b' },
      },
    },
  },
]

/** 马卡龙模板 */
export const macaronTemplates: Template[] = [
  {
    id: 'macaron-pink',
    name: '马卡龙粉',
    description: '柔嫩粉色调，少女感满满',
    category: 'macaron',
    styles: '',
    options: {
      base: { themeColor: '#ec4899', fontSize: '15px', lineHeight: '1.9' },
      block: {
        h1: {
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#be185d',
          textAlign: 'center',
          margin: '1.8em auto 1em',
        },
        h2: {
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#db2777',
          margin: '1.6em 0 0.8em',
          display: 'inline-block',
          padding: '4px 14px',
          background: '#fce7f3',
          borderRadius: '999px',
        },
        h3: { fontSize: '16px', fontWeight: 'bold', color: '#9d174d', margin: '1.4em 0 0.6em' },
        p: { margin: '1em 0', lineHeight: 1.9, color: '#500724', textAlign: 'justify' },
        blockquote: {
          background: '#fdf2f8',
          borderLeft: '4px solid #f9a8d4',
          padding: '1em',
          color: '#9d174d',
          borderRadius: '10px',
          margin: '1.2em 0',
        },
      },
      inline: {
        strong: { color: '#ec4899', fontWeight: 'bold' },
        link: { color: '#db2777', textDecoration: 'underline' },
        em: { color: '#a8a29e' },
      },
    },
  },
  {
    id: 'macaron-mint',
    name: '马卡龙薄荷',
    description: '薄荷绿+奶油黄，清新治愈',
    category: 'macaron',
    styles: '',
    options: {
      base: { themeColor: '#14b8a6', fontSize: '15px', lineHeight: '1.9' },
      block: {
        h1: {
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#0f766e',
          textAlign: 'center',
          margin: '1.8em auto 1em',
        },
        h2: {
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#0d9488',
          margin: '1.6em 0 0.8em',
          display: 'inline-block',
          padding: '4px 14px',
          background: '#ccfbf1',
          borderRadius: '8px',
        },
        h3: { fontSize: '16px', fontWeight: 'bold', color: '#115e59', margin: '1.4em 0 0.6em' },
        p: { margin: '1em 0', lineHeight: 1.9, color: '#134e4a', textAlign: 'justify' },
        blockquote: {
          background: 'linear-gradient(90deg, #ecfeff, #fefce8)',
          borderLeft: '4px solid #5eead4',
          padding: '1em',
          color: '#0f766e',
          borderRadius: '10px',
          margin: '1.2em 0',
        },
      },
      inline: {
        strong: { color: '#14b8a6', fontWeight: 'bold' },
        link: { color: '#0d9488', textDecoration: 'underline' },
        em: { color: '#94a3b8' },
      },
    },
  },
]

/** 暗色补充模板 */
export const darkTemplates: Template[] = [
  {
    id: 'dark-violet',
    name: '暗夜紫',
    description: '深色底+紫罗兰高亮，酷感十足',
    category: 'dark',
    styles: '',
    options: {
      base: {
        themeColor: '#a78bfa',
        fontSize: '15px',
        lineHeight: '1.8',
        padding: '1.5rem',
        color: '#e4e4e7',
      },
      block: {
        h1: {
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#c4b5fd',
          margin: '1.8em 0 1em',
          textAlign: 'center',
        },
        h2: {
          fontSize: '19px',
          fontWeight: 'bold',
          color: '#a78bfa',
          margin: '1.6em 0 0.8em',
          paddingLeft: '12px',
          borderLeft: '4px solid #8b5cf6',
        },
        h3: { fontSize: '16px', fontWeight: 'bold', color: '#d8b4fe', margin: '1.4em 0 0.6em' },
        p: { margin: '1em 0', lineHeight: 1.8, color: '#d4d4d8' },
        blockquote: {
          borderLeft: '3px solid #8b5cf6',
          background: '#27272a',
          padding: '1em',
          color: '#a1a1aa',
          borderRadius: '0 6px 6px 0',
          margin: '1.2em 0',
        },
        code_pre: {
          background: '#27272a',
          border: '1px solid #3f3f46',
          borderRadius: '6px',
          padding: '1em',
          margin: '1.2em 0',
          overflowX: 'auto',
        },
      },
      inline: {
        strong: { color: '#f0abfc', fontWeight: 'bold' },
        link: { color: '#c4b5fd', textDecoration: 'underline' },
        codespan: {
          color: '#f0abfc',
          background: '#27272a',
          padding: '2px 6px',
          borderRadius: '4px',
        },
        em: { color: '#a1a1aa' },
      },
    },
    transform: (html: string) =>
      `<section style="background:#18181b;padding:16px;border-radius:8px;">${html}</section>`,
  },
]
