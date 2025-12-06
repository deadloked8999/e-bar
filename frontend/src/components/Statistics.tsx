import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import { documentsApi } from '../api/documents'

export default function Statistics() {
  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: documentsApi.getStatistics,
  })

  const cards = [
    {
      label: 'Всего документов',
      value: stats?.total || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'На проверке',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Проверено',
      value: stats?.verified || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Отклонено',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-ios-lg shadow-ios p-5 hover:shadow-ios-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-ios bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div className={`px-3 py-1 rounded-full ${card.bgColor}`}>
              <span className={`text-2xl font-bold ${card.textColor}`}>
                {card.value}
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-ios-gray-600">{card.label}</h3>
        </motion.div>
      ))}
    </div>
  )
}

