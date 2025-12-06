import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Check, X, Clock, Trash2, AlertCircle } from 'lucide-react'
import { documentsApi } from '../api/documents'
import { Document, DocumentStatus } from '../types/document'
import { DOCUMENT_BLOCKS } from '../types/document'
import clsx from 'clsx'

interface Props {
  onDocumentChange: () => void
}

export default function DocumentList({ onDocumentChange }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getDocuments,
  })

  const handleVerify = async (id: string, status: DocumentStatus) => {
    try {
      await documentsApi.verifyDocument(id, status)
      onDocumentChange()
    } catch (err) {
      console.error('Error verifying document:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return

    setDeletingId(id)
    try {
      await documentsApi.deleteDocument(id)
      onDocumentChange()
    } catch (err) {
      console.error('Error deleting document:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const getDocumentLabel = (type: string) => {
    for (const block of DOCUMENT_BLOCKS) {
      const doc = block.documents.find(d => d.type === type)
      if (doc) return doc.label
    }
    return type
  }

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return <Check className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <X className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return 'Проверен'
      case 'rejected':
        return 'Отклонен'
      case 'pending':
        return 'На проверке'
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-ios-lg shadow-ios p-6">
        <h2 className="text-2xl font-semibold text-ios-gray-900 mb-6">
          Загруженные документы
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-ios-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-ios-lg shadow-ios p-6">
        <h2 className="text-2xl font-semibold text-ios-gray-900 mb-6">
          Загруженные документы
        </h2>
        <div className="flex items-center gap-3 p-4 bg-ios-red/10 border border-ios-red/20 rounded-ios">
          <AlertCircle className="w-5 h-5 text-ios-red" />
          <p className="text-ios-red">Ошибка загрузки документов</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-ios-lg shadow-ios p-6">
      <h2 className="text-2xl font-semibold text-ios-gray-900 mb-6">
        Загруженные документы
        <span className="ml-3 text-lg font-normal text-ios-gray-500">
          ({documents.length})
        </span>
      </h2>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-ios-gray-300 mx-auto mb-4" />
          <p className="text-ios-gray-500">Документы еще не загружены</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          <AnimatePresence>
            {documents.map((doc: Document) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={clsx(
                  'border border-ios-gray-200 rounded-ios p-4 hover:shadow-md transition-shadow',
                  deletingId === doc.id && 'opacity-50'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-ios-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-ios-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ios-gray-900 truncate">
                        {getDocumentLabel(doc.document_type)}
                      </h3>
                      <p className="text-sm text-ios-gray-500 truncate">{doc.filename}</p>
                      <p className="text-xs text-ios-gray-400 mt-1">
                        {new Date(doc.uploaded_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-ios-gray-400 hover:text-ios-red transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
                    getStatusColor(doc.status)
                  )}>
                    {getStatusIcon(doc.status)}
                    {getStatusLabel(doc.status)}
                  </div>

                  {doc.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(doc.id, 'verified')}
                        className="px-4 py-2 bg-ios-green text-white rounded-lg text-sm font-medium hover:bg-ios-green/90 transition-colors"
                      >
                        Принять
                      </button>
                      <button
                        onClick={() => handleVerify(doc.id, 'rejected')}
                        className="px-4 py-2 bg-ios-red text-white rounded-lg text-sm font-medium hover:bg-ios-red/90 transition-colors"
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

