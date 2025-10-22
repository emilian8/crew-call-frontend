// API service for communicating with the backend
const API_BASE_URL = 'http://localhost:8000/api'

export interface Duty {
  id: string
  title: string
  dueAt: string
  status: 'Open' | 'Assigned' | 'Done'
  assignee?: string
  event: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  date: string
  duties: Duty[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to: ${API_BASE_URL}${endpoint}`)
      console.log('Request options:', options)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST', // All your backend endpoints are POST
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors', // Enable CORS
        credentials: 'omit', // Don't send cookies
        ...options,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        return { error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('Response data:', data)
      return { data }
    } catch (error) {
      console.error('Network error:', error)
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  // DutyRoster API endpoints
  async addDuty(event: string, actor: string, title: string, dueAt: string) {
    return this.request<{ duty: string }>('/DutyRoster/addDuty', {
      body: JSON.stringify({ event, actor, title, dueAt }),
    })
  }

  async assignDuty(duty: string, actor: string, assignee: string) {
    return this.request<{}>('/DutyRoster/assignDuty', {
      body: JSON.stringify({ duty, actor, assignee }),
    })
  }

  async unassignDuty(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/unassignDuty', {
      body: JSON.stringify({ duty, actor }),
    })
  }

  async updateDuty(duty: string, actor: string, title?: string, dueAt?: string) {
    return this.request<{}>('/DutyRoster/updateDuty', {
      body: JSON.stringify({ duty, actor, title, dueAt }),
    })
  }

  async markDone(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/markDone', {
      body: JSON.stringify({ duty, actor }),
    })
  }

  async reOpen(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/reOpen', {
      body: JSON.stringify({ duty, actor }),
    })
  }

  async deleteDuty(duty: string, actor: string) {
    return this.request<{}>('/DutyRoster/deleteDuty', {
      body: JSON.stringify({ duty, actor }),
    })
  }
}

export const apiService = new ApiService()
