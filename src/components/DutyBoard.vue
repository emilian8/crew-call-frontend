<template>
  <div class="duty-board">
    <div class="header">
      <button class="back-btn" @click="$emit('back')">Back</button>
      <h1>{{ event?.title || 'Duty Board' }}</h1>
      <button class="btn btn-primary" @click="showAddDuty = true">Add Duty</button>
    </div>

    <div class="tabs">
      <button :class="['tab', currentTab === 'duties' ? 'active' : '']" @click="currentTab = 'duties'">Duties</button>
      <button :class="['tab', currentTab === 'members' ? 'active' : '']" @click="currentTab = 'members'">Members</button>
      <button :class="['tab', currentTab === 'archived' ? 'active' : '']" @click="currentTab = 'archived'">Archived</button>
    </div>

    <div v-if="currentTab === 'duties'" class="duty-board-content">
      <div v-if="dutyStore.error" class="error-message">
        <p>Error: {{ dutyStore.error }}</p>
        <button @click="dutyStore.setError(null)" class="btn btn-sm btn-secondary">Dismiss</button>
      </div>

      <div class="status-column">
        <h3>Status</h3>
        <div v-if="dutyStore.loading" class="loading-message"><p>Loading...</p></div>
        <div class="duties">
          <DutyItem
            v-for="duty in visibleDuties"
            :key="duty.id"
            :duty="duty"
            :member-options="memberUsers"
            @assign="handleAssign"
            @unassign="handleUnassign"
            @mark-done="handleMarkDone"
            @reopen="handleReopen"
            @archive="handleArchive"
            @delete="handleDelete"
            @edit="handleEdit"
          />
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-danger" @click="deleteCurrentEvent" v-if="props.event">Delete Event</button>
      </div>

      <DutyForm
        v-if="showAddDuty"
        :duty="null"
        :member-options="memberUsers"
        @save="handleAddDuty"
        @cancel="showAddDuty = false"
      />

      <DutyForm
        v-if="showEditDuty && editingDuty"
        :duty="editingDuty"
        :member-options="memberUsers"
        @save="handleUpdateDuty"
        @cancel="showEditDuty = false"
      />
    </div>

    <div v-else-if="currentTab === 'members'" class="members-content">
      <MembersPanel :event="props.event" />
    </div>

    <div v-else class="duty-board-content">
      <div class="status-column">
        <h3>Archived</h3>
        <div class="duties">
          <div v-if="archivedDuties.length === 0" class="loading-message"><p>No archived duties.</p></div>
          <DutyItem
            v-for="duty in archivedDuties"
            :key="duty.id"
            :duty="duty"
            :member-options="memberUsers"
            @assign="handleAssign"
            @unassign="handleUnassign"
            @mark-done="handleMarkDone"
            @reopen="handleReopen"
            @archive="handleArchive"
            @delete="handleDelete"
            @edit="handleEdit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDutyStore } from '@/stores/dutyStore'
import { useEventStore } from '@/stores/eventStore'
import MembersPanel from './MembersPanel2.vue'
import type { Duty } from '@/services/api'
import DutyItem from './DutyItem.vue'
import DutyForm from './DutyForm.vue'

interface Props { event: { id: string; title: string } | null }
const props = defineProps<Props>()
const emit = defineEmits<{ back: [] }>()

const dutyStore = useDutyStore()
const eventStore = useEventStore()
const currentTab = ref<'duties' | 'members' | 'archived'>('duties')
const showAddDuty = ref(false)
const showEditDuty = ref(false)
const editingDuty = ref<Duty | null>(null)

const memberUsers = computed(() => {
  if (!props.event) return [] as string[]
  const mem = eventStore.members[props.event.id] || []
  return mem.map(m => m.user)
})

onMounted(async () => { if (props.event) await eventStore.loadMembers(props.event.id) })
watch(() => props.event?.id, async (id) => { if (id) await eventStore.loadMembers(id) })

const visibleDuties = computed(() => {
  const _tick = dutyStore.archiveTick.value
  const duties = dutyStore.currentEventDuties
  if (!props.event) return duties
  return duties.filter(d => !dutyStore.isArchived(props.event!.id, d.id))
})

const archivedDuties = computed(() => {
  const _tick = dutyStore.archiveTick.value
  const duties = dutyStore.currentEventDuties
  if (!props.event) return [] as Duty[]
  return duties.filter(d => dutyStore.isArchived(props.event!.id, d.id))
})

const handleAssign = (dutyId: string, assignee: string) => { dutyStore.assignDuty(dutyId, assignee) }
const handleUnassign = (dutyId: string) => { dutyStore.unassignDuty(dutyId) }
const handleMarkDone = (dutyId: string) => { dutyStore.markDone(dutyId) }
const handleReopen = (dutyId: string) => { dutyStore.reOpen(dutyId) }
const handleArchive = (dutyId: string) => { dutyStore.archiveDuty(dutyId) }
const handleDelete = (dutyId: string) => { if (confirm('Are you sure you want to delete this duty?')) dutyStore.deleteDuty(dutyId) }
const handleEdit = (duty: Duty) => { editingDuty.value = duty; showEditDuty.value = true }
const handleAddDuty = (title: string, dueAt: string, assignee?: string) => {
  dutyStore.addDuty(title, dueAt, assignee)
  showAddDuty.value = false
}
const handleUpdateDuty = (title: string, dueAt: string, assignee?: string) => {
  if (editingDuty.value) {
    dutyStore.updateDuty(editingDuty.value.id, title, dueAt)
    showEditDuty.value = false
    editingDuty.value = null
  }
}

const deleteCurrentEvent = async () => {
  if (!props.event) return
  const role = eventStore.roles[props.event.id]
  if (role !== 'Organizer') { alert('Only organizers can delete events.'); return }
  if (!confirm(`Delete event "${props.event.title}"?`)) return
  await eventStore.deleteEvent(props.event.id)
  emit('back')
}
</script>

<style scoped>
.duty-board { padding: 1rem; max-width: 800px; margin: 0 auto; }
.header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.back-btn { background: none; border: none; font-size: 1rem; cursor: pointer; padding: 0.5rem; border-radius: 4px; transition: background-color 0.3s ease; }
.back-btn:hover { background-color: #f0f0f0; }
.header h1 { flex: 1; font-size: 1.5rem; font-weight: 600; color: #333; }
.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.btn-secondary { background: #f8f9fa; color: #333; border: 1px solid #e1e5e9; }
.btn-secondary:hover { background: #e9ecef; }
.btn-danger { background: #dc3545; color: #fff; border: none; }
.btn-danger:hover { filter: brightness(0.95); }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.tab { padding: 0.4rem 0.75rem; border: 1px solid #e1e5e9; background: #fff; border-radius: 6px; cursor: pointer; }
.tab.active { background: #eef2ff; border-color: #c7d2fe; }
.duty-board-content { margin-bottom: 2rem; }
.status-column h3 { font-size: 1.25rem; font-weight: 600; color: #333; margin-bottom: 1rem; }
.duties { display: flex; flex-direction: column; gap: 1rem; }
.actions { display: flex; justify-content: center; }
.error-message { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #f5c6cb; display: flex; justify-content: space-between; align-items: center; }
.error-message p { margin: 0; flex: 1; }
.loading-message { background: #d1ecf1; color: #0c5460; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #bee5eb; text-align: center; }
.loading-message p { margin: 0; }
</style>
