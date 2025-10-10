'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, ArrowRight, Calendar, Scale, FileText, Users, DollarSign } from 'lucide-react'
import { detectForum, ForumDetectionResult } from '@/lib/forum-detection'
import { complianceEngine, ComplianceStatus } from '@/lib/compliance-engine'
import { DictationInput, DictationTextArea } from '@/components/dictation/DictationButton'
import DictationDateInput from '@/components/dictation/DictationDateInput'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  isComplete: boolean
  isValid: boolean
}

interface BillWizardData {
  // Step 1: Case Information
  caseNumber: string
  claimValue: number
  caseType: 'civil' | 'criminal' | 'family' | 'commercial' | 'other'
  
  // Step 2: Forum Detection
  forum: ForumDetectionResult | null
  
  // Step 3: Bill Type & Costs Order
  billType: 'party-and-party' | 'attorney-and-client' | 'own-client'
  costsOrder: string
  
  // Step 4: Key Dates
  keyDates: {
    issueDate: string
    serviceDate: string
    trialDate: string
    judgmentDate: string
    billDate: string
  }
  
  // Step 5: Client & Practitioner Info
  clientInfo: {
    name: string
    type: 'individual' | 'corporate' | 'government'
    isVATVendor: boolean
  }
  practitionerInfo: {
    name: string
    isVATVendor: boolean
    admissionDate: string
    practiceType: 'attorney' | 'advocate' | 'candidate'
  }
}

interface BillWizardProps {
  onComplete: (data: BillWizardData) => void
  onCancel: () => void
}

export default function BillWizard({ onComplete, onCancel }: BillWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<BillWizardData>({
    caseNumber: '',
    claimValue: 0,
    caseType: 'civil',
    forum: null,
    billType: 'party-and-party',
    costsOrder: '',
    keyDates: {
      issueDate: '',
      serviceDate: '',
      trialDate: '',
      judgmentDate: '',
      billDate: new Date().toISOString().split('T')[0]
    },
    clientInfo: {
      name: '',
      type: 'individual',
      isVATVendor: false
    },
    practitionerInfo: {
      name: '',
      isVATVendor: false,
      admissionDate: '',
      practiceType: 'attorney'
    }
  })
  
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>('compliant')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const steps: WizardStep[] = [
    {
      id: 'case-info',
      title: 'Case Information',
      description: 'Enter basic case details',
      icon: <FileText className="w-5 h-5" />,
      isComplete: wizardData.caseNumber !== '' && wizardData.claimValue > 0,
      isValid: wizardData.caseNumber !== '' && wizardData.claimValue > 0
    },
    {
      id: 'forum-detection',
      title: 'Forum Detection',
      description: 'Automatic court jurisdiction detection',
      icon: <Scale className="w-5 h-5" />,
      isComplete: wizardData.forum !== null,
      isValid: wizardData.forum?.confidence === 'high' || wizardData.forum?.confidence === 'medium'
    },
    {
      id: 'bill-type',
      title: 'Bill Type & Costs Order',
      description: 'Select bill type and costs order',
      icon: <DollarSign className="w-5 h-5" />,
      isComplete: !!wizardData.billType && wizardData.costsOrder.trim() !== '',
      isValid: !!wizardData.billType && wizardData.costsOrder.trim() !== ''
    },
    {
      id: 'key-dates',
      title: 'Key Dates',
      description: 'Enter important case dates',
      icon: <Calendar className="w-5 h-5" />,
      isComplete: Object.values(wizardData.keyDates).every(date => date !== ''),
      isValid: Object.values(wizardData.keyDates).every(date => date !== '')
    },
    {
      id: 'parties-info',
      title: 'Parties Information',
      description: 'Client and practitioner details',
      icon: <Users className="w-5 h-5" />,
      isComplete: wizardData.clientInfo.name !== '' && wizardData.practitionerInfo.name !== '',
      isValid: wizardData.clientInfo.name !== '' && wizardData.practitionerInfo.name !== ''
    }
  ]
  
  const progress = ((currentStep + 1) / steps.length) * 100
  
  // Auto-detect forum when case info changes
  useEffect(() => {
    if (wizardData.claimValue > 0 && wizardData.caseType) {
      const caseDetails = {
        claimValue: wizardData.claimValue,
        caseType: wizardData.caseType as 'civil' | 'criminal' | 'appeal' | 'application' | 'review'
      }
      const forum = detectForum(caseDetails)
      setWizardData(prev => ({ ...prev, forum }))
    }
  }, [wizardData.claimValue, wizardData.caseType])
  
  // Validate current step
  useEffect(() => {
    validateCurrentStep()
  }, [currentStep, wizardData])
  
  const validateCurrentStep = () => {
    const errors: string[] = []
    
    switch (currentStep) {
      case 0: // Case Information
        if (!wizardData.caseNumber) errors.push('Case number is required')
        if (wizardData.claimValue <= 0) errors.push('Claim value must be greater than 0')
        break
        
      case 1: // Forum Detection
        if (!wizardData.forum) errors.push('Forum detection failed')
        else if (wizardData.forum.confidence === 'low' || (wizardData.forum.warnings && wizardData.forum.warnings.length > 0)) {
          errors.push(wizardData.forum.reasoning)
        }
        break
        
      case 2: // Bill Type & Costs Order
        if (!wizardData.costsOrder) errors.push('Costs order wording is required')
        break
        
      case 3: // Key Dates
        Object.entries(wizardData.keyDates).forEach(([key, value]) => {
          if (!value) errors.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`)
        })
        break
        
      case 4: // Parties Information
        if (!wizardData.clientInfo.name) errors.push('Client name is required')
        if (!wizardData.practitionerInfo.name) errors.push('Practitioner name is required')
        break
    }
    
    setValidationErrors(errors)
    setComplianceStatus(errors.length === 0 ? 'compliant' : 'non-compliant')
  }
  
  const handleNext = () => {
    if (currentStep < steps.length - 1 && validationErrors.length === 0) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleComplete = () => {
    if (steps.every(step => step.isValid)) {
      onComplete(wizardData)
    }
  }
  
  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'non-compliant':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }
  
  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'non-compliant':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Case Information
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="caseNumber">Case Number</Label>
              <DictationInput
                value={wizardData.caseNumber}
                onChange={(value) => setWizardData(prev => ({ ...prev, caseNumber: value }))}
                placeholder="e.g., 12345/2024 (type or dictate)"
              />
            </div>
            
            <div>
              <Label htmlFor="claimValue">Claim Value (R)</Label>
              <Input
                id="claimValue"
                type="number"
                value={wizardData.claimValue || ''}
                onChange={(e) => setWizardData(prev => ({ ...prev, claimValue: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="caseType">Case Type</Label>
              <Select
                value={wizardData.caseType}
                onValueChange={(value: any) => setWizardData(prev => ({ ...prev, caseType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
        
      case 1: // Forum Detection
        return (
          <div className="space-y-4">
            {wizardData.forum ? (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${getStatusColor(wizardData.forum.confidence === 'high' ? 'compliant' : wizardData.forum.confidence === 'medium' ? 'warning' : 'non-compliant')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(wizardData.forum.confidence === 'high' ? 'compliant' : wizardData.forum.confidence === 'medium' ? 'warning' : 'non-compliant')}
                    <h3 className="font-semibold">Forum Detection Result</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Court:</span>
                      <p>{wizardData.forum.courtName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Scale:</span>
                      <p>{wizardData.forum.scale}</p>
                    </div>
                    <div>
                      <span className="font-medium">Jurisdiction:</span>
                      <p>{wizardData.forum.jurisdiction}</p>
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <p className="capitalize">{wizardData.forum.confidence}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Reasoning:</span>
                      <p>{wizardData.forum.reasoning}</p>
                    </div>
                  </div>
                  
                  {wizardData.forum.warnings && wizardData.forum.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <span className="font-medium text-yellow-800">Warnings:</span>
                      <ul className="text-yellow-700 mt-1">
                        {wizardData.forum.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Enter case information to detect forum</p>
              </div>
            )}
          </div>
        )
        
      case 2: // Bill Type & Costs Order
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="billType">Bill Type</Label>
              <Select
                value={wizardData.billType}
                onValueChange={(value: any) => setWizardData(prev => ({ ...prev, billType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="party-and-party">Party-and-Party</SelectItem>
                  <SelectItem value="attorney-and-client">Attorney-and-Client</SelectItem>
                  <SelectItem value="own-client">Own Client</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {wizardData.billType === 'party-and-party' && 'Necessary costs only - narrower scope'}
                {wizardData.billType === 'attorney-and-client' && 'Reasonable costs - wider scope but voucher-backed'}
                {wizardData.billType === 'own-client' && 'Contractual basis - must remain ethical and reasonable'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="costsOrder">Costs Order Wording</Label>
              <DictationTextArea
                value={wizardData.costsOrder}
                onChange={(value) => setWizardData(prev => ({ ...prev, costsOrder: value }))}
                placeholder="Enter the exact wording of the costs order... (type or dictate)"
                rows={3}
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter the exact wording from the court order or judgment
              </p>
            </div>
          </div>
        )
        
      case 3: // Key Dates
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <DictationDateInput
                  id="issueDate"
                  label="Issue Date"
                  value={wizardData.keyDates.issueDate}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    keyDates: { ...prev.keyDates, issueDate: value }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="serviceDate">Service Date</Label>
                <DictationDateInput
                  id="serviceDate"
                  label="Service Date"
                  value={wizardData.keyDates.serviceDate}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    keyDates: { ...prev.keyDates, serviceDate: value }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="trialDate">Trial Date</Label>
                <DictationDateInput
                  id="trialDate"
                  label="Trial Date"
                  value={wizardData.keyDates.trialDate}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    keyDates: { ...prev.keyDates, trialDate: value }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="judgmentDate">Judgment Date</Label>
                <DictationDateInput
                  id="judgmentDate"
                  label="Judgment Date"
                  value={wizardData.keyDates.judgmentDate}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    keyDates: { ...prev.keyDates, judgmentDate: value }
                  }))}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="billDate">Bill Date</Label>
                <DictationDateInput
                  id="billDate"
                  label="Bill Date"
                  value={wizardData.keyDates.billDate}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    keyDates: { ...prev.keyDates, billDate: value }
                  }))}
                />
              </div>
            </div>
          </div>
        )
        
      case 4: // Parties Information
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Client Information</h3>
              
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <DictationInput
                  value={wizardData.clientInfo.name}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    clientInfo: { ...prev.clientInfo, name: value }
                  }))}
                  placeholder="Client name or company (type or dictate)"
                />
              </div>
              <div>
                <Label htmlFor="clientAddress">Client Address</Label>
                <DictationTextArea
                  value={(wizardData as any).clientInfo?.address || ''}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    clientInfo: { ...prev.clientInfo, address: value } as any
                  }))}
                  placeholder="Physical or postal address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientType">Client Type</Label>
                  <Select
                    value={wizardData.clientInfo.type}
                    onValueChange={(value: any) => setWizardData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="clientVAT"
                    checked={wizardData.clientInfo.isVATVendor}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, isVATVendor: e.target.checked }
                    }))}
                  />
                  <Label htmlFor="clientVAT">Client is VAT Vendor</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Practitioner Information</h3>
              
              <div>
                <Label htmlFor="practitionerName">Practitioner Name</Label>
                <DictationInput
                  value={wizardData.practitionerInfo.name}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    practitionerInfo: { ...prev.practitionerInfo, name: value }
                  }))}
                  placeholder="Attorney/Advocate name"
                />
              </div>
              <div>
                <Label htmlFor="opposingPartyName">Opposing Party Name</Label>
                <DictationInput
                  value={(wizardData as any).opposingPartyName || ''}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    opposingPartyName: value
                  }) as any)}
                  placeholder="Defendant/Respondent name"
                />
              </div>
              <div>
                <Label htmlFor="opposingPartyAddress">Opposing Party Address</Label>
                <DictationTextArea
                  value={(wizardData as any).opposingPartyAddress || ''}
                  onChange={(value) => setWizardData(prev => ({
                    ...prev,
                    opposingPartyAddress: value
                  }) as any)}
                  placeholder="Opposing party physical or postal address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="practiceType">Practice Type</Label>
                  <Select
                    value={wizardData.practitionerInfo.practiceType}
                    onValueChange={(value: any) => setWizardData(prev => ({
                      ...prev,
                      practitionerInfo: { ...prev.practitionerInfo, practiceType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attorney">Attorney</SelectItem>
                      <SelectItem value="advocate">Advocate</SelectItem>
                      <SelectItem value="candidate">Candidate Attorney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    value={wizardData.practitionerInfo.admissionDate}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      practitionerInfo: { ...prev.practitionerInfo, admissionDate: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="practitionerVAT"
                  checked={wizardData.practitionerInfo.isVATVendor}
                  onChange={(e) => setWizardData(prev => ({
                    ...prev,
                    practitionerInfo: { ...prev.practitionerInfo, isVATVendor: e.target.checked }
                  }))}
                />
                <Label htmlFor="practitionerVAT">Practitioner is VAT Vendor</Label>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Bill Creation Wizard</CardTitle>
                <p className="text-gray-600 mt-1">Step-by-step bill creation with compliance checking</p>
              </div>
              <Badge className={getStatusColor(complianceStatus)}>
                {getStatusIcon(complianceStatus)}
                <span className="ml-1 capitalize">{complianceStatus.replace('-', ' ')}</span>
              </Badge>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">{currentStep + 1} of {steps.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    index === currentStep
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : step.isComplete
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {step.icon}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  {step.isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              ))}
            </div>
          </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
          
          {validationErrors.length > 0 && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <XCircle className="w-4 h-4 text-red-500" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={validationErrors.length > 0}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!steps.every(step => step.isValid)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Bill
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}