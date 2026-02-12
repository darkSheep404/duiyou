/**
 * 内存日志管理模块
 * 仅在内存中保留日志（最多 200 条），刷新后清空
 */

const MAX_LOGS = 200
const logs = []

function addLog(level, message, detail = null) {
  const entry = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    timestamp: new Date().toISOString(),
    level,
    message,
    detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)) : null
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
