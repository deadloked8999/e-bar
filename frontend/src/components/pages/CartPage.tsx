import { ShoppingCart, Package } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'

interface CartPageProps {
  establishment: EstablishmentResponse
}

export default function CartPage({ establishment }: CartPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-semibold text-white">Корзина</h1>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 text-center border border-white/20">
        <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Корзина пуста</h3>
        <p className="text-white/60">
          Добавьте товары из раздела "Бар" для оформления заказа
        </p>
      </div>
    </div>
  )
}

