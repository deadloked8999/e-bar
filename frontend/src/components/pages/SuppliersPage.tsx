import { useState, useMemo, useEffect } from 'react'
import { Users, FileSignature, TrendingUp, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'

type SupplierTab = 'active' | 'pending' | 'purchases'
type PeriodType = 'month' | 'months' | 'year'

interface Supplier {
  id: number
  name: string
  monthlyAmount: number
}

const activeSuppliers: Supplier[] = [
  { id: 1, name: 'Beluga Group', monthlyAmount: 1250000 },
  { id: 2, name: 'AST (АСТ-Интернэшнл Инваэронмэнт)', monthlyAmount: 890000 },
  { id: 3, name: 'Luding Group', monthlyAmount: 2100000 },
  { id: 4, name: 'Alianta Group', monthlyAmount: 1560000 },
  { id: 5, name: 'Ladoga', monthlyAmount: 980000 },
  { id: 6, name: 'Roust', monthlyAmount: 1750000 },
  { id: 7, name: 'Novabev Group', monthlyAmount: 1420000 },
]

const pendingSuppliers: string[] = [
  'Alvisa',
  'VVP Wine',
  'Алкогольная Сибирская Группа',
]

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

// Генерация вымышленных данных закупок для поставщика
// Декабрь всегда равен базовой сумме, остальные месяцы варьируются
const generateSupplierPurchases = (supplierName: string, baseAmount: number) => {
  const purchases: Record<string, number> = {}
  const currentMonth = new Date().getMonth() // 0-11, где 11 = декабрь
  
  months.forEach((month, index) => {
    if (index === 11) {
      // Декабрь всегда равен базовой сумме
      purchases[month] = baseAmount
    } else {
      // Остальные месяцы: генерируем суммы от 50% до 150% от базовой суммы
      // Используем индекс месяца для стабильной генерации
      const seed = supplierName.charCodeAt(0) + index
      const normalizedSeed = (seed % 100) / 100
      const variation = baseAmount * 0.5
      purchases[month] = Math.round(baseAmount - variation + normalizedSeed * variation * 2)
    }
  })
  return purchases
}

interface Payment {
  id: number
  date: string
  amount: number
  invoiceNumber: string
  description: string
}

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<SupplierTab>('active')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<Supplier | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [supplierPurchasesCache, setSupplierPurchasesCache] = useState<Record<string, Record<string, number>>>({})
  const [selectedMonthForDetails, setSelectedMonthForDetails] = useState<number>(new Date().getMonth())

  // Генерируем данные для выбранного поставщика один раз и кешируем
  useEffect(() => {
    if (selectedSupplier && !supplierPurchasesCache[selectedSupplier.name]) {
      const purchases = generateSupplierPurchases(selectedSupplier.name, selectedSupplier.monthlyAmount)
      setSupplierPurchasesCache(prev => ({
        ...prev,
        [selectedSupplier.name]: purchases
      }))
    }
  }, [selectedSupplier])

  // Генерация платежек для поставщика за месяц
  const generatePayments = (supplier: Supplier, monthIndex: number, year: number): Payment[] => {
    const purchases = getSupplierPurchases(supplier.name)
    const monthName = months[monthIndex]
    const totalAmount = purchases[monthName] || supplier.monthlyAmount
    
    // Генерируем от 5 до 15 платежек
    const numPayments = 5 + Math.floor((supplier.name.charCodeAt(0) + monthIndex) % 11)
    
    const payments: Payment[] = []
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    
    // Минимальная сумма платежки (1% от общей суммы, но не менее 1000 рублей)
    const minAmount = Math.max(1000, Math.round(totalAmount * 0.01))
    
    // Генерируем проценты для каждой платежки (сумма = 100%)
    // Каждая платежка должна быть минимум 1% от общей суммы
    const percentages: number[] = []
    let totalPercentage = 0
    
    for (let i = 0; i < numPayments; i++) {
      if (i === numPayments - 1) {
        // Последняя платежка = остаток до 100%
        const remaining = 100 - totalPercentage
        percentages.push(Math.max(1, remaining)) // Минимум 1%
      } else {
        // Остальные: от 5% до 25% от общей суммы
        const seed = (supplier.name.charCodeAt(0) + monthIndex + i) % 20
        const percentage = 5 + seed // от 5% до 24%
        percentages.push(percentage)
        totalPercentage += percentage
      }
    }
    
    // Нормализуем, если сумма превысила 100%
    if (totalPercentage > 100) {
      const factor = (100 - (numPayments - 1)) / (totalPercentage - percentages[numPayments - 1])
      for (let i = 0; i < numPayments - 1; i++) {
        percentages[i] = Math.max(1, percentages[i] * factor)
      }
      percentages[numPayments - 1] = Math.max(1, 100 - percentages.slice(0, -1).reduce((sum, p) => sum + p, 0))
    }
    
    // Генерируем платежки
    let distributedAmount = 0
    for (let i = 0; i < numPayments; i++) {
      let amount = i === numPayments - 1
        ? totalAmount - distributedAmount // Последняя = остаток для точности
        : Math.round(totalAmount * percentages[i] / 100)
      
      // Гарантируем минимальную сумму
      if (amount < minAmount) {
        amount = minAmount
      }
      
      distributedAmount += amount
      
      // Генерируем дату в пределах месяца
      const day = 1 + Math.floor((supplier.name.charCodeAt(0) + monthIndex + i) % daysInMonth)
      const date = new Date(year, monthIndex, day)
      
      payments.push({
        id: i + 1,
        date: date.toLocaleDateString('ru-RU'),
        amount,
        invoiceNumber: `INV-${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        description: `Платежка №${i + 1} за ${monthName.toLowerCase()} ${year}`
      })
    }
    
    // Корректируем последнюю платежку, чтобы сумма была точной
    const actualTotal = payments.reduce((sum, p) => sum + p.amount, 0)
    const difference = totalAmount - actualTotal
    if (difference !== 0 && payments.length > 0) {
      payments[payments.length - 1].amount += difference
      // Если после корректировки последняя платежка стала меньше минимума, перераспределяем
      if (payments[payments.length - 1].amount < minAmount) {
        const shortage = minAmount - payments[payments.length - 1].amount
        payments[payments.length - 1].amount = minAmount
        // Берем из предпоследней платежки
        if (payments.length > 1 && payments[payments.length - 2].amount > minAmount + shortage) {
          payments[payments.length - 2].amount -= shortage
        }
      }
    }
    
    // Сортируем по дате
    return payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Получаем кешированные данные или пустой объект
  const getSupplierPurchases = (supplierName: string): Record<string, number> => {
    return supplierPurchasesCache[supplierName] || {}
  }

  return (
    <div className="space-y-6">
      {/* Вкладки */}
      <div className="flex gap-2 border-b border-white/20">
        <button
          onClick={() => setActiveTab('active')}
          className={clsx(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'active'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Действующие</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'pending'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            <span>Ожидают подписи</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={clsx(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'purchases'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Закупки</span>
          </div>
        </button>
      </div>

      {/* Контент вкладок */}
      <div className="bg-white/10 backdrop-blur-lg rounded-ios-lg p-6 border border-white/20">
        {activeTab === 'active' && !selectedSupplierForDetails && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Действующие поставщики</h3>
              <div className="text-right">
                <p className="text-sm text-white/80">
                  {new Date().toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-white/60">
                  {new Date().toLocaleDateString('ru-RU', { year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {activeSuppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplierForDetails(supplier)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-ios-lg border border-white/10 hover:border-cyan-400/30 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-white">{supplier.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-cyan-400">
                      {formatAmount(supplier.monthlyAmount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </div>
                </button>
              ))}
            </div>
            
            {/* Итого за текущий месяц */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">
                  Итого заказов за {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', day: 'numeric' })}
                </span>
                <span className="text-sm font-semibold text-white">
                  {activeSuppliers.length} {activeSuppliers.length === 1 ? 'поставщик' : activeSuppliers.length < 5 ? 'поставщика' : 'поставщиков'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">Итого сумма заказов:</span>
                <span className="text-xl font-bold text-cyan-400">
                  {formatAmount(activeSuppliers.reduce((sum, supplier) => sum + supplier.monthlyAmount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && selectedSupplierForDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSupplierForDetails(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ← Назад
                </button>
                <h3 className="text-lg font-semibold text-white">{selectedSupplierForDetails.name}</h3>
              </div>
            </div>

            {/* Выбор месяца */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-white/80">Месяц:</span>
              <select
                value={selectedMonthForDetails}
                onChange={(e) => setSelectedMonthForDetails(Number(e.target.value))}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-ios-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                {months.map((month, index) => (
                  <option key={index} value={index} className="bg-slate-800">{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-ios-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year} className="bg-slate-800">{year}</option>
                ))}
              </select>
            </div>

            {/* Список платежек */}
            {(() => {
              const payments = generatePayments(selectedSupplierForDetails, selectedMonthForDetails, selectedYear)
              const purchases = getSupplierPurchases(selectedSupplierForDetails.name)
              const monthName = months[selectedMonthForDetails]
              const totalAmount = purchases[monthName] || selectedSupplierForDetails.monthlyAmount
              const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0)

              return (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-ios-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/80">
                        Платежки за {monthName} {selectedYear}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {payments.length} {payments.length === 1 ? 'платежка' : payments.length < 5 ? 'платежки' : 'платежек'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-white">Итого сумма:</span>
                      <span className="text-xl font-bold text-cyan-400">
                        {formatAmount(paymentsTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-ios-lg border border-white/10 hover:border-cyan-400/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium text-white">{payment.invoiceNumber}</span>
                            <span className="text-xs text-white/60">{payment.date}</span>
                          </div>
                          <p className="text-xs text-white/70">{payment.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-cyan-400 ml-4">
                          {formatAmount(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Ожидают подписи</h3>
            <div className="space-y-2">
              {pendingSuppliers.map((supplier, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-ios-lg border border-white/10 hover:border-yellow-400/30 transition-colors"
                >
                  <span className="text-sm font-medium text-white">{supplier}</span>
                  <span className="text-xs text-yellow-400/80">Ожидает подписи</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'purchases' && !selectedSupplier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Закупки по поставщикам</h3>
            </div>
            <div className="space-y-2">
              {activeSuppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-ios-lg border border-white/10 hover:border-cyan-400/30 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-white">{supplier.name}</span>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'purchases' && selectedSupplier && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ← Назад
                </button>
                <h3 className="text-lg font-semibold text-white">{selectedSupplier.name}</h3>
              </div>
            </div>

            {/* Выбор года */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-white/80">Год:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-ios-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year} className="bg-slate-800">{year}</option>
                ))}
              </select>
            </div>

            {/* Выбор типа периода */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-white/80">Период:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriodType('month')}
                  className={clsx(
                    'px-4 py-2 rounded-ios-lg text-sm font-medium transition-colors',
                    periodType === 'month'
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/20'
                  )}
                >
                  Месяц
                </button>
                <button
                  onClick={() => setPeriodType('months')}
                  className={clsx(
                    'px-4 py-2 rounded-ios-lg text-sm font-medium transition-colors',
                    periodType === 'months'
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/20'
                  )}
                >
                  Несколько месяцев
                </button>
                <button
                  onClick={() => setPeriodType('year')}
                  className={clsx(
                    'px-4 py-2 rounded-ios-lg text-sm font-medium transition-colors',
                    periodType === 'year'
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/20'
                  )}
                >
                  Год
                </button>
              </div>
            </div>

            {/* Выбор месяца */}
            {periodType === 'month' && (
              <div className="mb-4">
                <span className="text-sm text-white/80 mb-2 block">Выберите месяц:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-ios-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index} className="bg-slate-800">{month}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Выбор нескольких месяцев */}
            {periodType === 'months' && (
              <div className="mb-4">
                <span className="text-sm text-white/80 mb-2 block">Выберите месяцы:</span>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-ios-lg border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMonths([...selectedMonths, index])
                          } else {
                            setSelectedMonths(selectedMonths.filter(m => m !== index))
                          }
                        }}
                        className="w-4 h-4 text-cyan-400 bg-white/5 border-white/20 rounded focus:ring-cyan-400/50"
                      />
                      <span className="text-xs text-white">{month}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Результат */}
            <div className="bg-white/5 rounded-ios-lg p-6 border border-white/10 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-semibold text-white">Сумма за период</h4>
              </div>
              {(() => {
                const purchases = getSupplierPurchases(selectedSupplier.name)
                if (Object.keys(purchases).length === 0) {
                  return <p className="text-sm text-white/60">Загрузка данных...</p>
                }
                let total = 0
                let periodText = ''

                if (periodType === 'month') {
                  total = purchases[months[selectedMonth]]
                  periodText = `${months[selectedMonth]} ${selectedYear}`
                } else if (periodType === 'months') {
                  if (selectedMonths.length === 0) {
                    return (
                      <p className="text-sm text-white/60">Выберите хотя бы один месяц</p>
                    )
                  }
                  total = selectedMonths.reduce((sum, monthIndex) => {
                    return sum + purchases[months[monthIndex]]
                  }, 0)
                  periodText = selectedMonths.map(m => months[m]).join(', ') + ` ${selectedYear}`
                } else {
                  total = Object.values(purchases).reduce((sum, amount) => sum + amount, 0)
                  periodText = `Весь ${selectedYear} год`
                }

                return (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Период: {periodText}</p>
                    <p className="text-3xl font-bold text-cyan-400">{formatAmount(total)}</p>
                  </div>
                )
              })()}
            </div>

            {/* График по месяцам */}
            <div className="bg-white/5 rounded-ios-lg p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-semibold text-white">Аналитика по месяцам</h4>
              </div>
              {(() => {
                const purchases = getSupplierPurchases(selectedSupplier.name)
                if (Object.keys(purchases).length === 0) {
                  return <p className="text-sm text-white/60">Загрузка данных...</p>
                }
                const monthlyData = months.map((month, index) => ({
                  month,
                  amount: purchases[month],
                  index
                }))
                
                const maxAmount = Math.max(...monthlyData.map(d => d.amount))
                const minAmount = Math.min(...monthlyData.map(d => d.amount))
                const range = maxAmount - minAmount || 1
                
                const chartWidth = 800
                const chartHeight = 300
                const padding = 40
                const barWidth = (chartWidth - padding * 2) / monthlyData.length - 10
                const barMaxHeight = chartHeight - padding * 2

                return (
                  <div className="overflow-x-auto">
                    <svg width={chartWidth} height={chartHeight} className="w-full">
                      {/* Ось Y - значения */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const value = minAmount + range * ratio
                        const y = padding + barMaxHeight * (1 - ratio)
                        return (
                          <g key={ratio}>
                            <line
                              x1={padding}
                              y1={y}
                              x2={chartWidth - padding}
                              y2={y}
                              stroke="rgba(255, 255, 255, 0.1)"
                              strokeWidth="1"
                            />
                            <text
                              x={padding - 10}
                              y={y + 4}
                              fill="rgba(255, 255, 255, 0.6)"
                              fontSize="10"
                              textAnchor="end"
                            >
                              {formatAmount(value)}
                            </text>
                          </g>
                        )
                      })}

                      {/* Столбцы графика */}
                      {monthlyData.map((data, index) => {
                        const barHeight = ((data.amount - minAmount) / range) * barMaxHeight
                        const x = padding + index * (barWidth + 10) + 5
                        const y = padding + barMaxHeight - barHeight
                        
                        // Определяем цвет: зеленый если вырос, красный если упал
                        const prevAmount = index > 0 ? monthlyData[index - 1].amount : data.amount
                        const isGrowth = data.amount >= prevAmount
                        const color = isGrowth ? '#22d3ee' : '#f87171'
                        
                        return (
                          <g key={index}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill={color}
                              rx="4"
                              opacity="0.8"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 5}
                              fill="white"
                              fontSize="10"
                              textAnchor="middle"
                              fontWeight="500"
                            >
                              {formatAmount(data.amount)}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight - padding + 20}
                              fill="rgba(255, 255, 255, 0.7)"
                              fontSize="9"
                              textAnchor="middle"
                              transform={`rotate(-45 ${x + barWidth / 2} ${chartHeight - padding + 20})`}
                            >
                              {data.month.substring(0, 3)}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

