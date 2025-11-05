import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import { useEventStore } from './eventStore'
import { useDutyStore } from './dutyStore'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const email = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  const isAuthed = computed(() => !!token.value)

  function loadFromStorage() {
    try {
      const t = localStorage.getItem('crewcall_token')
      const u = localStorage.getItem('crewcall_userId')
      if (t) token.value = t
      if (u) userId.value = u
      if (t && u) {
        const eventStore = useEventStore()
        const dutyStore = useDutyStore()
        eventStore.setActor(u)
        dutyStore.setActor(u)
      }
    } catch {/* noop */}
  }

  async function login(emailInput: string, pw: string) {
    loading.value = true
    error.value = null
    success.value = null
    try {
      const res = await apiService.login(emailInput, pw)
      if (res.error) { error.value = res.error; return }
      if ((res.data as any)?.error) { error.value = (res.data as any).error; return }
      if (res.data?.token && res.data?.userId) {
        token.value = res.data.token
        userId.value = res.data.userId
        email.value = emailInput
        try {
          localStorage.setItem('crewcall_token', res.data.token)
          localStorage.setItem('crewcall_userId', res.data.userId)
        } catch {/* noop */}
        // propagate to domain stores and refresh
        const eventStore = useEventStore()
        const dutyStore = useDutyStore()
        eventStore.setActor(res.data.userId)
        dutyStore.setActor(res.data.userId)
        await eventStore.loadMyEvents()
      } else {
        error.value = 'Log In Failed'
      }
    } catch (e) {
      error.value = 'Login failed'
    } finally {
      loading.value = false
    }
  }

  async function register(emailInput: string, pw: string): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null
    try {
      const res = await apiService.createAccount(emailInput, pw)
      if (res.error) { error.value = res.error; return false }
      const data: any = res.data
      if (data?.error) { error.value = data.error; return false }
      if (data?.created) {
        success.value = data?.message || 'Account created, please log in'
        email.value = emailInput
        return true
      } else {
        error.value = 'Registration failed'
        return false
      }
    } catch (e) {
      error.value = 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    userId.value = null
    try {
      localStorage.removeItem('crewcall_token')
      localStorage.removeItem('crewcall_userId')
    } catch {/* noop */}
  }

  // initialize
  loadFromStorage()

  return { token, userId, email, loading, error, success, isAuthed, login, register, logout }
})
