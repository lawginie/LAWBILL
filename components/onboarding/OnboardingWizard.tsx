'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  Scale, 
  FileText, 
  Users, 
  Camera,
  CheckCircle,
  Info,
  Upload,
  Lightbulb
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface OnboardingData {
  firm: {
    name: string
    address: string
    vatNumber: string
    practiceAreas: string[]
  }
  tariffPreferences: {
    defaultCourt: string
    defaultScale: string
    vatRate: number
    roundingMinutes: number
  }
  firstMatter: {
    title: string
    courtType: string
    scale: string
    parties: string
    caseNumber: string
  }
  teamSetup: {
    secretaryEmail: string
    opponentEmail: string
  }
  sampleUpload: {
    hasUploaded: boolean
    fileName?: string
  }
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    firm: {
      name: '',
      address: '',
      vatNumber: '',
      practiceAreas: []
    },
    tariffPreferences: {
      defaultCourt: 'HC',
      defaultScale: 'A',
      vatRate: 15,
      roundingMinutes: 6
    },
    firstMatter: {
      title: '',
      courtType: 'HC',
      scale: 'A',
      parties: '',
      caseNumber: ''
    },
    teamSetup: {
      secretaryEmail: '',
      opponentEmail: ''
    },
    sampleUpload: {
      hasUploaded: false
    }
  })

  const totalSteps = 5

  const updateData = (section: keyof OnboardingData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete(data)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.firm.name && data.firm.address
      case 2:
        return data.tariffPreferences.defaultCourt && data.tariffPreferences.defaultScale
      case 3:
        return data.firstMatter.title && data.firstMatter.parties
      case 4:
        return true // Optional step
      case 5:
        return true // Optional step
      default:
        return false
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateData('sampleUpload', {
        hasUploaded: true,
        fileName: file.name
      })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Firm Information
              </CardTitle>
              <CardDescription>
                Let's start by setting up your law firm's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name *</Label>
                <Input
                  id="firmName"
                  value={data.firm.name}
                  onChange={(e) => updateData('firm', { name: e.target.value })}
                  placeholder="e.g., Smith & Associates Attorneys"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmAddress">Firm Address *</Label>
                <Input
                  id="firmAddress"
                  value={data.firm.address}
                  onChange={(e) => updateData('firm', { address: e.target.value })}
                  placeholder="e.g., 123 Main Street, Cape Town, 8001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number (optional)</Label>
                <Input
                  id="vatNumber"
                  value={data.firm.vatNumber}
                  onChange={(e) => updateData('firm', { vatNumber: e.target.value })}
                  placeholder="e.g., 4123456789"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This information will appear on all your bills and legal documents.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Tariff Preferences
              </CardTitle>
              <CardDescription>
                Configure your default billing settings based on South African court tariffs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCourt">Default Court Type</Label>
                  <Select
                    value={data.tariffPreferences.defaultCourt}
                    onValueChange={(value) => updateData('tariffPreferences', { defaultCourt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MC">Magistrates' Court</SelectItem>
                      <SelectItem value="HC">High Court</SelectItem>
                      <SelectItem value="SCA">Supreme Court of Appeal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultScale">Default Scale</Label>
                  <Select
                    value={data.tariffPreferences.defaultScale}
                    onValueChange={(value) => updateData('tariffPreferences', { defaultScale: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Scale A (Complex matters)</SelectItem>
                      <SelectItem value="B">Scale B (Standard matters)</SelectItem>
                      <SelectItem value="C">Scale C (Simple matters)</SelectItem>
                      <SelectItem value="D">Scale D (Routine matters)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={data.tariffPreferences.vatRate}
                    onChange={(e) => updateData('tariffPreferences', { vatRate: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rounding">Time Rounding (minutes)</Label>
                  <Select
                    value={data.tariffPreferences.roundingMinutes.toString()}
                    onValueChange={(value) => updateData('tariffPreferences', { roundingMinutes: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 minutes (0.1 hour)</SelectItem>
                      <SelectItem value="15">15 minutes (0.25 hour)</SelectItem>
                      <SelectItem value="30">30 minutes (0.5 hour)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Most South African attorneys use 6-minute rounding (0.1 hour increments) for time-based billing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your First Matter
              </CardTitle>
              <CardDescription>
                Let's create your first matter to get you started with billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matterTitle">Matter Title *</Label>
                <Input
                  id="matterTitle"
                  value={data.firstMatter.title}
                  onChange={(e) => updateData('firstMatter', { title: e.target.value })}
                  placeholder="e.g., Smith v Jones - Contract Dispute"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parties">Parties *</Label>
                <Input
                  id="parties"
                  value={data.firstMatter.parties}
                  onChange={(e) => updateData('firstMatter', { parties: e.target.value })}
                  placeholder="e.g., John Smith vs Mary Jones"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courtType">Court Type</Label>
                  <Select
                    value={data.firstMatter.courtType}
                    onValueChange={(value) => updateData('firstMatter', { courtType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MC">Magistrates' Court</SelectItem>
                      <SelectItem value="HC">High Court</SelectItem>
                      <SelectItem value="SCA">Supreme Court of Appeal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale">Scale</Label>
                  <Select
                    value={data.firstMatter.scale}
                    onValueChange={(value) => updateData('firstMatter', { scale: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Scale A</SelectItem>
                      <SelectItem value="B">Scale B</SelectItem>
                      <SelectItem value="C">Scale C</SelectItem>
                      <SelectItem value="D">Scale D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number (optional)</Label>
                  <Input
                    id="caseNumber"
                    value={data.firstMatter.caseNumber}
                    onChange={(e) => updateData('firstMatter', { caseNumber: e.target.value })}
                    placeholder="e.g., 12345/2024"
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Don't worry - you can always create more matters later and modify these details.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Setup
              </CardTitle>
              <CardDescription>
                Invite your secretary and opposing parties to collaborate (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretaryEmail">Secretary Email (optional)</Label>
                <Input
                  id="secretaryEmail"
                  type="email"
                  value={data.teamSetup.secretaryEmail}
                  onChange={(e) => updateData('teamSetup', { secretaryEmail: e.target.value })}
                  placeholder="secretary@yourfirm.co.za"
                />
                <p className="text-sm text-gray-500">
                  Your secretary will be able to help with bill preparation and document management
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opponentEmail">Opposing Attorney Email (optional)</Label>
                <Input
                  id="opponentEmail"
                  type="email"
                  value={data.teamSetup.opponentEmail}
                  onChange={(e) => updateData('teamSetup', { opponentEmail: e.target.value })}
                  placeholder="opponent@theirfirm.co.za"
                />
                <p className="text-sm text-gray-500">
                  Opposing parties can review and object to bill items before taxation
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You can skip this step and invite team members later from your dashboard.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Try OCR Document Scanning
              </CardTitle>
              <CardDescription>
                Upload a sample document to see how our OCR technology extracts billing items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {data.sampleUpload.hasUploaded ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                    <h3 className="text-lg font-medium">File Uploaded!</h3>
                    <p className="text-gray-500">{data.sampleUpload.fileName}</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Ready for OCR processing
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <h3 className="text-lg font-medium">Upload a Sample Document</h3>
                      <p className="text-gray-500">
                        Try uploading a file cover, attendance note, or any document with billing information
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">What our OCR can extract:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Time entries (e.g., "tel opp 12m", "perusal 2h")</li>
                  <li>• Dates and case references</li>
                  <li>• Attendance notes and descriptions</li>
                  <li>• Travel distances and disbursements</li>
                </ul>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> This step is optional, but trying OCR now will help you understand how to save time later!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to LawBill Pro</h1>
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          <p className="text-gray-600 mt-2">
            Let's get you set up in just a few minutes
          </p>
        </div>

        {/* Current Step */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={nextStep}
            disabled={!isStepValid()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@lawbillpro.co.za" className="text-blue-600 hover:underline">
              support@lawbillpro.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}