<template>
  <div class="person-timeline">
    <!-- 时间线（不显示筛选框） -->
    <div class="timeline-container">
      <el-timeline v-if="timelineItems.length > 0">
        <el-timeline-item
          v-for="item in timelineItems"
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
                  <el-tag v-if="item.eventType" type="primary" size="small" style="margin-left: 8px;">
                    {{ item.eventType }}
                  </el-tag>
                </div>
                <div class="item-header-right">
                  <el-button size="small" circle @click="goEditEvent(item)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-tag type="info" size="small">事件</el-tag>
                </div>
              </div>
              
              <!-- 多人物显示 -->
              <div class="item-people" v-if="item.people && item.people.length > 1">
                <div class="people-avatars">
                  <el-avatar
                    v-for="(person, index) in item.people.slice(0, 5)"
                    :key="person.id"
                    :src="person.avatar"
                    :size="24"
                    :style="{ marginLeft: index > 0 ? '-4px' : '0', zIndex: 5 - index }"
                    class="person-avatar"
                  >
                    {{ person.nickname ? person.nickname.charAt(0) : person.name.charAt(0) }}
                  </el-avatar>
                  <span v-if="item.people.length > 5" class="more-people">
                    +{{ item.people.length - 5 }}
                  </span>
                </div>
                <span class="people-names">
                  {{ item.people.map(p => p.name).join(', ') }}
                </span>
              </div>
              
              <div v-if="item.location" class="item-location">
                <el-icon><Location /></el-icon>
                <span>{{ item.location }}</span>
              </div>
              
              <p v-if="item.description" class="item-description">
                {{ item.description }}
              </p>
              
              <!-- 图片附件 -->
              <div v-if="item.attachments && item.attachments.length" class="item-attachments">
                <div class="attachment-grid">
                  <el-image
                    v-for="(attachment, index) in item.attachments.filter(a => a.type === 'image' || !a.type)"
                    :key="index"
                    :src="attachment.url"
                    fit="cover"
                    class="attachment-item-img"
                    :preview-src-list="item.attachments.filter(a => a.type === 'image' || !a.type).map(a => a.url)"
                    :initial-index="index"
                    preview-teleported
                  />
                </div>
              </div>
              
              <div v-if="item.tags && item.tags.length" class="item-tags">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  :style="getTagStyle(tag)"
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
                <div class="item-header-right">
                  <el-button size="small" circle @click="goEditChat(item)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-tag :type="getChatTypeColor(item.chatType)" size="small">
                    {{ item.chatType || item.type }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 多人物显示 -->
              <div class="item-people" v-if="item.people && item.people.length > 1">
                <div class="people-avatars">
                  <el-avatar
                    v-for="(person, index) in item.people.slice(0, 5)"
                    :key="person.id"
                    :src="person.avatar"
                    :size="24"
                    :style="{ marginLeft: index > 0 ? '-4px' : '0', zIndex: 5 - index }"
                    class="person-avatar"
                  >
                    {{ person.nickname ? person.nickname.charAt(0) : person.name.charAt(0) }}
                  </el-avatar>
                  <span v-if="item.people.length > 5" class="more-people">
                    +{{ item.people.length - 5 }}
                  </span>
                </div>
                <span class="people-names">
                  {{ item.people.map(p => p.name).join(', ') }}
                </span>
              </div>
              
              <p class="item-content">{{ item.content }}</p>

              <!-- 图片附件 -->
              <div v-if="item.attachments && item.attachments.length" class="item-attachments">
                <div class="attachment-grid">
                  <el-image
                    v-for="(attachment, index) in item.attachments.filter(a => a.type === 'image' || !a.type)"
                    :key="index"
                    :src="attachment.url"
                    fit="cover"
                    class="attachment-item-img"
                    :preview-src-list="item.attachments.filter(a => a.type === 'image' || !a.type).map(a => a.url)"
                    :initial-index="index"
                    preview-teleported
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="该人物暂无相关记录" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { Calendar, ChatDotRound, Location, Edit } from '@element-plus/icons-vue'
import { getTagStyle } from '../utils/tagColor'

const props = defineProps({
  personId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const store = useAppStore()

// 获取该人物的时间线数据
const timelineItems = computed(() => {
  return store.getTimelineByPerson(props.personId)
})

// 编辑事件/聊天
const goEditEvent = (item) => {
  router.push({ path: '/events', query: { edit: item.id } })
}

const goEditChat = (item) => {
  router.push({ path: '/chats', query: { edit: item.id } })
}

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
.person-timeline {
  width: 100%;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-card {
  margin-left: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.timeline-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-header-right .el-tag {
  border: none !important;
  border-radius: 12px !important;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-title h4 {
  margin: 0;
  color: var(--dy-title);
  font-size: 16px;
  font-weight: 700;
}

.item-icon {
  color: var(--dy-accent-start);
}

.item-people {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--dy-body);
  font-size: 14px;
}

.people-avatars {
  display: flex;
  align-items: center;
  position: relative;
}

.person-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.more-people {
  margin-left: 8px;
  font-size: 12px;
  color: var(--dy-meta);
  background: var(--dy-chip-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.people-names {
  color: var(--dy-body);
  font-weight: 500;
}

.item-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--dy-meta);
  font-size: 13px;
}

.item-description,
.item-content {
  color: var(--dy-body);
  line-height: 1.6;
  margin: 8px 0;
  white-space: pre-wrap;
}

.item-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item-tags .el-tag {
  border: none !important;
  border-radius: 12px !important;
  font-size: 11px;
}

.item-attachments {
  margin: 12px 0;
}

.attachment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  max-width: 100%;
}

.attachment-item-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--dy-radius-sm);
  cursor: pointer;
  overflow: hidden;
}

.attachment-item-img :deep(img) {
  border-radius: var(--dy-radius-sm);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .timeline-container {
    padding: 0 10px;
  }
  
  .timeline-card {
    margin-left: 10px;
  }
  
  .attachment-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .people-avatars .person-avatar {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>
