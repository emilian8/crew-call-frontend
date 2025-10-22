import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService, type NotificationItem } from '@/services/api'
import { useEventStore } from './eventStore'

export const useNotifyStore = defineStore('notify', () => {
  const notifications = ref<NotificationItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)

  const setError = (msg: string | null) => { error.value = msg }
  const setLoading = (v: boolean) => { loading.value = v }

  const refresh = async (onlyUnread = false) => {
    const eventStore = useEventStore()
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.listUserNotifications(eventStore.currentActor, onlyUnread)
      if (res.error) { setError(res.error); return }
      const data = (res.data || []) as any[]
      notifications.value = data.map(n => ({
        id: n._id,
        recipient: n.recipient,
        subject: n.subject,
        body: n.body,
        createdAt: new Date(n.createdAt).toISOString(),
        unread: !!n.unread,
      }))
    } catch (_) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (notificationId: string) => {
    const eventStore = useEventStore()
    const res = await apiService.markRead(notificationId, eventStore.currentActor)
    if (res.error) { setError(res.error); return }
    const n = notifications.value.find(n => n.id === notificationId)
    if (n) n.unread = false
  }

  const deleteNotification = async (notificationId: string) => {
    const eventStore = useEventStore()
    const res = await apiService.deleteNotification(notificationId, eventStore.currentActor)
    if (res.error) { setError(res.error); return }
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    setError,
    setLoading,
    refresh,
    markRead,
    deleteNotification,
  }
})

