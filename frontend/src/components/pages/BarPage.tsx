import { useState } from 'react'
import { ShoppingBag, Package, Truck, Heart, FileText, Receipt, TrendingUp, Clock, HelpCircle, Search, Users, Box, ShoppingCart } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'
import clsx from 'clsx'
import DocumentsPage from './DocumentsPage'
import SuppliersPage from './SuppliersPage'
import InvoicesPage from './InvoicesPage'

interface BarPageProps {
  establishment: EstablishmentResponse
}

type MenuItem = {
  id: string
  label: string
  icon: any
}

export default function BarPage({ establishment }: BarPageProps) {
  const [activeMenuItem, setActiveMenuItem] = useState<string>('documents')

  const menuItems: MenuItem[] = [
    { id: 'documents', label: 'Документы', icon: FileText },
    { id: 'suppliers', label: 'Поставщики', icon: Users },
    { id: 'stock', label: 'Остатки', icon: Box },
    { id: 'smart-cart', label: 'Умная корзина', icon: ShoppingCart },
    { id: 'delivery', label: 'Доставка', icon: Truck },
    { id: 'favorites', label: 'Избранное', icon: Heart },
    { id: 'payments', label: 'Платежки', icon: Receipt },
    { id: 'invoices', label: 'Счета', icon: FileText },
    { id: 'analytics', label: 'Аналитика продаж', icon: TrendingUp },
    { id: 'deferral', label: 'Отсрочка', icon: Clock },
    { id: 'help', label: 'Помощь', icon: HelpCircle },
  ]

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'documents':
        return <DocumentsPage establishment={establishment} />
      case 'suppliers':
        return <SuppliersPage />
      case 'stock':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Box className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Остатки</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'smart-cart':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <ShoppingCart className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Умная корзина</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'delivery':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Truck className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Доставка</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'favorites':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Heart className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Избранное</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'payments':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Receipt className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Платежки</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'invoices':
        return <InvoicesPage />
      case 'analytics':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <TrendingUp className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Аналитика продаж</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'deferral':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Clock className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Отсрочка</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      case 'help':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Помощь</h3>
            <p className="text-white/60">Раздел в разработке</p>
          </div>
        )
      default:
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
            <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Раздел в разработке</h3>
            <p className="text-white/60">Выберите пункт меню</p>
          </div>
        )
    }
  }

  return (
    <div className="flex gap-6 justify-start">
      {/* Левая панель навигации */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg border border-white/20 p-4">
          {/* Поиск сверху */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Поиск..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-ios-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 text-sm"
              />
            </div>
          </div>

          {/* Меню */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenuItem === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenuItem(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-ios-lg transition-all text-left',
                    isActive
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-cyan-400')} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 space-y-6">
        {renderContent()}
      </div>
    </div>
  )
}

