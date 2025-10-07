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
        <el-button type="success" @click="exportData">
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
        <p><strong>技术栈：</strong>Vue 3 + Element Plus + Pinia</p>
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
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Download, Upload } from '@element-plus/icons-vue'

const store = useAppStore()

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
const exportData = () => {
  try {
    const data = store.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `duiyou-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 处理文件选择
const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const success = store.importData(e.target.result)
      if (success) {
        ElMessage.success('数据导入成功')
      } else {
        ElMessage.error('数据格式错误，导入失败')
      }
    } catch (error) {
      ElMessage.error('文件读取失败: ' + error.message)
    }
  }
  reader.readAsText(file.raw)
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
</script>

<style scoped>
.settings-page {
  width: 100%;
}

.stats-card,
.tags-card,
.data-card,
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

@media (max-width: 768px) {
  .data-actions {
    flex-direction: column;
  }

  .data-actions .el-button {
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
