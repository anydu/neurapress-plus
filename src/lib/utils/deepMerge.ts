/** 深度合并普通对象（数组与 null 直接覆盖），用于模板样式合并 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return override as T
  if (typeof override !== 'object' || override === null || Array.isArray(override)) {
    return override as T
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const baseValue = (base as Record<string, unknown>)[key]
    if (value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(baseValue ?? {}, value)
    } else if (value !== undefined) {
      result[key] = value
    }
  }
  return result as T
}
