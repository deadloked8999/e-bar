import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { DigitALCLogo } from './DigitALCLogo'
import { authApi } from '../api/auth'

interface ResetPasswordProps {
  onBack: () => void
  onSuccess: () => void
}

export default function ResetPassword({ onBack, onSuccess }: ResetPasswordProps) {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Валидация
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setError('Код должен состоять из 6 цифр')
      return
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
      // Через 2 секунды перенаправляем на страницу логина
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка при сбросе пароля. Проверьте код и попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen font-sf flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <DigitALCLogo />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Сброс пароля</h1>
          <p className="text-cyan-300">
            Введите код восстановления и новый пароль
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-ios-lg shadow-2xl p-8 border border-white/20"
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Пароль успешно изменен!</h2>
              <p className="text-cyan-200 mb-6">
                Теперь вы можете войти с новым паролем
              </p>
              <p className="text-sm text-cyan-200 animate-pulse">
                Перенаправление на страницу входа...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <span>Код восстановления (6 цифр)</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => {
                    // Разрешаем только цифры, максимум 6 символов
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setToken(value)
                  }}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className={clsx(
                    'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50 text-center text-2xl tracking-widest font-mono',
                    error
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                      : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                  )}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Новый пароль</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Введите новый пароль"
                    required
                    className={clsx(
                      'w-full px-4 py-3 pr-12 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                      error
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
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Подтверждение пароля</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    required
                    className={clsx(
                      'w-full px-4 py-3 pr-12 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                      error
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    title={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-ios-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !token || !newPassword || !confirmPassword}
                whileTap={!loading && token && newPassword && confirmPassword ? { scale: 0.98 } : {}}
                className={clsx(
                  'w-full py-4 rounded-ios-lg font-semibold text-lg transition-all flex items-center justify-center gap-2',
                  loading || !token || !newPassword || !confirmPassword
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-ios hover:from-cyan-500 hover:to-cyan-700'
                )}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Сброс пароля...</span>
                  </>
                ) : (
                  <span>Сбросить пароль</span>
                )}
              </motion.button>

              {/* Back Button */}
              <motion.button
                type="button"
                onClick={onBack}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-ios-lg font-medium transition-all bg-ios-gray-100 hover:bg-ios-gray-200 text-ios-gray-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Вернуться к входу</span>
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

