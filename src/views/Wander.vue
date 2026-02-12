<template>
  <div class="wander-page">
    <!-- 顶部 -->
    <div class="wander-header">
      <div class="header-left">
        <span class="header-emoji">🎲</span>
        <div>
          <h2>随机漫步</h2>
          <p class="header-sub">回忆里的碎片，随缘翻阅</p>
        </div>
      </div>
      <button class="shuffle-btn" @click="shuffle">
        <span class="shuffle-icon">↻</span>
        换一批
      </button>
    </div>

    <!-- 指示器 -->
    <div v-if="randomItems.length > 1" class="indicator-bar">
      <span
        v-for="(_, i) in randomItems"
        :key="i"
        class="dot"
        :class="{ active: i === activeIndex }"
        @click="scrollTo(i)"
      />
    </div>

    <!-- 滚动卡片区 -->
    <div v-if="randomItems.length > 0" class="scroll-track" ref="trackRef">
      <div
        v-for="(item, idx) in randomItems"
        :key="`${item.type}-${item.id}`"
        class="card-snap"
        :data-index="idx"
      >
        <div class="card" :class="cardAccent(item)">
          <!-- 顶部色带 -->
          <div class="card-ribbon">
            <span class="ribbon-type">{{ item.type === 'event' ? '📅 事件' : '💬 聊天' }}</span>
            <span class="ribbon-badge" v-if="item.eventType || item.chatType">
              {{ item.eventType || item.chatType }}
            </span>
          </div>

          <!-- 标题 -->
          <h3 class="card-title">{{ item.type === 'event' ? item.title : '聊天记录' }}</h3>

          <!-- 人物行 -->
          <div class="card-people" v-if="item.people && item.people.length > 0">
            <div class="avatar-stack">
              <span
                v-for="(person, pi) in item.people.slice(0, 4)"
                :key="person.id"
                class="mini-avatar"
                :style="{ zIndex: 10 - pi, marginLeft: pi > 0 ? '-10px' : '0' }"
              >
                <img v-if="person.avatar" :src="person.avatar" :alt="person.name" />
                <span v-else class="avatar-letter">{{ (person.nickname || person.name).charAt(0) }}</span>
              </span>
              <span v-if="item.people.length > 4" class="avatar-more">+{{ item.people.length - 4 }}</span>
            </div>
            <span class="people-label">{{ item.people.map(p => p.name).join('、') }}</span>
          </div>

          <!-- 元信息 -->
          <div class="card-meta">
            <span class="meta-item">🕐 {{ formatDateTime(item.displayTime) }}</span>
            <span v-if="item.location" class="meta-item">📍 {{ item.location }}</span>
          </div>

          <!-- 正文 -->
          <div class="card-body" v-if="item.description || item.content">
            <p>{{ item.description || item.content }}</p>
          </div>

          <!-- 图片 -->
          <div v-if="getImages(item).length" class="card-images">
            <el-image
              v-for="(img, imgIdx) in getImages(item)"
              :key="imgIdx"
              :src="img"
              fit="cover"
              class="card-img"
              :preview-src-list="getImages(item)"
              :initial-index="imgIdx"
              preview-teleported
            />
          </div>

          <!-- 标签 -->
          <div v-if="item.tags && item.tags.length" class="card-tags">
            <span v-for="tag in item.tags" :key="tag" class="tag-chip" :style="getTagStyle(tag)">{{ tag }}</span>
          </div>

          <!-- 底部计数 -->
          <div class="card-footer">
            <span class="card-counter">{{ idx + 1 }} / {{ randomItems.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🌙</div>
      <p>还没有任何记忆碎片</p>
      <p class="empty-hint">去添加一些事件或聊天记录吧~</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { getTagStyle } from '../utils/tagColor'

const store = useAppStore()
const randomItems = ref([])
const activeIndex = ref(0)
const trackRef = ref(null)
let scrollObserver = null

// 随机抽取
const shuffle = () => {
  const all = store.timelineItems
  if (all.length === 0) { randomItems.value = []; return }
  const copy = [...all]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  randomItems.value = copy.slice(0, Math.min(5, copy.length))
  activeIndex.value = 0
  nextTick(() => {
    if (trackRef.value) trackRef.value.scrollLeft = 0
    setupObserver()
  })
}

// 滚动到指定卡片
const scrollTo = (i) => {
  const track = trackRef.value
  if (!track) return
  const cards = track.querySelectorAll('.card-snap')
  if (cards[i]) {
    cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
}

// IntersectionObserver 追踪当前可见卡片
const setupObserver = () => {
  if (scrollObserver) scrollObserver.disconnect()
  const track = trackRef.value
  if (!track) return
  scrollObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const idx = Number(entry.target.dataset.index)
          if (!isNaN(idx)) activeIndex.value = idx
        }
      }
    },
    { root: track, threshold: 0.6 }
  )
  track.querySelectorAll('.card-snap').forEach(el => scrollObserver.observe(el))
}

// 工具函数
const getImages = (item) => {
  if (!item.attachments) return []
  return item.attachments.filter(a => a.type === 'image' || !a.type).map(a => a.url)
}

const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return `${days}天前`
  if (days < 365) return `${date.getMonth() + 1}月${date.getDate()}日`
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const cardAccent = (item) => item.type === 'event' ? 'accent-blue' : 'accent-green'

onMounted(() => { shuffle() })
onBeforeUnmount(() => { if (scrollObserver) scrollObserver.disconnect() })
</script>

<style scoped>
/* ===== 页面 ===== */
.wander-page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 20px;
}

/* ===== 头部 ===== */
.wander-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-emoji {
  font-size: 36px;
  line-height: 1;
}
.wander-header h2 {
  margin: 0;
  font-size: 22px;
  color: #1d2129;
  letter-spacing: 0.5px;
}
.header-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #a0a4b0;
}
.shuffle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
}
.shuffle-btn:active {
  transform: scale(0.95);
}
.shuffle-icon {
  font-size: 18px;
  display: inline-block;
  transition: transform 0.4s;
}
.shuffle-btn:active .shuffle-icon {
  transform: rotate(360deg);
}

/* ===== 指示器 ===== */
.indicator-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9dbe3;
  cursor: pointer;
  transition: all 0.25s;
}
.dot.active {
  width: 22px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

/* ===== 横向滚动轨道 ===== */
.scroll-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0 20px;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-track::-webkit-scrollbar {
  display: none;
}

.card-snap {
  flex: 0 0 92%;
  max-width: 520px;
  scroll-snap-align: center;
}

/* ===== 卡片 ===== */
.card {
  position: relative;
  background: #fff;
  border-radius: 18px;
  padding: 0;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}
.card:active {
  transform: scale(0.985);
}

/* 顶部色带 */
.card-ribbon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 10px;
}
.accent-blue .card-ribbon {
  background: linear-gradient(135deg, #e8f0fe, #d4e4ff);
}
.accent-green .card-ribbon {
  background: linear-gradient(135deg, #e8fae8, #d1f5d1);
}
.ribbon-type {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}
.ribbon-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.8);
  color: #555;
  font-weight: 500;
}

/* 标题 */
.card-title {
  margin: 0;
  padding: 14px 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.4;
}

/* 人物行 */
.card-people {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px 0;
}
.avatar-stack {
  display: flex;
  align-items: center;
}
.mini-avatar {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #fff;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  flex-shrink: 0;
}
.mini-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.avatar-more {
  margin-left: -6px;
  font-size: 11px;
  color: #909399;
  padding-left: 8px;
}
.people-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 元信息 */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 20px 0;
}
.meta-item {
  font-size: 12px;
  color: #8c8fa3;
}

/* 正文 */
.card-body {
  padding: 12px 20px 0;
}
.card-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #4a4d5a;
  white-space: pre-wrap;
  word-break: break-word;
  /* 最多 6 行 */
  display: -webkit-box;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 图片 */
.card-images {
  display: flex;
  gap: 8px;
  padding: 12px 20px 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.card-images::-webkit-scrollbar { display: none; }
.card-img {
  flex-shrink: 0;
  width: 110px;
  height: 110px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
}
.card-img :deep(img) {
  border-radius: 12px;
}

/* 标签 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 20px 0;
}
.tag-chip {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
}

/* 底部 */
.card-footer {
  padding: 14px 20px;
  text-align: right;
}
.card-counter {
  font-size: 11px;
  color: #c0c4cc;
  font-variant-numeric: tabular-nums;
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.empty-state p {
  margin: 0;
  font-size: 16px;
  color: #606266;
}
.empty-hint {
  margin-top: 6px !important;
  font-size: 13px !important;
  color: #a0a4b0 !important;
}

/* ===== 桌面端 ===== */
@media (min-width: 769px) {
  .card-snap {
    flex: 0 0 70%;
    max-width: 520px;
  }
  .scroll-track {
    padding-left: calc((100% - 520px) / 2);
    padding-right: calc((100% - 520px) / 2);
  }
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .wander-page {
    padding-bottom: 10px;
  }
  .wander-header h2 {
    font-size: 18px;
  }
  .header-emoji {
    font-size: 28px;
  }
  .header-sub {
    display: none;
  }
  .shuffle-btn {
    padding: 7px 14px;
    font-size: 13px;
  }

  .card-snap {
    flex: 0 0 88%;
  }
  .scroll-track {
    gap: 12px;
    padding-left: 6%;
    padding-right: 6%;
  }

  .card-title {
    font-size: 16px;
    padding: 12px 16px 0;
  }
  .card-ribbon {
    padding: 12px 16px 8px;
  }
  .card-people,
  .card-meta,
  .card-body,
  .card-images,
  .card-tags {
    padding-left: 16px;
    padding-right: 16px;
  }
  .card-footer {
    padding: 12px 16px;
  }

  .card-img {
    width: 90px;
    height: 90px;
  }
  .card-body p {
    font-size: 13px;
  }
}
</style>
