import { useState, useRef } from 'react'
import { User, Mail, Phone, Briefcase, Lock, Building, MapPin, Save, X, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react'
import { EstablishmentResponse } from '../../api/establishment'
import { establishmentApi } from '../../api/establishment'
import clsx from 'clsx'
import CustomSelect from '../CustomSelect'
import axios from 'axios'

interface ProfilePageProps {
  establishment: EstablishmentResponse
  onUpdate: (updated: EstablishmentResponse) => void
}

const ESTABLISHMENT_TYPES = [
  { value: 'bar', label: 'Бар' },
  { value: 'restaurant', label: 'Ресторан' },
  { value: 'club', label: 'Клуб' },
  { value: 'hotel', label: 'Отель' },
  { value: 'other', label: 'Другое' }
]

export default function ProfilePage({ establishment, onUpdate }: ProfilePageProps) {
  const [formData, setFormData] = useState({
    name: establishment.name || '',
    username: establishment.username || '',
    password: '',
    passwordConfirm: '',
    position: establishment.position || '',
    phone: establishment.phone || '',
    email: establishment.email || '',
    business_name: establishment.business_name || '',
    business_type: establishment.business_type || '',
    business_phone: (establishment as any).business_phone || '',
    website: (establishment as any).website || '',
    address: establishment.address || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const getLogoUrl = (logoPath: string | null | undefined) => {
    if (!logoPath) return null
    if (logoPath.startsWith('data:') || logoPath.startsWith('http')) return logoPath
    // Преобразуем путь в URL
    const normalizedPath = logoPath.replace(/\\/g, '/')
    if (normalizedPath.includes('uploads/logos/')) {
      return `/api/uploads/logos/${normalizedPath.split('logos/')[1]}`
    }
    return `/api/uploads/logos/${normalizedPath.split('/').pop()}`
  }
  const [logoPreview, setLogoPreview] = useState<string | null>(getLogoUrl((establishment as any).logo_path))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  const formatPhone = (value: string) => {
    // Удаляем все нецифры
    let digits = value.replace(/\D/g, '')
    
    // Если начинается с 8, заменяем на +7
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1)
    }
    
    // Если не начинается с 7, добавляем +7
    if (!digits.startsWith('7')) {
      digits = '7' + digits
    }
    
    // Ограничиваем до 11 цифр (7 + 10)
    digits = digits.slice(0, 11)
    
    // Форматируем: +7 (XXX) XXX-XX-XX
    if (digits.length > 1) {
      const code = digits.slice(1, 4)
      const part1 = digits.slice(4, 7)
      const part2 = digits.slice(7, 9)
      const part3 = digits.slice(9, 11)
      
      let formatted = '+7'
      if (code) formatted += ` (${code}`
      if (part1) formatted += `) ${part1}`
      if (part2) formatted += `-${part2}`
      if (part3) formatted += `-${part3}`
      
      return formatted
    }
    
    return digits ? '+7' : ''
  }

  const handlePhoneChange = (value: string, field: 'phone' | 'business_phone' = 'phone') => {
    const formatted = formatPhone(value)
    handleChange(field, formatted)
  }

  const formatWebsite = (value: string) => {
    if (!value) return ''
    
    // Убираем пробелы
    value = value.trim()
    
    // Если пусто, возвращаем пустую строку
    if (!value) return ''
    
    // Если уже есть протокол, возвращаем как есть
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }
    
    // Если нет протокола, добавляем https://
    return `https://${value}`
  }

  const handleWebsiteChange = (value: string) => {
    const formatted = formatWebsite(value)
    handleChange('website', formatted)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение')
      return
    }

    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB')
      return
    }

    setLogoUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(
        `/api/establishments/${establishment.id}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Создаем превью сразу из файла
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Обновляем данные заведения
      const updated = await establishmentApi.getEstablishment(establishment.id)
      onUpdate(updated)
      
      // Обновляем logo_path из ответа для постоянного отображения
      if (response.data.logo_path) {
        const logoUrl = `/api/uploads/logos/${response.data.logo_path.split('/').pop()}`
        setLogoPreview(logoUrl)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Logo upload error:', err)
      setError(err.response?.data?.detail || 'Ошибка при загрузке логотипа')
    } finally {
      setLogoUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      // Проверяем пароли, если они введены
      if (formData.password) {
        if (formData.password !== formData.passwordConfirm) {
          setError('Пароли не совпадают')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setError('Пароль должен содержать минимум 6 символов')
          setLoading(false)
          return
        }
      }

      // Подготавливаем данные для отправки (убираем пустой пароль и подтверждение)
      const updateData: any = { ...formData }
      delete updateData.passwordConfirm
      if (!updateData.password) {
        delete updateData.password
      }

      const updated = await establishmentApi.updateEstablishment(establishment.id, updateData)
      onUpdate(updated)
      setSuccess(true)
      // Очищаем поля паролей после успешного сохранения
      setFormData(prev => ({ ...prev, password: '', passwordConfirm: '' }))
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.response?.data?.detail || 'Ошибка при сохранении изменений')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="space-y-6 max-w-[35%] w-full">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-semibold text-white">Мой профиль</h1>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Личная информация */}
        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Личная информация
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Имя
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Логин
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Пароль (оставьте пустым, чтобы не менять)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Новый пароль"
                  className="w-full px-3 py-2 pr-10 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {formData.password && (
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={formData.passwordConfirm}
                    onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-3 py-2 pr-10 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Должность
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Телефон
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>
          </div>
        </div>

        {/* Информация о заведении */}
        <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Информация о заведении
          </h2>
          
          <div className="space-y-4">
            {/* Логотип компании */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Логотип компании
              </label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview}
                      alt="Логотип компании" 
                      className="w-24 h-24 object-cover rounded-ios-lg border border-white/20"
                      onError={(e) => {
                        // Если не удалось загрузить, показываем placeholder
                        setLogoPreview(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-ios-lg flex items-center justify-center bg-white/5">
                    <ImageIcon className="w-8 h-8 text-white/40" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    disabled={logoUploading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={clsx(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-ios-lg border border-white/20 cursor-pointer transition-all',
                      logoUploading
                        ? 'bg-white/5 text-white/50 cursor-not-allowed'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{logoUploading ? 'Загрузка...' : logoPreview ? 'Изменить логотип' : 'Загрузить логотип'}</span>
                  </label>
                  <p className="text-xs text-white/50 mt-1">JPG, PNG, GIF, WebP до 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Название заведения
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Тип заведения
              </label>
              <CustomSelect
                value={formData.business_type}
                onChange={(value) => handleChange('business_type', value)}
                options={ESTABLISHMENT_TYPES}
                placeholder="Выберите тип"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Телефон заведения
              </label>
              <input
                type="text"
                value={formData.business_phone || ''}
                onChange={(e) => handlePhoneChange(e.target.value, 'business_phone')}
                placeholder="+7 (XXX) XXX-XX-XX"
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Сайт заведения
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleWebsiteChange(e.target.value)}
                onBlur={(e) => {
                  // При потере фокуса форматируем URL
                  const formatted = formatWebsite(e.target.value)
                  if (formatted !== e.target.value) {
                    handleChange('website', formatted)
                  }
                }}
                placeholder="example.com или https://example.com"
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Адрес
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                required
              />
            </div>
          </div>
        </div>

        {/* Сообщения об ошибке и успехе */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-ios-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-400/30 rounded-ios-lg p-3 text-green-300 text-sm">
            Изменения успешно сохранены!
          </div>
        )}

        {/* Кнопка сохранения */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-ios-lg font-semibold transition-all duration-300',
              'relative overflow-hidden',
              loading
                ? 'text-white/50 cursor-not-allowed'
                : 'text-white hover:scale-105'
            )}
            style={{
              background: loading 
                ? 'rgba(255, 255, 255, 0.03)' 
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: loading
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Внутренний блик сверху */}
            <div 
              className="absolute inset-0 rounded-ios-lg pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%)',
              }}
            />
            {/* Дополнительный блик при наведении */}
            {!loading && (
              <div 
                className="absolute inset-0 rounded-ios-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
                }}
              />
            )}
            <Save className="w-5 h-5 relative z-10 drop-shadow-sm" />
            <span className="relative z-10 drop-shadow-sm">{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

