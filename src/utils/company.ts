const FALLBACK_COMPANY_ID = 'company-1'
const ACTIVE_COMPANY_STORAGE_KEY = 'active-company-id'

export function getActiveCompanyId(): string {
  const envCompanyId = import.meta.env.VITE_DEFAULT_COMPANY_ID?.trim()

  if (envCompanyId) {
    return envCompanyId
  }

  if (typeof window !== 'undefined') {
    const storedCompanyId = window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)?.trim()

    if (storedCompanyId) {
      return storedCompanyId
    }
  }

  return FALLBACK_COMPANY_ID
}

export function setActiveCompanyId(companyId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyId)
}
