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
          <h3>{{ event.title }}</h3>
          <p class="event-date">{{ formatDate(event.date) }}</p>
          <div class="duty-count">
            {{ event.duties.length }} duties
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/services/api'

interface Props {
  events: Event[]
}

defineProps<Props>()

const emit = defineEmits<{
  'create-event': []
  'select-event': [event: Event]
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
