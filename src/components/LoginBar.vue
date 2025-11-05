<template>
  <div class="loginbar">
    <template v-if="!auth.isAuthed">
      <div class="tabs">
        <button :class="['tab', mode==='login' && 'active']" @click="mode='login'">Log In</button>
        <button :class="['tab', mode==='register' && 'active']" @click="mode='register'">Create Account</button>
      </div>
      <form class="row" @submit.prevent="onSubmit">
        <input v-model="email" type="email" placeholder="email" required />
        <input v-model="pw" type="password" placeholder="password" required />
        <button class="btn btn-primary" :disabled="auth.loading">{{ mode==='login' ? 'Log In' : 'Create' }}</button>
      </form>
      <div v-if="auth.error" class="err">{{ auth.error }}</div>
      <div v-if="auth.success" class="ok">{{ auth.success }}</div>
    </template>
    <template v-else>
      <div class="row">
        <span class="who">{{ auth.userId }}</span>
        <button class="btn" @click="auth.logout">Logout</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const email = ref('')
const pw = ref('')
const mode = ref<'login'|'register'>('login')

const onSubmit = async () => {
  if (mode.value === 'login') {
    await auth.login(email.value, pw.value)
  } else {
    const ok = await auth.register(email.value, pw.value)
    if (ok) {
      // Switch to login mode; keep email filled to help user log in
      mode.value = 'login'
    }
  }
  if (!auth.error) { email.value = ''; pw.value = '' }
}
</script>

<style scoped>
.loginbar { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem 0; }
.row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
input { padding: .5rem; border: 1px solid #ccd; border-radius: 6px; }
.btn { padding: .5rem .75rem; border: 1px solid #ccd; border-radius: 6px; background: #f8f9fa; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border: none; }
.who { font-weight: 600; }
.err { color: #b00020; font-size: .9rem; }
.ok { color: #0d6b2f; font-size: .9rem; }
.tabs { display:flex; gap:.5rem; margin-bottom:.5rem; }
.tab { background:#fff; border:1px solid #ccd; border-radius:6px; padding:.4rem .75rem; cursor:pointer; }
.tab.active { background:#eef2ff; border-color:#c7d2fe; color:#334155; }
</style>
