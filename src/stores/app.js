import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const people = ref([])
  const events = ref([])
  const chats = ref([])
  const tags = ref(['朋友', '家人', '同事'])

  // 生成唯一ID
  const generateId = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 人物相关操作
  const addPerson = (person) => {
    const newPerson = {
      ...person,
      id: generateId('p'),
      createdAt: new Date().toISOString()
    }
    people.value.push(newPerson)
    saveToLocalStorage()
    return newPerson
  }

  const updatePerson = (personData) => {
    const index = people.value.findIndex(p => p.id === personData.id)
    if (index !== -1) {
      people.value[index] = { ...people.value[index], ...personData }
      saveToLocalStorage()
    }
  }

  const deletePerson = (id) => {
    people.value = people.value.filter(p => p.id !== id)
    // 同时删除相关的事件和聊天记录
    events.value = events.value.filter(e => e.person_id !== id)
    chats.value = chats.value.filter(c => c.person_id !== id)
    saveToLocalStorage()
  }

  const getPersonById = (id) => {
    return people.value.find(p => p.id === id)
  }

  // 事件相关操作
  const addEvent = (event) => {
    const newEvent = {
      ...event,
      id: generateId('e'),
      time: event.time || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    events.value.push(newEvent)
    saveToLocalStorage()
    return newEvent
  }

  const updateEvent = (eventData) => {
    const index = events.value.findIndex(e => e.id === eventData.id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...eventData }
      saveToLocalStorage()
    }
  }

  const deleteEvent = (id) => {
    events.value = events.value.filter(e => e.id !== id)
    saveToLocalStorage()
  }

  // 聊天记录相关操作
  const addChat = (chat) => {
    const newChat = {
      ...chat,
      id: generateId('c'),
      time: chat.time || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    chats.value.push(newChat)
    saveToLocalStorage()
    return newChat
  }

  const updateChat = (chatData) => {
    const index = chats.value.findIndex(c => c.id === chatData.id)
    if (index !== -1) {
      chats.value[index] = { ...chats.value[index], ...chatData }
      saveToLocalStorage()
    }
  }

  const deleteChat = (id) => {
    chats.value = chats.value.filter(c => c.id !== id)
    saveToLocalStorage()
  }

  // 标签相关操作
  const addTag = (tag) => {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag)
      saveToLocalStorage()
    }
  }

  const deleteTag = (tag) => {
    tags.value = tags.value.filter(t => t !== tag)
    // 从人物中移除该标签
    people.value.forEach(person => {
      if (person.tags && person.tags.includes(tag)) {
        person.tags = person.tags.filter(t => t !== tag)
      }
    })
    // 从事件中移除该标签
    events.value.forEach(event => {
      if (event.tags && event.tags.includes(tag)) {
        event.tags = event.tags.filter(t => t !== tag)
      }
    })
    saveToLocalStorage()
  }

  const renameTag = (oldTag, newTag) => {
    const index = tags.value.indexOf(oldTag)
    if (index !== -1) {
      tags.value[index] = newTag
      // 更新人物中的标签
      people.value.forEach(person => {
        if (person.tags && person.tags.includes(oldTag)) {
          const tagIndex = person.tags.indexOf(oldTag)
          person.tags[tagIndex] = newTag
        }
      })
      // 更新事件中的标签
      events.value.forEach(event => {
        if (event.tags && event.tags.includes(oldTag)) {
          const tagIndex = event.tags.indexOf(oldTag)
          event.tags[tagIndex] = newTag
        }
      })
      saveToLocalStorage()
    }
  }

  // 时间线数据
  const timelineItems = computed(() => {
    const items = []
    
    // 添加事件到时间线
    events.value.forEach(event => {
      const person = getPersonById(event.person_id)
      items.push({
        ...event,
        type: 'event',
        person: person,
        displayTime: new Date(event.time)
      })
    })
    
    // 添加聊天记录到时间线
    chats.value.forEach(chat => {
      const person = getPersonById(chat.person_id)
      items.push({
        ...chat,
        type: 'chat',
        person: person,
        displayTime: new Date(chat.time)
      })
    })
    
    // 按时间排序（最新的在前）
    return items.sort((a, b) => b.displayTime - a.displayTime)
  })

  // 根据人物筛选时间线
  const getTimelineByPerson = (personId) => {
    return timelineItems.value.filter(item => item.person_id === personId)
  }

  // 根据标签筛选时间线
  const getTimelineByTag = (tag) => {
    return timelineItems.value.filter(item => 
      (item.tags && item.tags.includes(tag)) || 
      (item.person && item.person.tags && item.person.tags.includes(tag))
    )
  }

  // 数据持久化
  const saveToLocalStorage = () => {
    const data = {
      people: people.value,
      events: events.value,
      chats: chats.value,
      tags: tags.value
    }
    localStorage.setItem('duiyou-data', JSON.stringify(data))
  }

  const loadFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('duiyou-data')
      if (data) {
        const parsed = JSON.parse(data)
        people.value = parsed.people || []
        events.value = parsed.events || []
        chats.value = parsed.chats || []
        tags.value = parsed.tags || ['朋友', '家人', '同事']
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  // 导出数据
  const exportData = () => {
    const data = {
      people: people.value,
      events: events.value,
      chats: chats.value,
      tags: tags.value,
      exportTime: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入数据
  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      if (data.people) people.value = data.people
      if (data.events) events.value = data.events
      if (data.chats) chats.value = data.chats
      if (data.tags) tags.value = data.tags
      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // 初始化时加载数据
  loadFromLocalStorage()

  return {
    // 状态
    people,
    events,
    chats,
    tags,
    timelineItems,
    
    // 人物操作
    addPerson,
    updatePerson,
    deletePerson,
    getPersonById,
    
    // 事件操作
    addEvent,
    updateEvent,
    deleteEvent,
    
    // 聊天操作
    addChat,
    updateChat,
    deleteChat,
    
    // 标签操作
    addTag,
    deleteTag,
    renameTag,
    
    // 时间线
    getTimelineByPerson,
    getTimelineByTag,
    
    // 数据操作
    exportData,
    importData,
    saveToLocalStorage
  }
})
