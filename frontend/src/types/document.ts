export type DocumentStatus = 'pending' | 'verified' | 'rejected'
export type VerificationStatus = 'verified' | 'update_required' | 'update_by_date' | 'invalid'

export interface Document {
  id: number
  establishment_id: number
  document_group: string
  document_type: string
  document_name: string
  file_name: string | null
  file_path: string | null
  required: boolean
  uploaded: boolean
  status: DocumentStatus
  verification_status?: VerificationStatus
  expiry_date?: string | null
  uploaded_at: string | null
  created_at: string
}

export interface DocumentStats {
  total: number
  pending: number
  verified: number
  rejected: number
}

export const DOCUMENT_BLOCKS = [
  {
    id: 1,
    title: 'Юр. лицо',
    icon: '📋',
    documents: [
      { type: 'ogrn_inn', label: 'ОГРН/ИНН', description: 'Основной государственный регистрационный номер' },
      { type: 'charter', label: 'Устав', description: 'Устав организации' },
      { type: 'registration_certificate', label: 'Свидетельство о регистрации', description: 'Свидетельство о государственной регистрации' },
      { type: 'egryul_extract', label: 'Выписка ЕГРЮЛ', description: 'Заверенная копия' },
      { type: 'authorized_capital', label: 'Уставной капитал', description: 'Справка, выписка из банка, решение участников' },
      { type: 'okved', label: 'ОКВЭД', description: 'Копия' },
      { type: 'passport_power_of_attorney', label: 'Паспорт/Доверенность', description: 'На подписанта' },
      { type: 'general_director_appointment', label: 'Приказ о назначении Ген. Директора', description: 'Приказ о назначении генерального директора' },
      { type: 'company_card', label: 'Карточка предприятия', description: 'Карточка предприятия' },
    ]
  },
  {
    id: 2,
    title: 'Алкогольная деятельность',
    icon: '🎫',
    documents: [
      { type: 'alcohol_license', label: 'Лицензия на алкоголь', description: 'Действующая лицензия на продажу алкогольной продукции' },
      { type: 'lease_ownership', label: 'Договор аренды/собственности', description: 'Срок действия договора не менее срока действия алкогольной лицензии' },
      { type: 'egais', label: 'ЕГАИС', description: 'Информация о действующей регистрации' },
    ]
  },
  {
    id: 3,
    title: 'Помещения и требования',
    icon: '💰',
    documents: [
      { type: 'mchs_conclusion', label: 'МЧС', description: 'Заключения на помещение' },
      { type: 'rospotrebnadzor_conclusion', label: 'Роспотребнадзор', description: 'Заключения на помещение' },
    ]
  },
  {
    id: 4,
    title: 'Финансы и отчетность',
    icon: '👤',
    documents: [
      { type: 'kkt_registration', label: 'ККТ', description: 'Копия регистрации ККТ' },
      { type: 'bank_details', label: 'Банковские реквизиты', description: 'Справка, бланк' },
      { type: 'fns_certificate', label: 'Справка из ФНС', description: 'Об отсутствии задолженности' },
    ]
  }
]

