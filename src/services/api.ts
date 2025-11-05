// api.ts

// Prefer env var (e.g., VITE_API_BASE_URL="https://api.example.com/api"),
// otherwise default to same-origin "/api" (use your host's reverse proxy).
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export interface Duty { id: string; title: string; dueAt: string; status: 'Open' | 'Assigned' | 'Done'; assignee?: string | null; event: string; updatedAt: string }
export interface Event { id: string; title: string; startsAt: string; endsAt: string; active: boolean; duties?: Duty[] }
export interface Member { user: string; role: 'Organizer' | 'DutyMember' }
export interface Template { id: string; owner: string; title: string; members: string[]; standardDuties: string[]; createdAt: string; updatedAt: string }
export interface NotificationItem { id: string; recipient: string; subject: string; body: string; createdAt: string; unread: boolean }
export interface ApiResponse<T> { data?: T; error?: string }

class ApiService {
  private getToken(): string | undefined {
    try { return localStorage.getItem('crewcall_token') || undefined } catch { return undefined }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
        mode: 'cors',
        credentials: 'omit',
        ...options,
      })
      if (!response.ok) { return { error: `HTTP ${response.status}: ${await response.text()}` } }
      const data = await response.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' && (data as any).error.length > 0) {
        return { error: (data as any).error }
      }
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  // -------------------- DutyRoster --------------------
  async addDuty(event: string, actor: string, title: string, dueAt: string) {
    return this.request<{ duty: string }>('/DutyRoster/addDuty', { body: JSON.stringify({ token: this.getToken(), event, actor, title, dueAt }) })
  }
  async assignDuty(duty: string, actor: string, assignee: string) {
    return this.request<{}>('/DutyRoster/assignDuty', { body: JSON.stringify({ token: this.getToken(), duty, actor, assignee }) })
  }
  async unassignDuty(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/unassignDuty', { body: JSON.stringify({ token: this.getToken(), duty, actor }) })
  }
  async updateDuty(duty: string, actor: string, title?: string, dueAt?: string) {
    return this.request<{}>('/DutyRoster/updateDuty', { body: JSON.stringify({ token: this.getToken(), duty, actor, title, dueAt }) })
  }
  async markDone(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/markDone', { body: JSON.stringify({ token: this.getToken(), duty, actor }) })
  }
  async reOpen(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/reOpen', { body: JSON.stringify({ token: this.getToken(), duty, actor }) })
  }
  async deleteDuty(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/deleteDuty', { body: JSON.stringify({ token: this.getToken(), duty, actor }) })
  }
  async getEventDuties(event: string) {
    return this.request<any>('/DutyRoster/_getEventDuties', { body: JSON.stringify({ event }) })
  }

  // -------------------- EventDirectory --------------------
  async createEvent(creator: string, title: string, startsAt: string, endsAt: string) {
    return this.request<{ event: string }>('/EventDirectory/createEvent', {
      body: JSON.stringify({ token: this.getToken(), creator, title, startsAt: { $date: startsAt }, endsAt: { $date: endsAt } }),
    })
  }
  async invite(event: string, inviter: string, invitee: string, role: 'Organizer' | 'DutyMember') {
    return this.request<{}>('/EventDirectory/invite', { body: JSON.stringify({ token: this.getToken(), event, inviter, invitee, role }) })
  }
  async setActive(event: string, setter: string, flag: boolean) {
    return this.request<{}>('/EventDirectory/setActive', { body: JSON.stringify({ token: this.getToken(), event, setter, flag }) })
  }
  async removeMember(event: string, actor: string, member: string) {
    return this.request<{}>('/EventDirectory/removeMember', { body: JSON.stringify({ token: this.getToken(), event, actor, member }) })
  }
  async deleteEvent(event: string, actor: string) {
    return this.request<{}>('/EventDirectory/deleteEvent', { body: JSON.stringify({ token: this.getToken(), event, actor }) })
  }
  async getEvent(event: string) {
    return this.request<any>('/EventDirectory/_getEvent', { body: JSON.stringify({ event }) })
  }
  async getEventMembers(event: string) {
    return this.request<Array<Member>>('/EventDirectory/_getEventMembers', { body: JSON.stringify({ event }) })
  }
  async getUserEvents(user: string) {
    return this.request<Array<{ event: string; role: 'Organizer' | 'DutyMember' }>>('/EventDirectory/_getUserEvents', { body: JSON.stringify({ user }) })
  }

  // -------------------- RotationGroups --------------------
  async listTemplates(owner: string) {
    return this.request<Template[]>('/RotationGroups/_listTemplatesByOwner', { body: JSON.stringify({ owner }) })
  }
  async createTemplate(owner: string, title: string, members: string[], standardDuties: string[]) {
    return this.request<{ template: string }>('/RotationGroups/createTemplate', { body: JSON.stringify({ owner, title, members, standardDuties }) })
  }
  async updateTemplate(template: string, actor: string, payload: { title?: string; members?: string[]; standardDuties?: string[] }) {
    return this.request<{}>('/RotationGroups/updateTemplate', { body: JSON.stringify({ template, actor, ...payload }) })
  }
  async deleteTemplate(template: string, actor: string) {
    return this.request<{}>('/RotationGroups/deleteTemplate', { body: JSON.stringify({ template, actor }) })
  }
  async applyTemplate(template: string, event: string, actor: string) {
    return this.request<{ application: string; dutiesEmitted: number }>('/RotationGroups/applyTemplate', { body: JSON.stringify({ template, event, actor }) })
  }
  async getAppliedDutiesForApplication(application: string) {
    return this.request<any[]>('/RotationGroups/_getAppliedDutiesForApplication', { body: JSON.stringify({ application }) })
  }

  // -------------------- Notify --------------------
  async listUserNotifications(user: string, onlyUnread = false) {
    return this.request<any[]>('/Notify/_listUserNotifications', { body: JSON.stringify({ user, onlyUnread }) })
  }
  async notify(recipient: string, subject: string, bodyText: string) {
    return this.request<{ notification: string }>('/Notify/notify', { body: JSON.stringify({ recipient, subject, body: bodyText }) })
  }
  async markRead(notification: string, user: string) {
    return this.request<{}>('/Notify/markRead', { body: JSON.stringify({ notification, user }) })
  }
  async deleteNotification(notification: string, user: string) {
    return this.request<{}>('/Notify/deleteNotification', { body: JSON.stringify({ notification, user }) })
  }

  // -------------------- Auth --------------------
  async login(email: string, pw: string) {
    return this.request<{ token: string; userId: string }>('/Auth/login', { body: JSON.stringify({ email, pw }) })
  }
  async createAccount(email: string, pw: string) {
    return this.request<{ created: boolean; message?: string }>('/Auth/createAccount', { body: JSON.stringify({ email, pw }) })
  }
}

export const apiService = new ApiService()
