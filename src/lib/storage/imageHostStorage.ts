/**
 * 图床配置持久化（键名对齐 Pro 站）：
 *  - image_host_configs
 *  - default_image_host_config_id
 */

export type ImageHostType = 'default' | 'custom' | 'smms' | 'imgur' | 'gitee' | 'github'

export interface ImageHostConfig {
  id: string
  name: string
  type: ImageHostType
  enabled: boolean
  isDefault?: boolean
  config: {
    /** 允许的最大文件大小（MB） */
    maxFileSize?: number
    allowedTypes?: string[]
    /** 自定义 API 地址 */
    apiUrl?: string
    /** 鉴权 token（仅存本地） */
    token?: string
    /** github 仓库（owner/repo） */
    repo?: string
    /** 存储目录 */
    folder?: string
  }
}

export function loadImageHostConfigs(): ImageHostConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('image_host_configs')
    if (!raw) return []
    const configs = JSON.parse(raw) as ImageHostConfig[]
    return Array.isArray(configs) && configs.length ? configs : [createDefaultImageHost()]
  } catch (error) {
    console.error('读取图床配置失败:', error)
    return [createDefaultImageHost()]
  }
}

export function saveImageHostConfigs(configs: ImageHostConfig[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem('image_host_configs', JSON.stringify(configs))
    return true
  } catch (error) {
    console.error('写入图床配置失败:', error)
    return false
  }
}

export function createDefaultImageHost(): ImageHostConfig {
  return {
    id: `img_host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '默认图床',
    type: 'default',
    enabled: true,
    isDefault: true,
    config: {
      maxFileSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
  }
}

export function loadDefaultImageHostId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('default_image_host_config_id')
}

export function saveDefaultImageHostId(id: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('default_image_host_config_id', id)
}

/** 获取默认图床配置 */
export function getDefaultImageHost(): ImageHostConfig {
  const configs = loadImageHostConfigs()
  const defaultId = loadDefaultImageHostId()
  const byId = configs.find((c) => c.id === defaultId && c.enabled)
  if (byId) return byId
  return configs.find((c) => c.isDefault && c.enabled) || configs[0] || createDefaultImageHost()
}

/**
 * 上传图片。默认图床（type=default）无法远端上传时，
 * 退化为 base64 内嵌（公众号可接受小体积 base64 图片）。
 */
export async function uploadImage(file: File): Promise<string> {
  const host = getDefaultImageHost()
  const maxBytes = (host.config.maxFileSize ?? 10) * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`图片超过 ${host.config.maxFileSize}MB 限制`)
  }

  if (host.type === 'default' || !host.config.apiUrl) {
    // 本地模式：转 base64
    return readAsDataUrl(file)
  }

  try {
    const form = new FormData()
    form.append('file', file)
    const response = await fetch(host.config.apiUrl, {
      method: 'POST',
      headers: host.config.token ? { Authorization: `Bearer ${host.config.token}` } : undefined,
      body: form,
    })
    if (!response.ok) {
      throw new Error(`图床返回 ${response.status}`)
    }
    const data = (await response.json()) as { url?: string; data?: { url?: string } }
    const url = data.url || data.data?.url
    if (!url) throw new Error('图床响应中没有图片地址')
    return url
  } catch (error) {
    console.error('上传到图床失败，退化为 base64:', error)
    return readAsDataUrl(file)
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取图片文件失败'))
    reader.readAsDataURL(file)
  })
}

// ---------- 图片库（上传历史，键名对齐 Pro） ----------

export interface ImageHistoryItem {
  id: string
  name: string
  url: string
  size: number
  createdAt: number
}

const MAX_IMAGE_HISTORY = 50

export function loadImageHistory(): ImageHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('image_history')
    const list = raw ? (JSON.parse(raw) as ImageHistoryItem[]) : []
    return Array.isArray(list) ? list : []
  } catch (error) {
    console.error('读取图片历史失败:', error)
    return []
  }
}

export function saveImageHistory(list: ImageHistoryItem[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem('image_history', JSON.stringify(list.slice(0, MAX_IMAGE_HISTORY)))
    return true
  } catch (error) {
    console.error('写入图片历史失败:', error)
    return false
  }
}

/** 记录一张上传成功的图片（置顶，去重，上限 50） */
export function recordImage(name: string, url: string, size: number): ImageHistoryItem[] {
  const item: ImageHistoryItem = {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    url,
    size,
    createdAt: Date.now(),
  }
  const next = [item, ...loadImageHistory().filter((i) => i.url !== url)].slice(0, MAX_IMAGE_HISTORY)
  saveImageHistory(next)
  return next
}

export function removeImageHistoryItem(id: string): ImageHistoryItem[] {
  const next = loadImageHistory().filter((i) => i.id !== id)
  saveImageHistory(next)
  return next
}
