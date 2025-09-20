'use client'

import { useState, useEffect } from 'react'
import { AuthForms } from '@/components/auth/AuthForms'
import { MainDashboard } from '@/components/dashboard/MainDashboard'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    if (user && profile) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`)
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [user, profile])

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed:', data)
    // In a real app, this would save the onboarding data to the database
    localStorage.setItem(`onboarding_completed_${user?.id}`, 'true')
    setShowOnboarding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LawBill Pro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Mobile-optimized auth layout */}
        <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                LawBill Pro
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                South African Legal Billing Made Simple
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="bg-white px-3 py-1 rounded-full">OCR Scanning</span>
                <span className="bg-white px-3 py-1 rounded-full">Live Billing</span>
                <span className="bg-white px-3 py-1 rounded-full">Court Compliant</span>
              </div>
            </div>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
              <AuthForms />
            </div>
            
            {/* Mobile-friendly features showcase */}
            <div className="mt-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Built for South African Attorneys
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-900">📱 Mobile-First Design</h4>
                  <p className="text-gray-600 mt-1">Snap photos of documents and create bills on the go</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-900">⚖️ Court Compliant</h4>
                  <p className="text-gray-600 mt-1">Aligned with LSSA tariffs and court rules</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-900">🤝 Collaboration</h4>
                  <p className="text-gray-600 mt-1">Work with opposing parties and secretaries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'mobile-optimized' : ''}`}>
      <MainDashboard />
      
      {/* Mobile-specific enhancements */}
      {isMobile && (
        <>
          {/* Mobile quick action button */}
          <div className="fixed bottom-4 right-4 z-50">
            <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Mobile-specific styles */}
          <style jsx global>{`
            .mobile-optimized {
              font-size: 16px; /* Prevent zoom on iOS */
            }
            
            .mobile-optimized input,
            .mobile-optimized select,
            .mobile-optimized textarea {
              font-size: 16px; /* Prevent zoom on iOS */
            }
            
            .mobile-optimized .card {
              margin: 0.5rem;
              border-radius: 0.75rem;
            }
            
            .mobile-optimized .button {
              min-height: 44px; /* iOS touch target */
              padding: 0.75rem 1rem;
            }
            
            @media (max-width: 768px) {
              .mobile-optimized .grid {
                grid-template-columns: 1fr;
                gap: 0.5rem;
              }
              
              .mobile-optimized .text-sm {
                font-size: 0.875rem;
              }
              
              .mobile-optimized .p-4 {
                padding: 0.75rem;
              }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
