import axios from 'axios'
import { Document, DocumentStats, DocumentStatus } from '../types/document'

const API_BASE_URL = '/api'

export const documentsApi = {
  async uploadDocument(file: File, documentType: string, establishmentId: number): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    formData.append('establishment_id', establishmentId.toString())

    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getDocuments(establishmentId: number): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents`, {
      params: { establishment_id: establishmentId }
    })
    return response.data.documents
  },

  async getDocument(id: number): Promise<Document> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`)
    return response.data
  },

  async verifyDocument(id: number, status: DocumentStatus): Promise<Document> {
    const formData = new FormData()
    formData.append('status', status)

    const response = await axios.post(`${API_BASE_URL}/documents/${id}/verify`, formData)
    return response.data
  },

  async deleteDocument(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${id}`)
  },

  async getStatistics(establishmentId: number): Promise<DocumentStats> {
    const response = await axios.get(`${API_BASE_URL}/documents/stats`, {
      params: { establishment_id: establishmentId }
    })
    return response.data
  },

  async updateDocumentStatus(
    id: number,
    verification_status?: string,
    expiry_date?: string
  ): Promise<Document> {
    const formData = new FormData()
    if (verification_status) {
      formData.append('verification_status', verification_status)
    }
    if (expiry_date) {
      formData.append('expiry_date', expiry_date)
    }

    const response = await axios.put(`${API_BASE_URL}/documents/${id}/status`, formData)
    return response.data
  },
}

