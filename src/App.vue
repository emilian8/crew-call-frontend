<template>
  <div id="app">
    <div v-if="!auth.isAuthed" class="landing">
      <div class="panel">
        <h1>CrewCall</h1>
        <p class="tagline">Sign in to view your events and duties.</p>
        <LoginBar />
      </div>
    </div>
    <div v-else class="app-container">
      <LoginBar />
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
import { ref, onMounted, watchEffect } from 'vue'
import { useDutyStore } from '@/stores/dutyStore'
import { useEventStore } from '@/stores/eventStore'
import { useNotifyStore } from '@/stores/notifyStore'
import { useAuthStore } from '@/stores/authStore'
import type { Event } from '@/services/api'
import EventList from '@/components/EventList.vue'
import DutyBoard from '@/components/DutyBoard.vue'
import CreateEventModal from '@/components/CreateEventModal.vue'
import LoginBar from '@/components/LoginBar.vue'

const dutyStore = useDutyStore()
const eventStore = useEventStore()
const notifyStore = useNotifyStore()
const auth = useAuthStore()

const currentView = ref<'event-list' | 'duty-board'>('event-list')
const selectedEvent = ref<Event | null>(null)
const showCreateEvent = ref(false)

onMounted(async () => {
  if (auth.isAuthed) {
    await eventStore.loadMyEvents()
    await notifyStore.refresh(true)
  }
})

watchEffect(async () => {
  if (auth.isAuthed && eventStore.events.length === 0) {
    await eventStore.loadMyEvents()
    await notifyStore.refresh(true)
  }
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
.landing { min-height: 100vh; display:flex; align-items:center; justify-content:center; background:#f8f9fa; }
.panel { background:#fff; border:1px solid #e1e5e9; border-radius:12px; padding:2rem; box-shadow:0 8px 24px rgba(0,0,0,.08); max-width:420px; width:100%; text-align:center; }
.panel h1 { margin:0 0 .5rem; font-size:2rem; }
.tagline { margin:0 0 1rem; color:#555; }
</style>
<style>
/* Landing page form layout overrides (unscoped to reach child component) */
.landing .loginbar { display:block; }
.landing .loginbar .tabs { display:flex; justify-content:center; margin-bottom:.5rem; }
.landing .loginbar .row { flex-direction: column; align-items: stretch; }
.landing .loginbar input { width: 100%; box-sizing: border-box; }
.landing .loginbar .btn { width: 100%; }
.landing .panel form { width:100%; }
</style>
