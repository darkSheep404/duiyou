import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import People from '../views/People.vue'
import Events from '../views/Events.vue'
import Chats from '../views/Chats.vue'
import Timeline from '../views/Timeline.vue'
import Settings from '../views/Settings.vue'
import PersonDetail from '../views/PersonDetail.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/timeline',
    children: [
      {
        path: '/people',
        name: 'People',
        component: People,
        meta: { title: '人物管理' }
      },
      {
        path: '/person/:id',
        name: 'PersonDetail',
        component: PersonDetail,
        meta: { title: '人物详情' }
      },
      {
        path: '/events',
        name: 'Events',
        component: Events,
        meta: { title: '事件记录' }
      },
      {
        path: '/chats',
        name: 'Chats',
        component: Chats,
        meta: { title: '聊天记录' }
      },
      {
        path: '/timeline',
        name: 'Timeline',
        component: Timeline,
        meta: { title: '时间线' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: Settings,
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/duiyou/'),
  routes
})

export default router
