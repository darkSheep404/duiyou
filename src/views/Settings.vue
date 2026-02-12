<template>
  <div class="settings-page">
    <!-- 数据统计 -->
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>数据统计</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-number">{{ store.people.length }}</div>
            <div class="stat-label">人物</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-number">{{ store.events.length }}</div>
            <div class="stat-label">事件</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-number">{{ store.chats.length }}</div>
            <div class="stat-label">聊天记录</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-number">{{ store.tags.length }}</div>
            <div class="stat-label">标签</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 标签管理 -->
    <el-card class="tags-card">
      <template #header>
        <div class="card-header">
          <span>标签管理</span>
          <el-button type="primary" size="small" @click="showTagDialog = true">
            <el-icon><Plus /></el-icon>
            添加标签
          </el-button>
        </div>
      </template>
      <div class="tags-list">
        <div v-for="tag in store.tags" :key="tag" class="tag-item">
          <el-tag size="large" closable @close="deleteTag(tag)">
            {{ tag }}
          </el-tag>
          <el-button type="text" size="small" @click="editTag(tag)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据管理 -->
    <el-card class="data-card">
      <template #header>
        <div class="card-header">
          <span>数据管理</span>
        </div>
      </template>
      <div class="data-actions">
        <el-button type="success" @click="exportData" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".json"
          :on-change="handleFileChange"
        >
          <el-button type="warning">
            <el-icon><Upload /></el-icon>
            导入数据
          </el-button>
        </el-upload>
        <el-button type="danger" @click="clearAllData">
          <el-icon><Delete /></el-icon>
          清空所有数据
        </el-button>
      </div>
    </el-card>

    <!-- ☁️ 云端同步 -->
    <el-card class="sync-card">
      <template #header>
        <div class="card-header">
          <span>☁️ 云端同步</span>
          <el-button v-if="ossConfigured" size="small" text @click="refreshCloudStatus" :loading="checkingCloud">
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>
        </div>
      </template>

      <!-- 同步设置 -->
      <el-form label-position="top" size="default" class="sync-config-form">
        <el-form-item label="OSS 地址">
          <el-input
            v-model="syncConfig.ossBaseUrl"
            placeholder="your-bucket.oss-cn-shenzhen.aliyuncs.com"
            clearable
          >
            <template #prepend>https://</template>
          </el-input>
          <div class="form-tip">阿里云 OSS Bucket 的公共访问地址（需开启公共读写）</div>
        </el-form-item>
        <el-form-item label="备份文件名">
          <el-input
            v-model="syncConfig.ossFileName"
            placeholder="duiyou-backup.json"
            clearable
          />
          <div class="form-tip">可用不同文件名区分多台设备或多个备份</div>
        </el-form-item>
        <div class="config-actions">
          <el-button type="primary" size="small" @click="saveSyncConfig">保存配置</el-button>
          <el-button size="small" @click="resetSyncConfig">清空配置</el-button>
        </div>
      </el-form>

      <el-divider />

      <!-- 未配置提示 -->
      <div v-if="!ossConfigured" class="cloud-not-configured">
        <el-empty description="请先配置 OSS 地址以启用云同步" :image-size="60" />
      </div>

      <!-- 已配置：云端状态 + 操作按钮 -->
      <template v-else>
        <div class="cloud-status">
          <div class="status-row">
            <span class="status-label">云端备份：</span>
            <span v-if="checkingCloud" class="status-value">检查中...</span>
            <el-tag v-else-if="cloudInfo.exists" type="success" size="small">有备份</el-tag>
            <el-tag v-else type="info" size="small">暂无备份</el-tag>
          </div>
          <div v-if="cloudInfo.exists" class="status-row">
            <span class="status-label">云端时间：</span>
            <span class="status-value">{{ cloudInfo.lastModifiedFormatted }}</span>
          </div>
          <div v-if="cloudInfo.exists && cloudInfo.syncTime" class="status-row">
            <span class="status-label">上传时间：</span>
            <span class="status-value">{{ cloudInfo.syncTime }}</span>
          </div>
        </div>
        <div class="sync-actions">
          <el-button type="primary" @click="uploadToCloud" :loading="uploading">
            <el-icon><Upload /></el-icon>
            上传到云端
          </el-button>
          <el-button type="success" @click="downloadFromCloud" :loading="downloading">
            <el-icon><Download /></el-icon>
            从云端下载
          </el-button>
        </div>
      </template>
    </el-card>

    <!-- 应用信息 -->
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>应用信息</span>
        </div>
      </template>
      <div class="app-info">
        <p><strong>应用名称：</strong>鼠鼠友人帐 - 人际关系管理</p>
        <p><strong>版本：</strong>1.0.0</p>
        <p><strong>平台：</strong>{{ platformName }}</p>
        <p><strong>技术栈：</strong>Vue 3 + Element Plus + Pinia + Capacitor</p>
        <p><strong>数据存储：</strong>本地存储（LocalStorage）</p>
        <p><strong>功能：</strong>人物管理、事件记录、聊天记录、时间线展示</p>
      </div>
    </el-card>

    <!-- 添加/编辑标签对话框 -->
    <el-dialog
      v-model="showTagDialog"
      :title="editingTag ? '编辑标签' : '添加标签'"
      width="300px"
    >
      <el-input
        v-model="tagInput"
        placeholder="请输入标签名称"
        @keyup.enter="saveTag"
      />
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Download, Upload, Refresh } from '@element-plus/icons-vue'
import { getPlatform } from '../utils/platform'
import { exportToFile, importFromFile } from '../utils/fileHelper'
import { uploadToOss, downloadFromOss, checkOssBackup, formatGmtTime, isOssConfigured } from '../utils/ossSync'
import { loadConfig, saveConfig as saveConfigToStorage, resetConfig } from '../config'

const store = useAppStore()

// 平台检测
const platformName = computed(() => {
  const p = getPlatform()
  return p === 'android' ? 'Android' : p === 'ios' ? 'iOS' : 'Web'
})

// 加载状态
const exporting = ref(false)
const uploading = ref(false)
const downloading = ref(false)
const checkingCloud = ref(false)

// 云端信息
const cloudInfo = reactive({
  exists: false,
  lastModified: '',
  lastModifiedFormatted: '',
  syncTime: ''
})

// 同步配置
const syncConfig = reactive({ ...loadConfig() })
// 移除 https:// 前缀用于显示（prepend 已有）
if (syncConfig.ossBaseUrl && syncConfig.ossBaseUrl.startsWith('https://')) {
  syncConfig.ossBaseUrl = syncConfig.ossBaseUrl.replace('https://', '')
}

// 是否已配置 OSS（响应式标记，保存/重置配置时更新）
const ossConfigured = ref(isOssConfigured())

// 标签管理
const showTagDialog = ref(false)
const tagInput = ref('')
const editingTag = ref('')

// 文件上传
const uploadRef = ref()

// 添加标签
const saveTag = () => {
  const tag = tagInput.value.trim()
  if (!tag) {
    ElMessage.error('请输入标签名称')
    return
  }

  if (editingTag.value) {
    // 编辑标签
    if (tag !== editingTag.value) {
      store.renameTag(editingTag.value, tag)
      ElMessage.success('标签已更新')
    }
  } else {
    // 添加标签
    if (store.tags.includes(tag)) {
      ElMessage.error('标签已存在')
      return
    }
    store.addTag(tag)
    ElMessage.success('标签添加成功')
  }

  showTagDialog.value = false
  tagInput.value = ''
  editingTag.value = ''
}

// 编辑标签
const editTag = (tag) => {
  editingTag.value = tag
  tagInput.value = tag
  showTagDialog.value = true
}

// 删除标签
const deleteTag = async (tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag}" 吗？这将从所有人物和事件中移除该标签。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    store.deleteTag(tag)
    ElMessage.success('标签删除成功')
  } catch {
    // 用户取消删除
  }
}

// 导出数据
const exportData = async () => {
  exporting.value = true
  try {
    const data = store.exportData()
    const filename = `duiyou-data-${new Date().toISOString().split('T')[0]}.json`
    const result = await exportToFile(data, filename)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

// 处理文件选择（Web 和 Android 统一，Android WebView 自动调起系统文件选择器）
const handleFileChange = async (file) => {
  const result = await importFromFile(file.raw)
  if (result.success && result.data) {
    const success = store.importData(result.data)
    if (success) {
      ElMessage.success('数据导入成功')
    } else {
      ElMessage.error('数据格式错误，导入失败')
    }
  } else {
    ElMessage.error(result.message || '文件读取失败')
  }
}

// 清空所有数据
const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复！',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 清空数据
    store.people.length = 0
    store.events.length = 0
    store.chats.length = 0
    store.tags.splice(0, store.tags.length, '朋友', '家人', '同事')
    store.saveToLocalStorage()

    ElMessage.success('数据已清空')
  } catch {
    // 用户取消操作
  }
}

// ========== 云端同步 ==========

// 刷新云端状态
const refreshCloudStatus = async () => {
  if (!isOssConfigured()) return
  checkingCloud.value = true
  try {
    const info = await checkOssBackup()
    cloudInfo.exists = info.exists
    cloudInfo.lastModified = info.lastModified || ''
    cloudInfo.lastModifiedFormatted = formatGmtTime(info.lastModified)

    // 尝试获取 JSON 中的 syncTime（更精确）
    if (info.exists) {
      try {
        const result = await downloadFromOss()
        if (result.success && result.data) {
          const parsed = JSON.parse(result.data)
          cloudInfo.syncTime = parsed.syncTime
            ? new Date(parsed.syncTime).toLocaleString('zh-CN')
            : ''
        }
      } catch {
        cloudInfo.syncTime = ''
      }
    }
  } catch {
    cloudInfo.exists = false
  } finally {
    checkingCloud.value = false
  }
}

// 上传到云端
const uploadToCloud = async () => {
  if (!isOssConfigured()) {
    ElMessage.warning('请先配置 OSS 地址并保存')
    return
  }
  // 先检查云端是否已有数据
  checkingCloud.value = true
  const info = await checkOssBackup()
  checkingCloud.value = false

  let confirmMsg = '确定将本地数据上传到云端？'
  if (info.exists) {
    confirmMsg = `云端已有备份（${formatGmtTime(info.lastModified)}），上传将覆盖云端数据，确认？`
  }

  try {
    await ElMessageBox.confirm(confirmMsg, '上传到云端', {
      confirmButtonText: '确认上传',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return // 用户取消
  }

  uploading.value = true
  try {
    const data = store.exportData()
    const result = await uploadToOss(data)
    if (result.success) {
      ElMessage.success(result.message)
      refreshCloudStatus()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// 从云端下载
const downloadFromCloud = async () => {
  if (!isOssConfigured()) {
    ElMessage.warning('请先配置 OSS 地址并保存')
    return
  }
  // 先检查云端状态
  checkingCloud.value = true
  const info = await checkOssBackup()
  checkingCloud.value = false

  if (!info.exists) {
    ElMessage.warning('云端暂无备份数据')
    return
  }

  const cloudTimeStr = formatGmtTime(info.lastModified)

  try {
    const action = await ElMessageBox({
      title: '从云端下载',
      message: `☁️ 云端数据时间：${cloudTimeStr}\n\n请选择下载方式：`,
      distinguishCancelAndClose: true,
      confirmButtonText: '覆盖本地',
      cancelButtonText: '智能合并',
      showCancelButton: true,
      type: 'info',
      customClass: 'sync-dialog'
    })
    // confirm = 覆盖本地
    await doDownload('overwrite')
  } catch (action) {
    if (action === 'cancel') {
      // cancel = 智能合并
      await doDownload('merge')
    }
    // close = 关闭对话框，不做操作
  }
}

// 执行下载
const doDownload = async (mode) => {
  downloading.value = true
  try {
    const result = await downloadFromOss()
    if (!result.success) {
      ElMessage.error(result.message)
      return
    }

    if (mode === 'overwrite') {
      const success = store.importData(result.data)
      if (success) {
        ElMessage.success('已用云端数据覆盖本地')
      } else {
        ElMessage.error('云端数据格式错误')
      }
    } else {
      // 智能合并
      const mergeResult = store.mergeData(result.data)
      if (mergeResult.success) {
        ElMessage.success(mergeResult.message)
      } else {
        ElMessage.error(mergeResult.message)
      }
    }
  } catch (error) {
    ElMessage.error('下载失败: ' + error.message)
  } finally {
    downloading.value = false
  }
}

// ========== 同步设置 ==========

const saveSyncConfig = () => {
  const url = syncConfig.ossBaseUrl ? syncConfig.ossBaseUrl.trim() : ''
  const config = {
    ossBaseUrl: url ? (url.startsWith('http') ? url : `https://${url}`) : '',
    ossFileName: (syncConfig.ossFileName && syncConfig.ossFileName.trim()) || 'duiyou-backup.json'
  }
  saveConfigToStorage(config)
  ossConfigured.value = !!config.ossBaseUrl
  if (config.ossBaseUrl) {
    ElMessage.success('同步配置已保存')
    refreshCloudStatus()
  } else {
    ElMessage.info('已保存（OSS 地址为空，云同步未启用）')
    cloudInfo.exists = false
    cloudInfo.lastModified = ''
    cloudInfo.lastModifiedFormatted = ''
    cloudInfo.syncTime = ''
  }
}

const resetSyncConfig = () => {
  resetConfig()
  ossConfigured.value = false
  syncConfig.ossBaseUrl = ''
  syncConfig.ossFileName = 'duiyou-backup.json'
  cloudInfo.exists = false
  cloudInfo.lastModified = ''
  cloudInfo.lastModifiedFormatted = ''
  cloudInfo.syncTime = ''
  ElMessage.success('已清空同步配置')
}

// 页面加载时检查云端状态
onMounted(() => {
  if (ossConfigured.value) {
    refreshCloudStatus()
  }
})
</script>

<style scoped>
.settings-page {
  width: 100%;
}

.stats-card,
.tags-card,
.data-card,
.sync-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.data-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.app-info {
  line-height: 1.8;
  color: #606266;
}

.app-info p {
  margin: 8px 0;
}

.data-hint {
  margin-top: 12px;
  padding: 8px 0;
}

.cloud-status {
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.status-value {
  color: #303133;
}

.sync-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.config-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.sync-config-form {
  margin-bottom: 0;
}

.cloud-not-configured {
  padding: 8px 0;
}

@media (max-width: 768px) {
  .data-actions,
  .sync-actions,
  .config-actions {
    flex-direction: column;
  }

  .data-actions .el-button,
  .sync-actions .el-button,
  .config-actions .el-button {
    width: 100%;
  }

  .stat-number {
    font-size: 24px;
  }

  .tags-list {
    gap: 8px;
  }
}
</style>
