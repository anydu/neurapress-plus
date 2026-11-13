'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_SPLIT_RATIO,
  MAX_SPLIT_RATIO,
  MIN_SPLIT_RATIO,
} from '@/lib/storage'

interface ResizableSplitterProps {
  /** 当前编辑区宽度占比 */
  ratio: number
  /** drag 阶段仅更新 DOM，commit 阶段才写入 store */
  onRatioChange: (ratio: number, phase: 'drag' | 'commit') => void
  /** 指向 Grid 分屏容器，用于计算比例 */
  containerRef: React.RefObject<HTMLDivElement>
  /** 两侧最小像素宽度，默认 280px */
  minPixelWidth?: number
  className?: string
}

/** 依据容器实际宽度约束比例：兼顾 25%~75% 与最小像素宽度 */
function clampRatio(raw: number, width: number, minPixelWidth: number): number {
  if (!width || width < minPixelWidth * 2) return DEFAULT_SPLIT_RATIO
  const pixelRatio = minPixelWidth / width
  const min = Math.max(MIN_SPLIT_RATIO, pixelRatio)
  const max = Math.min(MAX_SPLIT_RATIO, 1 - pixelRatio)
  if (min > max) return DEFAULT_SPLIT_RATIO
  return Math.min(max, Math.max(min, raw))
}

export function ResizableSplitter({
  ratio,
  onRatioChange,
  containerRef,
  minPixelWidth = 280,
  className,
}: ResizableSplitterProps) {
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const ratioRef = useRef(ratio)
  const onRatioChangeRef = useRef(onRatioChange)
  const prevUserSelect = useRef('')
  const prevCursor = useRef('')

  // 保持回调与比例为最新值，避免拖拽期间闭包过期
  onRatioChangeRef.current = onRatioChange
  if (!draggingRef.current) ratioRef.current = ratio

  const restoreBody = () => {
    document.body.style.userSelect = prevUserSelect.current
    document.body.style.cursor = prevCursor.current
  }

  const computeRatio = (clientX: number): number => {
    const container = containerRef.current
    if (!container) return ratioRef.current
    const rect = container.getBoundingClientRect()
    return clampRatio((clientX - rect.left) / rect.width, rect.width, minPixelWidth)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.detail > 1) return
    e.preventDefault()
    draggingRef.current = true
    pointerIdRef.current = e.pointerId
    prevUserSelect.current = document.body.style.userSelect
    prevCursor.current = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* 浏览器不支持时仍可依赖全局 pointer 事件冒泡 */
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    e.preventDefault()
    const next = computeRatio(e.clientX)
    ratioRef.current = next
    e.currentTarget.setAttribute('aria-valuenow', String(Math.round(next * 100)))
    onRatioChangeRef.current(next, 'drag')
  }

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current)
      } catch {
        /* capture 可能已自动释放 */
      }
      pointerIdRef.current = null
    }
    restoreBody()
    onRatioChangeRef.current(ratioRef.current, 'commit')
  }

  const commitRatio = (next: number) => {
    const container = containerRef.current
    const width = container?.getBoundingClientRect().width ?? 0
    const clamped = clampRatio(next, width, minPixelWidth)
    ratioRef.current = clamped
    onRatioChangeRef.current(clamped, 'commit')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null
    if (e.key === 'ArrowLeft') next = ratioRef.current - 0.02
    if (e.key === 'ArrowRight') next = ratioRef.current + 0.02
    if (e.key === 'Home') next = DEFAULT_SPLIT_RATIO
    if (next === null) return
    e.preventDefault()
    commitRatio(Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, next)))
  }

  // 卸载时若仍在拖拽，恢复 body 样式，避免页面卡在拖拽态
  useEffect(
    () => () => {
      if (draggingRef.current) restoreBody()
    },
    [],
  )

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="调整编辑区与预览区宽度"
      aria-valuemin={Math.round(MIN_SPLIT_RATIO * 100)}
      aria-valuemax={Math.round(MAX_SPLIT_RATIO * 100)}
      aria-valuenow={Math.round(ratioRef.current * 100)}
      tabIndex={0}
      data-testid="resizable-splitter"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onDoubleClick={() => commitRatio(DEFAULT_SPLIT_RATIO)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative z-10 flex w-1.5 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none',
        'focus-visible:bg-primary/10',
        dragging && 'bg-primary/10',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none h-full w-px bg-border transition-colors',
          'group-hover:bg-primary/60 group-focus-visible:bg-primary',
          dragging && 'bg-primary',
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute flex h-8 w-1.5 items-center justify-center rounded-full opacity-0 transition-opacity',
          'group-hover:opacity-100 group-focus-visible:opacity-100',
          dragging && 'opacity-100',
        )}
      >
        <span className="h-6 w-0.5 rounded-full bg-primary/70" />
      </span>
    </div>
  )
}
