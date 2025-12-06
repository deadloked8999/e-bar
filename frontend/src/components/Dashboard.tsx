import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, FileText, ShoppingBag, ShoppingCart, LogOut, X, User } from 'lucide-react'
import { EstablishmentResponse } from '../api/establishment'
import clsx from 'clsx'

// Страницы
import HomePage from './pages/HomePage'
import DocumentsPage from './pages/DocumentsPage'
import BarPage from './pages/BarPage'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'

interface DashboardProps {
  establishment: EstablishmentResponse
  onLogout: () => void
  onEstablishmentUpdate?: (updated: EstablishmentResponse) => void
}

type TabType = 'home' | 'documents' | 'bar' | 'cart'

export default function Dashboard({ establishment, onLogout, onEstablishmentUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [establishmentData, setEstablishmentData] = useState<EstablishmentResponse>(establishment)
  const [hoveredTab, setHoveredTab] = useState<TabType | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const tabs = [
    { id: 'home' as TabType, label: 'Главная', icon: Home, pageNumber: 1 },
    { id: 'documents' as TabType, label: 'Документы', icon: FileText, pageNumber: 2 },
    { id: 'bar' as TabType, label: 'Мой кабинет', icon: ShoppingBag, pageNumber: 3 },
    { id: 'cart' as TabType, label: 'Корзина', icon: ShoppingCart, pageNumber: 4 },
  ]

  const currentPageNumber = tabs.find(tab => tab.id === activeTab)?.pageNumber || 1
  const totalPages = tabs.length

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    onLogout()
  }

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false)
  }

  const handleProfileUpdate = (updated: EstablishmentResponse) => {
    setEstablishmentData(updated)
    if (onEstablishmentUpdate) {
      onEstablishmentUpdate(updated)
    }
  }

  const renderPage = () => {
    if (showProfile) {
      return <ProfilePage establishment={establishmentData} onUpdate={handleProfileUpdate} />
    }

    switch (activeTab) {
      case 'home':
        return <HomePage establishment={establishmentData} />
      case 'documents':
        return <DocumentsPage establishment={establishmentData} />
      case 'bar':
        return <BarPage establishment={establishmentData} />
      case 'cart':
        return <CartPage establishment={establishmentData} />
      default:
        return <HomePage establishment={establishmentData} />
    }
  }

  return (
    <div className="min-h-screen font-sf pb-20">
      {/* Header with Logo, Business Name and Logout */}
      <div className="container mx-auto px-4 pt-6 max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Логотип компании */}
            {establishmentData && (establishmentData as any).logo_path && (
              <img 
                src={(() => {
                  const logoPath = (establishmentData as any).logo_path
                  if (!logoPath) return ''
                  if (logoPath.startsWith('data:') || logoPath.startsWith('http')) return logoPath
                  const normalizedPath = logoPath.replace(/\\/g, '/')
                  if (normalizedPath.includes('uploads/logos/')) {
                    return `/api/uploads/logos/${normalizedPath.split('logos/')[1]}`
                  }
                  return `/api/uploads/logos/${normalizedPath.split('/').pop()}`
                })()}
                alt="Логотип компании" 
                className="w-12 h-12 object-cover rounded-ios-lg border border-white/20"
                onError={(e) => {
                  // Скрываем логотип при ошибке загрузки
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            {/* Название заведения */}
            <div>
              <h2 className="text-lg font-semibold text-white">{establishmentData.business_name}</h2>
              {!showProfile && (
                <p className="text-xs text-cyan-400/80">Страница {currentPageNumber} из {totalPages}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-ios-lg transition-colors text-sm font-medium backdrop-blur-sm border border-white/20',
                showProfile
                  ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              )}
            >
              <User className="w-4 h-4" />
              <span>Мой профиль</span>
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-ios-lg transition-colors text-sm font-medium backdrop-blur-sm border border-white/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Выход</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {renderPage()}
      </div>

      {/* Bottom Navigation Bar - скрываем при открытии профиля */}
      {!showProfile && (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4">
        <div 
          ref={navRef}
          className="flex items-center justify-center gap-1 py-2 px-3 rounded-ios-lg relative border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)',
          }}
          onMouseLeave={() => setHoveredTab(null)}
        >
            {/* Внутренний блик сверху для всей панели */}
            <div 
              className="absolute inset-0 rounded-ios-lg pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%)',
              }}
            />
            
            {/* Анимированный индикатор */}
            {(hoveredTab || activeTab) && (() => {
              const targetTab = hoveredTab || activeTab
              const button = buttonRefs.current[targetTab]
              const container = navRef.current
              
              if (!button || !container) return null
              
              // Используем offsetLeft/offsetTop относительно контейнера
              const x = button.offsetLeft
              const y = button.offsetTop
              const width = button.offsetWidth
              const height = button.offsetHeight
              
              return (
                <motion.div
                  className="absolute rounded-ios-lg pointer-events-none z-0"
                  style={{
                    background: 'rgba(34, 211, 238, 0.15)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                    left: 0,
                    top: 0,
                  }}
                  initial={false}
                  animate={{
                    width,
                    height,
                    x,
                    y,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 120000,
                    damping: 20,
                    mass: 0.05,
                  }}
                />
              )
            })()}

            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isHovered = hoveredTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    buttonRefs.current[tab.id] = el
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-ios-lg transition-all relative z-10',
                    isActive || isHovered
                      ? 'text-cyan-400'
                      : 'text-white/60 hover:text-white/80'
                  )}
                >
                  <Icon className={clsx('w-5 h-5 relative z-10', (isActive || isHovered) && 'text-cyan-400 drop-shadow-sm')} />
                  <span className={clsx('text-xs font-medium relative z-10', (isActive || isHovered) && 'text-cyan-400 drop-shadow-sm')}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
        </div>
      </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleLogoutCancel}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800/95 backdrop-blur-xl rounded-ios-lg p-6 max-w-md w-full border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Выход из системы</h3>
              <button
                onClick={handleLogoutCancel}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-white/80 mb-6">
              Вы уверены, что хотите выйти из личного кабинета?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-ios-lg transition-colors font-medium border border-white/20"
              >
                Отмена
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-ios-lg transition-colors font-medium"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

