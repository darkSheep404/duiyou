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
      people.value[index] = { ...people.value[index], ...personData, updatedAt: new Date().toISOString() }
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
      events.value[index] = { ...events.value[index], ...eventData, updatedAt: new Date().toISOString() }
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
      chats.value[index] = { ...chats.value[index], ...chatData, updatedAt: new Date().toISOString() }
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
      // 支持多人物事件 - person_ids 是数组，person_id 是兼容旧数据
      const personIds = event.person_ids || (event.person_id ? [event.person_id] : [])
      const people = personIds.map(id => getPersonById(id)).filter(Boolean)
      
      items.push({
        ...event,
        type: 'event',
        people: people, // 多个人物
        person: people[0], // 兼容旧代码
        person_ids: personIds,
        displayTime: new Date(event.time)
      })
    })
    
    // 添加聊天记录到时间线
    chats.value.forEach(chat => {
      // 支持多人物聊天 - person_ids 是数组，person_id 是兼容旧数据
      const personIds = chat.person_ids || (chat.person_id ? [chat.person_id] : [])
      const people = personIds.map(id => getPersonById(id)).filter(Boolean)
      
      items.push({
        ...chat,
        type: 'chat',
        people: people, // 多个人物
        person: people[0], // 兼容旧代码
        person_ids: personIds,
        displayTime: new Date(chat.time)
      })
    })
    
    // 按时间排序（最新的在前）
    return items.sort((a, b) => b.displayTime - a.displayTime)
  })

  // 根据人物筛选时间线
  const getTimelineByPerson = (personId) => {
    return timelineItems.value.filter(item => {
      // 支持多人物事件和聊天
      if (item.person_ids && item.person_ids.includes(personId)) {
        return true
      }
      // 兼容旧数据
      return item.person_id === personId
    })
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
      exportTime: new Date().toISOString(),
      syncTime: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入数据（覆盖模式）
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

  // 智能合并数据（按 ID 取并集，同 ID 取 updatedAt 较新的）
  const mergeData = (jsonData) => {
    try {
      const remote = JSON.parse(jsonData)

      // 合并数组：按 id 取并集，同 id 保留更新时间较晚的
      const mergeArray = (localArr, remoteArr) => {
        const map = new Map()
        // 先放入本地数据
        for (const item of localArr) {
          map.set(item.id, item)
        }
        // 再用远端数据合并
        for (const item of remoteArr) {
          const existing = map.get(item.id)
          if (!existing) {
            // 本地没有，直接新增
            map.set(item.id, item)
          } else {
            // 两边都有，取 updatedAt 较新的；没有 updatedAt 则比较 createdAt
            const localTime = existing.updatedAt || existing.createdAt || ''
            const remoteTime = item.updatedAt || item.createdAt || ''
            if (remoteTime > localTime) {
              map.set(item.id, item)
            }
          }
        }
        return Array.from(map.values())
      }

      people.value = mergeArray(people.value, remote.people || [])
      events.value = mergeArray(events.value, remote.events || [])
      chats.value = mergeArray(chats.value, remote.chats || [])

      // 标签取并集去重
      const mergedTags = new Set([...tags.value, ...(remote.tags || [])])
      tags.value = Array.from(mergedTags)

      saveToLocalStorage()
      return { success: true, message: '数据合并完成' }
    } catch (error) {
      console.error('合并数据失败:', error)
      return { success: false, message: '合并失败: ' + error.message }
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
    mergeData,
    saveToLocalStorage
  }
})
