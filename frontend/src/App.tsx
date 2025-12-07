import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import DocumentUploader from './components/DocumentUploader'
import UserRegistration, { UserData } from './components/UserRegistration'
import LoginPage from './components/LoginPage'
import PageNavigator from './components/PageNavigator'
import Dashboard from './components/Dashboard'
import { DigitALCLogo } from './components/DigitALCLogo'
import { LogOut } from 'lucide-react'
import { establishmentApi, EstablishmentResponse } from './api/establishment'
import { documentsApi } from './api/documents'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'registration' | 'main' | 'dashboard'>('login')
  const [establishmentId, setEstablishmentId] = useState<number | null>(null)
  const [establishmentData, setEstablishmentData] = useState<EstablishmentResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedEstablishmentIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Проверяем, есть ли уже зарегистрированный пользователь
    const savedEstablishmentId = localStorage.getItem('establishmentId')
    if (savedEstablishmentId) {
      const id = parseInt(savedEstablishmentId)
      if (!isNaN(id)) {
        setEstablishmentId(id)
        // Загружаем данные заведения из БД
        establishmentApi.getEstablishment(id)
          .then(async (data) => {
            setEstablishmentData(data)
            // Проверяем, загружены ли все документы
            try {
              const docs = await documentsApi.getDocuments(id)
              // Проверяем, что все обязательные документы загружены
              const allDocsUploaded = docs.length > 0 && docs.every(doc => doc.uploaded && doc.file_name)
              
              if (allDocsUploaded) {
                setCurrentPage('dashboard')
              } else {
                setCurrentPage('main')
              }
            } catch {
              // Если ошибка при загрузке документов, переходим на страницу загрузки
              setCurrentPage('main')
            }
          })
          .catch(() => {
            // Если заведение не найдено, очищаем localStorage
            localStorage.removeItem('establishmentId')
            setCurrentPage('login')
          })
      } else {
        localStorage.removeItem('establishmentId')
        setCurrentPage('login')
      }
    } else {
      setCurrentPage('login')
    }
  }, [])

  // Загружаем establishmentId при переходе на страницу main
  useEffect(() => {
    if (currentPage === 'main' && !loading) {
      const savedEstablishmentId = localStorage.getItem('establishmentId')
      const pendingData = localStorage.getItem('pendingRegistrationData')
      
      // Если есть незавершенная регистрация (данные формы, но нет establishmentId)
      if (pendingData && !savedEstablishmentId) {
        // Не загружаем ничего, просто показываем страницу загрузки документов
        // Данные будут сохранены при первой загрузке документа
        return
      }
      
      if (savedEstablishmentId) {
        const id = parseInt(savedEstablishmentId)
        if (!isNaN(id)) {
          // Если уже загружали этот establishmentId, не загружаем заново
          if (loadedEstablishmentIdRef.current === id && establishmentData) {
            return
          }
          // Загружаем данные заведения только если еще не загружаем
          setLoading(true)
          setEstablishmentId(id)
          loadedEstablishmentIdRef.current = id
          establishmentApi.getEstablishment(id)
            .then(data => {
              setEstablishmentData(data)
              setLoading(false)
            })
            .catch((error) => {
              console.error('Error loading establishment:', error)
              localStorage.removeItem('establishmentId')
              setEstablishmentId(null)
              setEstablishmentData(null)
              loadedEstablishmentIdRef.current = null
              setLoading(false)
            })
        }
      }
    }
  }, [currentPage])

  // Страница 1: Вход/Регистрация
  const handleLogin = async (establishment: EstablishmentResponse) => {
    // Сохраняем данные заведения
    setEstablishmentData(establishment)
    setEstablishmentId(establishment.id)
    localStorage.setItem('establishmentId', establishment.id.toString())
    
    // Проверяем, загружены ли все документы
    // Если да - переходим в личный кабинет, если нет - на страницу загрузки документов
    try {
      const docs = await documentsApi.getDocuments(establishment.id)
      // Проверяем, что все обязательные документы загружены
      const allDocsUploaded = docs.length > 0 && docs.every(doc => doc.uploaded && doc.file_name)
      
      if (allDocsUploaded) {
        setCurrentPage('dashboard')
      } else {
        setCurrentPage('main')
      }
    } catch {
      // Если ошибка при загрузке документов, переходим на страницу загрузки
      setCurrentPage('main')
    }
  }

  // Переход к странице регистрации
  const handleRegister = () => {
    setCurrentPage('registration')
  }

  // Страница 2: Регистрация пользователя (личная информация + информация о заведении)
  // НЕ сохраняем в БД сразу, только переходим на страницу загрузки документов
  const handleUserRegistration = (data: UserData) => {
    // Сохраняем данные формы во временное хранилище
    localStorage.setItem('pendingRegistrationData', JSON.stringify(data))
    // Переходим на страницу загрузки документов
    setCurrentPage('main')
  }

  const handleUploadSuccess = () => {
    // Документ успешно загружен
  }

  const handleLogout = () => {
    localStorage.removeItem('establishmentId')
    localStorage.removeItem('pendingRegistrationData')
    setEstablishmentId(null)
    setEstablishmentData(null)
    loadedEstablishmentIdRef.current = null
    setCurrentPage('login')
  }

  // Страница 1: Вход/Регистрация
  if (currentPage === 'login') {
    return (
      <>
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
        <PageNavigator currentPage={currentPage} onPageChange={setCurrentPage} />
      </>
    )
  }

  // Страница 2: Регистрация пользователя
  if (currentPage === 'registration') {
    return (
      <>
        <UserRegistration onRegistrationComplete={handleUserRegistration} />
        <PageNavigator currentPage={currentPage} onPageChange={setCurrentPage} />
      </>
    )
  }

  // Личный кабинет (Dashboard) - после успешного входа и загрузки всех документов
  if (currentPage === 'dashboard' && establishmentData) {
    return (
      <Dashboard 
        establishment={establishmentData} 
        onLogout={handleLogout}
        onEstablishmentUpdate={(updated) => {
          setEstablishmentData(updated)
        }}
      />
    )
  }

  // Страница 3: Основное приложение
  // Показываем загрузку только если загружаем данные существующего заведения
  if (currentPage === 'main' && loading && establishmentId) {
    return (
      <div className="min-h-screen font-sf flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300">Загрузка...</p>
        </div>
        <PageNavigator currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sf">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Number */}
        <div className="text-center mb-4">
          <span className="text-cyan-400 text-sm font-medium">Страница 3 из 3</span>
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <DigitALCLogo />
              <div>
                <p className="text-cyan-300 text-sm">Управление документами</p>
              </div>
            </div>
            {establishmentData && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{establishmentData.name}</p>
                  <p className="text-xs text-cyan-300">{establishmentData.position}</p>
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-ios-lg transition-colors text-sm font-medium backdrop-blur-sm"
                  title="Выйти и вернуться к регистрации"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Document Uploader */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DocumentUploader 
              establishmentId={establishmentId}
              pendingRegistrationData={(() => {
                const pending = localStorage.getItem('pendingRegistrationData')
                return pending ? JSON.parse(pending) : null
              })()}
              onEstablishmentCreated={(id) => {
                setEstablishmentId(id)
                loadedEstablishmentIdRef.current = id
                // Загружаем данные заведения
                establishmentApi.getEstablishment(id)
                  .then(data => {
                    setEstablishmentData(data)
                  })
                  .catch(err => console.error('Error loading establishment:', err))
              }}
              onUploadSuccess={handleUploadSuccess}
              onGoHome={() => {
                // Очищаем данные и переходим на страницу входа
                localStorage.removeItem('establishmentId')
                localStorage.removeItem('pendingRegistrationData')
                setEstablishmentId(null)
                setEstablishmentData(null)
                loadedEstablishmentIdRef.current = null
                setCurrentPage('login')
              }}
              onAllDocumentsUploaded={async () => {
                // Не перенаправляем автоматически - пользователь сам нажмет "На главную"
                // Просто сохраняем, что все документы загружены
              }}
            />
          </motion.div>
        </div>
      </div>
      <PageNavigator currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}

export default App

