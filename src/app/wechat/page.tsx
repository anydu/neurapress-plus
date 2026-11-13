"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Logo } from '@/components/icons/Logo'
import { Loader2 } from 'lucide-react'

const LoadingLogo = () => (
  <div className="flex h-full items-center justify-center bg-background">
    <div className="mt-20 flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Logo className="h-20 w-20" />
        <p className="text-lg font-medium text-foreground">让 Markdown 编辑更简单</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>正在加载编辑器</span>
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    </div>
  </div>
)

// 编辑器包含 CodeMirror 与浏览器 API，关闭 SSR
const ProEditor = dynamic(() => import('@/components/editor/ProEditor'), {
  ssr: false,
  loading: () => <LoadingLogo />,
})

export default function WechatPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <Suspense fallback={<LoadingLogo />}>
        <ProEditor />
      </Suspense>
    </main>
  )
}
