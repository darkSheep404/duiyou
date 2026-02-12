<template>
  <el-container class="layout-container">
    <!-- 桌面端侧边栏 -->
    <el-aside width="200px" class="desktop-view sidebar">
      <div class="logo">
        <h2>鼠鼠友人帐</h2>
        <p>人际关系管理</p>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#2c3e50"
        text-color="#ecf0f1"
        active-text-color="#3498db"
      >
        <el-menu-item index="/people">
          <el-icon><User /></el-icon>
          <span>人物管理</span>
        </el-menu-item>
        <el-menu-item index="/events">
          <el-icon><Calendar /></el-icon>
          <span>事件记录</span>
        </el-menu-item>
        <el-menu-item index="/chats">
          <el-icon><ChatDotRound /></el-icon>
          <span>聊天记录</span>
        </el-menu-item>
        <el-menu-item index="/timeline">
          <el-icon><Clock /></el-icon>
          <span>时间线</span>
        </el-menu-item>
        <el-menu-item index="/wander">
          <el-icon><MagicStick /></el-icon>
          <span>漫步</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-content">
          <h3 class="page-title">{{ $route.meta.title || '鼠鼠友人帐' }}</h3>
          <div class="header-actions">
              <el-select
                v-model="globalTag"
                placeholder="全局标签筛选"
                clearable
                size="small"
                style="width: 150px;"
                @change="onGlobalFilterChange"
                @clear="onGlobalFilterClear"
              >
                <el-option
                  v-for="tag in store.tags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
              <el-button type="text" @click="$router.push('/settings')">
                <el-icon><User /></el-icon>
              </el-button>
          </div>
        </div>
      </el-header>

      <!-- 全局过滤提示条 -->
      <div v-if="store.globalFilterTag" class="global-filter-bar">
        <span>🌍 正在按标签「{{ store.globalFilterTag }}」筛选全部数据</span>
        <el-button type="primary" link size="small" @click="onGlobalFilterClear">清除筛选</el-button>
      </div>

      <!-- 主内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 移动端底部导航 -->
    <div class="mobile-view bottom-nav">
      <el-row>
        <el-col :span="24">
          <div class="nav-buttons">
            <div
              v-for="item in navItems"
              :key="item.path"
              class="nav-item"
              :class="{ active: $route.path === item.path }"
              @click="$router.push(item.path)"
            >
              <el-icon :size="20">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { User, Calendar, ChatDotRound, Clock, Setting, MagicStick } from '@element-plus/icons-vue'

const store = useAppStore()
const people = computed(() => store.people)

// 全局标签筛选
const globalTag = ref(store.globalFilterTag || '')

const onGlobalFilterChange = (val) => {
  if (val) {
    store.setGlobalFilter(val)
  } else {
    store.clearGlobalFilter()
  }
}

const onGlobalFilterClear = () => {
  globalTag.value = ''
  store.clearGlobalFilter()
}

// 同步 store 变更
watch(() => store.globalFilterTag, (val) => {
  globalTag.value = val
})

const navItems = [
  { path: '/people', title: '人物', icon: 'User' },
  { path: '/events', title: '事件', icon: 'Calendar' },
  { path: '/chats', title: '聊天', icon: 'ChatDotRound' },
  { path: '/timeline', title: '时间线', icon: 'Clock' },
  { path: '/wander', title: '漫步', icon: 'MagicStick' },
  { path: '/settings', title: '设置', icon: 'Setting' }
]
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1c2e 0%, #2c3e50 100%);
  color: #ecf0f1;
}

.logo {
  padding: 28px 20px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo h2 {
  margin: 0;
  background: var(--dy-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 20px;
  letter-spacing: 1px;
}

.logo p {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #7f8c9b;
}

.header {
  background: var(--dy-card-bg);
  border-bottom: none;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.page-title {
  margin: 0;
  color: var(--dy-title);
  font-weight: 700;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  background-color: var(--dy-bg);
  padding: 20px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--dy-card-bg);
  border-top: none;
  z-index: 1000;
  padding: 6px 0 env(safe-area-inset-bottom, 8px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.nav-buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: color 0.25s, transform 0.15s;
  color: var(--dy-meta);
  border-radius: 12px;
}

.nav-item:active {
  transform: scale(0.92);
}

.nav-item.active {
  color: var(--dy-accent-start);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.10), rgba(118, 75, 162, 0.08));
}

.nav-item span {
  font-size: 11px;
  margin-top: 3px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
    margin-bottom: 70px;
  }
}

.global-filter-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--dy-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-bottom: none;
}
</style>
