import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Briefcase, Lock, UserCircle, Building, MapPin, FileText, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import CustomSelect from './CustomSelect'
import { DigitALCLogo } from './DigitALCLogo'

interface UserRegistrationProps {
  onRegistrationComplete: (userData: UserData) => void
}

export interface UserData {
  // Личная информация
  name: string
  username: string
  password: string
  position: string
  phone: string
  email: string
  // Информация о заведении
  establishmentName: string
  establishmentType: string
  address: string
  inn: string
  ogrn: string
}

const ESTABLISHMENT_TYPES = [
  { value: 'bar', label: 'Бар' },
  { value: 'restaurant', label: 'Ресторан' },
  { value: 'club', label: 'Клуб' },
  { value: 'hotel', label: 'Отель' },
  { value: 'other', label: 'Другое' }
]

export default function UserRegistration({ onRegistrationComplete }: UserRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<UserData>({
    name: '',
    username: '',
    password: '',
    position: '',
    phone: '',
    email: '',
    establishmentName: '',
    establishmentType: '',
    address: '',
    inn: '',
    ogrn: ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof UserData, string>>>({})

  const handleChange = (field: keyof UserData, value: string) => {
    // Специальная обработка для поля телефона
    if (field === 'phone') {
      // Удаляем все символы кроме цифр и +
      let cleaned = value.replace(/[^\d+]/g, '')
      
      // Если начинается с 8, заменяем на +7
      if (cleaned.startsWith('8')) {
        cleaned = '+7' + cleaned.slice(1)
      }
      // Если не начинается с +7, добавляем +7
      else if (!cleaned.startsWith('+7')) {
        // Удаляем + если есть
        cleaned = cleaned.replace(/^\+/, '')
        // Добавляем +7
        cleaned = '+7' + cleaned
      }
      
      // Ограничиваем до 12 символов (+7 + 10 цифр)
      if (cleaned.length > 12) {
        cleaned = cleaned.slice(0, 12)
      }
      
      // Проверяем, что после +7 не более 10 цифр
      const digitsAfterPlus = cleaned.replace(/^\+7/, '').replace(/\D/g, '')
      if (digitsAfterPlus.length > 10) {
        cleaned = '+7' + digitsAfterPlus.slice(0, 10)
      }
      
      setFormData(prev => ({ ...prev, [field]: cleaned }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof UserData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Введите логин'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Логин должен быть не менее 3 символов'
    }

    if (!formData.password) {
      newErrors.password = 'Введите пароль'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов'
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Введите должность'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон'
    } else {
      // Проверяем формат телефона: должен начинаться с +7 и содержать 10 цифр после
      const phoneDigits = formData.phone.replace(/^\+7/, '').replace(/\D/g, '')
      if (!formData.phone.startsWith('+7')) {
        newErrors.phone = 'Телефон должен начинаться с +7'
      } else if (phoneDigits.length !== 10) {
        newErrors.phone = 'Телефон должен содержать 10 цифр после +7'
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof UserData, string>> = {}

    if (!formData.establishmentName.trim()) {
      newErrors.establishmentName = 'Введите название заведения'
    }

    if (!formData.establishmentType) {
      newErrors.establishmentType = 'Выберите тип заведения'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Введите адрес заведения'
    }

    if (!formData.inn.trim()) {
      newErrors.inn = 'Введите ИНН'
    } else if (!/^\d{10}$|^\d{12}$/.test(formData.inn.replace(/\s/g, ''))) {
      newErrors.inn = 'ИНН должен содержать 10 или 12 цифр'
    }

    if (!formData.ogrn.trim()) {
      newErrors.ogrn = 'Введите ОГРН'
    } else if (!/^\d{13}$|^\d{15}$/.test(formData.ogrn.replace(/\s/g, ''))) {
      newErrors.ogrn = 'ОГРН должен содержать 13 или 15 цифр'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 2 && validateStep2()) {
      onRegistrationComplete(formData)
    }
  }

  const isStep1Valid = () => {
    return formData.name.trim() !== '' &&
           formData.username.trim() !== '' &&
           formData.password.trim() !== '' &&
           formData.position.trim() !== '' &&
           formData.phone.trim() !== '' &&
           formData.email.trim() !== ''
  }

  const isStep2Valid = () => {
    return formData.establishmentName.trim() !== '' &&
           formData.establishmentType !== '' &&
           formData.address.trim() !== '' &&
           formData.inn.trim() !== '' &&
           formData.ogrn.trim() !== ''
  }

  return (
    <div className="min-h-screen font-sf flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* Page Number */}
          <div className="mb-4">
            <span className="text-cyan-400 text-sm font-medium">Страница 2 из 3</span>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <DigitALCLogo />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Регистрация</h1>
          <p className="text-cyan-300">
            {currentStep === 1 ? 'Создайте аккаунт для доступа к системе DigitALC' : 'Информация о заведении'}
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                currentStep >= 1 ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white/20 text-white/50 hover:bg-white/30'
              )}
              title="Шаг 1: Личная информация"
            >
              1
            </button>
            <div className={clsx(
              'h-1 w-16 transition-all',
              currentStep >= 2 ? 'bg-cyan-500' : 'bg-white/20'
            )} />
            <button
              onClick={() => setCurrentStep(2)}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                currentStep >= 2 ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white/20 text-white/50 hover:bg-white/30'
              )}
              title="Шаг 2: Информация о заведении"
            >
              2
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-ios-lg shadow-2xl p-8 border border-white/20"
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-1">Личная информация</h2>
                  <p className="text-sm text-cyan-200">Заполните все поля для регистрации</p>
                </div>

                <form onSubmit={handleNext} className="space-y-5">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Имя</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Введите ваше имя"
                className={clsx(
                        'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                        errors.name
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Логин */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  <span>Логин</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Введите логин"
                className={clsx(
                  'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                  errors.username
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                )}
              />
              {errors.username && (
                <p className="text-xs text-red-400 mt-1">{errors.username}</p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Пароль</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Введите пароль"
                  className={clsx(
                    'w-full px-4 py-3 pr-12 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                    errors.password
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                      : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Должность */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Должность</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Введите вашу должность"
                className={clsx(
                  'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                  errors.position
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                )}
              />
              {errors.position && (
                <p className="text-xs text-red-400 mt-1">{errors.position}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Телефон</span>
                </div>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className={clsx(
                  'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                  errors.phone
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                )}
              />
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@email.com"
                className={clsx(
                  'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                  errors.email
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

                  {/* Next Button */}
                  <motion.button
                    type="submit"
                    disabled={!isStep1Valid()}
                    whileTap={isStep1Valid() ? { scale: 0.98 } : {}}
                    className={clsx(
                      'w-full py-4 rounded-ios-lg font-semibold text-lg transition-all mt-8 flex items-center justify-center gap-2',
                      isStep1Valid()
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-ios hover:from-cyan-500 hover:to-cyan-700'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    )}
                  >
                    <span>Продолжить</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-1">Информация о заведении</h2>
                  <p className="text-sm text-cyan-200">Укажите данные о вашем заведении</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Название заведения */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>Название заведения</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.establishmentName}
                      onChange={(e) => handleChange('establishmentName', e.target.value)}
                      placeholder="Введите название заведения"
                      className={clsx(
                        'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                        errors.establishmentName
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                      )}
                    />
                    {errors.establishmentName && (
                      <p className="text-xs text-red-400 mt-1">{errors.establishmentName}</p>
                    )}
                  </div>

                  {/* Тип заведения */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>Тип заведения</span>
                      </div>
                    </label>
                    <CustomSelect
                      value={formData.establishmentType}
                      onChange={(value) => handleChange('establishmentType', value)}
                      options={ESTABLISHMENT_TYPES}
                      placeholder="Выберите тип заведения"
                      error={errors.establishmentType}
                    />
                    {errors.establishmentType && (
                      <p className="text-xs text-red-400 mt-1">{errors.establishmentType}</p>
                    )}
                  </div>

                  {/* Адрес заведения */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Адрес заведения</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Введите адрес или выберите на карте"
                      className={clsx(
                        'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                        errors.address
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                      )}
                    />
                    <p className="text-xs text-cyan-200/70 mt-1">
                      Выбор на карте будет доступен после подключения API Яндекс.Карт
                    </p>
                    {errors.address && (
                      <p className="text-xs text-red-400 mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* ИНН */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>ИНН</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.inn}
                      onChange={(e) => handleChange('inn', e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890"
                      maxLength={12}
                      className={clsx(
                        'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                        errors.inn
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                      )}
                    />
                    {errors.inn && (
                      <p className="text-xs text-red-400 mt-1">{errors.inn}</p>
                    )}
                  </div>

                  {/* ОГРН */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>ОГРН</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.ogrn}
                      onChange={(e) => handleChange('ogrn', e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890123"
                      maxLength={15}
                      className={clsx(
                        'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                        errors.ogrn
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                      )}
                    />
                    {errors.ogrn && (
                      <p className="text-xs text-red-400 mt-1">{errors.ogrn}</p>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 mt-8">
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-4 rounded-ios-lg font-semibold text-lg transition-all bg-ios-gray-100 hover:bg-ios-gray-200 text-ios-gray-700 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Назад</span>
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={!isStep2Valid()}
                      whileTap={isStep2Valid() ? { scale: 0.98 } : {}}
                      className={clsx(
                        'flex-1 py-4 rounded-ios-lg font-semibold text-lg transition-all flex items-center justify-center gap-2',
                        isStep2Valid()
                          ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-ios hover:from-cyan-500 hover:to-cyan-700'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      )}
                    >
                      <span>Перейти к загрузке документов</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

