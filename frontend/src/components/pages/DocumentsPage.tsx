import { FileText, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Building } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'
import { useState, useEffect } from 'react'
import { documentsApi } from '../../api/documents'
import { Document } from '../../types/document'
import { DOCUMENT_BLOCKS } from '../../types/document'
import clsx from 'clsx'

interface DocumentsPageProps {
  establishment: EstablishmentResponse
}

export default function DocumentsPage({ establishment }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null)

  useEffect(() => {
    if (establishment.id) {
      documentsApi.getDocuments(establishment.id)
        .then((docs) => {
          setDocuments(docs)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error loading documents:', err)
          setLoading(false)
        })
    }
  }, [establishment.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Проверено'
      case 'pending':
        return 'На проверке'
      case 'rejected':
        return 'Отклонено'
      default:
        return 'Не загружено'
    }
  }

  const toggleBlock = (blockId: number) => {
    setSelectedBlock(selectedBlock === blockId ? null : blockId)
  }

  // Маппинг типов заведений на русский язык
  const getBusinessTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'bar': 'Бар',
      'restaurant': 'Ресторан',
      'club': 'Клуб',
      'hotel': 'Отель',
      'other': 'Другое'
    }
    return typeMap[type] || type
  }

  // Создаем Map для быстрого поиска документов по типу
  const documentsByType = new Map<string, Document>()
  documents.forEach(doc => {
    documentsByType.set(doc.document_type, doc)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 justify-start">
      {/* Блоки документов слева */}
      <div className="flex-1 space-y-2 max-w-[50%]">
        {/* Информация о заведении сверху */}
        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-4 border border-white/20 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <Building className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Информация ООО ХАСТЛЕР</h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-white/60 text-xs mb-0.5">
                {getBusinessTypeLabel(establishment.business_type).toUpperCase()}
              </p>
              <p className="text-white font-semibold text-sm">
                {establishment.business_name}
              </p>
            </div>
            {establishment.name && (
              <p className="text-white/80">
                <span className="text-cyan-300">Имя:</span> {establishment.name}
              </p>
            )}
            {establishment.address && (
              <p className="text-white/80">
                <span className="text-cyan-300">Адрес:</span> {establishment.address}
              </p>
            )}
            {(establishment as any).business_phone && (
              <p className="text-white/80">
                <span className="text-cyan-300">Телефон организации:</span> {(establishment as any).business_phone}
              </p>
            )}
            {(establishment as any).website && (
              <p className="text-white/80">
                <span className="text-cyan-300">Сайт:</span>{' '}
                <a 
                  href={(establishment as any).website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  {(establishment as any).website}
                </a>
              </p>
            )}
            {establishment.email && (
              <p className="text-white/80">
                <span className="text-cyan-300">Email:</span> {establishment.email}
              </p>
            )}
            <p className="text-white/80">
              <span className="text-cyan-300">ИНН:</span> {establishment.inn}
            </p>
            <p className="text-white/80">
              <span className="text-cyan-300">ОГРН:</span> {establishment.ogrn}
            </p>
          </div>
        </div>

        {/* Блоки документов (Юр. лицо будет последним) */}
        {DOCUMENT_BLOCKS.map((block) => {
          // Проверяем, все ли документы в блоке загружены
          const allDocumentsUploaded = block.documents.every(doc => {
            const document = documentsByType.get(doc.type)
            return document && document.uploaded && document.file_name
          })
          
          return (
            <div key={block.id} className="border border-white/20 rounded-ios overflow-hidden">
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{block.title}</span>
                  {allDocumentsUploaded && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
                {selectedBlock === block.id ? (
                  <ChevronUp className="w-4 h-4 text-cyan-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-cyan-300" />
                )}
              </button>

              {selectedBlock === block.id && (
                <div className="px-3 py-2 space-y-1 bg-white/5">
                  {block.documents.map((doc) => {
                    const document = documentsByType.get(doc.type)
                    const isUploaded = document && document.uploaded && document.file_name
                    
                    return (
                      <div
                        key={doc.type}
                        className={clsx(
                          'w-full text-left px-2 py-1.5 rounded-lg transition-all flex items-center justify-between',
                          'bg-white/10 hover:bg-white/20 text-white'
                        )}
                      >
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="font-medium text-sm truncate">{doc.label}</span>
                          {isUploaded && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        {document && (
                          <div className="ml-3 flex-shrink-0">
                            <p className={clsx(
                              'text-xs font-medium',
                              document.status === 'verified' ? 'text-green-400' :
                              document.status === 'rejected' ? 'text-red-400' :
                              'text-yellow-400'
                            )}>
                              {document.status === 'verified' ? 'Проверено' :
                               document.status === 'rejected' ? 'Отклонено' :
                               'На проверке'}
                            </p>
                          </div>
                        )}
                        {!document && (
                          <div className="ml-3 flex-shrink-0">
                            <p className="text-xs text-white/40">Не загружено</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }).sort((a, b) => {
          // Блок "Юр. лицо" (id: 1) должен быть последним
          if (a.id === 1) return 1
          if (b.id === 1) return -1
          return a.id - b.id
        })}
      </div>
    </div>
  )
}

