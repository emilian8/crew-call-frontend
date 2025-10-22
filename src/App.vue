<template>
  <div id="app">
    <div class="app-container">
      <!-- Event List View -->
      <EventList
        v-if="currentView === 'event-list'"
        :events="mockEvents"
        @create-event="handleCreateEvent"
        @select-event="handleSelectEvent"
      />

      <!-- Duty Board View -->
      <DutyBoard
        v-else-if="currentView === 'duty-board'"
        :event="selectedEvent"
        @back="currentView = 'event-list'"
        @apply-template="handleApplyTemplate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDutyStore } from '@/stores/dutyStore'
import type { Event } from '@/services/api'
import EventList from '@/components/EventList.vue'
import DutyBoard from '@/components/DutyBoard.vue'

const dutyStore = useDutyStore()

const currentView = ref<'event-list' | 'duty-board'>('event-list')
const selectedEvent = ref<Event | null>(null)

// Mock data for demonstration
const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Saturday Cleaning',
    date: '2024-03-10T15:00:00Z',
    duties: [
      {
        id: 'duty-1',
        title: 'Sweep common room',
        dueAt: '2024-03-10T17:00:00Z',
        status: 'Assigned',
        assignee: 'user-1',
        event: 'event-1',
        updatedAt: '2024-03-10T10:00:00Z'
      },
      {
        id: 'duty-2',
        title: 'Trash & recycling',
        dueAt: '2024-03-10T18:00:00Z',
        status: 'Done',
        assignee: 'user-2',
        event: 'event-1',
        updatedAt: '2024-03-10T11:00:00Z'
      },
      {
        id: 'duty-3',
        title: 'Restock supplies',
        dueAt: '2024-03-10T19:00:00Z',
        status: 'Open',
        event: 'event-1',
        updatedAt: '2024-03-10T09:00:00Z'
      }
    ]
  },
  {
    id: 'event-2',
    title: 'Friday Party Setup',
    date: '2024-03-15T17:00:00Z',
    duties: [
      {
        id: 'duty-4',
        title: 'Set up tables',
        dueAt: '2024-03-15T18:00:00Z',
        status: 'Open',
        event: 'event-2',
        updatedAt: '2024-03-15T10:00:00Z'
      },
      {
        id: 'duty-5',
        title: 'Decorate venue',
        dueAt: '2024-03-15T19:00:00Z',
        status: 'Assigned',
        assignee: 'user-3',
        event: 'event-2',
        updatedAt: '2024-03-15T11:00:00Z'
      }
    ]
  }
]

const handleCreateEvent = () => {
  // TODO: Implement event creation
  console.log('Create new event')
}

const handleSelectEvent = (event: Event) => {
  selectedEvent.value = event
  dutyStore.setCurrentEvent(event)
  currentView.value = 'duty-board'
}

const handleApplyTemplate = () => {
  // TODO: Implement template application
  console.log('Apply template')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
