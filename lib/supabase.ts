import { localStorageService } from './localStorage'

// Mock Supabase-like interface using localStorage
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    })
  })
}

// For client components - return the same mock
export const createClientSupabase = () => supabase

// Database types
export interface Database {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string
          name: string
          vat_number: string | null
          registration_number: string | null
          address: string | null
          phone: string | null
          email: string | null
          settings: any
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          vat_number?: string | null
          registration_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          settings?: any
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          vat_number?: string | null
          registration_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          settings?: any
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          firm_id: string | null
          role: 'admin' | 'attorney' | 'secretary' | 'opponent'
          first_name: string | null
          last_name: string | null
          phone: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          firm_id?: string | null
          role: 'admin' | 'attorney' | 'secretary' | 'opponent'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          firm_id?: string | null
          role?: 'admin' | 'attorney' | 'secretary' | 'opponent'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      court_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean
        }
      }
      tariff_versions: {
        Row: {
          id: string
          court_type_id: string | null
          scale: string
          effective_from: string
          effective_to: string | null
          version_name: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          court_type_id?: string | null
          scale: string
          effective_from: string
          effective_to?: string | null
          version_name?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          court_type_id?: string | null
          scale?: string
          effective_from?: string
          effective_to?: string | null
          version_name?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      tariff_items: {
        Row: {
          id: string
          tariff_version_id: string | null
          item_number: string | null
          label: string
          description: string | null
          rate: number | null
          unit: string | null
          minimum_units: number
          maximum_units: number | null
          cap_amount: number | null
          vat_applicable: boolean
          category: string | null
          subcategory: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          tariff_version_id?: string | null
          item_number?: string | null
          label: string
          description?: string | null
          rate?: number | null
          unit?: string | null
          minimum_units?: number
          maximum_units?: number | null
          cap_amount?: number | null
          vat_applicable?: boolean
          category?: string | null
          subcategory?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          tariff_version_id?: string | null
          item_number?: string | null
          label?: string
          description?: string | null
          rate?: number | null
          unit?: string | null
          minimum_units?: number
          maximum_units?: number | null
          cap_amount?: number | null
          vat_applicable?: boolean
          category?: string | null
          subcategory?: string | null
          is_active?: boolean
        }
      }
      matters: {
        Row: {
          id: string
          firm_id: string
          case_number: string | null
          court_type_id: string | null
          scale: string
          plaintiff: string | null
          defendant: string | null
          matter_description: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_number?: string | null
          court_type_id?: string | null
          scale: string
          plaintiff?: string | null
          defendant?: string | null
          matter_description?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_number?: string | null
          court_type_id?: string | null
          scale?: string
          plaintiff?: string | null
          defendant?: string | null
          matter_description?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          matter_id: string
          bill_number: string | null
          status: string
          subtotal_fees: number
          subtotal_disbursements: number
          subtotal_counsel: number
          vat_amount: number
          total_amount: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          matter_id: string
          bill_number?: string | null
          status?: string
          subtotal_fees?: number
          subtotal_disbursements?: number
          subtotal_counsel?: number
          vat_amount?: number
          total_amount?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          matter_id?: string
          bill_number?: string | null
          status?: string
          subtotal_fees?: number
          subtotal_disbursements?: number
          subtotal_counsel?: number
          vat_amount?: number
          total_amount?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bill_items: {
        Row: {
          id: string
          bill_id: string
          tariff_item_id: string | null
          date_of_service: string | null
          description: string
          units: number
          rate_applied: number
          amount_ex_vat: number
          vat_amount: number
          total_amount: number
          source: string | null
          source_reference: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          tariff_item_id?: string | null
          date_of_service?: string | null
          description: string
          units?: number
          rate_applied: number
          amount_ex_vat: number
          vat_amount?: number
          total_amount: number
          source?: string | null
          source_reference?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          tariff_item_id?: string | null
          date_of_service?: string | null
          description?: string
          units?: number
          rate_applied?: number
          amount_ex_vat?: number
          vat_amount?: number
          total_amount?: number
          source?: string | null
          source_reference?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}