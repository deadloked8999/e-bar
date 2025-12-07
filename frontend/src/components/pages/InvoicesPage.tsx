import { Building2, Copy, Check, ChevronDown, ChevronUp, Files } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface BankAccount {
  id: number
  bankName: string
  accountNumber: string
  bik: string
  correspondentAccount: string
  inn: string
  kpp: string
  recipientName: string
}

const bankAccounts: BankAccount[] = [
  {
    id: 1,
    bankName: 'Сбербанк',
    accountNumber: '40702810123456789012',
    bik: '044525225',
    correspondentAccount: '30101810400000000225',
    inn: '7707083893',
    kpp: '773601001',
    recipientName: 'ООО "ХАСТЛЕР"'
  },
  {
    id: 2,
    bankName: 'Т-банк',
    accountNumber: '40702810567890123456',
    bik: '044525187',
    correspondentAccount: '30101810100000000187',
    inn: '7702070139',
    kpp: '770201001',
    recipientName: 'ООО "ХАСТЛЕР"'
  },
  {
    id: 3,
    bankName: 'ПСБ',
    accountNumber: '40702810987654321098',
    bik: '044525823',
    correspondentAccount: '30101810800000000823',
    inn: '7736050003',
    kpp: '773601001',
    recipientName: 'ООО "ХАСТЛЕР"'
  },
  {
    id: 4,
    bankName: 'Альфа-банк',
    accountNumber: '40702810111213141516',
    bik: '044525593',
    correspondentAccount: '30101810200000000593',
    inn: '7728168971',
    kpp: '770801001',
    recipientName: 'ООО "ХАСТЛЕР"'
  },
  {
    id: 5,
    bankName: 'УзПромСтрой Банк',
    accountNumber: '40702810222334455667',
    bik: '000816777',
    correspondentAccount: '30101810000000000167',
    inn: '200398765',
    kpp: '200301001',
    recipientName: 'ООО "ХАСТЛЕР"'
  }
]

export default function InvoicesPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null)

  const toggleAccount = (accountId: number) => {
    setExpandedAccount(prev => {
      // Если кликнули на уже открытый счет - закрываем его
      if (prev === accountId) {
        return null
      }
      // Иначе открываем новый счет (предыдущий автоматически закроется)
      return accountId
    })
  }

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAllRequisites = async (account: BankAccount) => {
    const requisites = `Банк: ${account.bankName}
Номер счета: ${account.accountNumber}
БИК: ${account.bik}
Корреспондентский счет: ${account.correspondentAccount}
ИНН: ${account.inn}
КПП: ${account.kpp}
Получатель: ${account.recipientName}`
    
    try {
      await navigator.clipboard.writeText(requisites)
      setCopiedField(`all-${account.id}`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-3 max-w-[50%]">
      <h2 className="text-xl font-semibold text-white mb-4">Подключенные банковские счета</h2>
      
      <div className="grid grid-cols-1 gap-2">
        {bankAccounts.map((account) => {
          const isExpanded = expandedAccount === account.id
          return (
            <div
              key={account.id}
              className="bg-white/10 backdrop-blur-lg rounded-ios-lg border border-white/20 hover:border-cyan-400/30 transition-colors overflow-hidden"
            >
              <button
                onClick={() => toggleAccount(account.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-semibold text-white">{account.bankName}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Кнопка копирования всех реквизитов */}
                  <div className="mb-3 pb-3 border-b border-white/10">
                    <button
                      onClick={() => copyAllRequisites(account)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 rounded-ios-lg transition-colors text-sm font-medium border border-cyan-400/30"
                    >
                      {copiedField === `all-${account.id}` ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Files className="w-4 h-4" />
                          <span>Скопировать все реквизиты</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Счет:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-white font-mono">{account.accountNumber}</span>
                      <button
                    onClick={() => copyToClipboard(account.accountNumber, `account-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `account-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">БИК:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-mono">{account.bik}</span>
                  <button
                    onClick={() => copyToClipboard(account.bik, `bik-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `bik-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Корр. счет:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-mono">{account.correspondentAccount}</span>
                  <button
                    onClick={() => copyToClipboard(account.correspondentAccount, `corr-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `corr-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">ИНН:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-mono">{account.inn}</span>
                  <button
                    onClick={() => copyToClipboard(account.inn, `inn-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `inn-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">КПП:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-mono">{account.kpp}</span>
                  <button
                    onClick={() => copyToClipboard(account.kpp, `kpp-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `kpp-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Получатель:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white">{account.recipientName}</span>
                  <button
                    onClick={() => copyToClipboard(account.recipientName, `recipient-${account.id}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Копировать"
                  >
                    {copiedField === `recipient-${account.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

