/**
 * 导出工具：HTML 下载 / Markdown 下载 / 打印 PDF / 剪贴板 HTML
 */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 将预览 HTML 包装为完整可打开的 HTML 文档 */
export function wrapStandaloneHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  body { max-width: 677px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; color: #333; }
  pre { overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
  img { max-width: 100%; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 导出为 .html 文件下载 */
export function exportHtmlFile(bodyHtml: string, title: string) {
  const html = wrapStandaloneHtml(bodyHtml, title)
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${title || '文档'}.html`)
}

/** 导出为 .md 文件下载 */
export function exportMarkdownFile(markdown: string, title: string) {
  downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `${title || '文档'}.md`)
}

/** 导出为 Word 文档（HTML 内容以 .doc 容器下载，Word 可直接打开编辑） */
export function exportWordFile(bodyHtml: string, title: string) {
  const html = wrapStandaloneHtml(bodyHtml, title)
  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]--><style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:12pt;}img{max-width:100%;}</style></head><body>${bodyHtml}</body></html>`
  // \ufeff BOM 保证 Word 正确识别 UTF-8
  downloadBlob(new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' }), `${title || '文档'}.doc`)
}

/** 通过隐藏 iframe 调起打印（另存为 PDF） */
export function printWithStyles(bodyHtml: string, title: string) {
  const html = wrapStandaloneHtml(bodyHtml, title)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (error) {
      console.error('打印失败:', error)
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }
}

/** 获取纯文本统计（避免在存储层依赖 DOM 时重复创建） */
export function getPlainTextLength(html: string): number {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').length
}
