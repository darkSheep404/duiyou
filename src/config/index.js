/**
 * 默认配置
 * 代码中不包含任何 OSS 地址，开发者可通过 .env.local 文件设置默认值：
 *   VITE_OSS_BASE_URL=https://your-bucket.oss-cn-xxx.aliyuncs.com
 *   VITE_OSS_FILE_NAME=duiyou-backup.json
 * 用户也可在「设置」页面覆盖这些值，覆盖后存入 localStorage
 */
export const defaultConfig = {
  // OSS 云同步基础 URL（不带末尾斜杠），从 .env.local 读取，未设置则为空
  ossBaseUrl: import.meta.env.VITE_OSS_BASE_URL || '',
  // 云端备份文件名
  ossFileName: import.meta.env.VITE_OSS_FILE_NAME || 'duiyou-backup.json'
}

const CONFIG_STORAGE_KEY = 'duiyou-config'

/**
 * 读取用户配置（localStorage 优先，回退到默认值）
 */
export function loadConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('读取配置失败:', e)
  }
  return { ...defaultConfig }
}

/**
 * 保存用户配置到 localStorage
 */
export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('保存配置失败:', e)
    return false
  }
}

/**
 * 清除用户配置，恢复默认
 */
export function resetConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY)
}
