import { FileText, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Building, Copy, Mail, Check, AlertTriangle, Upload, X } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'
import { useState, useEffect } from 'react'
import { documentsApi } from '../../api/documents'
import { Document, VerificationStatus } from '../../types/document'
import { DOCUMENT_BLOCKS } from '../../types/document'
import clsx from 'clsx'
import { useDropzone } from 'react-dropzone'
import CustomSelect from '../CustomSelect'

interface BankAccount {
  id: number
  bankName: string
  accountNumber: string
  bik: string
  correspondentAccount: string
}

interface DocumentsPageProps {
  establishment: EstablishmentResponse
}

const bankAccounts: BankAccount[] = [
  {
    id: 1,
    bankName: 'Сбербанк',
    accountNumber: '40702810123456789012',
    bik: '044525225',
    correspondentAccount: '30101810400000000225'
  },
  {
    id: 2,
    bankName: 'Т-банк',
    accountNumber: '40702810567890123456',
    bik: '044525187',
    correspondentAccount: '30101810100000000187'
  },
  {
    id: 3,
    bankName: 'ПСБ',
    accountNumber: '40702810987654321098',
    bik: '044525823',
    correspondentAccount: '30101810800000000823'
  },
  {
    id: 4,
    bankName: 'Альфа-банк',
    accountNumber: '40702810111213141516',
    bik: '044525593',
    correspondentAccount: '30101810200000000593'
  },
  {
    id: 5,
    bankName: 'УзПромСтрой Банк',
    accountNumber: '40702810222334455667',
    bik: '000816777',
    correspondentAccount: '30101810000000000167'
  }
]

export default function DocumentsPage({ establishment }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedBank, setSelectedBank] = useState<BankAccount>(bankAccounts[0])
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [documentToUpdate, setDocumentToUpdate] = useState<Document | null>(null)
  const [uploading, setUploading] = useState(false)

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

  const getOldStatusText = (status: string) => {
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

  // Функция для получения статуса документа
  const getVerificationStatus = (document: Document | undefined): VerificationStatus => {
    if (!document) return 'verified'
    return document.verification_status || 'verified'
  }

  // Функция для получения текста статуса
  const getStatusText = (document: Document | undefined): string => {
    const status = getVerificationStatus(document)
    switch (status) {
      case 'verified':
        return 'Проверено'
      case 'update_required':
        return 'Обновить'
      case 'update_by_date':
        if (document?.expiry_date) {
          const expiryDate = new Date(document.expiry_date)
          return `Обновить до ${expiryDate.toLocaleDateString('ru-RU')}`
        }
        return 'Обновить до даты'
      case 'invalid':
        return 'Не действительно'
      default:
        return 'На проверке'
    }
  }

  // Функция для получения цвета статуса
  const getStatusColor = (document: Document | undefined): string => {
    const status = getVerificationStatus(document)
    switch (status) {
      case 'verified':
        return 'text-green-400'
      case 'update_required':
        return 'text-yellow-400'
      case 'update_by_date':
        // Проверяем, осталось ли меньше недели
        if (document?.expiry_date) {
          const expiryDate = new Date(document.expiry_date)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            return 'text-orange-400'
          }
          if (daysUntilExpiry <= 0) {
            return 'text-red-400'
          }
        }
        return 'text-yellow-400'
      case 'invalid':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  // Функция для проверки предупреждения (за неделю до окончания)
  const shouldShowWarning = (document: Document | undefined): boolean => {
    if (!document?.expiry_date) return false
    const expiryDate = new Date(document.expiry_date)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  // Функция для проверки истечения срока
  const isExpired = (document: Document | undefined): boolean => {
    if (!document?.expiry_date) return false
    const expiryDate = new Date(document.expiry_date)
    return expiryDate.getTime() <= Date.now()
  }

  // Обработчик клика на статус для обновления
  const handleStatusClick = (document: Document) => {
    const status = getVerificationStatus(document)
    if (status === 'update_required' || status === 'update_by_date' || status === 'invalid') {
      setDocumentToUpdate(document)
      setUpdateModalOpen(true)
    }
  }

  // Обработчик загрузки файла в модальном окне
  const onDrop = async (acceptedFiles: File[]) => {
    if (!documentToUpdate || acceptedFiles.length === 0) return
    
    setUploading(true)
    try {
      const file = acceptedFiles[0]
      await documentsApi.uploadDocument(file, documentToUpdate.document_type, establishment.id)
      
      // Обновляем статус на "pending" после загрузки
      await documentsApi.updateDocumentStatus(documentToUpdate.id, 'update_required')
      
      // Обновляем список документов
      const updatedDocs = await documentsApi.getDocuments(establishment.id)
      setDocuments(updatedDocs)
      
      setUpdateModalOpen(false)
      setDocumentToUpdate(null)
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  })

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

  // Формирование карточки предприятия
  const generateCompanyCard = (): string => {
    const kpp = establishment.ogrn ? establishment.ogrn.slice(0, 9) : 'Не указано'
    const card = `КАРТОЧКА ПРЕДПРИЯТИЯ

Полное наименование: Общество с ограниченной ответственностью «${establishment.business_name}»
Сокращенное наименование: ООО «${establishment.business_name}»
Юридический адрес: ${establishment.address || 'Не указано'}
Почтовый адрес: ${establishment.address || 'Не указано'}
Телефон/факс: ${(establishment as any).business_phone || establishment.phone || 'Не указано'}
ИНН/КПП: ${establishment.inn || 'Не указано'}/${kpp}
ОГРН: ${establishment.ogrn || 'Не указано'}
Расчетный счет: 40702810123456789012
Корреспондентский счет: 30101810400000000225
БИК банка: 044525225
Банк: Сбербанк

---
DigitALC - Умная экосистема закупок алкоголя`
    return card
  }

  const copyCompanyCard = async () => {
    try {
      const card = generateCompanyCard()
      await navigator.clipboard.writeText(card)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendCompanyCardByEmail = () => {
    const card = generateCompanyCard()
    const subject = encodeURIComponent(`Карточка предприятия ${establishment.business_name}`)
    const body = encodeURIComponent(card)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
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
      <div className="flex-1 space-y-2 w-full max-w-[90%]">
        {/* Карточка предприятия и Информация - рядом друг с другом */}
        <div className="flex flex-col lg:flex-row gap-4 mb-2">
          {/* Карточка предприятия */}
          <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-ios-lg p-4 lg:p-5 border border-white/20 min-w-0 w-full lg:w-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Карточка предприятия</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyCompanyCard}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Копировать"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                  )}
                </button>
                <button
                  onClick={sendCompanyCardByEmail}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Отправить по email"
                >
                  <Mail className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-white/70 mb-2">Банк:</label>
              <CustomSelect
                value={selectedBank.bankName}
                options={bankAccounts.map(bank => ({ value: bank.bankName, label: bank.bankName }))}
                onChange={(value) => {
                  const bank = bankAccounts.find(b => b.bankName === value)
                  if (bank) {
                    setSelectedBank(bank)
                  }
                }}
                placeholder="Выберите банк"
              />
            </div>
            <div className="space-y-0 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Полное наименование:</span>
                <span className="text-white sm:text-right break-words">Общество с ограниченной ответственностью «{establishment.business_name}»</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Сокращенное наименование:</span>
                <span className="text-white sm:text-right break-words">ООО «{establishment.business_name}»</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Юридический адрес:</span>
                <span className="text-white sm:text-right break-words">{establishment.address || 'Не указано'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Почтовый адрес:</span>
                <span className="text-white sm:text-right break-words">{establishment.address || 'Не указано'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Телефон/факс:</span>
                <span className="text-white sm:text-right break-words">{(establishment as any).business_phone || establishment.phone || 'Не указано'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">ИНН/КПП:</span>
                <span className="text-white sm:text-right break-words font-mono">{establishment.inn || 'Не указано'}/{establishment.ogrn ? establishment.ogrn.slice(0, 9) : 'Не указано'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">ОГРН:</span>
                <span className="text-white sm:text-right break-words font-mono">{establishment.ogrn || 'Не указано'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Расчетный счет:</span>
                <span className="text-white sm:text-right break-words font-mono">{selectedBank.accountNumber}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Корреспондентский счет:</span>
                <span className="text-white sm:text-right break-words font-mono">{selectedBank.correspondentAccount}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">БИК банка:</span>
                <span className="text-white sm:text-right break-words font-mono">{selectedBank.bik}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Банк:</span>
                <span className="text-white sm:text-right break-words">{selectedBank.bankName}</span>
              </div>
            </div>
          </div>

          {/* Информация о заведении */}
          <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-ios-lg p-4 lg:p-5 border border-white/20 min-w-0 w-full lg:w-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Информация ООО ХАСТЛЕР</h3>
            </div>
            <div className="space-y-0 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Наименование:</span>
                <span className="text-white sm:text-right break-words">{establishment.business_name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Тип заведения:</span>
                <span className="text-white sm:text-right break-words">{getBusinessTypeLabel(establishment.business_type)}</span>
              </div>
              {establishment.name && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                  <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Имя:</span>
                  <span className="text-white sm:text-right break-words">{establishment.name}</span>
                </div>
              )}
              {(establishment as any).business_phone && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                  <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Телефон организации:</span>
                  <span className="text-white sm:text-right break-words">{(establishment as any).business_phone}</span>
                </div>
              )}
              {(establishment as any).website && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 py-2 gap-2 sm:gap-4">
                  <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Сайт:</span>
                  <span className="text-white sm:text-right break-words">
                    <a 
                      href={(establishment as any).website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    >
                      {(establishment as any).website}
                    </a>
                  </span>
                </div>
              )}
              {establishment.email && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-2 sm:gap-4">
                  <span className="text-white/70 font-medium flex-shrink-0 min-w-[140px]">Email:</span>
                  <span className="text-white sm:text-right break-words">{establishment.email}</span>
                </div>
              )}
            </div>
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
                          <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                            {shouldShowWarning(document) && (
                              <AlertTriangle className="w-4 h-4 text-orange-400" title="Истекает через неделю" />
                            )}
                            {isExpired(document) && (
                              <AlertTriangle className="w-4 h-4 text-red-400" title="Срок действия истёк" />
                            )}
                            <button
                              onClick={() => handleStatusClick(document)}
                              className={clsx(
                                'text-xs font-medium transition-colors',
                                getStatusColor(document),
                                (getVerificationStatus(document) === 'update_required' || 
                                 getVerificationStatus(document) === 'update_by_date' || 
                                 getVerificationStatus(document) === 'invalid') && 
                                'hover:underline cursor-pointer'
                              )}
                            >
                              {getStatusText(document)}
                            </button>
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

      {/* Модальное окно для обновления документа */}
      {updateModalOpen && documentToUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Обновить документ: {documentToUpdate.document_name}
              </h3>
              <button
                onClick={() => {
                  setUpdateModalOpen(false)
                  setDocumentToUpdate(null)
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-ios-lg p-8 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <p className="text-white/80">Загрузка...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-cyan-400" />
                  <p className="text-white font-medium">
                    {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда или нажмите для выбора'}
                  </p>
                  <p className="text-xs text-white/60">
                    PDF, JPG, PNG, DOC, DOCX до 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

