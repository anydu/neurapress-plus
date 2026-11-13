/**
 * Mermaid 渲染统一模块（归并原 mermaid-utils / mermaid-init /
 * utils/mermaid / config/mermaid / types/mermaid / components/MermaidRenderer）
 */
import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'

export type MermaidTheme = 'default' | 'dark' | 'neutral' | 'forest'

export interface MermaidError extends Error {
  content: string
}

const defaultThemeVariables = {
  primaryColor: '#4f46e5',
  primaryBorderColor: '#4f46e5',
  primaryTextColor: '#000000',
  lineColor: '#666666',
  textColor: '#333333',
  fontSize: '14px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif',
}

const darkThemeVariables = {
  ...defaultThemeVariables,
  primaryColor: '#6366f1',
  primaryBorderColor: '#6366f1',
  primaryTextColor: '#ffffff',
  lineColor: '#999999',
  textColor: '#ffffff',
}

export const themeVariables: Record<MermaidTheme, typeof defaultThemeVariables> = {
  default: defaultThemeVariables,
  dark: darkThemeVariables,
  neutral: { ...defaultThemeVariables, primaryColor: '#6b7280', primaryBorderColor: '#6b7280' },
  forest: { ...defaultThemeVariables, primaryColor: '#059669', primaryBorderColor: '#059669' },
}

export const createMermaidConfig = (theme: MermaidTheme = 'default'): MermaidConfig => ({
  theme: 'base',
  themeVariables: themeVariables[theme],
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 50,
    useMaxWidth: false,
  },
  sequence: {
    useMaxWidth: false,
    boxMargin: 10,
    mirrorActors: false,
    bottomMarginAdj: 2,
  },
  pie: {
    textPosition: 0.75,
    useMaxWidth: true,
  },
  startOnLoad: false,
  securityLevel: 'loose',
})

/** 获取当前站点明暗主题 */
export const getCurrentTheme = (): MermaidTheme => {
  if (typeof window === 'undefined') return 'default'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'default'
}

/** 初始化 mermaid 配置（按当前主题） */
export const initializeMermaidConfig = (theme: MermaidTheme = getCurrentTheme()) => {
  mermaid.initialize(createMermaidConfig(theme))
}

/**
 * 渲染单个图表源码为 SVG。
 * @throws MermaidError 语法错误或渲染失败
 */
export const renderMermaidDiagram = async (content: string): Promise<{ svg: string }> => {
  try {
    await mermaid.parse(content)
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2)}`
    return await mermaid.render(id, content)
  } catch (error) {
    const mermaidError: MermaidError = Object.assign(
      error instanceof Error ? error : new Error('未知错误'),
      { content, message: error instanceof Error ? error.message : '未知错误' },
    )
    throw mermaidError
  }
}

/**
 * 初始化配置并渲染容器内所有未渲染的 .mermaid 元素。
 * 兼容旧 mermaid-utils.initializeMermaid 的调用语义。
 */
export const initializeMermaid = async (theme: MermaidTheme = getCurrentTheme()) => {
  initializeMermaidConfig(theme)
  await renderMermaidDiagrams(theme)
}

/** 批量渲染页面中的图表 */
export const renderMermaidDiagrams = async (theme: MermaidTheme = getCurrentTheme()) => {
  initializeMermaidConfig(theme)
  try {
    const elements = document.querySelectorAll<HTMLElement>('.mermaid')
    if (!elements.length) return

    for (const element of Array.from(elements)) {
      try {
        if (element.querySelector('svg')) continue
        const source = element.textContent?.trim() || ''
        if (!source) continue

        const { svg } = await renderMermaidDiagram(source)
        element.innerHTML = svg

        if (theme === 'dark') {
          const svgElement = element.querySelector('svg')
          if (svgElement) svgElement.style.filter = 'invert(0.85)'
        }
      } catch (error) {
        console.error('Failed to render mermaid diagram:', error)
        const message = error instanceof Error ? error.message : '图表渲染失败'
        const source = element.textContent?.trim() || ''
        element.innerHTML = `
          <div class="mermaid-error rounded-lg overflow-hidden border border-red-200">
            <div class="bg-red-50 dark:bg-red-950 p-3 text-red-700 dark:text-red-400 text-sm">${message}</div>
            <pre class="bg-white dark:bg-zinc-900 p-3 m-0 text-sm overflow-x-auto">${source}</pre>
          </div>
        `
      }
    }
  } catch (error) {
    console.error('Failed to initialize mermaid:', error)
  }
}
