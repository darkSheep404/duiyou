<template>
  <div class="timeline-page">
    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="selectedPerson"
            placeholder="按人物筛选"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="person in store.people"
              :key="person.id"
              :label="person.name"
              :value="person.id"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="selectedTag"
            placeholder="按标签筛选"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="tag in store.tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="selectedType"
            placeholder="按类型筛选"
            clearable
            style="width: 100%"
          >
            <el-option label="事件" value="event" />
            <el-option label="聊天记录" value="chat" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 时间线 -->
    <div class="timeline-container">
      <el-timeline>
        <el-timeline-item
          v-for="item in filteredTimeline"
          :key="`${item.type}-${item.id}`"
          :timestamp="formatDateTime(item.displayTime)"
          placement="top"
          :type="getTimelineType(item.type)"
          :size="getTimelineSize(item.type)"
        >
          <el-card class="timeline-card" shadow="hover">
            <!-- 事件类型 -->
            <div v-if="item.type === 'event'" class="timeline-event">
              <div class="item-header">
                <div class="item-title">
                  <el-icon class="item-icon"><Calendar /></el-icon>
                  <h4>{{ item.title }}</h4>
                </div>
                <el-tag type="info" size="small">事件</el-tag>
              </div>
              
              <div class="item-person">
                <el-avatar
                  v-if="item.person?.avatar"
                  :src="item.person.avatar"
                  :size="24"
                />
                <div
                  v-else-if="item.person"
                  class="avatar"
                  style="width: 24px; height: 24px; font-size: 12px;"
                >
                  {{ item.person.name.charAt(0) }}
                </div>
                <span>{{ item.person?.name || '未知用户' }}</span>
              </div>
              
              <div v-if="item.location" class="item-location">
                <el-icon><Location /></el-icon>
                <span>{{ item.location }}</span>
              </div>
              
              <p v-if="item.description" class="item-description">
                {{ item.description }}
              </p>
              
              <div v-if="item.tags && item.tags.length" class="item-tags">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 8px;"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            
            <!-- 聊天记录类型 -->
            <div v-else-if="item.type === 'chat'" class="timeline-chat">
              <div class="item-header">
                <div class="item-title">
                  <el-icon class="item-icon"><ChatDotRound /></el-icon>
                  <h4>聊天记录</h4>
                </div>
                <el-tag :type="getChatTypeColor(item.type)" size="small">
                  {{ item.type }}
                </el-tag>
              </div>
              
              <div class="item-person">
                <el-avatar
                  v-if="item.person?.avatar"
                  :src="item.person.avatar"
                  :size="24"
                />
                <div
                  v-else-if="item.person"
                  class="avatar"
                  style="width: 24px; height: 24px; font-size: 12px;"
                >
                  {{ item.person.name.charAt(0) }}
                </div>
                <span>{{ item.person?.name || '未知用户' }}</span>
              </div>
              
              <p class="item-content">{{ item.content }}</p>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <!-- 空状态 -->
      <div v-if="filteredTimeline.length === 0" class="empty-state">
        <el-empty description="暂无时间线数据" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { Calendar, ChatDotRound, Location } from '@element-plus/icons-vue'

const store = useAppStore()

// 筛选条件
const selectedPerson = ref('')
const selectedTag = ref('')
const selectedType = ref('')

// 筛选后的时间线数据
const filteredTimeline = computed(() => {
  let result = store.timelineItems
  
  // 按人物筛选
  if (selectedPerson.value) {
    result = result.filter(item => item.person_id === selectedPerson.value)
  }
  
  // 按标签筛选
  if (selectedTag.value) {
    result = result.filter(item => {
      // 检查项目本身的标签
      if (item.tags && item.tags.includes(selectedTag.value)) {
        return true
      }
      // 检查关联人物的标签
      if (item.person && item.person.tags && item.person.tags.includes(selectedTag.value)) {
        return true
      }
      return false
    })
  }
  
  // 按类型筛选
  if (selectedType.value) {
    result = result.filter(item => item.type === selectedType.value)
  }
  
  return result
})

// 格式化日期时间
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}天前 ` + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleString('zh-CN')
  }
}

// 获取时间线项目类型样式
const getTimelineType = (type) => {
  return type === 'event' ? 'primary' : 'success'
}

const getTimelineSize = (type) => {
  return type === 'event' ? 'large' : 'normal'
}

// 获取聊天类型颜色
const getChatTypeColor = (type) => {
  const colorMap = {
    '文字': '',
    '电话': 'success',
    '面谈': 'warning'
  }
  return colorMap[type] || ''
}
</script>

<style scoped>
.timeline-page {
  width: 100%;
}

.filter-card {
  margin-bottom: 20px;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-card {
  margin-left: 20px;
  transition: transform 0.2s;
}

.timeline-card:hover {
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-title h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.item-icon {
  color: #409eff;
}

.item-person {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.item-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #909399;
  font-size: 14px;
}

.item-description,
.item-content {
  color: #606266;
  line-height: 1.5;
  margin: 8px 0;
  white-space: pre-wrap;
}

.item-tags {
  margin-top: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

@media (max-width: 768px) {
  .timeline-container {
    max-width: 100%;
  }
  
  .timeline-card {
    margin-left: 10px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Element Plus Timeline 自定义样式 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
  font-weight: 500;
}

:deep(.el-timeline-item__node) {
  background-color: #409eff;
}

:deep(.el-timeline-item__node--large) {
  width: 16px;
  height: 16px;
}

:deep(.el-timeline-item__node--success) {
  background-color: #67c23a;
}
</style>
