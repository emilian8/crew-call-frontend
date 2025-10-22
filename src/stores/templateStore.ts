import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService, type Template } from '@/services/api'
import { useEventStore } from './eventStore'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setError = (msg: string | null) => { error.value = msg }
  const setLoading = (v: boolean) => { loading.value = v }

  const listMyTemplates = async () => {
    const eventStore = useEventStore()
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.listTemplates(eventStore.currentActor)
      if (res.error) { setError(res.error); return }
      const data = (res.data || []) as any[]
      templates.value = data.map((t: any) => ({
        id: t._id,
        owner: t.owner,
        title: t.title,
        members: t.members,
        standardDuties: t.standardDuties,
        createdAt: new Date(t.createdAt).toISOString(),
        updatedAt: new Date(t.updatedAt).toISOString(),
      }))
    } catch (_) {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (title: string, members: string[], standardDuties: string[]) => {
    const eventStore = useEventStore()
    const res = await apiService.createTemplate(eventStore.currentActor, title, members, standardDuties)
    if (res.error) { setError(res.error); return }
    await listMyTemplates()
  }

  const updateTemplate = async (templateId: string, payload: { title?: string; members?: string[]; standardDuties?: string[] }) => {
    const eventStore = useEventStore()
    const res = await apiService.updateTemplate(templateId, eventStore.currentActor, payload)
    if (res.error) { setError(res.error); return }
    await listMyTemplates()
  }

  const deleteTemplate = async (templateId: string) => {
    const eventStore = useEventStore()
    const res = await apiService.deleteTemplate(templateId, eventStore.currentActor)
    if (res.error) { setError(res.error); return }
    templates.value = templates.value.filter(t => t.id !== templateId)
  }

  const applyTemplateToEvent = async (templateId: string, eventId: string) => {
    const eventStore = useEventStore()
    const res = await apiService.applyTemplate(templateId, eventId, eventStore.currentActor)
    if (res.error) { setError(res.error); return }
    return res.data
  }

  return {
    templates,
    loading,
    error,
    setError,
    setLoading,
    listMyTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplateToEvent,
  }
})

