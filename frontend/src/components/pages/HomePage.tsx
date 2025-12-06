import { Building, CheckCircle, Clock, FileText } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'
import { DigitALCLogo } from '../DigitALCLogo'

interface HomePageProps {
  establishment: EstablishmentResponse
}

export default function HomePage({ establishment }: HomePageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <DigitALCLogo />
          <div>
            <h1 className="text-2xl font-semibold text-white">Добро пожаловать!</h1>
            <p className="text-cyan-300 text-sm">{establishment.business_name}</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Информация о заведении</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-white/80">
              <span className="text-cyan-300">Тип:</span> {establishment.business_type}
            </p>
            <p className="text-white/80">
              <span className="text-cyan-300">Адрес:</span> {establishment.address}
            </p>
            <p className="text-white/80">
              <span className="text-cyan-300">ИНН:</span> {establishment.inn}
            </p>
            <p className="text-white/80">
              <span className="text-cyan-300">ОГРН:</span> {establishment.ogrn}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Документы</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/80">Документы загружены</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80">На проверке</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-ios-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Быстрые действия</h3>
        <p className="text-white/80 text-sm">
          Используйте нижнюю панель навигации для перехода между разделами приложения.
        </p>
      </div>
    </div>
  )
}

