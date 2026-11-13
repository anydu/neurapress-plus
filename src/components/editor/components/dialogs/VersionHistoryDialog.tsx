'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { History, RotateCcw, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/EditorStore'

export function VersionHistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, currentDocument, restoreVersion, createManualSnapshot } = useEditorStore()
  const versions = currentDocument
    ? state.versionHistory[currentDocument.id] ?? []
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            版本历史
          </DialogTitle>
        </DialogHeader>

        <button
          type="button"
          onClick={() => {
            createManualSnapshot()
          }}
          className="rounded-md border border-input px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          为当前内容创建快照
        </button>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {versions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无历史版本，编辑内容后会自动记录快照
            </p>
          )}
          {versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {new Date(version.createdAt).toLocaleString('zh-CN', { hour12: false })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {version.content.length} 字符 · {version.title}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    restoreVersion(version)
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  恢复
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Trash2 className="h-3 w-3" />
          每个文档最多保留 30 个版本，超出后自动清理最早的记录
        </p>
      </DialogContent>
    </Dialog>
  )
}
