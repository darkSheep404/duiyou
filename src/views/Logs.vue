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
  max-width: 800px;
  margin: 0 auto;
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

.filter-bar .el-button--danger {
  border-radius: 14px !important;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-card {
  border-left: 4px solid #d9dbe3 !important;
  border-radius: var(--dy-radius) !important;
  transition: transform 0.15s;
}

.log-card:hover {
  transform: translateY(-2px);
}

.log-card.log-error {
  border-left-color: #f56c6c !important;
  background: linear-gradient(135deg, #fff5f5, #fff0f0) !important;
}

.log-card.log-warn {
  border-left-color: #e6a23c !important;
  background: linear-gradient(135deg, #fffbf0, #fdf6ec) !important;
}

.log-card.log-info {
  border-left-color: var(--dy-accent-start) !important;
  background: linear-gradient(135deg, #f8f9fe, #f0f2f8) !important;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.log-header .el-tag {
  border-radius: 10px !important;
}

.log-time {
  font-size: 12px;
  color: var(--dy-meta);
}

.log-message {
  color: var(--dy-title);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

.log-detail {
  margin-top: 8px;
}

.detail-pre {
  font-size: 12px;
  color: var(--dy-body);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--dy-radius-sm);
  max-height: 200px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
}

:deep(.el-collapse-item__header) {
  font-size: 12px;
  color: var(--dy-meta);
  height: 28px;
  line-height: 28px;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style>
