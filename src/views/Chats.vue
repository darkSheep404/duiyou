<template>
  <div class="chats-page">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-input
            v-model="searchText"
            placeholder="搜索聊天记录..."
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
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
          <el-button type="primary" @click="showAddDialog = true" style="width: 100%">
            <el-icon><Plus /></el-icon>
            添加聊天记录
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 聊天记录列表 -->
    <div class="chats-list">
      <el-card
        v-for="chat in filteredChats"
        :key="chat.id"
        class="chat-card"
        shadow="hover"
      >
        <div class="chat-header">
          <div class="chat-person">
            <el-avatar
              v-if="getPersonById(chat.person_id)?.avatar"
              :src="getPersonById(chat.person_id).avatar"
              :size="32"
            />
            <div
              v-else-if="getPersonById(chat.person_id)"
              class="avatar"
              style="width: 32px; height: 32px; font-size: 14px;"
            >
              {{ getPersonName(chat.person_id).charAt(0) }}
            </div>
            <div class="person-info">
              <div class="person-name">{{ getPersonName(chat.person_id) }}</div>
              <div class="chat-time">{{ formatDateTime(chat.time) }}</div>
            </div>
          </div>
          <div class="chat-actions">
            <el-tag :type="getChatTypeColor(chat.type)" size="small">
              {{ chat.type }}
            </el-tag>
            <el-button type="text" @click="editChat(chat)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="text" @click="deleteChat(chat)" style="color: #f56c6c;">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="chat-content">
          <p>{{ chat.content }}</p>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑聊天记录对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingChat ? '编辑聊天记录' : '添加聊天记录'"
      width="90%"
      style="max-width: 500px;"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="关联人物" required>
          <el-select v-model="formData.person_id" placeholder="选择人物" style="width: 100%">
            <el-option
              v-for="person in store.people"
              :key="person.id"
              :label="person.name"
              :value="person.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="聊天类型" required>
          <el-select v-model="formData.type" placeholder="选择聊天类型" style="width: 100%">
            <el-option label="文字" value="文字" />
            <el-option label="电话" value="电话" />
            <el-option label="面谈" value="面谈" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="formData.time"
            type="datetime"
            placeholder="选择时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            rows="6"
            placeholder="请输入聊天内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveChat">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'

const store = useAppStore()

// 搜索和筛选
const searchText = ref('')
const selectedPerson = ref('')

// 对话框控制
const showAddDialog = ref(false)
const editingChat = ref(null)

// 表单数据
const formData = reactive({
  person_id: '',
  type: '文字',
  time: '',
  content: ''
})

// 筛选后的聊天记录列表
const filteredChats = computed(() => {
  let result = [...store.chats].sort((a, b) => new Date(b.time) - new Date(a.time))
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(chat => 
      chat.content.toLowerCase().includes(search)
    )
  }
  
  if (selectedPerson.value) {
    result = result.filter(chat => chat.person_id === selectedPerson.value)
  }
  
  return result
})

// 获取人物信息
const getPersonById = (id) => store.getPersonById(id)
const getPersonName = (id) => {
  const person = store.getPersonById(id)
  return person ? person.name : '未知用户'
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
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

// 重置表单
const resetForm = () => {
  formData.person_id = ''
  formData.type = '文字'
  formData.time = ''
  formData.content = ''
  editingChat.value = null
}

// 编辑聊天记录
const editChat = (chat) => {
  editingChat.value = chat
  formData.person_id = chat.person_id
  formData.type = chat.type
  formData.time = chat.time
  formData.content = chat.content
  showAddDialog.value = true
}

// 保存聊天记录
const saveChat = () => {
  if (!formData.person_id) {
    ElMessage.error('请选择关联人物')
    return
  }
  
  if (!formData.content.trim()) {
    ElMessage.error('请输入聊天内容')
    return
  }
  
  const chatData = {
    person_id: formData.person_id,
    type: formData.type,
    time: formData.time || new Date().toISOString(),
    content: formData.content.trim()
  }
  
  if (editingChat.value) {
    store.updateChat(editingChat.value.id, chatData)
    ElMessage.success('聊天记录已更新')
  } else {
    store.addChat(chatData)
    ElMessage.success('聊天记录添加成功')
  }
  
  showAddDialog.value = false
  resetForm()
}

// 删除聊天记录
const deleteChat = async (chat) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条聊天记录吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    store.deleteChat(chat.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}
</script>

<style scoped>
.chats-page {
  width: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.chats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-card {
  transition: transform 0.2s;
}

.chat-card:hover {
  transform: translateY(-2px);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chat-person {
  display: flex;
  align-items: center;
  gap: 12px;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.person-name {
  font-weight: 500;
  color: #303133;
}

.chat-time {
  font-size: 12px;
  color: #909399;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-content {
  padding-left: 44px;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chat-actions {
    align-self: flex-end;
  }
  
  .chat-content {
    padding-left: 0;
    margin-top: 8px;
  }
}
</style>
