import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileCheck, X, ChevronDown, ChevronUp, CheckCircle, Home } from 'lucide-react'
import { documentsApi } from '../api/documents'
import { establishmentApi } from '../api/establishment'
import { DOCUMENT_BLOCKS } from '../types/document'
import { UserData } from './UserRegistration'
import clsx from 'clsx'

interface Props {
  establishmentId: number | null
  pendingRegistrationData: UserData | null
  onEstablishmentCreated: (id: number) => void
  onUploadSuccess: () => void
  onGoHome?: () => void
  onAllDocumentsUploaded?: () => void
}

export default function DocumentUploader({ establishmentId, pendingRegistrationData, onEstablishmentCreated, onUploadSuccess, onGoHome, onAllDocumentsUploaded }: Props) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<Set<string>>(new Set())

  // Загружаем список загруженных документов при монтировании
  useEffect(() => {
    if (establishmentId) {
      const loadUploadedDocuments = async () => {
        try {
          const documents = await documentsApi.getDocuments(establishmentId)
          const uploadedTypes = new Set(documents.map(doc => doc.document_type))
          setUploadedDocuments(uploadedTypes)
        } catch (err) {
          // Игнорируем ошибки при загрузке
        }
      }
      loadUploadedDocuments()
    }
  }, [establishmentId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!selectedType) {
        setError('Пожалуйста, выберите тип документа')
        return
      }

      if (acceptedFiles.length === 0) return

      setUploading(true)
      setError(null)

      try {
        let currentEstablishmentId = establishmentId
        
        // Если заведения еще нет в БД, создаем его при первой загрузке документа
        if (!currentEstablishmentId && pendingRegistrationData) {
          try {
            // Проверяем, что все обязательные поля заполнены
            console.log('=== CREATING ESTABLISHMENT ===')
            console.log('Full pendingRegistrationData:', JSON.stringify(pendingRegistrationData, null, 2))
            console.log('Type of pendingRegistrationData:', typeof pendingRegistrationData)
            console.log('Is pendingRegistrationData an object?', pendingRegistrationData && typeof pendingRegistrationData === 'object')
            
            // Проверяем все обязательные поля (с учетом пустых строк)
            // Используем правильные имена полей из UserData
            const name = (pendingRegistrationData.name || '').toString().trim()
            const email = (pendingRegistrationData.email || '').toString().trim()
            const username = (pendingRegistrationData.username || '').toString().trim()
            const password = (pendingRegistrationData.password || '').toString().trim()
            const position = (pendingRegistrationData.position || '').toString().trim()
            const phone = (pendingRegistrationData.phone || '').toString().trim()
            const businessName = (pendingRegistrationData.establishmentName || '').toString().trim()
            const businessType = (pendingRegistrationData.establishmentType || '').toString().trim()
            const address = (pendingRegistrationData.address || '').toString().trim()
            const inn = (pendingRegistrationData.inn || '').toString().trim()
            const ogrn = (pendingRegistrationData.ogrn || '').toString().trim()
            
            console.log('Extracted values:', {
              name, email, username, password, position, phone,
              businessName, businessType, address, inn, ogrn
            })
            
            // Проверяем только критичные поля для создания заведения
            const missingFields = []
            if (!name) missingFields.push('имя')
            if (!email) missingFields.push('email')
            if (!username) missingFields.push('логин')
            if (!password) missingFields.push('пароль')
            if (!position) missingFields.push('должность')
            if (!phone) missingFields.push('телефон')
            if (!businessName) missingFields.push('название заведения')
            if (!businessType) missingFields.push('тип заведения')
            if (!address) missingFields.push('адрес')
            if (!inn) missingFields.push('ИНН')
            if (!ogrn) missingFields.push('ОГРН')
            
            if (missingFields.length > 0) {
              console.error('=== MISSING FIELDS ===')
              console.error('Missing fields:', missingFields)
              console.error('Actual values:', {
                name: `"${name}"`, email: `"${email}"`, username: `"${username}"`,
                password: password ? '***' : '', position: `"${position}"`, phone: `"${phone}"`,
                businessName: `"${businessName}"`, businessType: `"${businessType}"`,
                address: `"${address}"`, inn: `"${inn}"`, ogrn: `"${ogrn}"`
              })
              setError(`Ошибка: не заполнены поля: ${missingFields.join(', ')}`)
              setUploading(false)
              return
            }
            
            // Все поля заполнены, можно создавать заведение
            console.log('✓ All fields validated, creating establishment...')
            
            const establishment = await establishmentApi.createEstablishment(pendingRegistrationData)
            currentEstablishmentId = establishment.id
            onEstablishmentCreated(currentEstablishmentId)
            // Сохраняем ID в localStorage
            localStorage.setItem('establishmentId', currentEstablishmentId.toString())
            // Удаляем временные данные
            localStorage.removeItem('pendingRegistrationData')
          } catch (err: any) {
            console.error('Error creating establishment:', err)
            console.error('Error response:', err.response)
            const errorDetail = err.response?.data?.detail || err.message || 'Ошибка при создании заведения'
            setError(`Ошибка при создании заведения: ${errorDetail}`)
            setUploading(false)
            return
          }
        }
        
        if (!currentEstablishmentId) {
          setError('Ошибка: не удалось создать заведение')
          setUploading(false)
          return
        }

        console.log('Uploading document with establishment_id:', currentEstablishmentId)
        await documentsApi.uploadDocument(acceptedFiles[0], selectedType, currentEstablishmentId)
        setUploadSuccess(true)
        // Обновляем список загруженных документов из БД
        const documents = await documentsApi.getDocuments(currentEstablishmentId)
        const uploadedTypes = new Set(documents.map(doc => doc.document_type))
        setUploadedDocuments(uploadedTypes)
        setSelectedType('')
        setSelectedBlock(null)
        onUploadSuccess()
        
        setTimeout(() => {
          setUploadSuccess(false)
        }, 3000)
      } catch (err: any) {
        console.error('Document upload error:', err)
        console.error('Error response:', err.response)
        const errorDetail = err.response?.data?.detail || err.message || 'Ошибка при загрузке документа'
        setError(`Ошибка при загрузке документа: ${errorDetail}`)
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
    disabled: !selectedType,
  })

  const toggleBlock = (blockId: number) => {
    setSelectedBlock(selectedBlock === blockId ? null : blockId)
  }

  // Проверяем, все ли блоки полностью загружены
  const allBlocksCompleted = DOCUMENT_BLOCKS.every(block => 
    block.documents.every(doc => uploadedDocuments.has(doc.type))
  )

  // Проверяем, все ли документы загружены (без автоматического перенаправления)
  // Пользователь сам нажмет кнопку "На главную" когда захочет

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      // Если callback не передан, очищаем localStorage и перезагружаем страницу
      localStorage.removeItem('establishmentId')
      localStorage.removeItem('pendingRegistrationData')
      window.location.href = '/'
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg shadow-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Загрузка документов
      </h2>

      {/* Document Type Selection */}
      <div className="space-y-2 mb-6">
        {DOCUMENT_BLOCKS.map((block) => {
          // Проверяем, все ли документы в блоке загружены
          const allDocumentsUploaded = block.documents.every(doc => uploadedDocuments.has(doc.type))
          
          return (
            <div key={block.id} className="border border-white/20 rounded-ios overflow-hidden">
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{block.title}</span>
                  {allDocumentsUploaded && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                {selectedBlock === block.id ? (
                  <ChevronUp className="w-5 h-5 text-cyan-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyan-300" />
                )}
              </button>

            <AnimatePresence>
              {selectedBlock === block.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 bg-white/5">
                    {block.documents.map((doc) => {
                      const isUploaded = uploadedDocuments.has(doc.type)
                      return (
                        <button
                          key={doc.type}
                          onClick={() => setSelectedType(doc.type)}
                          className={clsx(
                            'w-full text-left p-3 rounded-lg transition-all flex items-center justify-between',
                            selectedType === doc.type
                              ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-md'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          )}
                        >
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {doc.label}
                              {isUploaded && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <div className={clsx(
                              'text-xs mt-1',
                              selectedType === doc.type ? 'text-white/90' : 'text-cyan-200'
                            )}>
                              {doc.description}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )
        })}
      </div>

      {/* Success Message или Drop Zone */}
      <AnimatePresence mode="wait">
        {allBlocksCompleted ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-400/30 rounded-ios-lg p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-semibold text-white mb-4">
              Ваш Цифровой Профиль успешно создан!
            </h3>
            
            <p className="text-white/90 mb-2 text-lg">
              Ваш профиль находится на проверке. Мы уведомим вас по email о результатах верификации в течение 1-3 рабочих дней. Благодарим за выбор DigitALC.
            </p>
            
            <motion.button
              onClick={handleGoHome}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-white rounded-ios-lg font-semibold text-lg shadow-lg hover:from-cyan-500 hover:to-cyan-700 transition-all"
            >
              <Home className="w-5 h-5" />
              <span>На главную</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-ios-lg p-8 text-center cursor-pointer transition-all',
              isDragActive && 'border-cyan-400 bg-cyan-400/10 scale-105',
              !selectedType && 'opacity-50 cursor-not-allowed',
              selectedType && !isDragActive && 'border-white/30 hover:border-cyan-400 hover:bg-cyan-400/5',
              uploading && 'pointer-events-none opacity-50'
            )}
            whileHover={selectedType ? { scale: 1.01 } : {}}
            whileTap={selectedType ? { scale: 0.99 } : {}}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {uploadSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <FileCheck className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-green-400 font-medium">Документ успешно загружен!</p>
                </motion.div>
              ) : uploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white font-medium">Загрузка...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Upload className={clsx(
                    'w-12 h-12',
                    selectedType ? 'text-cyan-400' : 'text-white/40'
                  )} />
                  <div>
                    <p className="text-white font-medium mb-1">
                      {isDragActive ? 'Отпустите файл' : 'Перетащите файл сюда'}
                    </p>
                    <p className="text-sm text-cyan-200">
                      {selectedType 
                        ? 'или нажмите для выбора (PDF, JPG, PNG, DOC, DOCX до 10MB)'
                        : 'Сначала выберите тип документа выше'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-ios flex items-start gap-3 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Ошибка</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-200"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

