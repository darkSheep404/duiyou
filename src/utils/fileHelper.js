import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isNativePlatform } from './platform'

/**
 * 导出数据到文件
 * - Web 端：使用 Blob + download link（浏览器弹出保存对话框）
 * - Android 端：先写入缓存，再通过系统分享/保存选择器让用户选择保存位置
 * @param {string} jsonString - 要导出的 JSON 字符串
 * @param {string} filename - 文件名
 * @returns {Promise<{success: boolean, message: string, path?: string}>}
 */
export async function exportToFile(jsonString, filename) {
  if (isNativePlatform()) {
    return await exportNative(jsonString, filename)
  } else {
    return exportWeb(jsonString, filename)
  }
}

/**
 * 从文件导入数据（统一使用 FileReader 读取）
 * Web 和 Android 都通过 <input type="file"> 选择文件，
 * Android WebView 会自动调起系统文件选择器（SAF），支持浏览任意文件夹
 * @param {File} file - 从 input/upload 组件获取的 File 对象
 * @returns {Promise<{success: boolean, data?: string, message?: string}>}
 */
export function importFromFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, message: '未选择文件' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve({ success: true, data: e.target.result })
    }
    reader.onerror = () => {
      resolve({ success: false, message: '文件读取失败' })
    }
    reader.readAsText(file)
  })
}

// ========== Web 端导出 ==========

function exportWeb(jsonString, filename) {
  try {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return { success: true, message: '数据导出成功' }
  } catch (error) {
    return { success: false, message: '导出失败: ' + error.message }
  }
}

// ========== Android 原生端导出 ==========

async function exportNative(jsonString, filename) {
  try {
    // 1. 先写入缓存目录
    const cacheResult = await Filesystem.writeFile({
      path: filename,
      data: jsonString,
      directory: Directory.Cache,
      encoding: Encoding.UTF8
    })

    // 2. 通过系统分享选择器让用户选择保存位置/分享方式
    await Share.share({
      title: '鼠鼠友人帐 - 数据备份',
      dialogTitle: '选择保存位置',
      url: cacheResult.uri,
      files: [cacheResult.uri]
    })

    return {
      success: true,
      message: '数据已导出',
      path: cacheResult.uri
    }
  } catch (error) {
    // 用户取消分享时 Share 会抛异常，不算失败
    if (error.message && error.message.includes('cancel')) {
      return { success: true, message: '已取消导出' }
    }
    return { success: false, message: '导出失败: ' + error.message }
  }
}
