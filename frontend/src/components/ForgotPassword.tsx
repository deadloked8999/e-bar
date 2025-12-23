import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import { DigitALCLogo } from './DigitALCLogo'
import { authApi } from '../api/auth'

interface ForgotPasswordProps {
  onBack: () => void
  onTokenSent: () => void
}

export default function ForgotPassword({ onBack, onTokenSent }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
      // Через 3 секунды переходим на страницу сброса пароля
      setTimeout(() => {
        onTokenSent()
      }, 3000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка при отправке запроса. Попробуйте еще раз.')
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
          <h1 className="text-3xl font-bold text-white mb-2">Восстановление пароля</h1>
          <p className="text-cyan-300">
            Введите email для получения кода восстановления
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
              <h2 className="text-xl font-semibold text-white mb-2">Код отправлен!</h2>
              <p className="text-cyan-200 mb-4">
                Код восстановления отправлен в консоль разработчика
              </p>
              <p className="text-sm text-cyan-300/70 mb-6">
                Проверьте backend terminal для получения кода
              </p>
              <p className="text-sm text-cyan-200 animate-pulse">
                Перенаправление на страницу сброса пароля...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className={clsx(
                    'w-full px-4 py-3 border rounded-ios-lg outline-none transition-all bg-white/5 text-white placeholder-white/50',
                    error
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                      : 'border-white/20 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400'
                  )}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-ios-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !email}
                whileTap={!loading && email ? { scale: 0.98 } : {}}
                className={clsx(
                  'w-full py-4 rounded-ios-lg font-semibold text-lg transition-all flex items-center justify-center gap-2',
                  loading || !email
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-white shadow-ios hover:from-cyan-500 hover:to-cyan-700'
                )}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Отправка...</span>
                  </>
                ) : (
                  <span>Отправить код восстановления</span>
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

