<template>
  <div class="person-detail-page">
    <!-- 返回按钮 -->
    <el-button @click="router.back()" type="text" class="back-btn">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <!-- 人物信息卡片 -->
    <el-card class="person-info-card" shadow="hover">
      <div class="person-header">
        <div class="person-avatar-section">
          <el-avatar
            v-if="person?.avatar"
            :src="person.avatar"
            :size="80"
            class="person-avatar"
          />
          <div
            v-else
            class="person-avatar default-avatar"
          >
            {{ person?.name?.charAt(0) || '?' }}
          </div>
        </div>
        
        <div class="person-basic-info">
          <h2 class="person-name">{{ person?.name || '未知用户' }}</h2>
          <p v-if="person?.nickname" class="person-nickname">昵称：{{ person.nickname }}</p>
          <div v-if="person?.tags && person.tags.length" class="person-tags">
            <el-tag
              v-for="tag in person.tags"
              :key="tag"
              size="small"
              :style="getTagStyle(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        
        <div class="person-actions">
          <el-button type="primary" @click="editPerson">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </div>
      
      <!-- 详细信息 -->
      <div class="person-details">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" v-if="person?.phone">
            <div class="detail-item">
              <el-icon class="detail-icon"><Phone /></el-icon>
              <span class="detail-label">电话：</span>
              <span class="detail-value">{{ person.phone }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" v-if="person?.email">
            <div class="detail-item">
              <el-icon class="detail-icon"><Message /></el-icon>
              <span class="detail-label">邮箱：</span>
              <span class="detail-value">{{ person.email }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" v-if="person?.company">
            <div class="detail-item">
              <el-icon class="detail-icon"><OfficeBuilding /></el-icon>
              <span class="detail-label">公司：</span>
              <span class="detail-value">{{ person.company }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" v-if="person?.position">
            <div class="detail-item">
              <el-icon class="detail-icon"><User /></el-icon>
              <span class="detail-label">职位：</span>
              <span class="detail-value">{{ person.position }}</span>
            </div>
          </el-col>
          <el-col :span="24" v-if="person?.address">
            <div class="detail-item">
              <el-icon class="detail-icon"><Location /></el-icon>
              <span class="detail-label">地址：</span>
              <span class="detail-value">{{ person.address }}</span>
            </div>
          </el-col>
          <el-col :span="24" v-if="person?.notes">
            <div class="detail-item">
              <el-icon class="detail-icon"><Document /></el-icon>
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ person.notes }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 相关时间线 -->
    <div class="person-timeline-section">
      <h3 class="section-title">
        <el-icon><Clock /></el-icon>
        相关时间线
      </h3>
      
      <!-- 使用时间线组件，不显示筛选框 -->
      <PersonTimeline :person-id="personId" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import PersonTimeline from '../components/PersonTimeline.vue'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Message, 
  OfficeBuilding, 
  User, 
  Location, 
  Document,
  Clock
} from '@element-plus/icons-vue'
import { getTagStyle } from '../utils/tagColor'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const personId = computed(() => route.params.id)
const person = computed(() => store.getPersonById(personId.value))

// 编辑人物
const editPerson = () => {
  // 这里可以触发编辑对话框或跳转到编辑页面
  router.push(`/people?edit=${personId.value}`)
}
</script>

<style scoped>
.person-detail-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 20px;
  color: var(--dy-accent-start);
  font-weight: 500;
}

.person-info-card {
  margin-bottom: 20px;
}

.person-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f1f5;
}

.person-avatar-section {
  flex-shrink: 0;
}

.person-avatar {
  width: 80px;
  height: 80px;
}

.default-avatar {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dy-gradient);
  color: white;
  border-radius: 50%;
  font-size: 32px;
  font-weight: bold;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.person-basic-info {
  flex: 1;
}

.person-name {
  margin: 0 0 8px 0;
  color: var(--dy-title);
  font-size: 24px;
  font-weight: 700;
}

.person-nickname {
  margin: 0 0 12px 0;
  color: var(--dy-meta);
  font-size: 14px;
}

.person-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.person-tags .el-tag {
  border: none !important;
  border-radius: 12px !important;
  font-size: 12px;
}

.person-actions {
  flex-shrink: 0;
}

.person-actions .el-button {
  border-radius: 20px !important;
  background: var(--dy-gradient) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}

.person-details {
  background: #fafbfd;
  padding: 20px;
  border-radius: var(--dy-radius-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.detail-icon {
  color: var(--dy-accent-start);
  width: 16px;
}

.detail-label {
  color: var(--dy-meta);
  font-weight: 500;
  min-width: 60px;
}

.detail-value {
  color: var(--dy-title);
  flex: 1;
  word-break: break-all;
}

.person-timeline-section {
  margin-top: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--dy-title);
  font-size: 18px;
  font-weight: 700;
}

.section-title .el-icon {
  color: var(--dy-accent-start);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .person-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .person-basic-info {
    text-align: center;
  }

  .person-tags {
    justify-content: center;
  }
  
  .person-details {
    padding: 15px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>
