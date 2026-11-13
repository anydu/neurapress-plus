'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { FileUp, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotionFile {
  name: string
  content: string
}

interface NotionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (name: string, content: string) => void
}

function slugToTitle(name: string): string {
  return name
    .replace(/\.(md|markdown)$/i, '')
    .replace(/([0-9a-f]{32})\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 导入 Notion：Notion 导出包（zip）或单个 .md 文件。
 * zip 中提取第一个/选中的 .md 文件。
 */
export function NotionImportDialog({ open, onOpenChange, onImport }: NotionImportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<NotionFile[]>([])
  const [loading, setLoading] = useState(false)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setLoading(true)
    try {
      const results: NotionFile[] = []
      for (const file of Array.from(fileList)) {
        if (file.name.endsWith('.zip')) {
          const JSZip = (await import('jszip')).default
          const zip = await JSZip.loadAsync(await file.arrayBuffer())
          const mdFiles = Object.keys(zip.files).filter(
            (n) => /\.(md|markdown)$/i.test(n) && !zip.files[n].dir,
          )
          for (const name of mdFiles) {
            const content = await zip.files[name].async('string')
            if (content.trim()) {
              results.push({ name: slugToTitle(name.split('/').pop() || name), content })
            }
          }
        } else if (/\.(md|markdown|txt)$/i.test(file.name)) {
          results.push({ name: slugToTitle(file.name), content: await file.text() })
        }
      }
      if (!results.length) {
        toast({
          variant: 'destructive',
          title: '未找到可用内容',
          description: '请选择 Notion 导出的 zip 包或 .md 文件',
        })
      }
      setFiles(results)
    } catch (error) {
      console.error('解析 Notion 导出文件失败:', error)
      toast({ variant: 'destructive', title: '解析失败', description: '文件可能已损坏' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="notion-import-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            导入 Notion
          </DialogTitle>
        </DialogHeader>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <FileUp className="h-6 w-6" />
          点击选择 Notion 导出的 zip 包或 .md 文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".zip,.md,.markdown,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {loading && <p className="text-center text-xs text-muted-foreground">解析中…</p>}

        {files.length > 0 && (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {files.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => {
                  onImport(file.name, file.content)
                  setFiles([])
                  onOpenChange(false)
                  toast({ title: '导入成功', description: `已导入「${file.name}」` })
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {file.content.length} 字符
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          在 Notion 中选择页面 → Export → Markdown & CSV 即可得到可导入的文件。
        </p>
      </DialogContent>
    </Dialog>
  )
}
