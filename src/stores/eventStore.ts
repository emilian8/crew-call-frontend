import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import { apiService, type Event, type Member } from '@/services/api'

export const useEventStore = defineStore('event', () => {
  const currentActor = ref<string>('actor-1') // will be set from auth on login
  const events = ref<Event[]>([])
  const members = ref<Record<string, Member[]>>({}) // keyed by event id
  const roles = ref<Record<string, 'Organizer' | 'DutyMember'>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setError = (msg: string | null) => { error.value = msg }
  const setLoading = (v: boolean) => { loading.value = v }

  const setActor = (id: string) => { currentActor.value = id }

  const loadMyEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getUserEvents(currentActor.value)
      if (res.error) { setError(res.error); return }
      const list = (res.data || []) as Array<{ event: string; role: 'Organizer' | 'DutyMember' }>
      // Fetch each event doc to display titles and times
      const loaded: Event[] = []
      for (const row of list) {
        roles.value[row.event] = row.role
        const ev = await apiService.getEvent(row.event)
        if (ev.data && !(ev.data as any).error && ev.data) {
          const e = ev.data as any
          loaded.push({
            id: e._id,
            title: e.title,
            startsAt: new Date(e.startsAt).toISOString(),
            endsAt: new Date(e.endsAt).toISOString(),
            active: !!e.active,
            duties: [],
          })
        }
      }
      // De-duplicate by id in case of race conditions
      const seen = new Set<string>()
      const uniq: Event[] = []
      for (const ev of loaded) {
        if (!seen.has(ev.id)) { seen.add(ev.id); uniq.push(ev) }
      }
      events.value = uniq
    } catch (_) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (title: string, startsAt: string, endsAt: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.createEvent(currentActor.value, title, startsAt, endsAt)
      if (res.error) { setError(res.error); return }
      if (res.data?.event) {
        // Load the created event doc
        const ev = await apiService.getEvent(res.data.event)
        if (ev.data) {
          const e = ev.data as any
          const newEvt: Event = {
            id: e._id,
            title: e.title,
            startsAt: new Date(e.startsAt).toISOString(),
            endsAt: new Date(e.endsAt).toISOString(),
            active: !!e.active,
            duties: [],
          }
          const existingIdx = events.value.findIndex(ev => ev.id === newEvt.id)
          if (existingIdx >= 0) {
            // Replace existing to avoid duplicates
            events.value.splice(existingIdx, 1, newEvt)
          } else {
            events.value.unshift(newEvt)
          }
          roles.value[e._id] = 'Organizer'
        }
      }
    } catch (_) {
      setError('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (eventId: string) => {
    const res = await apiService.getEventMembers(eventId)
    if (res.error) { setError(res.error); return }
    members.value[eventId] = (res.data || [])
  }

  const inviteMember = async (eventId: string, invitee: string, role: 'Organizer' | 'DutyMember') => {
    const res = await apiService.invite(eventId, currentActor.value, invitee, role)
    if (res.error) { setError(res.error); return }
    await loadMembers(eventId)
  }

  const removeMember = async (eventId: string, member: string) => {
    const res = await apiService.removeMember(eventId, currentActor.value, member)
    if (res.error) { setError(res.error); return }
    await loadMembers(eventId)
  }

  const setActive = async (eventId: string, flag: boolean) => {
    const res = await apiService.setActive(eventId, currentActor.value, flag)
    if (res.error) { setError(res.error); return }
    const e = events.value.find(e => e.id === eventId)
    if (e) e.active = flag
  }

  const deleteEvent = async (eventId: string) => {
    const res = await apiService.deleteEvent(eventId, currentActor.value)
    if (res.error) { setError(res.error); return }
    events.value = events.value.filter(e => e.id !== eventId)
    delete members.value[eventId]
    delete roles.value[eventId]
  }

  return {
    currentActor,
    events,
    members,
    roles,
    loading,
    error,
    setError,
    setLoading,
    setActor,
    loadMyEvents,
    createEvent,
    loadMembers,
    inviteMember,
    removeMember,
    setActive,
    deleteEvent,
  }
})
