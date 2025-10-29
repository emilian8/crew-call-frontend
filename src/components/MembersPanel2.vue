<template>
  <div class="members-panel">
    <div class="header">
      <h3>Members</h3>
      <small v-if="role">Your role: {{ role }}</small>
    </div>

    <div v-if="eventStore.loading" class="loading">Loading members...</div>
    <div v-if="eventStore.error" class="error">{{ eventStore.error }}</div>

    <div class="list">
      <div class="list-header">
        <div>User</div>
        <div>Role</div>
        <div class="num">Assigned</div>
        <div class="num">Done</div>
        <div class="actions-col">Actions</div>
      </div>
      <div v-for="row in rows" :key="row.user" class="list-row">
        <div class="mono">{{ row.user }}</div>
        <div>{{ row.role || '—' }}</div>
        <div class="num">{{ row.assigned }}</div>
        <div class="num">{{ row.done }}</div>
        <div class="actions-col">
          <template v-if="canManage">
            <button v-if="!row.role" class="btn btn-sm" @click="invite(row.user)">Add</button>
            <button v-else class="btn btn-sm btn-danger" @click="remove(row.user)">Remove</button>
          </template>
        </div>
      </div>
      <div v-if="rows.length === 0" class="empty">No members yet.</div>
    </div>

    <div v-if="canManage" class="invite">
      <h4>Add Member</h4>
      <div class="invite-row">
        <input v-model="inviteUser" placeholder="User ID" />
        <select v-model="inviteRole">
          <option value="DutyMember">DutyMember</option>
          <option value="Organizer">Organizer</option>
        </select>
        <button class="btn btn-primary" @click="submitInvite">Add</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useDutyStore } from '@/stores/dutyStore'

interface Props { event: { id: string; title: string } | null }
const props = defineProps<Props>()

const eventStore = useEventStore()
const dutyStore = useDutyStore()

const role = computed(() => props.event ? eventStore.roles[props.event.id] : undefined)
const canManage = computed(() => role.value === 'Organizer')

const inviteUser = ref('')
const inviteRole = ref<'Organizer' | 'DutyMember'>('DutyMember')

const members = computed(() => props.event ? (eventStore.members[props.event.id] || []) : [])
const dutyAgg = computed(() => {
  const map: Record<string, { assigned: number; done: number }> = {}
  const list = dutyStore.currentEventDuties
  for (const d of list) {
    const user = d.assignee || ''
    if (!user) continue
    if (!map[user]) map[user] = { assigned: 0, done: 0 }
    if (d.status === 'Assigned') map[user].assigned += 1
    if (d.status === 'Done') map[user].done += 1
  }
  return map
})

const rows = computed(() => {
  if (!props.event) return [] as Array<{ user: string; role?: string; assigned: number; done: number }>
  const set = new Set<string>()
  const out: Array<{ user: string; role?: string; assigned: number; done: number }> = []
  for (const m of members.value) {
    set.add(m.user)
    const agg = dutyAgg.value[m.user] || { assigned: 0, done: 0 }
    out.push({ user: m.user, role: m.role, assigned: agg.assigned, done: agg.done })
  }
  for (const user of Object.keys(dutyAgg.value)) {
    if (set.has(user)) continue
    const agg = dutyAgg.value[user]
    out.push({ user, role: undefined, assigned: agg.assigned, done: agg.done })
  }
  out.sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done
    return a.assigned - b.assigned
  })
  return out
})

onMounted(async () => {
  if (props.event) await eventStore.loadMembers(props.event.id)
})

watch(() => props.event?.id, async (id) => {
  if (id) await eventStore.loadMembers(id)
})

async function invite(user: string) {
  if (!props.event) return
  await eventStore.inviteMember(props.event.id, user, 'DutyMember')
}

async function remove(user: string) {
  if (!props.event) return
  await eventStore.removeMember(props.event.id, user)
}

async function submitInvite() {
  if (!props.event || !inviteUser.value.trim()) return
  await eventStore.inviteMember(props.event.id, inviteUser.value.trim(), inviteRole.value)
  inviteUser.value = ''
}
</script>

<style scoped>
.members-panel { display: flex; flex-direction: column; gap: 1rem; }
.header { display: flex; align-items: baseline; gap: 1rem; }
.loading { color: #555; }
.error { color: #b00020; }
.list { border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden; }
.list-header, .list-row { display: grid; grid-template-columns: 1fr 120px 100px 100px 160px; gap: 0.5rem; padding: 0.5rem 0.75rem; align-items: center; }
.list-header { background: #f8f9fa; font-weight: 600; }
.list-row:nth-child(odd) { background: #fcfcfd; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.9rem; }
.actions-col { display: flex; gap: 0.5rem; justify-content: flex-end; }
.empty { padding: 0.75rem; color: #666; }
.invite { border-top: 1px dashed #e1e5e9; padding-top: 0.75rem; }
.invite-row { display: flex; gap: 0.5rem; }
input, select { padding: 0.5rem; border: 1px solid #ccd; border-radius: 6px; }
.btn { padding: 0.4rem 0.75rem; border: 1px solid #ccd; border-radius: 6px; background: #f8f9fa; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; }
.btn-danger { background: #dc3545; color: white; border: none; }
</style>

