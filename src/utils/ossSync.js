import { loadConfig } from '../config'
import { logInfo, logError } from './logger'

/**
 * 检查 OSS 是否已配置
 * @returns {boolean}
 */
export function isOssConfigured() {
  const config = loadConfig()
  return !!(config.ossBaseUrl && config.ossBaseUrl.trim())
}

/**
 * 获取完整的 OSS 文件 URL
 * @throws {Error} 如果 OSS 未配置
 */
function getOssUrl() {
  const config = loadConfig()
  const baseUrl = (config.ossBaseUrl || '').replace(/\/+$/, '')
  if (!baseUrl) {
    throw new Error('未配置 OSS 地址，请先在同步设置中填写')
  }
  const fileName = config.ossFileName || 'duiyou-backup.json'
  return `${baseUrl}/${fileName}`
}

/**
 * 上传数据到 OSS（公共读写 bucket，直接 PUT）
 * @param {string} jsonString - 要上传的 JSON 字符串
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function uploadToOss(jsonString) {
  const url = getOssUrl()

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: jsonString
    })

    if (response.ok) {
      logInfo('上传到云端成功')
      return { success: true, message: '数据已上传到云端' }
    } else {
      const text = await response.text()
      logError(`上传失败 (${response.status})`, text)
      return { success: false, message: `上传失败 (${response.status}): ${text}` }
    }
  } catch (error) {
    logError('上传异常', error.message)
    return { success: false, message: '上传失败: ' + error.message }
  }
}

/**
 * 从 OSS 下载数据（公共读写 bucket，直接 GET）
 * @returns {Promise<{success: boolean, data?: string, message: string, lastModified?: string}>}
 */
export async function downloadFromOss() {
  const url = getOssUrl()

  try {
    // 加时间戳防止缓存
    const response = await fetch(`${url}?t=${Date.now()}`, {
      method: 'GET'
    })

    if (response.ok) {
      const data = await response.text()
      const lastModified = response.headers.get('Last-Modified') || ''
      return {
        success: true,
        data,
        message: '数据已从云端下载',
        lastModified
      }
    } else if (response.status === 404) {
      logError('云端暂无备份数据 (404)')
      return { success: false, message: '云端暂无备份数据' }
    } else {
      logError(`下载失败 (${response.status})`)
      return { success: false, message: `下载失败 (${response.status})` }
    }
  } catch (error) {
    logError('下载异常', error.message)
    return { success: false, message: '下载失败: ' + error.message }
  }
}

/**
 * 检查云端备份信息（HEAD 请求，获取文件元数据）
 * @returns {Promise<{exists: boolean, lastModified?: string, size?: number}>}
 */
export async function checkOssBackup() {
  const url = getOssUrl()

  try {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      method: 'HEAD'
    })

    if (response.ok) {
      return {
        exists: true,
        lastModified: response.headers.get('Last-Modified') || '',
        size: parseInt(response.headers.get('Content-Length') || '0', 10)
      }
    }
    logError('检查云端备份: 不存在或状态异常')
    return { exists: false }
  } catch (error) {
    logError('检查云端备份异常', error?.message || error)
    return { exists: false }
  }
}

/**
 * 格式化 GMT 时间字符串为本地时间显示
 * @param {string} gmtString - HTTP Last-Modified 格式时间
 * @returns {string}
 */
export function formatGmtTime(gmtString) {
  if (!gmtString) return '未知'
  try {
    const date = new Date(gmtString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return gmtString
  }
}
