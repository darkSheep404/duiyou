/**
 * 内存日志管理模块
 * 仅在内存中保留日志（最多 200 条），刷新后清空
 */

const MAX_LOGS = 200
const logs = []

function formatDetail(detail) {
  if (!detail) return null
  if (typeof detail === 'string') return detail
  // Error 对象：保留 name、message、stack
  if (detail instanceof Error) {
    const parts = [`${detail.name || 'Error'}: ${detail.message}`]
    if (detail.stack) parts.push(detail.stack)
    if (detail.cause) parts.push(`Caused by: ${detail.cause}`)
    return parts.join('\n')
  }
  // 普通对象
  try { return JSON.stringify(detail, null, 2) } catch { return String(detail) }
}

function addLog(level, message, detail = null) {
  const entry = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    timestamp: new Date().toISOString(),
    level,
    message,
    detail: formatDetail(detail)
  }
  logs.unshift(entry) // 最新的在前面
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS
  }
}

export function logInfo(message, detail = null) {
  addLog('info', message, detail)
  console.log(`[INFO] ${message}`, detail || '')
}

export function logWarn(message, detail = null) {
  addLog('warn', message, detail)
  console.warn(`[WARN] ${message}`, detail || '')
}

export function logError(message, detail = null) {
  addLog('error', message, detail)
  console.error(`[ERROR] ${message}`, detail || '')
}

export function getLogs() {
  return logs
}

export function clearLogs() {
  logs.length = 0
}
