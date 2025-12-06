import { LogIn, UserCircle, FileText } from 'lucide-react'
import clsx from 'clsx'

interface PageNavigatorProps {
  currentPage: 'login' | 'registration' | 'main'
  onPageChange: (page: 'login' | 'registration' | 'main') => void
}

export default function PageNavigator({ currentPage, onPageChange }: PageNavigatorProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-slate-800/90 backdrop-blur-lg border border-white/20 rounded-full px-3 py-2 shadow-2xl flex items-center gap-2">
        <button
          onClick={() => onPageChange('login')}
          className={clsx(
            'p-2 rounded-full transition-all',
            currentPage === 'login'
              ? 'bg-cyan-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
          title="Страница 1: Вход"
        >
          <LogIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange('registration')}
          className={clsx(
            'p-2 rounded-full transition-all',
            currentPage === 'registration'
              ? 'bg-cyan-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
          title="Страница 2: Регистрация"
        >
          <UserCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange('main')}
          className={clsx(
            'p-2 rounded-full transition-all',
            currentPage === 'main'
              ? 'bg-cyan-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
          title="Страница 3: Основное приложение"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

