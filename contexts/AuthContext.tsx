'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Local storage types
interface User {
  id: string
  email: string
  created_at: string
}

interface Session {
  user: User
  access_token: string
  expires_at: number
}

interface UserProfile {
  id: string
  email: string
  role: 'attorney' | 'secretary' | 'opponent'
  firm_id: string
  first_name: string
  last_name: string
  full_name: string
  created_at: string
}

interface Firm {
  id: string
  name: string
  vat_number: string
  settings: {
    vat_rate: number
    rounding_minutes: number
    default_court: string
    default_scale: string
  }
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  firm: Firm | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, firmName: string, userRole: 'attorney' | 'secretary') => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasRole: (role: string) => boolean
  canAccess: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions
const PERMISSIONS = {
  attorney: [
    'create_matter',
    'edit_matter', 
    'delete_matter',
    'create_bill',
    'edit_bill',
    'delete_bill',
    'export_bill',
    'manage_firm',
    'invite_users',
    'view_billing',
    'manage_subscription'
  ],
  secretary: [
    'create_matter',
    'edit_matter',
    'create_bill', 
    'edit_bill',
    'export_bill',
    'view_billing'
  ],
  opponent: [
    'view_bill',
    'object_to_items',
    'respond_to_objections'
  ]
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firm, setFirm] = useState<Firm | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session from localStorage
    const storedSession = localStorage.getItem('lawbill_session')
    if (storedSession) {
      try {
        const session: Session = JSON.parse(storedSession)
        if (session.expires_at > Date.now()) {
          setSession(session)
          setUser(session.user)
          loadUserProfile(session.user.id)
        } else {
          // Session expired
          localStorage.removeItem('lawbill_session')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error parsing stored session:', error)
        localStorage.removeItem('lawbill_session')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      // Get user profile from localStorage
      const storedProfile = localStorage.getItem(`lawbill_profile_${userId}`)
      if (storedProfile) {
        const profileData: UserProfile = JSON.parse(storedProfile)
        setProfile(profileData)

        // Get firm data if user has a firm
        if (profileData.firm_id) {
          const storedFirm = localStorage.getItem(`lawbill_firm_${profileData.firm_id}`)
          if (storedFirm) {
            const firmData: Firm = JSON.parse(storedFirm)
            setFirm(firmData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Get stored user credentials
      const storedUsers = localStorage.getItem('lawbill_users') || '[]'
      const users: Array<{email: string, password: string, id: string}> = JSON.parse(storedUsers)
      
      const user = users.find(u => u.email === email && u.password === password)
      if (!user) {
        return { error: new Error('Invalid email or password') }
      }

      // Create session
      const session: Session = {
        user: {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        },
        access_token: `token_${user.id}_${Date.now()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }

      // Store session
      localStorage.setItem('lawbill_session', JSON.stringify(session))
      setSession(session)
      setUser(session.user)
      await loadUserProfile(user.id)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, firmName: string, userRole: 'attorney' | 'secretary') => {
    try {
      // Check if user already exists
      const storedUsers = localStorage.getItem('lawbill_users') || '[]'
      const users: Array<{email: string, password: string, id: string}> = JSON.parse(storedUsers)
      
      if (users.find(u => u.email === email)) {
        return { error: new Error('User already exists') }
      }

      // Generate IDs
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const firmId = `firm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create firm
      const firmData: Firm = {
        id: firmId,
        name: firmName,
        vat_number: '',
        settings: {
          vat_rate: 0.15,
          rounding_minutes: 15,
          default_court: 'MC',
          default_scale: 'A'
        },
        created_at: new Date().toISOString()
      }

      // Create user profile
      const profileData: UserProfile = {
        id: userId,
        email: email,
        role: userRole,
        firm_id: firmId,
        first_name: '',
        last_name: '',
        full_name: '',
        created_at: new Date().toISOString()
      }

      // Store user credentials
      users.push({ email, password, id: userId })
      localStorage.setItem('lawbill_users', JSON.stringify(users))

      // Store firm and profile
      localStorage.setItem(`lawbill_firm_${firmId}`, JSON.stringify(firmData))
      localStorage.setItem(`lawbill_profile_${userId}`, JSON.stringify(profileData))

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    // Clear session and state
    localStorage.removeItem('lawbill_session')
    setSession(null)
    setUser(null)
    setProfile(null)
    setFirm(null)
  }

  const hasRole = (role: string): boolean => {
    return profile?.role === role
  }

  const canAccess = (permission: string): boolean => {
    if (!profile) return false
    const userPermissions = PERMISSIONS[profile.role as keyof typeof PERMISSIONS] || []
    return userPermissions.includes(permission)
  }

  const value = {
    user,
    profile,
    firm,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    canAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, profile, loading, canAccess } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user || !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please sign in to continue.</p>
          </div>
        </div>
      )
    }

    if (requiredPermission && !canAccess(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}