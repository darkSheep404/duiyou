<template>
  <div class="events-page">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-input
            v-model="searchText"
            placeholder="搜索事件..."
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
            添加事件
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 事件列表 -->
    <div class="events-list">
      <el-card
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card"
        shadow="hover"
      >
        <div class="event-header">
          <div class="event-title">
            <div class="title-row">
              <h3>{{ event.title }}</h3>
              <el-tag v-if="event.eventType" type="info" size="small" style="margin-left: 8px;">
                {{ event.eventType }}
              </el-tag>
            </div>
            <div class="event-people">
              <!-- 支持多人物显示，最多显示5个头像 -->
              <div v-if="getEventPeople(event).length > 0" class="people-avatars">
                <el-avatar
                  v-for="(person, index) in getEventPeople(event).slice(0, 5)"
                  :key="person.id"
                  :src="person.avatar"
                  :size="24"
                  :style="{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 5 - index }"
                  class="person-avatar"
                >
                  {{ person.nickname ? person.nickname.charAt(0) : person.name.charAt(0) }}
                </el-avatar>
                <span v-if="getEventPeople(event).length > 5" class="more-people">
                  +{{ getEventPeople(event).length - 5 }}
                </span>
                <div class="people-names">
                  <el-tag
                    v-for="person in getEventPeople(event)"
                    :key="person.id"
                    size="small"
                    style="margin-right: 4px; margin-top: 4px;"
                  >
                    {{ person.name }}
                  </el-tag>
                </div>
              </div>
              <!-- 兼容旧数据单人物显示 -->
              <div v-else-if="event.person_id" class="single-person">
                <el-avatar
                  v-if="getPersonById(event.person_id)?.avatar"
                  :src="getPersonById(event.person_id).avatar"
                  :size="24"
                />
                <div
                  v-else
                  class="avatar"
                  style="width: 24px; height: 24px; font-size: 12px;"
                >
                  {{ getPersonName(event.person_id).charAt(0) }}
                </div>
                <span>{{ getPersonName(event.person_id) }}</span>
              </div>
            </div>
          </div>
          <div class="event-actions">
            <el-button type="text" @click="editEvent(event)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="text" @click="deleteEvent(event)" style="color: #f56c6c;">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="event-content">
          <div class="event-info">
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDateTime(event.time) }}</span>
            </div>
            <div v-if="event.location" class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ event.location }}</span>
            </div>
          </div>
          
          <p v-if="event.description" class="event-description">
            {{ event.description }}
          </p>
          
          <div v-if="event.tags && event.tags.length" class="event-tags">
            <el-tag
              v-for="tag in event.tags"
              :key="tag"
              size="small"
              style="margin-right: 8px;"
            >
              {{ tag }}
            </el-tag>
          </div>
          
          <div v-if="event.attachments && event.attachments.length" class="event-attachments">
            <div 
              v-for="(attachment, index) in event.attachments" 
              :key="index"
              class="attachment-preview"
            >
              <img 
                v-if="attachment.type === 'image'"
                :src="attachment.url" 
                class="attachment-thumbnail"
                @click="previewImage(attachment.url)"
              />
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑事件对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="90%"
      style="max-width: 500px;"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="formData.title" placeholder="请输入事件标题" />
        </el-form-item>
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
        <el-form-item label="事件类型">
          <el-select 
            v-model="formData.eventType" 
            placeholder="选择事件类型" 
            style="width: 100%"
            filterable
            allow-create
            default-first-option
          >
            <el-option label="聚餐" value="聚餐" />
            <el-option label="旅游" value="旅游" />
            <el-option label="会议" value="会议" />
            <el-option label="生日" value="生日" />
            <el-option label="聚会" value="聚会" />
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
        <el-form-item label="地点">
          <el-input v-model="formData.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            rows="4"
            placeholder="请输入事件描述"
          />
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
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '../stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete, Clock, Location, Upload } from '@element-plus/icons-vue'

const store = useAppStore()

// 搜索和筛选
const searchText = ref('')
const selectedPerson = ref('')

// 对话框控制
const showAddDialog = ref(false)
const editingEvent = ref(null)

// 表单数据
const formData = reactive({
  title: '',
  person_ids: [], // 改为数组支持多人物
  eventType: '', // 新增事件类型
  time: '',
  location: '',
  description: '',
  tags: [],
  attachments: []
})

// 筛选后的事件列表
const filteredEvents = computed(() => {
  let result = [...store.events].sort((a, b) => new Date(b.time) - new Date(a.time))
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(event => 
      event.title.toLowerCase().includes(search) ||
      event.description?.toLowerCase().includes(search) ||
      event.location?.toLowerCase().includes(search)
    )
  }
  
  if (selectedPerson.value) {
    result = result.filter(event => {
      const personIds = event.person_ids || [event.person_id].filter(Boolean) // 兼容旧数据
      return personIds.includes(selectedPerson.value)
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

// 获取事件相关的人物
const getEventPeople = (event) => {
  const personIds = event.person_ids || []
  return personIds.map(id => store.getPersonById(id)).filter(Boolean)
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

// 格式化日期时间
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 重置表单
const resetForm = () => {
  formData.title = ''
  formData.person_ids = []
  formData.eventType = ''
  formData.time = ''
  formData.location = ''
  formData.description = ''
  formData.tags = []
  formData.attachments = []
  editingEvent.value = null
}

// 编辑事件
const editEvent = (event) => {
  editingEvent.value = event
  formData.title = event.title
  // 支持新的多人物格式和兼容旧单人物格式
  formData.person_ids = event.person_ids || (event.person_id ? [event.person_id] : [])
  formData.eventType = event.eventType || ''
  formData.time = event.time
  formData.location = event.location || ''
  formData.description = event.description || ''
  formData.tags = event.tags ? [...event.tags] : []
  // 处理附件，确保有type字段
  formData.attachments = event.attachments ? event.attachments.map(att => ({
    ...att,
    type: att.type || (att.name && att.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file')
  })) : []
  showAddDialog.value = true
}

// 图片预览
const previewImage = (url) => {
  // 创建一个新窗口预览图片
  window.open(url, '_blank')
}

// 保存事件
const saveEvent = () => {
  if (!formData.title.trim()) {
    ElMessage.error('请输入事件标题')
    return
  }
  
  if (!formData.person_ids || formData.person_ids.length === 0) {
    ElMessage.error('请选择关联人物')
    return
  }
  
  const eventData = {
    id: editingEvent.value?.id, // 确保包含id
    title: formData.title.trim(),
    person_ids: formData.person_ids, // 使用新的多人物数据结构
    eventType: formData.eventType || '', // 事件类型
    time: formData.time || new Date().toISOString(),
    location: formData.location.trim(),
    description: formData.description.trim(),
    tags: formData.tags,
    attachments: formData.attachments
  }
  
  // 添加新标签到标签列表
  formData.tags.forEach(tag => {
    if (tag && !store.tags.includes(tag)) {
      store.addTag(tag)
    }
  })
  
  if (editingEvent.value) {
    store.updateEvent(eventData)
    ElMessage.success('事件信息已更新')
  } else {
    store.addEvent(eventData)
    ElMessage.success('事件添加成功')
  }
  
  showAddDialog.value = false
  resetForm()
}

// 删除事件
const deleteEvent = async (event) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除事件 "${event.title}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    store.deleteEvent(event.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}
</script>

<style scoped>
.events-page {
  width: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  transition: transform 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.event-title h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.event-people {
  margin-top: 8px;
}

.people-avatars {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.person-avatar {
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.more-people {
  background: #f5f7fa;
  color: #606266;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin-left: -8px;
}

.people-names {
  margin-top: 4px;
  width: 100%;
}

.single-person {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.event-actions {
  display: flex;
  gap: 4px;
}

.event-content {
  padding-left: 8px;
}

.event-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.event-description {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
}

.attachment-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
}

.event-attachments {
  margin-top: 12px;
}

.event-attachments .attachment-preview {
  display: flex;
  gap: 8px;
}

.event-attachments .attachment-thumbnail {
  width: 80px;
  height: 80px;
}

@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .event-actions {
    align-self: flex-end;
  }
  
  .event-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .attachment-upload {
    width: 100%;
  }
}
</style>
