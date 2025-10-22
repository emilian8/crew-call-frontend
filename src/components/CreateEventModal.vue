<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <h2>Create New Event</h2>
      <form @submit.prevent="submit">
        <div class="form-row">
          <label for="title">Title</label>
          <input id="title" v-model="title" type="text" required placeholder="e.g., Saturday Cleaning" />
        </div>

        <div class="form-grid">
          <div>
            <label>Start Date</label>
            <select v-model="startDate">
              <option v-for="d in dateOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
            </select>
          </div>
          <div>
            <label>Start Time</label>
            <select v-model="startTime">
              <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div>
            <label>End Date</label>
            <select v-model="endDate">
              <option v-for="d in dateOptions" :key="'e-'+d.value" :value="d.value">{{ d.label }}</option>
            </select>
          </div>
          <div>
            <label>End Time</label>
            <select v-model="endTime">
              <option v-for="t in timeOptions" :key="'e-'+t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div v-if="validationError" class="error">{{ validationError }}</div>

        <div class="actions">
          <button type="button" class="btn" @click="$emit('cancel')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{ save: [title: string, startsAtISO: string, endsAtISO: string]; cancel: [] }>()

const title = ref('')
const startDate = ref('')
const startTime = ref('09:00')
const endDate = ref('')
const endTime = ref('10:00')

type DateOption = { value: string; label: string }
const dateOptions = ref<DateOption[]>([])
const timeOptions = ref<string[]>([])

function buildDateOptions(days = 14): DateOption[] {
  const out: DateOption[] = []
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const value = d.toISOString().slice(0, 10) // YYYY-MM-DD
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    out.push({ value, label })
  }
  return out
}

function buildTimeOptions(stepMinutes = 30): string[] {
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      out.push(`${hh}:${mm}`)
    }
  }
  return out
}

onMounted(() => {
  dateOptions.value = buildDateOptions()
  timeOptions.value = buildTimeOptions(30)
  const today = dateOptions.value[0]?.value || ''
  startDate.value = today
  endDate.value = today
})

const validationError = computed(() => {
  const s = toISO(startDate.value, startTime.value)
  const e = toISO(endDate.value, endTime.value)
  if (!s || !e) return 'Please select valid dates and times.'
  if (new Date(s).getTime() >= new Date(e).getTime()) return 'End must be after start.'
  if (!title.value.trim()) return 'Please enter a title.'
  return ''
})

function toISO(dateYYYYMMDD: string, timeHHMM: string): string | null {
  if (!dateYYYYMMDD || !timeHHMM) return null
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number)
  const [hh, mm] = timeHHMM.split(':').map(Number)
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null
  const dt = new Date(Date.UTC(y, (m - 1), d, hh, mm, 0))
  return dt.toISOString()
}

function submit() {
  if (validationError.value) return
  const startsAtISO = toISO(startDate.value, startTime.value)!
  const endsAtISO = toISO(endDate.value, endTime.value)!
  emit('save', title.value.trim(), startsAtISO, endsAtISO)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 520px;
  max-width: calc(100vw - 2rem);
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
h2 { margin: 0 0 1rem 0; }
.form-row { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
label { font-weight: 600; color: #333; }
input, select { padding: 0.5rem; border: 1px solid #ccd; border-radius: 6px; }
.actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
.btn { padding: 0.5rem 1rem; border: 1px solid #ccd; border-radius: 8px; background: #f8f9fa; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; }
.error { color: #b00020; margin-top: 0.5rem; }
</style>

