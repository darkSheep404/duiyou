<template>
  <div class="chats-page">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          placeholder="搜索聊天记录..."
          clearable
          class="filter-item"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedPerson"
          placeholder="按人物筛选"
          clearable
          class="filter-item"
        >
          <el-option
            v-for="person in store.people"
            :key="person.id"
            :label="person.name"
            :value="person.id"
          />
        </el-select>
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
          <span class="btn-text">添加聊天记录</span>
        </el-button>
      </div>
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
            <!-- 支持多人物聊天显示 -->
            <div v-if="getChatPeople(chat).length > 0" class="people-avatars">
              <el-avatar
                v-for="(person, index) in getChatPeople(chat).slice(0, 5)"
                :key="person.id"
                :src="person.avatar"
                :size="32"
                :style="{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 5 - index }"
                class="person-avatar"
              >
                {{ person.nickname ? person.nickname.charAt(0) : person.name.charAt(0) }}
              </el-avatar>
              <span v-if="getChatPeople(chat).length > 5" class="more-people">
                +{{ getChatPeople(chat).length - 5 }}
              </span>
            </div>
            <!-- 兼容旧数据单人物显示 -->
            <div v-else-if="chat.person_id" class="single-person-avatar">
              <el-avatar
                v-if="getPersonById(chat.person_id)?.avatar"
                :src="getPersonById(chat.person_id).avatar"
                :size="32"
              />
              <div
                v-else
                class="avatar"
                style="width: 32px; height: 32px; font-size: 14px;"
              >
                {{ getPersonName(chat.person_id).charAt(0) }}
              </div>
            </div>
            <div class="person-info">
              <div class="person-name">
                <!-- 显示多人物名称 -->
                <span v-if="getChatPeople(chat).length > 0">
                  {{ getChatPeople(chat).map(p => p.name).join(', ') }}
                </span>
                <!-- 兼容旧数据 -->
                <span v-else-if="chat.person_id">
                  {{ getPersonName(chat.person_id) }}
                </span>
              </div>
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
          
          <div v-if="chat.attachments && chat.attachments.length" class="chat-attachments">
            <div class="attachment-preview">
              <el-image
                v-for="(attachment, index) in chat.attachments.filter(a => a.type === 'image')"
                :key="index"
                :src="attachment.url"
                fit="cover"
                class="attachment-thumbnail"
                :preview-src-list="chat.attachments.filter(a => a.type === 'image').map(a => a.url)"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
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
          <el-select 
            v-model="formData.person_ids" 
            multiple
            placeholder="选择人物" 
            style="width: 100%"
          >
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
        <el-form-item v-if="!editingChat" label="批量添加">
          <div class="batch-mode-row">
            <el-switch v-model="batchMode" />
            <span class="batch-mode-hint" v-if="batchMode">每行文本将创建一条独立记录</span>
          </div>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="batchMode && !editingChat ? 10 : 6"
            :placeholder="batchMode && !editingChat ? '每行一条记录，例如：\n今天聊了工作的事\n讨论了周末计划\n分享了一个有趣的视频' : '请输入聊天内容'"
          />
          <div v-if="batchMode && !editingChat && formData.content.trim()" class="batch-preview">
            <el-icon><List /></el-icon>
            将创建 <strong>{{ formData.content.split('\n').filter(l => l.trim()).length }}</strong> 条记录
          </div>
        </el-form-item>
        <el-form-item label="附件">
          <div class="attachment-upload">
            <div v-if="formData.attachments && formData.attachments.length" class="attachment-preview">
              <div 
                v-for="(attachment, index) in formData.attachments" 
                :key="index"
                class="attachment-item"
              >
                <img 
                  v-if="attachment.type === 'image'"
                  :src="attachment.url" 
                  class="attachment-thumbnail"
                  @click="previewImage(attachment.url)"
                  style="cursor: pointer;"
                />
                <div class="attachment-info">
                  <span>{{ attachment.name }}</span>
                  <el-button type="text" size="small" @click="removeAttachment(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <el-upload
              ref="attachmentUpload"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleAttachmentChange"
            >
              <el-button size="small">
                <el-icon><Upload /></el-icon>
                上传图片
              </el-button>
            </el-upload>
          </div>
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete, Upload, List } from '@element-plus/icons-vue'

const route = useRoute()
const store = useAppStore()

// 搜索和筛选
const searchText = ref('')
const selectedPerson = ref('')
const selectedTag = ref('')

// 对话框控制
const showAddDialog = ref(false)
const editingChat = ref(null)
const batchMode = ref(false)

// 表单数据
const formData = reactive({
  person_ids: [], // 改为数组支持多人物
  type: '文字',
  time: '',
  content: '',
  attachments: []
})

// 筛选后的聊天记录列表
const filteredChats = computed(() => {
  let result = [...store.chats].sort((a, b) => new Date(b.time) - new Date(a.time))
  
  // 全局标签过滤
  if (store.globalFilterTag) {
    result = result.filter(chat => {
      const personIds = chat.person_ids || [chat.person_id].filter(Boolean)
      return personIds.some(id => {
        const p = store.getPersonById(id)
        return p && p.tags && p.tags.includes(store.globalFilterTag)
      })
    })
  }
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(chat => 
      chat.content.toLowerCase().includes(search)
    )
  }
  
  if (selectedPerson.value) {
    result = result.filter(chat => {
      const personIds = chat.person_ids || [chat.person_id].filter(Boolean)
      return personIds.includes(selectedPerson.value)
    })
  }

  // 标签筛选
  if (selectedTag.value) {
    result = result.filter(chat => {
      const personIds = chat.person_ids || [chat.person_id].filter(Boolean)
      return personIds.some(id => {
        const p = store.getPersonById(id)
        return p && p.tags && p.tags.includes(selectedTag.value)
      })
    })
  }
  
  return result
})

// 获取人物信息
const getPersonById = (id) => store.getPersonById(id)
const getPersonName = (id) => {
  const person = store.getPersonById(id)
  return person ? person.name : '未知用户'
}

// 获取聊天相关的人物
const getChatPeople = (chat) => {
  const personIds = chat.person_ids || []
  return personIds.map(id => store.getPersonById(id)).filter(Boolean)
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 附件处理
const handleAttachmentChange = (file) => {
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const attachment = {
        name: file.name,
        url: e.target.result,
        type: file.raw.type.startsWith('image/') ? 'image' : 'file',
        size: file.size
      }
      formData.attachments.push(attachment)
    }
    reader.readAsDataURL(file.raw)
  }
}

const removeAttachment = (index) => {
  formData.attachments.splice(index, 1)
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
  formData.person_ids = []
  formData.type = '文字'
  formData.time = ''
  formData.content = ''
  formData.attachments = []
  editingChat.value = null
  batchMode.value = false
}

// 编辑聊天记录
const editChat = (chat) => {
  editingChat.value = chat
  // 支持新的多人物格式和兼容旧单人物格式
  formData.person_ids = chat.person_ids || (chat.person_id ? [chat.person_id] : [])
  formData.type = chat.type
  formData.time = chat.time
  formData.content = chat.content
  // 处理附件，确保有type字段
  formData.attachments = chat.attachments ? chat.attachments.map(att => ({
    ...att,
    type: att.type || (att.name && att.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file')
  })) : []
  showAddDialog.value = true
}

// 保存聊天记录
const saveChat = () => {
  if (!formData.person_ids || formData.person_ids.length === 0) {
    ElMessage.error('请选择关联人物')
    return
  }
  
  if (!formData.content.trim()) {
    ElMessage.error('请输入聊天内容')
    return
  }
  
  const chatData = {
    id: editingChat.value?.id, // 确保包含id
    person_ids: formData.person_ids, // 使用新的多人物数据结构
    type: formData.type,
    time: formData.time || new Date().toISOString(),
    content: formData.content.trim(),
    attachments: formData.attachments
  }
  
  if (editingChat.value) {
    store.updateChat(chatData)
    ElMessage.success('聊天记录已更新')
  } else if (batchMode.value) {
    // 批量模式：按换行拆分，每行一条记录
    const lines = formData.content.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length === 0) {
      ElMessage.error('请输入聊天内容')
      return
    }
    const baseTime = formData.time ? new Date(formData.time) : new Date()
    lines.forEach((line, index) => {
      store.addChat({
        person_ids: formData.person_ids,
        type: formData.type,
        // 每条记录时间递增1秒，保证排序顺序
        time: new Date(baseTime.getTime() + index * 1000).toISOString(),
        content: line,
        attachments: index === 0 ? formData.attachments : []
      })
    })
    ElMessage.success(`已批量添加 ${lines.length} 条聊天记录`)
  } else {
    store.addChat(chatData)
    ElMessage.success('聊天记录添加成功')
  }
  
  showAddDialog.value = false
  resetForm()
}

// 监听路由 query.edit，自动打开编辑对话框
const checkEditQuery = () => {
  const editId = route.query.edit
  if (editId) {
    const chat = store.chats.find(c => c.id === editId)
    if (chat) {
      editChat(chat)
    }
  }
}

onMounted(() => {
  checkEditQuery()
})

watch(() => route.query.edit, () => {
  checkEditQuery()
})

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
  max-width: 900px;
  margin: 0 auto;
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
  border-radius: 20px !important;
  background: var(--dy-gradient) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}

.chats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.chat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
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

.people-avatars {
  display: flex;
  align-items: center;
}

.person-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.more-people {
  background: var(--dy-chip-bg);
  color: var(--dy-body);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: -8px;
}

.single-person-avatar {
  display: flex;
  align-items: center;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.person-name {
  font-weight: 600;
  color: var(--dy-title);
}

.chat-time {
  font-size: 12px;
  color: var(--dy-meta);
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-actions .el-tag {
  border: none !important;
  border-radius: 12px !important;
}

.chat-content {
  padding-left: 44px;
  color: var(--dy-body);
  line-height: 1.6;
  white-space: pre-wrap;
}

.attachment-upload {
  margin-top: 8px;
}

.attachment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.attachment-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #eef0f5;
  border-radius: var(--dy-radius-sm);
  background: #fafbfd;
}

.attachment-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
}

.chat-attachments {
  margin-top: 12px;
}

.chat-attachments .attachment-preview {
  display: flex;
  gap: 8px;
}

.chat-attachments .attachment-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: var(--dy-radius-sm);
}

.batch-mode-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-mode-hint {
  font-size: 12px;
  color: var(--dy-meta);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  padding: 2px 10px;
  border-radius: 10px;
}

.batch-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--dy-meta);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06), rgba(118, 75, 162, 0.06));
  padding: 6px 12px;
  border-radius: 10px;
}

.batch-preview strong {
  color: #667eea;
  font-size: 15px;
}

@media (max-width: 768px) {
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
  
  .attachment-upload {
    width: 100%;
  }
}
</style>
