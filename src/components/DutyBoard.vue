<template>
  <div class="duty-board">
    <div class="header">
      <button class="back-btn" @click="$emit('back')">
        ←
      </button>
      <h1>{{ event?.title || 'Duty Board' }}</h1>
      <button class="btn btn-primary" @click="showAddDuty = true">
        Add Duty
      </button>
    </div>

    <div class="duty-board-content">
      <!-- Error Display -->
      <div v-if="dutyStore.error" class="error-message">
        <p>Error: {{ dutyStore.error }}</p>
        <button @click="dutyStore.setError(null)" class="btn btn-sm btn-secondary">Dismiss</button>
      </div>

      <div class="status-column">
        <h3>Status</h3>
        <div v-if="dutyStore.loading" class="loading-message">
          <p>Loading...</p>
        </div>
        <div class="duties">
          <DutyItem
            v-for="duty in allDuties"
            :key="duty.id"
            :duty="duty"
            @assign="handleAssign"
            @unassign="handleUnassign"
            @mark-done="handleMarkDone"
            @reopen="handleReopen"
            @delete="handleDelete"
            @edit="handleEdit"
          />
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="$emit('apply-template')">
        Apply Template
      </button>
    </div>

    <!-- Add Duty Modal -->
    <DutyForm
      v-if="showAddDuty"
      :duty="null"
      @save="handleAddDuty"
      @cancel="showAddDuty = false"
    />

    <!-- Edit Duty Modal -->
    <DutyForm
      v-if="showEditDuty && editingDuty"
      :duty="editingDuty"
      @save="handleUpdateDuty"
      @cancel="showEditDuty = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDutyStore } from '@/stores/dutyStore'
import type { Duty } from '@/services/api'
import DutyItem from './DutyItem.vue'
import DutyForm from './DutyForm.vue'

interface Props {
  event: { id: string; title: string } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  back: []
  'apply-template': []
}>()

const dutyStore = useDutyStore()
const showAddDuty = ref(false)
const showEditDuty = ref(false)
const editingDuty = ref<Duty | null>(null)

const allDuties = computed(() => {
  const duties = dutyStore.currentEventDuties
  console.log('Current duties:', duties)
  return duties
})

const handleAssign = (dutyId: string, assignee: string) => {
  dutyStore.assignDuty(dutyId, assignee)
}

const handleUnassign = (dutyId: string) => {
  dutyStore.unassignDuty(dutyId)
}

const handleMarkDone = (dutyId: string) => {
  dutyStore.markDone(dutyId)
}

const handleReopen = (dutyId: string) => {
  dutyStore.reOpen(dutyId)
}

const handleDelete = (dutyId: string) => {
  if (confirm('Are you sure you want to delete this duty?')) {
    dutyStore.deleteDuty(dutyId)
  }
}

const handleEdit = (duty: Duty) => {
  editingDuty.value = duty
  showEditDuty.value = true
}

const handleAddDuty = (title: string, dueAt: string) => {
  console.log('Adding duty:', { title, dueAt })
  dutyStore.addDuty(title, dueAt)
  showAddDuty.value = false
}

const handleUpdateDuty = (title: string, dueAt: string) => {
  if (editingDuty.value) {
    dutyStore.updateDuty(editingDuty.value.id, title, dueAt)
    showEditDuty.value = false
    editingDuty.value = null
  }
}
</script>

<style scoped>
.duty-board {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.header h1 {
  flex: 1;
  font-size: 1.5rem;
  font-weight: 600;
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

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e1e5e9;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.duty-board-content {
  margin-bottom: 2rem;
}

.status-column h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.duties {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions {
  display: flex;
  justify-content: center;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message p {
  margin: 0;
  flex: 1;
}

.loading-message {
  background: #d1ecf1;
  color: #0c5460;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #bee5eb;
  text-align: center;
}

.loading-message p {
  margin: 0;
}
</style>
