<template>
  <div id="app">
    <div class="app-container">
      <!-- Event List View -->
      <EventList
        v-if="currentView === 'event-list'"
        :events="eventStore.events"
        @create-event="handleCreateEvent"
        @select-event="handleSelectEvent"
        @delete-event="handleDeleteEvent"
      />

      <!-- Duty Board View -->
      <DutyBoard
        v-else-if="currentView === 'duty-board'"
        :event="selectedEvent"
        @back="currentView = 'event-list'"
        @apply-template="handleApplyTemplate"
      />

      <!-- Create Event Modal -->
      <CreateEventModal
        v-if="showCreateEvent"
        @save="createEventFromModal"
        @cancel="showCreateEvent = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDutyStore } from '@/stores/dutyStore'
import { useEventStore } from '@/stores/eventStore'
import { useTemplateStore } from '@/stores/templateStore'
import { useNotifyStore } from '@/stores/notifyStore'
import { apiService } from '@/services/api'
import type { Event } from '@/services/api'
import EventList from '@/components/EventList.vue'
import DutyBoard from '@/components/DutyBoard.vue'
import CreateEventModal from '@/components/CreateEventModal.vue'

const dutyStore = useDutyStore()
const eventStore = useEventStore()
const templateStore = useTemplateStore()
const notifyStore = useNotifyStore()

const currentView = ref<'event-list' | 'duty-board'>('event-list')
const selectedEvent = ref<Event | null>(null)
const showCreateEvent = ref(false)

onMounted(async () => {
  await eventStore.loadMyEvents()
  await notifyStore.refresh(true)
})

const handleCreateEvent = async () => {
  showCreateEvent.value = true
}

const createEventFromModal = async (title: string, startsAtISO: string, endsAtISO: string) => {
  showCreateEvent.value = false
  await eventStore.createEvent(title, startsAtISO, endsAtISO)
}

const handleSelectEvent = async (event: Event) => {
  selectedEvent.value = event
  dutyStore.setCurrentEvent(event)
  await dutyStore.loadEventDuties(event.id)
  currentView.value = 'duty-board'
}

const handleDeleteEvent = async (eventId: string) => {
  const role = eventStore.roles[eventId]
  if (role !== 'Organizer') {
    alert('Only organizers can delete events.')
    return
  }
  if (!confirm('Delete this event? This will remove the event and its memberships.')) return
  await eventStore.deleteEvent(eventId)
}

const handleApplyTemplate = async () => {
  if (!selectedEvent.value) return
  await templateStore.listMyTemplates()
  const titles = templateStore.templates.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
  const choice = window.prompt(`Select a template to apply to event:\n${titles}\nEnter number:`)
  if (!choice) return
  const idx = parseInt(choice, 10) - 1
  const t = templateStore.templates[idx]
  if (!t) return
  const result = await templateStore.applyTemplateToEvent(t.id, selectedEvent.value.id)
  if (result && (result as any).application) {
    const appId = (result as any).application as string
    // Materialize applied duties into DutyRoster with dueAt = event.endsAt
    const applied = await apiService.getAppliedDutiesForApplication(appId)
    const dueAt = selectedEvent.value.endsAt
    if (applied.data) {
      for (const ad of applied.data as any[]) {
        await apiService.addDuty(selectedEvent.value.id, eventStore.currentActor, ad.dutyName, dueAt)
      }
    }
    await dutyStore.loadEventDuties(selectedEvent.value.id)
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
