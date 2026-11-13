import { useState, useCallback, useEffect } from 'react'
import { getTemplateById } from '@/templates'
import { convertToWechat, getCodeThemeStyles, type RendererOptions } from '@/lib/markdown'
import { type CodeThemeId } from '@/config/code-themes'
import { useToast } from '@/components/ui/use-toast'
import { deepMerge } from '@/lib/utils/deepMerge'
import { initializeMermaid } from '@/lib/markdown/mermaid'

interface UsePreviewContentProps {
  value: string
  selectedTemplate: string
  styleOptions: RendererOptions
  codeTheme: CodeThemeId
}

/** 合并模板默认样式 + 用户样式配置 + 代码主题 */
export function mergeRendererOptions(
  templateOptions: RendererOptions | undefined,
  styleOptions: RendererOptions,
  codeTheme: CodeThemeId,
): RendererOptions {
  const themeColor =
    styleOptions.base?.themeColor || templateOptions?.base?.themeColor || '#1a1a1a'
  const fontSize = styleOptions.base?.fontSize || templateOptions?.base?.fontSize || '15px'
  const lineHeight = styleOptions.base?.lineHeight || templateOptions?.base?.lineHeight || '2'

  const userOverrides: RendererOptions = {
    ...styleOptions,
    base: { ...templateOptions?.base, ...styleOptions.base },
    block: {
      ...templateOptions?.block,
      ...styleOptions.block,
    },
  }

  const merged = deepMerge<RendererOptions>(
    {
      base: {},
      block: {},
      inline: {},
      codeTheme,
    },
    userOverrides,
  )

  // 代码块主题始终以选中的 codeTheme 为准
  merged.block = {
    ...merged.block,
    code_pre: {
      ...merged.block?.code_pre,
      ...getCodeThemeStyles(codeTheme),
    },
  }

  // 主题色应用规则（对齐 Pro）：标题 h1-h3 颜色跟随主题色，
  // 用户显式设置字号时传导到标题与正文
  const userThemeColor = styleOptions.base?.themeColor
  const userFontSize = styleOptions.base?.fontSize
  for (const key of ['h1', 'h2', 'h3'] as const) {
    const cur = { ...merged.block?.[key] }
    cur.color = themeColor
    if (key !== 'h3' && cur.borderBottom) {
      cur.borderBottom = `2px solid ${themeColor}`
    }
    if (key === 'h3' && cur.borderLeft) {
      cur.borderLeft = `3px solid ${themeColor}`
    }
    if (userFontSize) cur.fontSize = userFontSize
    merged.block[key] = cur
  }
  for (const key of ['p', 'ol', 'ul'] as const) {
    merged.block[key] = {
      ...merged.block?.[key],
      ...(userFontSize ? { fontSize: userFontSize } : {}),
    }
  }
  merged.inline = {
    ...merged.inline,
    listitem: { ...merged.inline?.listitem, ...(userFontSize ? { fontSize: userFontSize } : {}) },
  }

  return merged
}

export const usePreviewContent = ({
  value,
  selectedTemplate,
  styleOptions,
  codeTheme,
}: UsePreviewContentProps) => {
  const { toast } = useToast()
  const [isConverting, setIsConverting] = useState(false)
  const [previewContent, setPreviewContent] = useState('')

  const getPreviewContent = useCallback(() => {
    const template = getTemplateById(selectedTemplate)
    const mergedOptions = mergeRendererOptions(template?.options, styleOptions, codeTheme)

    const html = value ? convertToWechat(value, mergedOptions) : ''
    if (!template?.transform) return html

    try {
      const transformed = template.transform(html)
      if (transformed && typeof transformed === 'object') {
        const result = transformed as { html?: string; content?: string }
        if (result.html) return result.html
        if (result.content) return result.content
        return JSON.stringify(transformed)
      }
      return transformed || html
    } catch (error) {
      console.error('Template transformation error:', error)
      return html
    }
  }, [value, selectedTemplate, styleOptions, codeTheme])

  useEffect(() => {
    const updatePreview = async () => {
      setIsConverting(true)
      try {
        setPreviewContent(getPreviewContent())
        // 等待 DOM 更新后渲染 Mermaid
        await new Promise((resolve) => setTimeout(resolve, 50))
        try {
          await initializeMermaid()
        } catch (error) {
          console.error('Failed to initialize Mermaid:', error)
        }
      } catch (error) {
        console.error('Error updating preview:', error)
        toast({
          variant: 'destructive',
          title: '预览更新失败',
          description: '生成预览内容时发生错误',
        })
      } finally {
        setIsConverting(false)
      }
    }

    updatePreview()
  }, [value, selectedTemplate, styleOptions, codeTheme, getPreviewContent, toast])

  return {
    isConverting,
    previewContent,
    getPreviewContent,
  }
}
