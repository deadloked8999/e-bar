import axios from 'axios'
import { EstablishmentResponse } from './establishment'

const API_BASE_URL = '/api'

export const authApi = {
  async login(username: string, password: string): Promise<EstablishmentResponse> {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

