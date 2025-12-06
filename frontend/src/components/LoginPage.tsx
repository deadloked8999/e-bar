import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Building, CheckCircle, Zap, Shield, FileText, Clock, Store, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { DigitALCLogo } from './DigitALCLogo'
import { authApi } from '../api/auth'
import { EstablishmentResponse } from '../api/establishment'

interface LoginPageProps {
  onLogin: (establishment: EstablishmentResponse) => void
  onRegister: () => void
}

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [userType, setUserType] = useState<'horeca' | 'distributor'>('horeca')
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Загружаем сохраненные данные при монтировании только если была отмечена галочка
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    const wasRemembered = localStorage.getItem('rememberMe') === 'true'
    if (savedUsername && wasRemembered) {
      setLoginData({ username: savedUsername, password: '' })
      setRememberMe(true)
    } else {
      // Очищаем данные, если галочка не была отмечена
      setLoginData({ username: '', password: '' })
      setRememberMe(false)
      localStorage.removeItem('rememberedUsername')
      localStorage.removeItem('rememberMe')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Пока только для HORECA
      if (userType !== 'horeca') {
        setError('Вход для дистрибьютеров пока не доступен')
        setLoading(false)
        return
      }

      const establishment = await authApi.login(loginData.username, loginData.password)
      
      // Сохраняем логин, если галочка "Запомнить меня" отмечена
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', loginData.username)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberedUsername')
        localStorage.removeItem('rememberMe')
      }
      
      onLogin(establishment)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.response?.data?.detail || 'Ошибка при входе. Проверьте логин и пароль.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen font-sf flex">
      {/* Left Side - Description */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <DigitALCLogo />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-4">
            Умная экосистема закупок алкоголя для HoReCa
          </h2>

          <p className="text-cyan-200 text-lg mb-8 leading-relaxed">
            Одна платформа. Один профиль. Все проверенные поставщики.
          </p>

          <p className="text-white/80 mb-8 leading-relaxed">
            Заказы, автозаказы, цены, лицензии, документы и отсрочки - в одном месте.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-white/80">Проверяет лицензии и юридические данные</p>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-white/80">Подбирает лучших поставщиков</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-white/80">Автоматизирует закупки</p>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-white/80">Контролирует остатки, формирует договоры, проводит ЭДО</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-white/80">Даёт безопасную отсрочку платежа на основе реального оборота и ЕГАИС</p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-ios-lg p-4">
            <p className="text-cyan-200 text-sm">
              DigitALC берёт на себя всю рутину бара
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Page Number */}
          <div className="text-center mb-4">
            <span className="text-cyan-400 text-sm font-medium">Страница 1 из 3</span>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <DigitALCLogo />
          </div>

          {/* User Type Selector */}
          <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-2 mb-4 border border-white/20">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserType('horeca')}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  userType === 'horeca'
                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <Building className="w-5 h-5" />
                <span>HoReCa</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('distributor')}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  userType === 'distributor'
                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <Store className="w-5 h-5" />
                <span>Дистрибьютер</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-8 border border-white/20"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Вход в систему</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Логин или Email
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Введите логин или email"
                  className="w-full px-4 py-3 border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 pr-12 border border-white/20 rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-white/80 cursor-pointer">
                  Запомнить меня
                </label>
              </div>
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-ios-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={loading ? {} : { scale: 0.98 }}
                className={clsx(
                  'w-full py-4 rounded-ios-lg font-semibold text-lg transition-all shadow-ios mb-4',
                  loading
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white hover:from-cyan-500 hover:to-cyan-700'
                )}
              >
                {loading ? 'Вход...' : 'Войти'}
              </motion.button>
              <motion.button
                type="button"
                onClick={onRegister}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-ios-lg font-semibold text-lg transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Регистрация</span>
                </div>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

