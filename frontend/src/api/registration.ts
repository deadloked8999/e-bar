import axios from 'axios'

const API_BASE_URL = '/api'

export interface EstablishmentData {
  business_name: string
  business_type: string
  address: string
  registration_date: string
  owner_name: string
  owner_email: string
  owner_phone: string
}

export interface DocumentUploadData {
  document_group: string
  document_type: string
  document_name: string
  required: boolean
}

export const registrationApi = {
  async createEstablishment(data: EstablishmentData) {
    const response = await axios.post(`${API_BASE_URL}/establishments`, data)
    return response.data
  },

  async uploadDocument(establishmentId: number, file: File, docData: DocumentUploadData) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_group', docData.document_group)
    formData.append('document_type', docData.document_type)
    formData.append('document_name', docData.document_name)
    formData.append('required', docData.required.toString())

    const response = await axios.post(
      `${API_BASE_URL}/establishments/${establishmentId}/documents/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteDocument(establishmentId: number, documentId: number) {
    await axios.delete(`${API_BASE_URL}/establishments/${establishmentId}/documents/${documentId}`)
  },

  async getDocuments(establishmentId: number) {
    const response = await axios.get(`${API_BASE_URL}/establishments/${establishmentId}/documents`)
    return response.data
  },

  async submitEstablishment(establishmentId: number) {
    const response = await axios.post(`${API_BASE_URL}/establishments/${establishmentId}/submit`)
    return response.data
  },
}

