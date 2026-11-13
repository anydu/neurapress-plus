'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

/** 与 Pro 对齐的三组快捷键清单 */
const GROUPS: Array<{
  title: string
  items: Array<{ keys: string; action: string }>
}> = [
  {
    title: '文件',
    items: [
      { keys: 'Ctrl + S', action: '保存文档' },
      { keys: 'Ctrl + Shift + S', action: '另存为' },
      { keys: 'Ctrl + N', action: '新建文档' },
      { keys: 'Ctrl + O', action: '打开文档（导入）' },
      { keys: 'Ctrl + E', action: '导出文档 (HTML)' },
      { keys: 'Ctrl + Shift + P', action: '显示/隐藏预览' },
    ],
  },
  {
    title: '编辑',
    items: [
      { keys: 'Ctrl + Z', action: '撤销' },
      { keys: 'Ctrl + Y', action: '重做' },
      { keys: 'Ctrl + F', action: '搜索替换' },
    ],
  },
  {
    title: '格式',
    items: [
      { keys: 'Ctrl + B', action: '粗体' },
      { keys: 'Ctrl + I', action: '斜体' },
      { keys: 'Ctrl + U', action: '下划线' },
      { keys: 'Ctrl + Shift + X', action: '删除线' },
      { keys: 'Ctrl + `', action: '行内代码' },
      { keys: 'Ctrl + Shift + C', action: '代码块' },
      { keys: 'Ctrl + 1~6', action: '一至六级标题' },
      { keys: 'Ctrl + Shift + 8', action: '无序列表' },
      { keys: 'Ctrl + Shift + 7', action: '有序列表' },
      { keys: 'Ctrl + Shift + 9', action: '引用' },
      { keys: 'Ctrl + K', action: '插入链接' },
      { keys: 'Ctrl + Shift + I', action: '图片管理（上传/链接/图库）' },
      { keys: 'Ctrl + Shift + T', action: '插入表格' },
      { keys: 'Ctrl + Shift + M', action: '数学公式块' },
      { keys: 'Ctrl + /', action: '键盘快捷键' },
    ],
  },
]

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            键盘快捷键
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {group.items.map((s) => (
                  <div
                    key={s.action}
                    className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-accent/50"
                  >
                    <span className="text-sm">{s.action}</span>
                    <kbd className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">macOS 下 Ctrl 对应 ⌘ Command</p>
      </DialogContent>
    </Dialog>
  )
}
