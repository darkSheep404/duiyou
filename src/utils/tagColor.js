/**
 * 标签颜色工具 - 基于标签名称哈希分配确定性颜色
 * 同一标签名始终获得相同颜色
 */

const TAG_COLORS = [
  { bg: '#e8f5e9', text: '#2e7d32' },  // 绿色
  { bg: '#e3f2fd', text: '#1565c0' },  // 蓝色
  { bg: '#fce4ec', text: '#c62828' },  // 粉色
  { bg: '#fff3e0', text: '#e65100' },  // 橙色
  { bg: '#f3e5f5', text: '#7b1fa2' },  // 紫色
  { bg: '#e0f2f1', text: '#00695c' },  // 青绿
  { bg: '#fff8e1', text: '#f57f17' },  // 琥珀
  { bg: '#e8eaf6', text: '#283593' },  // 靛蓝
  { bg: '#fbe9e7', text: '#bf360c' },  // 深橙
  { bg: '#e0f7fa', text: '#00838f' },  // 青色
  { bg: '#f1f8e9', text: '#558b2f' },  // 浅绿
  { bg: '#ede7f6', text: '#4527a0' },  // 深紫
]

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * 获取标签颜色对象
 * @param {string} tag 标签名称
 * @returns {{ bg: string, text: string }}
 */
export function getTagColor(tag) {
  const idx = hashCode(tag) % TAG_COLORS.length
  return TAG_COLORS[idx]
}

/**
 * 获取标签内联样式（用于 Vue :style 绑定）
 * @param {string} tag 标签名称
 * @returns {object}
 */
export function getTagStyle(tag) {
  const c = getTagColor(tag)
  return {
    backgroundColor: c.bg,
    color: c.text,
  }
}
