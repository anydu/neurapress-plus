/**
 * 微信公众号外链处理：将 <a> 外链转换为文末引用（公众号不支持外链跳转）。
 */

interface ExtractedLink {
  index: number
  href: string
  text: string
}

/** 将 HTML 中的外链转为「文字 [n]」+ 文末引用列表 */
export function convertLinksToReferences(html: string): string {
  const links: ExtractedLink[] = []
  let counter = 0

  const replaced = html.replace(
    /<a\b[^>]*href=(["'])(https?:\/\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, _quote, href: string, inner: string) => {
      // 保留原文案，去掉嵌套的 a 标签样式
      const text = inner.replace(/<[^>]+>/g, '').trim() || href
      counter += 1
      links.push({ index: counter, href, text })
      return `${text}&nbsp;<sup style="color:#576b95;font-size:0.75em;">[${counter}]</sup>`
    },
  )

  if (!links.length) return html

  const references = links
    .map(
      (link) =>
        `<p style="font-size:0.85em;color:#888888;margin:0.3em 0;">[${link.index}] <a href="${link.href}" style="color:#576b95;">${link.text}</a></p>`,
    )
    .join('')

  return `${replaced}<hr style="border:none;border-top:1px solid #e5e5e5;margin:1.5em 0 1em;" /><section style="font-size:0.9em;">${references}</section>`
}
