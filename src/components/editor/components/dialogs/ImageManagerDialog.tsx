'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  UploadCloud,
  Link2,
  Images,
  Server,
  Check,
} from 'lucide-react'
import {
  loadImageHostConfigs,
  saveImageHostConfigs,
  createDefaultImageHost,
  saveDefaultImageHostId,
  loadImageHistory,
  removeImageHistoryItem,
  recordImage,
  uploadImage,
  type ImageHostConfig,
  type ImageHistoryItem,
} from '@/lib/storage'
import { cn } from '@/lib/utils'

type ManagerTab = 'upload' | 'link' | 'gallery' | 'host'

const TABS: Array<{ id: ManagerTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'upload', label: '上传图片', icon: UploadCloud },
  { id: 'link', label: '图片链接', icon: Link2 },
  { id: 'gallery', label: '图片库', icon: Images },
  { id: 'host', label: '图床设置', icon: Server },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface ImageManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 把插入的 markdown 写到编辑器光标处 */
  onInsert: (markdown: string) => void
  /** 打开时定位的 tab（默认上传） */
  initialTab?: ManagerTab
}

export function ImageManagerDialog({
  open,
  onOpenChange,
  onInsert,
  initialTab = 'upload',
}: ImageManagerDialogProps) {
  const [tab, setTab] = useState<ManagerTab>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkAlt, setLinkAlt] = useState('')
  const [gallery, setGallery] = useState<ImageHistoryItem[]>([])
  const [configs, setConfigs] = useState<ImageHostConfig[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTab(initialTab)
      setUploadError(null)
      setGallery(loadImageHistory())
      setConfigs(loadImageHostConfigs())
    }
  }, [open, initialTab])

  // ---------- 图床配置（原 ImageHostDialog 逻辑） ----------
  const persistHosts = (next: ImageHostConfig[]) => {
    setConfigs(next)
    saveImageHostConfigs(next)
    const def = next.find((c) => c.isDefault)
    if (def) saveDefaultImageHostId(def.id)
  }

  const addHost = () => {
    const created = createDefaultImageHost()
    created.name = '自定义图床'
    created.type = 'custom'
    created.isDefault = false
    created.id = `img_host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    persistHosts([...configs, created])
  }

  const updateHost = (id: string, patch: Partial<ImageHostConfig>) => {
    persistHosts(configs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeHost = (id: string) => {
    const next = configs.filter((c) => c.id !== id)
    persistHosts(next.length ? next : [createDefaultImageHost()])
  }

  // ---------- 上传 ----------
  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      setUploading(true)
      try {
        const url = await uploadImage(file)
        setGallery(recordImage(file.name, url, file.size))
        onInsert(`![${file.name}](${url})`)
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : '上传失败，请重试')
      } finally {
        setUploading(false)
      }
    }
  }

  // ---------- 链接 ----------
  const insertLink = () => {
    if (!/^https?:\/\//.test(linkUrl.trim())) {
      setUploadError('请输入以 http(s):// 开头的图片地址')
      return
    }
    setUploadError(null)
    const alt = linkAlt.trim() || '图片'
    setGallery(recordImage(alt, linkUrl.trim(), 0))
    onInsert(`![${alt}](${linkUrl.trim()})`)
    setLinkUrl('')
    setLinkAlt('')
  }

  const defaultHostName = configs.find((c) => c.isDefault)?.name ?? '默认图床'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" data-testid="image-manager-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            图片管理
          </DialogTitle>
        </DialogHeader>

        {/* Tab 切换 */}
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* 上传图片 */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                当前图床: <span className="font-medium text-foreground">{defaultHostName}</span>
              </span>
              <button
                type="button"
                onClick={() => setTab('host')}
                className="transition-colors hover:text-foreground"
              >
                图床设置
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
              }}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent/40',
              )}
            >
              <UploadCloud className={cn('h-8 w-8', uploading ? 'animate-pulse text-primary' : 'text-muted-foreground')} />
              <p className="text-sm font-medium">
                {uploading ? '上传中…' : '拖拽图片到此处或点击选择文件'}
              </p>
              <p className="text-xs text-muted-foreground">
                支持 JPG、PNG、GIF、WebP 格式，单个文件最大 10MB
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            <p className="text-xs text-muted-foreground">
              未配置自定义图床时，图片将以 base64 直接内嵌到文档中。
            </p>
          </div>
        )}

        {/* 图片链接 */}
        {tab === 'link' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="image-link-url">
                图片地址
              </label>
              <input
                id="image-link-url"
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="image-link-alt">
                图片描述（alt）
              </label>
              <input
                id="image-link-alt"
                type="text"
                value={linkAlt}
                onChange={(e) => setLinkAlt(e.target.value)}
                placeholder="图片描述"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                插入图片
              </button>
            </div>
          </div>
        )}

        {/* 图片库 */}
        {tab === 'gallery' && (
          <div className="space-y-2">
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-10 w-10 shrink-0 rounded border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                      {item.size > 0 && ` · ${formatBytes(item.size)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInsert(`![${item.name}](${item.url})`)}
                    className="shrink-0 rounded-md border border-input px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    插入
                  </button>
                  <button
                    type="button"
                    onClick={() => setGallery(removeImageHistoryItem(item.id))}
                    className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="从图片库移除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {gallery.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  还没有图片，上传或添加链接后会保存在这里
                </p>
              )}
            </div>
          </div>
        )}

        {/* 图床设置（原「图床配置」弹窗内容） */}
        {tab === 'host' && (
          <div className="space-y-3">
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {configs.map((config) => (
                <div key={config.id} className="rounded-lg border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={config.name}
                      onChange={(e) => updateHost(config.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        persistHosts(
                          configs.map((c) => ({
                            ...c,
                            isDefault: c.id === config.id,
                          })),
                        )
                      }
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
                        config.isDefault
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {config.isDefault && <Check className="h-3 w-3" />}
                      {config.isDefault ? '默认' : '设为默认'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHost(config.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="删除图床"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      value={config.config.apiUrl ?? ''}
                      onChange={(e) =>
                        updateHost(config.id, { config: { ...config.config, apiUrl: e.target.value } })
                      }
                      placeholder="API 地址（可选）"
                      className="rounded border border-input bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="password"
                      value={config.config.token ?? ''}
                      onChange={(e) =>
                        updateHost(config.id, { config: { ...config.config, token: e.target.value } })
                      }
                      placeholder="Token（仅存本地）"
                      className="rounded border border-input bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                未配置自定义图床时，图片将以 base64 直接内嵌。
              </p>
              <button
                type="button"
                onClick={addHost}
                className="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <Plus className="h-3 w-3" />
                添加图床
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
