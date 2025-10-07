<template>
  <el-container class="layout-container">
    <!-- 桌面端侧边栏 -->
    <el-aside width="200px" class="desktop-view sidebar">
      <div class="logo">
        <h2>对友</h2>
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
          <h3 class="page-title">{{ $route.meta.title || '对友' }}</h3>
          <div class="header-actions">
            <el-badge :value="people.length" class="item">
              <el-button type="text">
                <el-icon><User /></el-icon>
              </el-button>
            </el-badge>
          </div>
        </div>
      </el-header>

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
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import { User, Calendar, ChatDotRound, Clock, Setting } from '@element-plus/icons-vue'

const store = useAppStore()
const people = computed(() => store.people)

const navItems = [
  { path: '/people', title: '人物', icon: 'User' },
  { path: '/events', title: '事件', icon: 'Calendar' },
  { path: '/chats', title: '聊天', icon: 'ChatDotRound' },
  { path: '/timeline', title: '时间线', icon: 'Clock' },
  { path: '/settings', title: '设置', icon: 'Setting' }
]
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #2c3e50;
  color: #ecf0f1;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo h2 {
  margin: 0;
  color: #3498db;
}

.logo p {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #bdc3c7;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.page-title {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e4e7ed;
  z-index: 1000;
  padding: 8px 0;
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
  padding: 8px;
  cursor: pointer;
  transition: color 0.3s;
  color: #909399;
}

.nav-item.active {
  color: #409eff;
}

.nav-item span {
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
    margin-bottom: 70px;
  }
}
</style>
