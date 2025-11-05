<template>
  <div class="event-list">
    <div class="header">
      <h1>CrewCall</h1>
      <button class="btn btn-primary" @click="$emit('create-event')">
        + New Event
      </button>
    </div>

    <div class="section">
      <h2>Upcoming Events</h2>
      <div class="events">
        <div
          v-for="event in events"
          :key="event.id"
          class="event-card"
          @click="$emit('select-event', event)"
        >
          <div class="card-header">
            <h3>{{ event.title }}</h3>
            <span
              v-if="auth.userId"
              class="badge"
              :title="`Your role: ${eventStore.roles[event.id] || 'Member'}`"
            >
              {{ auth.userId }}
            </span>
            <button
              v-if="eventStore.roles[event.id] === 'Organizer'"
              class="btn btn-danger btn-sm"
              title="Delete event"
              @click.stop="$emit('delete-event', event.id)"
            >
              Delete
            </button>
          </div>
          <p class="event-date">{{ formatDate(event.startsAt) }} → {{ formatDate(event.endsAt) }}</p>
          <div class="duty-count">
            {{ event.active ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/services/api'
import { useEventStore } from '@/stores/eventStore'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  events: Event[]
}

defineProps<Props>()
const eventStore = useEventStore()
const auth = useAuthStore()

const emit = defineEmits<{
  'create-event': []
  'select-event': [event: Event],
  'delete-event': [id: string]
}>()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.event-list {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.events {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.event-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.event-date {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.duty-count {
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
.btn-danger { background: #dc3545; color: #fff; border: none; }
.btn-danger:hover { filter: brightness(0.95); }
.badge { background:#eef2ff; color:#334155; border:1px solid #c7d2fe; border-radius:12px; padding:.2rem .5rem; font-size:.8rem; }
