import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Create app
const app = createApp(App)

// Use plugins
app.use(createPinia())

// Mount app
app.mount('#app')
