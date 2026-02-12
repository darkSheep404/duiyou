<template>
  <div class="people-page">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          placeholder="搜索人物..."
          clearable
          class="filter-item"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedTag"
          placeholder="按标签筛选"
          clearable
          class="filter-item"
        >
          <el-option
            v-for="tag in store.tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        <el-button type="primary" @click="showAddDialog = true" class="filter-btn">
          <el-icon><Plus /></el-icon>
          <span class="btn-text">添加人物</span>
        </el-button>
      </div>
    </el-card>

    <!-- 人物列表 -->
    <div class="people-grid">
      <el-card
        v-for="person in filteredPeople"
        :key="person.id"
        class="person-card"
        shadow="hover"
      >
        <div class="person-content" @click="goToPersonDetail(person)">
          <div class="person-avatar">
            <img
              v-if="person.avatar"
              :src="person.avatar"
              :alt="person.name"
              class="avatar-img"
            />
            <div
              v-else
              class="avatar avatar-placeholder"
              :style="{ width: '60px', height: '60px', fontSize: '24px' }"
            >
              {{ person.nickname ? person.nickname.charAt(0) : person.name.charAt(0) }}
            </div>
          </div>
          
          <div class="person-info">
            <h3>{{ person.name }}</h3>
            <p class="nickname">{{ person.nickname }}</p>
            <p class="description">{{ person.description }}</p>
            
            <div class="person-tags">
              <el-tag
                v-for="tag in person.tags"
                :key="tag"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px;"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="contact-info">
              <div v-if="person.contact?.phone" class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>{{ person.contact.phone }}</span>
              </div>
              <div v-if="person.contact?.wechat" class="contact-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ person.contact.wechat }}</span>
              </div>
            </div>
          </div>
          
          <div class="person-actions" @click.stop>
            <el-button type="text" @click="editPerson(person)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="text" @click="deletePerson(person)" style="color: #f56c6c;">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑人物对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingPerson ? '编辑人物' : '添加人物'"
      width="90%"
      style="max-width: 500px;"
      @close="handleDialogClose"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload">
            <div class="avatar-preview">
              <img
                v-if="formData.avatar"
                :src="formData.avatar"
                class="avatar-img"
                style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"
              />
              <div
                v-else
                class="avatar avatar-placeholder"
                style="width: 60px; height: 60px; font-size: 24px;"
              >
                {{ formData.nickname ? formData.nickname.charAt(0) : (formData.name ? formData.name.charAt(0) : '?') }}
              </div>
            </div>
            <div class="avatar-input">
              <el-input 
                v-model="formData.avatar" 
                placeholder="请输入头像链接"
                style="margin-bottom: 8px;"
              />
              <el-upload
                ref="avatarUpload"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="handleAvatarChange"
              >
                <el-button size="small" type="primary">
                  <el-icon><Upload /></el-icon>
                  上传头像
                </el-button>
              </el-upload>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="formData.description"
            type="textarea"
            rows="3"
            placeholder="请输入简介"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in store.tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="formData.contact.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="微信">
          <el-input v-model="formData.contact.wechat" placeholder="请输入微信号" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="savePerson">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete, Phone, ChatDotRound, Upload } from '@element-plus/icons-vue'

const router = useRouter()
const store = useAppStore()

// 搜索和筛选
const searchText = ref('')
const selectedTag = ref('')

// 对话框控制
const showAddDialog = ref(false)
const editingPerson = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  nickname: '',
  avatar: '',
  description: '',
  tags: [],
  contact: {
    phone: '',
    wechat: ''
  }
})

// 筛选后的人物列表
const filteredPeople = computed(() => {
  let result = store.people
  
  // 全局标签过滤
  if (store.globalFilterTag) {
    result = result.filter(person =>
      person.tags && person.tags.includes(store.globalFilterTag)
    )
  }
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(person => 
      person.name.toLowerCase().includes(search) ||
      person.nickname?.toLowerCase().includes(search) ||
      person.description?.toLowerCase().includes(search)
    )
  }
  
  if (selectedTag.value) {
    result = result.filter(person => 
      person.tags && person.tags.includes(selectedTag.value)
    )
  }
  
  return result
})

// 头像上传处理
const handleAvatarChange = (file) => {
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.avatar = e.target.result
    }
    reader.readAsDataURL(file.raw)
  }
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.nickname = ''
  formData.avatar = ''
  formData.description = ''
  formData.tags = []
  formData.contact.phone = ''
  formData.contact.wechat = ''
  editingPerson.value = null
}

// 跳转到人物详情页
const goToPersonDetail = (person) => {
  router.push(`/person/${person.id}`)
}

// 编辑人物
const editPerson = (person) => {
  editingPerson.value = person
  formData.name = person.name
  formData.nickname = person.nickname || ''
  formData.avatar = person.avatar || ''
  formData.description = person.description || ''
  formData.tags = person.tags ? [...person.tags] : []
  formData.contact.phone = person.contact?.phone || ''
  formData.contact.wechat = person.contact?.wechat || ''
  showAddDialog.value = true
}

// 保存人物
const savePerson = () => {
  if (!formData.name.trim()) {
    ElMessage.error('请输入姓名')
    return
  }
  
  const personData = {
    id: editingPerson.value?.id, // 确保包含id
    name: formData.name.trim(),
    nickname: formData.nickname.trim(),
    avatar: formData.avatar.trim(),
    description: formData.description.trim(),
    tags: formData.tags,
    contact: {
      phone: formData.contact.phone.trim(),
      wechat: formData.contact.wechat.trim()
    }
  }
  
  // 添加新标签到标签列表
  formData.tags.forEach(tag => {
    if (tag && !store.tags.includes(tag)) {
      store.addTag(tag)
    }
  })
  
  if (editingPerson.value) {
    store.updatePerson(personData)
    ElMessage.success('人物信息已更新')
  } else {
    store.addPerson(personData)
    ElMessage.success('人物添加成功')
  }
  
  showAddDialog.value = false
  resetForm()
}

// 删除人物
const deletePerson = async (person) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${person.name} 吗？这将同时删除相关的事件和聊天记录。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    store.deletePerson(person.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}

// 关闭对话框时重置表单
const handleDialogClose = () => {
  resetForm()
}
</script>

<style scoped>
.people-page {
  width: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-item {
  flex: 1;
  min-width: 140px;
}

.filter-btn {
  flex-shrink: 0;
}

.people-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.person-card {
  transition: transform 0.2s;
}

.person-card:hover {
  transform: translateY(-2px);
}

.person-content {
  display: flex;
  gap: 15px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.person-content:hover {
  transform: translateY(-2px);
}

.person-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-upload {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.avatar-preview {
  flex-shrink: 0;
}

.avatar-input {
  flex: 1;
}

.person-info {
  flex: 1;
  min-width: 0;
}

.person-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.nickname {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

.description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.person-tags {
  margin-bottom: 12px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.person-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .people-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .person-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4px;
  }
  
  .avatar-img {
    width: 48px;
    height: 48px;
  }

  .person-info h3 {
    font-size: 14px;
  }

  .nickname {
    font-size: 12px;
    margin-bottom: 4px;
  }

  .description {
    font-size: 12px;
    margin-bottom: 6px;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .person-tags .el-tag {
    transform: scale(0.85);
    margin-right: 2px !important;
  }

  .contact-info {
    font-size: 11px;
  }
  
  .person-actions {
    position: static;
    justify-content: center;
    margin-top: 6px;
  }
  
  .avatar-upload {
    flex-direction: column;
    align-items: center;
  }

  .filter-bar {
    gap: 8px;
  }

  .filter-item {
    min-width: 0;
    flex: 1 1 calc(50% - 4px);
  }

  .filter-btn {
    flex: 0 0 auto;
  }

  .btn-text {
    display: none;
  }
}
</style>
