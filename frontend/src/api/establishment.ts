import axios from 'axios'
import { UserData } from '../components/UserRegistration'

const API_BASE_URL = '/api'

export interface EstablishmentResponse {
  id: number
  name: string
  username: string
  position: string
  phone: string
  email: string
  business_name: string
  business_type: string
  business_phone?: string
  website?: string
  logo_path?: string
  address: string
  inn: string
  ogrn: string
  status: string
  created_at: string
}

export const establishmentApi = {
  async createEstablishment(userData: UserData): Promise<EstablishmentResponse> {
    const response = await axios.post(`${API_BASE_URL}/establishments`, {
      name: userData.name,
      username: userData.username,
      password: userData.password,
      position: userData.position,
      phone: userData.phone,
      email: userData.email,
      business_name: userData.establishmentName,
      business_type: userData.establishmentType,
      address: userData.address,
      inn: userData.inn,
      ogrn: userData.ogrn,
    })
    return response.data
  },

  async getEstablishment(id: number): Promise<EstablishmentResponse> {
    const response = await axios.get(`${API_BASE_URL}/establishments/${id}`)
    return response.data
  },

  async updateEstablishment(id: number, data: Partial<EstablishmentResponse>): Promise<EstablishmentResponse> {
    const response = await axios.put(`${API_BASE_URL}/establishments/${id}`, data)
    return response.data
  },
}

