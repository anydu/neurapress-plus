/**
 * AI 助手服务接口（OpenAI 兼容协议）。
 * API key 仅存 localStorage，由设置对话框写入。
 */

export interface AiSettings {
  apiKey: string
  baseUrl: string
  model: string
}

export const AI_SETTINGS_KEY = 'ai_assistant_settings'

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
}

export function loadAiSettings(): AiSettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_KEY)
    if (!raw) return DEFAULT_AI_SETTINGS
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) }
  } catch (error) {
    console.error('读取 AI 设置失败:', error)
    return DEFAULT_AI_SETTINGS
  }
}

export function saveAiSettings(settings: AiSettings): void {
  window.localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
}

export function isAiConfigured(): boolean {
  return Boolean(loadAiSettings().apiKey)
}

/** 快捷指令预置 */
export const AI_QUICK_ACTIONS = [
  { id: 'polish', label: '润色文字', prompt: '请润色以下公众号文章的 Markdown 文字，保持原有格式与语气，直接输出结果：' },
  { id: 'translate', label: '翻译成英文', prompt: '请将以下内容翻译为地道流畅的英文，保留 Markdown 格式，直接输出结果：' },
  { id: 'expand', label: '扩写内容', prompt: '请在保持原意和 Markdown 格式的前提下适度扩写以下内容，直接输出结果：' },
  { id: 'proofread', label: '纠正错别字', prompt: '请纠正以下内容中的错别字和语病，保持 Markdown 格式不变，直接输出结果：' },
  { id: 'summary', label: '生成摘要', prompt: '请为以下内容生成一段 50 字以内的摘要，直接输出结果：' },
  { id: 'title', label: '推荐标题', prompt: '请为以下公众号文章推荐 5 个吸引人的标题，每行一个，不要其他内容：' },
] as const

export type AiQuickActionId = (typeof AI_QUICK_ACTIONS)[number]['id']

/** 调用 OpenAI 兼容接口。出错时抛出带可读信息的 Error */
export async function chatCompletion(prompt: string, content: string): Promise<string> {
  const settings = loadAiSettings()
  if (!settings.apiKey) {
    throw new Error('尚未配置 AI API Key，请点击状态栏「设置」进行配置')
  }

  const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: '你是公众号写作助手，输出干净的 Markdown，不要额外解释。' },
        { role: 'user', content: `${prompt}\n\n${content}` },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI 请求失败（${response.status}），请检查 API Key 与网络`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('AI 返回内容为空')
  return text.trim()
}
