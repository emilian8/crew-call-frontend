<template>
  <div class="duty-item" :class="statusClass">
    <div class="duty-content">
      <h4 class="duty-title">{{ duty.title }}</h4>
      <p class="duty-due">Due: {{ formatDate(duty.dueAt) }}</p>
      <div v-if="duty.assignee" class="duty-assignee">
        Assigned to: {{ duty.assignee }}
      </div>
    </div>

    <div class="duty-actions">
      <div v-if="duty.status === 'Open'" class="action-buttons">
        <button class="btn btn-sm btn-primary" @click="showAssignModal = true">
          Assign
        </button>
        <button class="btn btn-sm btn-success" @click="$emit('mark-done', duty.id)">
          Mark Done
        </button>
        <button class="btn btn-sm btn-secondary" @click="$emit('edit', duty)">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" @click="$emit('delete', duty.id)">
          Delete
        </button>
      </div>

      <div v-else-if="duty.status === 'Assigned'" class="action-buttons">
        <button class="btn btn-sm btn-warning" @click="$emit('unassign', duty.id)">
          Unassign
        </button>
        <button class="btn btn-sm btn-success" @click="$emit('mark-done', duty.id)">
          Mark Done
        </button>
        <button class="btn btn-sm btn-secondary" @click="$emit('edit', duty)">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" @click="$emit('delete', duty.id)">
          Delete
        </button>
      </div>

      <div v-else-if="duty.status === 'Done'" class="action-buttons">
        <button class="btn btn-sm btn-info" @click="$emit('reopen', duty.id)">
          Reopen
        </button>
        <button class="btn btn-sm btn-secondary" @click="$emit('edit', duty)">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" @click="$emit('delete', duty.id)">
          Delete
        </button>
      </div>
    </div>

    <!-- Assign Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click="showAssignModal = false">
      <div class="modal" @click.stop>
        <h3>Assign Duty</h3>
        <div class="form-group">
          <label>Assign to:</label>
          <select v-model="selectedAssignee" class="form-control">
            <option value="">Select assignee</option>
            <option value="user-1">User 1</option>
            <option value="user-2">User 2</option>
            <option value="user-3">User 3</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="handleAssign" :disabled="!selectedAssignee">
            Assign
          </button>
          <button class="btn btn-secondary" @click="showAssignModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Duty } from '@/services/api'

interface Props {
  duty: Duty
}

const props = defineProps<Props>()

const emit = defineEmits<{
  assign: [dutyId: string, assignee: string]
  unassign: [dutyId: string]
  'mark-done': [dutyId: string]
  reopen: [dutyId: string]
  delete: [dutyId: string]
  edit: [duty: Duty]
}>()

const showAssignModal = ref(false)
const selectedAssignee = ref('')

const statusClass = computed(() => {
  return `status-${props.duty.status.toLowerCase()}`
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const handleAssign = () => {
  if (selectedAssignee.value) {
    emit('assign', props.duty.id, selectedAssignee.value)
    showAssignModal.value = false
    selectedAssignee.value = ''
  }
}
</script>

<style scoped>
.duty-item {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.duty-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-open {
  border-left: 4px solid #f39c12;
}

.status-assigned {
  border-left: 4px solid #3498db;
}

.status-done {
  border-left: 4px solid #27ae60;
  opacity: 0.8;
}

.duty-content {
  flex: 1;
}

.duty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.duty-due {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.duty-assignee {
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 500;
}

.duty-actions {
  margin-left: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
