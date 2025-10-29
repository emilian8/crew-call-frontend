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
import { useNotifyStore } from '@/stores/notifyStore'
import type { Event } from '@/services/api'
import EventList from '@/components/EventList.vue'
import DutyBoard from '@/components/DutyBoard.vue'
import CreateEventModal from '@/components/CreateEventModal.vue'

const dutyStore = useDutyStore()
const eventStore = useEventStore()
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

// removed Apply Template feature
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
