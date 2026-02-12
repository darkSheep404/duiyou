<template>
  <div class="logs-page">
    <!-- 顶部工具栏 -->
    <el-card class="filter-card">
      <div class="filter-bar">
        <el-select
          v-model="selectedLevel"
          placeholder="按级别筛选"
          clearable
          size="default"
          style="width: 140px;"
        >
          <el-option label="Info" value="info" />
          <el-option label="Warn" value="warn" />
          <el-option label="Error" value="error" />
        </el-select>
        <el-button type="danger" size="default" @click="handleClear">
          <el-icon><Delete /></el-icon>
          清空日志
        </el-button>
        <el-button size="default" @click="refreshLogs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </el-card>

    <!-- 日志列表 -->
    <div class="logs-list">
      <el-card
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-card"
        :class="`log-${log.level}`"
        shadow="never"
      >
        <div class="log-header">
          <el-tag
            :type="levelTagType(log.level)"
            size="small"
            effect="dark"
          >
            {{ log.level.toUpperCase() }}
          </el-tag>
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        </div>
        <div class="log-message">{{ log.message }}</div>
        <div v-if="log.detail" class="log-detail">
          <el-collapse>
            <el-collapse-item title="详细信息">
              <pre class="detail-pre">{{ log.detail }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <el-empty v-if="filteredLogs.length === 0" description="暂无日志" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getLogs, clearLogs } from '../utils/logger'
import { Delete, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedLevel = ref('')
const logSnapshot = ref([...getLogs()])

const refreshLogs = () => {
  logSnapshot.value = [...getLogs()]
}

const filteredLogs = computed(() => {
  if (!selectedLevel.value) return logSnapshot.value
  return logSnapshot.value.filter(l => l.level === selectedLevel.value)
})

const handleClear = () => {
  clearLogs()
  logSnapshot.value = []
  ElMessage.success('日志已清空')
}

const levelTagType = (level) => {
  if (level === 'error') return 'danger'
  if (level === 'warn') return 'warning'
  return 'info'
}

const formatTime = (ts) => {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>

<style scoped>
.logs-page {
  width: 100%;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-card {
  border-left: 4px solid #dcdfe6;
}

.log-card.log-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.log-card.log-warn {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.log-card.log-info {
  border-left-color: #909399;
  background: #f4f4f5;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.log-message {
  color: #303133;
  font-size: 14px;
  line-height: 1.5;
}

.log-detail {
  margin-top: 8px;
}

.detail-pre {
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

:deep(.el-collapse-item__header) {
  font-size: 12px;
  color: #909399;
  height: 28px;
  line-height: 28px;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style>
