import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileText, CheckCircle, AlertCircle, Clock, User, Building, 
  MapPin, Calendar, Shield, Star, X, ChevronRight, Mail, Phone
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onComplete: (establishmentId: number) => void
}

interface FormData {
  businessName: string
  businessType: string
  address: string
  registrationDate: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
}

interface Document {
  id: string
  name: string
  required: boolean
  uploaded: boolean
  file: File | null
}

interface DocumentGroup {
  id: number
  name: string
  description: string
  documents: Document[]
}

interface DocumentItemProps {
  doc: Document
  groupId: number
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
}

function DocumentItem({ doc, onUpload, onRemove }: DocumentItemProps) {
  const [uploading, setUploading] = useState(false)
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      
      setUploading(true)
      try {
        await onUpload(acceptedFiles[0])
      } finally {
        setUploading(false)
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10485760, // 10MB
    multiple: false,
    disabled: uploading || doc.uploaded,
  })

  return (
    <div className="border border-tg-gray-200 rounded-tg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">
            {doc.name}
            {doc.required && <span className="text-red-500 ml-1">*</span>}
          </h4>
        </div>
        {doc.uploaded ? (
          <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={2.5} />
        ) : (
          <div className="w-5 h-5"></div>
        )}
      </div>
      
      {!doc.uploaded ? (
        <motion.div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-tg p-4 text-center cursor-pointer transition-all',
            isDragActive && 'border-tg-blue bg-tg-blue/5 scale-[1.02]',
            uploading && 'opacity-50 pointer-events-none',
            !uploading && !isDragActive && 'border-tg-gray-300 hover:border-tg-blue hover:bg-tg-blue/5'
          )}
          whileHover={!uploading ? { scale: 1.01 } : {}}
          whileTap={!uploading ? { scale: 0.99 } : {}}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-tg-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-tg-gray-500">Загрузка...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-tg-gray-400 mx-auto mb-2" />
              <p className="text-sm text-tg-gray-500 mb-2">
                {isDragActive ? 'Отпустите файл' : 'Перетащите файл сюда'}
              </p>
              <p className="text-xs text-tg-gray-400 mb-3">Или нажмите для выбора</p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="bg-green-50 rounded-tg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {doc.file?.name || 'Файл загружен'}
              </span>
            </div>
            <motion.button
              onClick={onRemove}
              whileTap={{ scale: 0.9 }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RegistrationForm({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: '',
    address: '',
    registrationDate: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  })
  const [establishmentId, setEstablishmentId] = useState<number | null>(null)

  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([
    {
      id: 1,
      name: 'Учредительные документы',
      description: 'Документы, подтверждающие создание и регистрацию юридического лица',
      documents: [
        { id: 'charter', name: 'Устав организации', required: true, uploaded: false, file: null },
        { id: 'registration', name: 'Свидетельство о государственной регистрации', required: true, uploaded: false, file: null },
        { id: 'inn', name: 'Свидетельство ИНН', required: true, uploaded: false, file: null },
        { id: 'ogrn', name: 'Свидетельство ОГРН', required: true, uploaded: false, file: null }
      ]
    },
    {
      id: 2,
      name: 'Лицензии и разрешения',
      description: 'Разрешительная документация для осуществления деятельности',
      documents: [
        { id: 'alcohol', name: 'Лицензия на алкогольную продукцию', required: false, uploaded: false, file: null },
        { id: 'food', name: 'Санитарно-эпидемиологическое заключение', required: true, uploaded: false, file: null },
        { id: 'fire', name: 'Пожарная безопасность', required: true, uploaded: false, file: null },
        { id: 'music', name: 'Лицензия на публичное исполнение музыки', required: false, uploaded: false, file: null }
      ]
    },
    {
      id: 3,
      name: 'Финансовая документация',
      description: 'Финансовые и бухгалтерские документы',
      documents: [
        { id: 'bank', name: 'Реквизиты банковского счета', required: true, uploaded: false, file: null },
        { id: 'tax', name: 'Свидетельство о постановке на налоговый учет', required: true, uploaded: false, file: null }
      ]
    },
    {
      id: 4,
      name: 'Дополнительные документы',
      description: 'Дополнительная информация и подтверждения',
      documents: [
        { id: 'floor', name: 'План этажа помещения', required: false, uploaded: false, file: null },
        { id: 'photo', name: 'Фотографии помещения', required: false, uploaded: false, file: null }
      ]
    }
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileUpload = async (groupId: number, docId: string, file: File) => {
    if (!establishmentId) {
      // Сначала создаем заведение
      const response = await fetch('/api/establishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const establishment = await response.json()
      setEstablishmentId(establishment.id)
      
      // Теперь загружаем документ
      await uploadDocument(establishment.id, groupId, docId, file)
    } else {
      await uploadDocument(establishmentId, groupId, docId, file)
    }
  }

  const uploadDocument = async (estId: number, groupId: number, docId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const group = documentGroups.find(g => g.id === groupId)
    const doc = group?.documents.find(d => d.id === docId)
    
    if (!group || !doc) return

    const groupMap: Record<number, string> = {
      1: 'founding',
      2: 'licenses',
      3: 'financial',
      4: 'additional'
    }

    formData.append('document_group', groupMap[groupId])
    formData.append('document_type', docId)
    formData.append('document_name', doc.name)
    formData.append('required', doc.required.toString())

    try {
      await fetch(`/api/establishments/${estId}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      setDocumentGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            documents: group.documents.map(doc => 
              doc.id === docId ? { ...doc, uploaded: true, file } : doc
            )
          }
        }
        return group
      }))
    } catch (error) {
      console.error('Error uploading document:', error)
    }
  }

  const handleFileRemove = async (groupId: number, docId: string) => {
    if (!establishmentId) return

    const group = documentGroups.find(g => g.id === groupId)
    const doc = group?.documents.find(d => d.id === docId)
    
    // Находим document_id из БД (упрощенно, в реальности нужен запрос)
    // Для упрощения просто обновляем состояние
    setDocumentGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          documents: group.documents.map(doc => 
            doc.id === docId ? { ...doc, uploaded: false, file: null } : doc
          )
        }
      }
      return group
    }))
  }

  const getTotalDocuments = () => {
    return documentGroups.reduce((total, group) => total + group.documents.length, 0)
  }

  const getUploadedDocuments = () => {
    return documentGroups.reduce((total, group) => {
      return total + group.documents.filter(doc => doc.uploaded).length
    }, 0)
  }

  const getRequiredDocuments = () => {
    return documentGroups.reduce((total, group) => {
      return total + group.documents.filter(doc => doc.required).length
    }, 0)
  }

  const getUploadedRequiredDocuments = () => {
    return documentGroups.reduce((total, group) => {
      return total + group.documents.filter(doc => doc.required && doc.uploaded).length
    }, 0)
  }

  const isFormComplete = () => {
    return Object.values(formData).every(value => value !== '') && 
           getUploadedRequiredDocuments() === getRequiredDocuments()
  }

  const handleSubmit = async () => {
    if (!establishmentId) {
      // Создаем заведение если еще не создано
      const response = await fetch('/api/establishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const establishment = await response.json()
      setEstablishmentId(establishment.id)
    }

    // Отправляем на проверку
    await fetch(`/api/establishments/${establishmentId}/submit`, {
      method: 'POST'
    })

    onComplete(establishmentId!)
  }

  const progress = (getUploadedDocuments() / getTotalDocuments()) * 100

  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-tg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-tg-lg shadow-card p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-tg-blue/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-tg-blue" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Профиль успешно создан!</h2>
          <p className="text-tg-gray-600 mb-6">
            Ваша заявка принята и находится на проверке. 
            Мы свяжемся с вами в течение 2-3 рабочих дней.
          </p>
          <div className="bg-tg-blue/10 rounded-tg p-4 mb-6">
            <p className="text-sm text-tg-blue flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2" />
              Статус проверки: В обработке
            </p>
          </div>
          <motion.button
            onClick={() => onComplete(establishmentId!)}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-tg-blue text-white py-3 rounded-tg font-medium shadow-button hover:shadow-button-hover active:shadow-button-active transition-all"
          >
            Перейти в приложение
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-tg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-tg-blue rounded-tg-lg flex items-center justify-center shadow-button mr-3">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Единый цифровой профиль заведения</h1>
          </div>
          <p className="text-tg-gray-600 max-w-2xl mx-auto">
            Создайте единый профиль для вашего ресторана, бара или гостиницы. 
            Загрузите необходимые документы и получите верифицированный статус.
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Прогресс загрузки</span>
              <span className="text-sm text-tg-gray-600">{getUploadedDocuments()}/{getTotalDocuments()} документов</span>
            </div>
            <div className="w-full bg-tg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-tg-blue h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {getUploadedRequiredDocuments() < getRequiredDocuments() && (
              <p className="text-sm text-amber-600 mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Обязательно загрузите {getRequiredDocuments() - getUploadedRequiredDocuments()} обязательных документов
              </p>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex space-x-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <motion.div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-button',
                      currentStep >= step
                        ? 'bg-tg-blue text-white'
                        : 'bg-tg-gray-200 text-tg-gray-500'
                    )}
                    whileHover={{ scale: 1.1 }}
                  >
                    {currentStep > step ? (
                      <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      step
                    )}
                  </motion.div>
                  <span className={clsx(
                    'text-sm',
                    currentStep >= step ? 'text-tg-blue font-medium' : 'text-tg-gray-500'
                  )}>
                    {step === 1 ? 'Основная информация' : step === 2 ? 'Загрузка документов' : 'Подтверждение'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Form */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-tg-lg shadow-card p-8 mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Основная информация о заведении</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название заведения *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                    placeholder="Название ресторана, бара или гостиницы"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип заведения *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                  >
                    <option value="">Выберите тип</option>
                    <option value="restaurant">Ресторан</option>
                    <option value="bar">Бар</option>
                    <option value="hotel">Гостиница</option>
                    <option value="cafe">Кафе</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес заведения *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                    placeholder="Полный адрес с индексом"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата регистрации *
                  </label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО владельца *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email владельца *
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                    placeholder="owner@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон владельца *
                  </label>
                  <input
                    type="tel"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-tg-gray-200 rounded-tg focus:ring-2 focus:ring-tg-blue focus:border-tg-blue outline-none"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <motion.button
                  onClick={() => setCurrentStep(2)}
                  disabled={!Object.values(formData).every(value => value !== '')}
                  whileTap={{ scale: 0.95 }}
                  className={clsx(
                    'px-6 py-3 rounded-tg font-medium shadow-button transition-all',
                    Object.values(formData).every(value => value !== '')
                      ? 'bg-tg-blue text-white hover:shadow-button-hover active:shadow-button-active'
                      : 'bg-tg-gray-300 text-tg-gray-500 cursor-not-allowed'
                  )}
                >
                  Продолжить к загрузке документов
                  <ChevronRight className="w-4 h-4 inline ml-2" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-tg-lg shadow-card p-8 mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Загрузка документов</h2>
              <p className="text-tg-gray-600 mb-8">
                Загрузите все необходимые документы. Обязательные документы отмечены звездочкой (*).
              </p>
              
              {documentGroups.map((group) => (
                <div key={group.id} className="mb-8 border border-tg-gray-200 rounded-tg-lg p-6 bg-tg-gray-50">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-tg-blue/10 rounded-tg flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5 text-tg-blue" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-tg-gray-500">{group.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.documents.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        doc={doc}
                        groupId={group.id}
                        onUpload={(file) => handleFileUpload(group.id, doc.id, file)}
                        onRemove={() => handleFileRemove(group.id, doc.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between">
                <motion.button
                  onClick={() => setCurrentStep(1)}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 border border-tg-gray-300 text-gray-700 rounded-tg font-medium shadow-button hover:shadow-button-hover active:shadow-button-active transition-all"
                >
                  Назад
                </motion.button>
                <motion.button
                  onClick={() => setCurrentStep(3)}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-tg-blue text-white rounded-tg font-medium shadow-button hover:shadow-button-hover active:shadow-button-active transition-all"
                >
                  Перейти к подтверждению
                  <ChevronRight className="w-4 h-4 inline ml-2" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-tg-lg shadow-card p-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Проверка и подтверждение</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.businessName}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.businessType === 'restaurant' ? 'Ресторан' : 
                           formData.businessType === 'bar' ? 'Бар' : 
                           formData.businessType === 'hotel' ? 'Гостиница' : 'Кафе'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.registrationDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Контактная информация</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.ownerName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.ownerEmail}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-tg-gray-500 mr-3" />
                      <span>{formData.ownerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Загруженные документы</h3>
                {documentGroups.map((group) => (
                  <div key={group.id} className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">{group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.documents.map((doc) => (
                        doc.uploaded && (
                          <span key={doc.id} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {doc.name}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-tg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3" />
                  <p className="text-amber-700 text-sm">
                    После отправки заявки все документы будут проверены нашими специалистами. 
                    Процесс проверки занимает 2-3 рабочих дня.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <motion.button
                  onClick={() => setCurrentStep(2)}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 border border-tg-gray-300 text-gray-700 rounded-tg font-medium shadow-button hover:shadow-button-hover active:shadow-button-active transition-all"
                >
                  Назад к документам
                </motion.button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!isFormComplete()}
                  whileTap={{ scale: 0.95 }}
                  className={clsx(
                    'px-6 py-3 rounded-tg font-medium shadow-button transition-all',
                    isFormComplete()
                      ? 'bg-tg-blue text-white hover:shadow-button-hover active:shadow-button-active'
                      : 'bg-tg-gray-300 text-tg-gray-500 cursor-not-allowed'
                  )}
                >
                  Отправить заявку на проверку
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

