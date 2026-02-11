import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { isNativePlatform } from './platform'

/**
 * 导出数据到文件
 * - Web 端：使用 Blob + download link
 * - Android 端：使用 Capacitor Filesystem 写入 Downloads 目录
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
 * 从文件导入数据
 * - Web 端：使用 FileReader 读取
 * - Android 端：使用 Capacitor Filesystem 选择文件读取
 * @param {File|null} file - Web 端的 File 对象，Android 端传 null
 * @returns {Promise<{success: boolean, data?: string, message?: string}>}
 */
export async function importFromFile(file) {
  if (isNativePlatform()) {
    return await importNative()
  } else {
    return await importWeb(file)
  }
}

// ========== Web 端实现 ==========

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

function importWeb(file) {
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

// ========== Android 原生端实现 ==========

async function exportNative(jsonString, filename) {
  try {
    // 写入到 Documents 目录（应用可直接访问，无需权限弹窗）
    const result = await Filesystem.writeFile({
      path: `duiyou/${filename}`,
      data: jsonString,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    })
    return {
      success: true,
      message: `数据已导出到 Documents/duiyou/${filename}`,
      path: result.uri
    }
  } catch (error) {
    // 回退到 ExternalStorage 尝试
    try {
      const result = await Filesystem.writeFile({
        path: `Download/duiyou/${filename}`,
        data: jsonString,
        directory: Directory.ExternalStorage,
        encoding: Encoding.UTF8,
        recursive: true
      })
      return {
        success: true,
        message: `数据已导出到 Download/duiyou/${filename}`,
        path: result.uri
      }
    } catch (fallbackError) {
      return { success: false, message: '导出失败: ' + fallbackError.message }
    }
  }
}

async function importNative() {
  try {
    // 列出 Documents/duiyou 下的文件供用户选择
    const files = await listExportedFiles()
    if (files.length === 0) {
      return { success: false, message: '未找到可导入的数据文件，请将 .json 文件放入 Documents/duiyou/ 目录' }
    }

    // 如果只有一个文件，直接读取；否则返回文件列表供选择
    if (files.length === 1) {
      const data = await readNativeFile(files[0].path, files[0].directory)
      return { success: true, data }
    }

    // 多个文件时返回列表
    return {
      success: true,
      fileList: files,
      message: '找到多个备份文件，请选择要导入的文件'
    }
  } catch (error) {
    return { success: false, message: '导入失败: ' + error.message }
  }
}

/**
 * 列出已导出的备份文件
 */
export async function listExportedFiles() {
  const files = []

  // 尝试 Documents/duiyou 目录
  try {
    const result = await Filesystem.readdir({
      path: 'duiyou',
      directory: Directory.Documents
    })
    for (const file of result.files) {
      if (file.name.endsWith('.json')) {
        files.push({
          name: file.name,
          path: `duiyou/${file.name}`,
          directory: Directory.Documents,
          location: 'Documents/duiyou',
          mtime: file.mtime
        })
      }
    }
  } catch {
    // 目录不存在，忽略
  }

  // 尝试 Download/duiyou 目录
  try {
    const result = await Filesystem.readdir({
      path: 'Download/duiyou',
      directory: Directory.ExternalStorage
    })
    for (const file of result.files) {
      if (file.name.endsWith('.json')) {
        files.push({
          name: file.name,
          path: `Download/duiyou/${file.name}`,
          directory: Directory.ExternalStorage,
          location: 'Download/duiyou',
          mtime: file.mtime
        })
      }
    }
  } catch {
    // 目录不存在，忽略
  }

  // 按修改时间排序（最新在前）
  return files.sort((a, b) => (b.mtime || 0) - (a.mtime || 0))
}

/**
 * 读取原生文件内容
 */
export async function readNativeFile(path, directory) {
  const result = await Filesystem.readFile({
    path,
    directory,
    encoding: Encoding.UTF8
  })
  return result.data
}
