import Link from 'next/link'
import XiaohongshuMarkdownEditor from '@/components/editor/xiaohongshu/XiaohongshuMarkdownEditor'
import { Toaster } from '@/components/ui/toaster'
import { ArrowLeft } from 'lucide-react'

export default function XiaohongshuPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Pro 风格顶栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <span className="text-sm font-medium">小红书笔记编辑器</span>
        </div>
        <Link
          href="/wechat"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          切换到公众号编辑器
        </Link>
      </header>

      <div className="min-h-0 flex-1">
        <XiaohongshuMarkdownEditor />
      </div>

      <Toaster />
    </main>
  )
}
