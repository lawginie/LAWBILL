// localStorage-based data service to replace Supabase

export interface LocalStorageData {
  firms: Firm[]
  users: User[]
  matters: Matter[]
  bills: Bill[]
  billItems: BillItem[]
  courtTypes: CourtType[]
  tariffVersions: TariffVersion[]
  tariffItems: TariffItem[]
}

export interface Firm {
  id: string
  name: string
  vat_number?: string
  registration_number?: string
  address?: string
  phone?: string
  email?: string
  settings?: any
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  firm_id?: string
  role: 'admin' | 'attorney' | 'secretary' | 'opponent'
  first_name?: string
  last_name?: string
  phone?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Matter {
  id: string
  firm_id: string
  case_number?: string
  court_type_id?: string
  scale: string
  plaintiff?: string
  defendant?: string
  matter_description?: string
  status: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  matter_id: string
  bill_number?: string
  status: string
  subtotal_fees: number
  subtotal_disbursements: number
  subtotal_counsel: number
  vat_amount: number
  total_amount: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface BillItem {
  id: string
  bill_id: string
  tariff_item_id?: string
  date_of_service?: string
  description: string
  units: number
  rate_applied: number
  amount_ex_vat: number
  vat_amount: number
  total_amount: number
  source?: string
  source_reference?: string
  created_by?: string
  created_at: string
}

export interface CourtType {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
}

export interface TariffVersion {
  id: string
  court_type_id?: string
  scale: string
  effective_from: string
  effective_to?: string
  version_name?: string
  is_active: boolean
  created_at: string
}

export interface TariffItem {
  id: string
  tariff_version_id?: string
  item_number?: string
  label: string
  description?: string
  rate?: number
  unit?: string
  minimum_units: number
  maximum_units?: number
  cap_amount?: number
  vat_applicable: boolean
  category?: string
  subcategory?: string
  is_active: boolean
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'lawbill_data'
  private readonly BACKUP_KEY = 'lawbill_data_backup'

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString()
  }

  private getData(): LocalStorageData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) {
        return this.getDefaultData()
      }
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading localStorage data:', error)
      return this.getDefaultData()
    }
  }

  private setData(data: LocalStorageData): void {
    try {
      // Create backup before saving
      const currentData = localStorage.getItem(this.STORAGE_KEY)
      if (currentData) {
        localStorage.setItem(this.BACKUP_KEY, currentData)
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      throw new Error('Failed to save data')
    }
  }

  private getDefaultData(): LocalStorageData {
    return {
      firms: [],
      users: [],
      matters: [],
      bills: [],
      billItems: [],
      courtTypes: [
        {
          id: 'hc',
          name: 'High Court',
          code: 'HC',
          description: 'High Court of South Africa',
          is_active: true
        },
        {
          id: 'mc',
          name: 'Magistrate Court',
          code: 'MC',
          description: 'Magistrate Court',
          is_active: true
        }
      ],
      tariffVersions: [],
      tariffItems: []
    }
  }

  // Firm operations
  async getFirms(): Promise<Firm[]> {
    const data = this.getData()
    return data.firms
  }

  async getFirmById(id: string): Promise<Firm | null> {
    const data = this.getData()
    return data.firms.find(firm => firm.id === id) || null
  }

  async createFirm(firmData: Omit<Firm, 'id' | 'created_at' | 'updated_at'>): Promise<Firm> {
    const data = this.getData()
    const now = this.getCurrentTimestamp()
    const firm: Firm = {
      ...firmData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    }
    data.firms.push(firm)
    this.setData(data)
    return firm
  }

  async updateFirm(id: string, updates: Partial<Firm>): Promise<Firm | null> {
    const data = this.getData()
    const firmIndex = data.firms.findIndex(firm => firm.id === id)
    if (firmIndex === -1) return null

    data.firms[firmIndex] = {
      ...data.firms[firmIndex],
      ...updates,
      updated_at: this.getCurrentTimestamp()
    }
    this.setData(data)
    return data.firms[firmIndex]
  }

  // User operations
  async getUsers(): Promise<User[]> {
    const data = this.getData()
    return data.users
  }

  async getUserById(id: string): Promise<User | null> {
    const data = this.getData()
    return data.users.find(user => user.id === id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = this.getData()
    return data.users.find(user => user.email === email) || null
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const data = this.getData()
    const now = this.getCurrentTimestamp()
    const user: User = {
      ...userData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    }
    data.users.push(user)
    this.setData(data)
    return user
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const data = this.getData()
    const userIndex = data.users.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      updated_at: this.getCurrentTimestamp()
    }
    this.setData(data)
    return data.users[userIndex]
  }

  // Matter operations
  async getMatters(firmId?: string): Promise<Matter[]> {
    const data = this.getData()
    if (firmId) {
      return data.matters.filter(matter => matter.firm_id === firmId)
    }
    return data.matters
  }

  async getMatterById(id: string): Promise<Matter | null> {
    const data = this.getData()
    return data.matters.find(matter => matter.id === id) || null
  }

  async createMatter(matterData: Omit<Matter, 'id' | 'created_at' | 'updated_at'>): Promise<Matter> {
    const data = this.getData()
    const now = this.getCurrentTimestamp()
    const matter: Matter = {
      ...matterData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    }
    data.matters.push(matter)
    this.setData(data)
    return matter
  }

  async updateMatter(id: string, updates: Partial<Matter>): Promise<Matter | null> {
    const data = this.getData()
    const matterIndex = data.matters.findIndex(matter => matter.id === id)
    if (matterIndex === -1) return null

    data.matters[matterIndex] = {
      ...data.matters[matterIndex],
      ...updates,
      updated_at: this.getCurrentTimestamp()
    }
    this.setData(data)
    return data.matters[matterIndex]
  }

  async deleteMatter(id: string): Promise<boolean> {
    const data = this.getData()
    const matterIndex = data.matters.findIndex(matter => matter.id === id)
    if (matterIndex === -1) return false

    data.matters.splice(matterIndex, 1)
    this.setData(data)
    return true
  }

  // Bill operations
  async getBills(matterId?: string): Promise<Bill[]> {
    const data = this.getData()
    if (matterId) {
      return data.bills.filter(bill => bill.matter_id === matterId)
    }
    return data.bills
  }

  async getBillById(id: string): Promise<Bill | null> {
    const data = this.getData()
    return data.bills.find(bill => bill.id === id) || null
  }

  async createBill(billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>): Promise<Bill> {
    const data = this.getData()
    const now = this.getCurrentTimestamp()
    const bill: Bill = {
      ...billData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    }
    data.bills.push(bill)
    this.setData(data)
    return bill
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill | null> {
    const data = this.getData()
    const billIndex = data.bills.findIndex(bill => bill.id === id)
    if (billIndex === -1) return null

    data.bills[billIndex] = {
      ...data.bills[billIndex],
      ...updates,
      updated_at: this.getCurrentTimestamp()
    }
    this.setData(data)
    return data.bills[billIndex]
  }

  async deleteBill(id: string): Promise<boolean> {
    const data = this.getData()
    const billIndex = data.bills.findIndex(bill => bill.id === id)
    if (billIndex === -1) return false

    // Also delete associated bill items
    data.billItems = data.billItems.filter(item => item.bill_id !== id)
    data.bills.splice(billIndex, 1)
    this.setData(data)
    return true
  }

  // Bill Item operations
  async getBillItems(billId?: string): Promise<BillItem[]> {
    const data = this.getData()
    if (billId) {
      return data.billItems.filter(item => item.bill_id === billId)
    }
    return data.billItems
  }

  async createBillItem(itemData: Omit<BillItem, 'id' | 'created_at'>): Promise<BillItem> {
    const data = this.getData()
    const item: BillItem = {
      ...itemData,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp()
    }
    data.billItems.push(item)
    this.setData(data)
    return item
  }

  async updateBillItem(id: string, updates: Partial<BillItem>): Promise<BillItem | null> {
    const data = this.getData()
    const itemIndex = data.billItems.findIndex(item => item.id === id)
    if (itemIndex === -1) return null

    data.billItems[itemIndex] = {
      ...data.billItems[itemIndex],
      ...updates
    }
    this.setData(data)
    return data.billItems[itemIndex]
  }

  async deleteBillItem(id: string): Promise<boolean> {
    const data = this.getData()
    const itemIndex = data.billItems.findIndex(item => item.id === id)
    if (itemIndex === -1) return false

    data.billItems.splice(itemIndex, 1)
    this.setData(data)
    return true
  }

  // Court Type operations
  async getCourtTypes(): Promise<CourtType[]> {
    const data = this.getData()
    return data.courtTypes
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
  }

  async exportData(): Promise<string> {
    const data = this.getData()
    return JSON.stringify(data, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const importedData = JSON.parse(jsonData) as LocalStorageData
      // Validate the structure
      if (!importedData.firms || !Array.isArray(importedData.firms)) {
        throw new Error('Invalid data format')
      }
      this.setData(importedData)
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message)
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY)
      if (!backupData) return false
      
      localStorage.setItem(this.STORAGE_KEY, backupData)
      return true
    } catch (error) {
      console.error('Error restoring from backup:', error)
      return false
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService()

// Export types for compatibility with existing Supabase code
export type Database = {
  public: {
    Tables: {
      firms: { Row: Firm; Insert: Omit<Firm, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Firm> }
      users: { Row: User; Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>; Update: Partial<User> }
      matters: { Row: Matter; Insert: Omit<Matter, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Matter> }
      bills: { Row: Bill; Insert: Omit<Bill, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Bill> }
      bill_items: { Row: BillItem; Insert: Omit<BillItem, 'id' | 'created_at'>; Update: Partial<BillItem> }
      court_types: { Row: CourtType; Insert: Omit<CourtType, 'id'>; Update: Partial<CourtType> }
      tariff_versions: { Row: TariffVersion; Insert: Omit<TariffVersion, 'id' | 'created_at'>; Update: Partial<TariffVersion> }
      tariff_items: { Row: TariffItem; Insert: Omit<TariffItem, 'id'>; Update: Partial<TariffItem> }
    }
  }
}