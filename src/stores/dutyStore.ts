import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Duty, Event } from '@/services/api'
import { apiService } from '@/services/api'

export const useDutyStore = defineStore('duty', () => {
  // State
  const events = ref<Event[]>([])
  const currentEvent = ref<Event | null>(null)
  const currentActor = ref<string>('actor-1') // Mock actor ID for now
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentEventDuties = computed(() => {
    return currentEvent.value?.duties || []
  })

  const openDuties = computed(() => {
    return currentEventDuties.value.filter(duty => duty.status === 'Open')
  })

  const assignedDuties = computed(() => {
    return currentEventDuties.value.filter(duty => duty.status === 'Assigned')
  })

  const doneDuties = computed(() => {
    return currentEventDuties.value.filter(duty => duty.status === 'Done')
  })

  // Local archive (UI-only) by event id (reactive for immediate UI updates)
  const archived = ref<Record<string, Record<string, true>>>({})
  const archiveTick = ref(0)
  const isArchived = (eventId: string, dutyId: string) => !!archived.value[eventId]?.[dutyId]
  const archiveDuty = async (dutyId: string) => {
    if (!currentEvent.value) return
    const evt = currentEvent.value.id
    const duty = currentEventDuties.value.find(d => d.id === dutyId)
    if (!duty) return
    // Ensure done to count points
    if (duty.status !== 'Done') {
      await markDone(dutyId)
    }
    // Mark archived reactively so UI filters immediately
    const bucket = archived.value[evt] || {}
    archived.value = { ...archived.value, [evt]: { ...bucket, [dutyId]: true } }
    archiveTick.value++
  }

  // Actions
  const setCurrentEvent = (event: Event) => {
    currentEvent.value = event
  }

  const setActor = (id: string) => {
    currentActor.value = id
  }

  const loadEventDuties = async (eventId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getEventDuties(eventId)
      if (res.error) {
        setError(res.error)
        return
      }
      const docs: any[] = (res.data as any) || []
      const mapped: Duty[] = docs.map((d: any) => ({
        id: d._id,
        title: d.title,
        dueAt: new Date(d.dueAt).toISOString(),
        status: d.status,
        assignee: d.assignee ?? undefined,
        event: d.event,
        updatedAt: new Date(d.updatedAt).toISOString(),
      }))
      if (currentEvent.value && currentEvent.value.id === eventId) {
        currentEvent.value.duties = mapped
      } else if (currentEvent.value && currentEvent.value.id !== eventId) {
        // no-op: caller should have setCurrentEvent already
        currentEvent.value.duties = mapped
      }
    } catch (err) {
      setError('Failed to load duties')
    } finally {
      setLoading(false)
    }
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const addDuty = async (title: string, dueAt: string, assignee?: string) => {
    if (!currentEvent.value) return

    setLoading(true)
    setError(null)

    try {
      console.log('Adding duty to backend:', { title, dueAt, eventId: currentEvent.value.id })

      const response = await apiService.addDuty(
        currentEvent.value.id,
        currentActor.value,
        title,
        dueAt
      )

      if (response.error) {
        setError(response.error)
        console.error('Backend error:', response.error)
        return
      }

      // Add the new duty to the current event
      if (response.data?.duty) {
        const newDuty: Duty = {
          id: response.data.duty,
          title,
          dueAt,
          status: 'Open',
          event: currentEvent.value.id,
          updatedAt: new Date().toISOString(),
        }

        if (currentEvent.value) {
          currentEvent.value.duties.push(newDuty)
          console.log('Successfully added duty:', newDuty)
        }

        if (assignee) {
          await assignDuty(newDuty.id, assignee)
        }
      }
    } catch (err) {
      setError('Failed to add duty')
      console.error('Error adding duty:', err)
    } finally {
      setLoading(false)
    }
  }

  const assignDuty = async (dutyId: string, assignee: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Assigning duty:', { dutyId, assignee })

      const response = await apiService.assignDuty(dutyId, currentActor.value, assignee)

      if (response.error) {
        setError(response.error)
        console.error('Backend error:', response.error)
        return
      }

      // Update the duty in the store
      const duty = currentEventDuties.value.find(d => d.id === dutyId)
      if (duty) {
        duty.status = 'Assigned'
        duty.assignee = assignee
        duty.updatedAt = new Date().toISOString()
        console.log('Successfully assigned duty:', duty)
      }
    } catch (err) {
      setError('Failed to assign duty')
      console.error('Error assigning duty:', err)
    } finally {
      setLoading(false)
    }
  }

  const unassignDuty = async (dutyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.unassignDuty(dutyId, currentActor.value)

      if (response.error) {
        setError(response.error)
        return
      }

      // Update the duty in the store
      const duty = currentEventDuties.value.find(d => d.id === dutyId)
      if (duty) {
        duty.status = 'Open'
        duty.assignee = undefined
        duty.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      setError('Failed to unassign duty')
    } finally {
      setLoading(false)
    }
  }

  const markDone = async (dutyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.markDone(dutyId, currentActor.value)

      if (response.error) {
        setError(response.error)
        return
      }

      // Update the duty in the store
      const duty = currentEventDuties.value.find(d => d.id === dutyId)
      if (duty) {
        duty.status = 'Done'
        duty.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      setError('Failed to mark duty as done')
    } finally {
      setLoading(false)
    }
  }

  const reOpen = async (dutyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.reOpen(dutyId, currentActor.value)

      if (response.error) {
        setError(response.error)
        return
      }

      // Update the duty in the store
      const duty = currentEventDuties.value.find(d => d.id === dutyId)
      if (duty) {
        duty.status = 'Open'
        duty.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      setError('Failed to reopen duty')
    } finally {
      setLoading(false)
    }
  }

  const deleteDuty = async (dutyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.deleteDuty(dutyId, currentActor.value)

      if (response.error) {
        setError(response.error)
        return
      }

      // Remove the duty from the store
      if (currentEvent.value) {
        currentEvent.value.duties = currentEvent.value.duties.filter(d => d.id !== dutyId)
      }
    } catch (err) {
      setError('Failed to delete duty')
    } finally {
      setLoading(false)
    }
  }

  const updateDuty = async (dutyId: string, title?: string, dueAt?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.updateDuty(dutyId, currentActor.value, title, dueAt)

      if (response.error) {
        setError(response.error)
        return
      }

      // Update the duty in the store
      const duty = currentEventDuties.value.find(d => d.id === dutyId)
      if (duty) {
        if (title) duty.title = title
        if (dueAt) duty.dueAt = dueAt
        duty.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      setError('Failed to update duty')
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    events,
    currentEvent,
    currentActor,
    loading,
    error,

    // Getters
    currentEventDuties,
    openDuties,
    assignedDuties,
    doneDuties,

    // Actions
    setCurrentEvent,
    setActor,
    loadEventDuties,
    isArchived,
    archiveDuty,
    archiveTick,
    setError,
    setLoading,
    addDuty,
    assignDuty,
    unassignDuty,
    markDone,
    reOpen,
    deleteDuty,
    updateDuty,
  }
})
