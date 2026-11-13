'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainNav } from '@/components/nav/MainNav'
import { Logo } from '@/components/icons/Logo'
import {
  FileText,
  Smartphone,
  Eye,
  Copy,
  Palette,
  Zap,
  ArrowRight,
  Github,
  Twitter,
  Mail,
  Sparkles,
  History,
  FolderOpen,
  Printer,
  ImagePlus,
  CloudUpload,
  FileDown,
} from 'lucide-react'

const features = [
  {
    icon: FolderOpen,
    title: '多文档管理',
    description: '侧边栏管理多篇文档，自动保存与最近文件，创作不再丢失'
  },
  {
    icon: History,
    title: '版本历史',
    description: '编辑过程自动快照，随时回滚到任意版本'
  },
  {
    icon: Palette,
    title: '20+ 精美模板',
    description: '技术、商务、文艺、报刊、马卡龙等 11 大分类，一键切换排版'
  },
  {
    icon: Sparkles,
    title: 'AI 写作助手',
    description: '润色、翻译、扩写、纠错，快捷指令让文字更有力量'
  },
  {
    icon: ImagePlus,
    title: '图床配置',
    description: '自定义图床或本地内嵌，图片插入一站搞定'
  },
  {
    icon: Printer,
    title: '多格式导出',
    description: '一键复制到公众号、导出 HTML/Markdown、打印为 PDF'
  }
]

const platforms = [
  {
    name: '微信公众号',
    description: '专业编辑器：CodeMirror 内核、实时预览、样式配置、外链转底部引用',
    href: '/wechat',
    color: 'bg-emerald-500'
  },
  {
    name: '小红书笔记',
    description: '富文本编辑体验，一键生成精美笔记图片',
    href: '/xiaohongshu',
    color: 'bg-rose-500'
  }
]

const workflow = [
  { icon: FileText, text: '用 Markdown 专注写作' },
  { icon: Palette, text: '选模板、调样式' },
  { icon: Eye, text: '实时预览排版效果' },
  { icon: Copy, text: '一键复制进公众号' }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400/20 via-indigo-400/20 to-emerald-400/20 blur-3xl"
        />
        <div className="container relative mx-auto px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              NeuraPress Plus · CodeMirror 内核 · AI 助手
            </div>
            <div className="mb-6 flex justify-center">
              <Logo className="h-16 w-16 text-primary" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
              让 <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">Markdown</span> 编辑更简单
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
              专业的公众号 Markdown 编辑器。多文档管理、版本历史、精美模板、AI 助手，
              碎片时间也能用手机发出有排版的文章。
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 text-lg text-white shadow-lg transition-transform hover:scale-[1.02]">
                <Link href="/wechat">
                  开始创作
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 text-lg">
                <Link href="/xiaohongshu">
                  <Smartphone className="mr-2 h-5 w-5" />
                  小红书笔记
                </Link>
              </Button>
            </div>
          </div>

          {/* 产品截图 */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border bg-background/70 p-2 shadow-2xl backdrop-blur transition-transform duration-500 hover:scale-[1.01]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/img/editor-preview.png"
                alt="NeuraPress Plus 编辑器界面"
                className="w-full rounded-xl border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 工作流程 */}
      <section className="border-y bg-muted/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {workflow.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  <span className="mr-1 text-xs text-muted-foreground">0{index + 1}</span>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              强大的功能特性
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              为内容创作者量身定制的编辑体验，让你的创作更加高效和专业
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 transition-colors group-hover:from-primary/25">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              支持多个平台
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              针对不同平台优化的编辑器，满足你的多样化需求
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
            {platforms.map((platform) => (
              <Card
                key={platform.name}
                className="group border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${platform.color}`} />
                    <CardTitle className="text-2xl">{platform.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full transition-colors group-hover:bg-primary/90">
                    <Link href={platform.href}>
                      立即体验
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary/5 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/10 to-transparent"
        />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
            准备开始创作了吗？
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            打开编辑器，选择模板，三分钟完成一篇排版精美的公众号文章
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-lg">
              <Link href="/wechat">
                <Zap className="mr-2 h-5 w-5" />
                微信公众号编辑器
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 text-lg">
              <Link href="/xiaohongshu">小红书笔记编辑器</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 text-lg">
              <Link href="https://github.com/tianyaxiang/neurapress" target="_blank">
                <Github className="mr-2 h-5 w-5" />
                查看源码
              </Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <CloudUpload className="h-4 w-4" />
            数据保存在本地浏览器
            <span className="mx-1">·</span>
            <FileDown className="h-4 w-4" />
            支持导出 HTML / Markdown / PDF
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">NeuraPress</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="https://github.com/tianyaxiang/neurapress"
                target="_blank"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/tianyaxiang"
                target="_blank"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:tianyaxiang@qq.com"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © 2026 NeuraPress. All rights reserved. Built with ❤️ using Next.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
