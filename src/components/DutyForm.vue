<template>
  <div class="modal-overlay" @click="$emit('cancel')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Duty' : 'Add Duty' }}</h3>
        <button class="close-btn" @click="$emit('cancel')">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="duty-form">
        <div class="form-group">
          <label for="title">Duty title:</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            class="form-control"
            placeholder="Enter duty title"
            required
          />
        </div>

        <div class="form-group">
          <label for="dueAt">Due date:</label>
          <input
            id="dueAt"
            v-model="formData.dueAt"
            type="datetime-local"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="assignee">Assign to:</label>
          <select
            id="assignee"
            v-model="formData.assignee"
            class="form-control"
          >
            <option value="">Event members</option>
            <option value="user-1">User 1</option>
            <option value="user-2">User 2</option>
            <option value="user-3">User 3</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Duty } from '@/services/api'

interface Props {
  duty: Duty | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [title: string, dueAt: string, assignee?: string]
  cancel: []
}>()

const isEditing = computed(() => props.duty !== null)

const formData = ref({
  title: '',
  dueAt: '',
  assignee: ''
})

const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' && formData.value.dueAt !== ''
})

// Initialize form data when duty prop changes
watch(() => props.duty, (newDuty) => {
  if (newDuty) {
    formData.value = {
      title: newDuty.title,
      dueAt: formatDateTimeLocal(newDuty.dueAt),
      assignee: newDuty.assignee || ''
    }
  } else {
    formData.value = {
      title: '',
      dueAt: '',
      assignee: ''
    }
  }
}, { immediate: true })

const formatDateTimeLocal = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const handleSubmit = () => {
  if (isFormValid.value) {
    const dueAt = new Date(formData.value.dueAt).toISOString()
    emit('save', formData.value.title, dueAt, formData.value.assignee || undefined)
  }
}
</script>

<style scoped>
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
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.duty-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e1e5e9;
}

.btn-secondary:hover {
  background: #e9ecef;
}
</style>
