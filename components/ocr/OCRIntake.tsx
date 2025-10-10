'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Camera, 
  FileText, 
  Loader2, 
  Check, 
  X,
  Eye,
  Plus,
  AlertCircle,
  Zap
} from 'lucide-react'
import { tariffEngine, BillItem } from '@/lib/tariff-engine'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface OCRSuggestion {
  id: string
  extractedText: string
  suggestedItem: {
    itemNumber: string
    description: string
    units: number
    rate: number
    confidence: number
  }
  sourceReference: string
  accepted: boolean
}

interface OCRIntakeProps {
  matterId: string
  courtType: string
  scale: string
  onItemsAdded: (items: BillItem[]) => void
}

export function OCRIntake({ matterId, courtType, scale, onItemsAdded }: OCRIntakeProps) {
  const { profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [ocrSuggestions, setOcrSuggestions] = useState<OCRSuggestion[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mock OCR processing function
  const processOCR = useCallback(async (file: File): Promise<OCRSuggestion[]> => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock extracted text patterns that would come from real OCR
    const mockExtractions = [
      {
        text: "tel opp 12m",
        itemNumber: "1.1",
        description: "Telephone consultation with opponent",
        units: 0.2, // 12 minutes = 0.2 hours
        confidence: 0.85
      },
      {
        text: "perusal contract 3p",
        itemNumber: "2.1",
        description: "Perusal of contract",
        units: 3, // 3 pages
        confidence: 0.92
      },
      {
        text: "draft letter 1p",
        itemNumber: "3.1",
        description: "Drafting letter",
        units: 1, // 1 page
        confidence: 0.78
      },
      {
        text: "court attendance 2h",
        itemNumber: "4.1",
        description: "Court attendance",
        units: 2, // 2 hours
        confidence: 0.88
      }
    ]

    return mockExtractions.map((extraction, index) => {
      const tariff = tariffEngine.getTariff(courtType, scale)
      const tariffItem = tariff?.items.find(item => item.itemNumber === extraction.itemNumber)
      
      return {
        id: `ocr-${Date.now()}-${index}`,
        extractedText: extraction.text,
        suggestedItem: {
          itemNumber: extraction.itemNumber,
          description: extraction.description,
          units: extraction.units,
          rate: tariffItem?.rate || 0,
          confidence: extraction.confidence
        },
        sourceReference: `OCR from ${file.name}`,
        accepted: false
      }
    })
  }, [courtType, scale])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    setIsProcessing(true)
    
    try {
      const file = files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error('Please upload an image or PDF file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      setUploadedFiles([file])

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }

      // Process OCR
      const suggestions = await processOCR(file)
      setOcrSuggestions(suggestions)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const acceptSuggestion = (suggestionId: string) => {
    setOcrSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, accepted: true }
          : suggestion
      )
    )
  }

  const rejectSuggestion = (suggestionId: string) => {
    setOcrSuggestions(prev => 
      prev.filter(suggestion => suggestion.id !== suggestionId)
    )
  }

  const addAcceptedItems = () => {
    const acceptedSuggestions = ocrSuggestions.filter(s => s.accepted)
    
    const billItems: BillItem[] = acceptedSuggestions.map(suggestion => {
      const billItem = tariffEngine.calculateBillItem(
        courtType,
        scale,
        suggestion.suggestedItem.itemNumber,
        suggestion.suggestedItem.units,
        suggestion.suggestedItem.description,
        'ocr',
        profile?.id || 'user'
      )

      if (billItem) {
        // Add OCR source reference
        billItem.source = suggestion.sourceReference
        return billItem
      }

      // Fallback for custom items
      return {
        id: `ocr-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tariffItemId: suggestion.suggestedItem.itemNumber,
        description: suggestion.suggestedItem.description,
        units: suggestion.suggestedItem.units,
        rateApplied: suggestion.suggestedItem.rate,
        amountExVat: suggestion.suggestedItem.units * suggestion.suggestedItem.rate,
        vat: 0,
        totalAmount: suggestion.suggestedItem.units * suggestion.suggestedItem.rate,
        source: 'ocr',
        sourceReference: suggestion.sourceReference,
        createdBy: profile?.id || 'user',
        createdAt: new Date()
      }
    }).filter(Boolean) as BillItem[]

    onItemsAdded(billItems)
    
    // Clear processed suggestions
    setOcrSuggestions([])
    setUploadedFiles([])
    setPreviewImage(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            OCR Document Intake
          </CardTitle>
          <CardDescription>
            Upload scanned documents or photos to extract billing items automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              
              {isProcessing ? (
                <div className="space-y-2">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
                  <p className="text-lg font-medium">Processing document...</p>
                  <p className="text-sm text-gray-500">Extracting text and analyzing content</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-lg font-medium">Upload Document</p>
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop<br />
                    Supports: Images (JPG, PNG) and PDF files
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Camera Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // In a real app, this would trigger camera capture
                  fileInputRef.current?.click()
                }}
                disabled={isProcessing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <img
                src={previewImage}
                alt="Document preview"
                className="w-full h-auto rounded-lg border"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* OCR Suggestions */}
      {ocrSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Extracted Items ({ocrSuggestions.length})
            </CardTitle>
            <CardDescription>
              Review and accept the items extracted from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ocrSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border rounded-lg p-4 ${
                    suggestion.accepted ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.extractedText}
                        </Badge>
                        <Badge 
                          variant={suggestion.suggestedItem.confidence >= 0.8 ? 'default' : 'secondary'}
                          className={`text-xs ${getConfidenceColor(suggestion.suggestedItem.confidence)}`}
                        >
                          {getConfidenceBadge(suggestion.suggestedItem.confidence)} Confidence
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{suggestion.suggestedItem.description}</h4>
                        <p className="text-sm text-gray-600">
                          {suggestion.suggestedItem.units} × {formatCurrency(suggestion.suggestedItem.rate)} = {' '}
                          {formatCurrency(suggestion.suggestedItem.units * suggestion.suggestedItem.rate)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Source: {suggestion.sourceReference}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {suggestion.accepted ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Accepted
                        </Badge>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acceptSuggestion(suggestion.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectSuggestion(suggestion.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {ocrSuggestions.some(s => s.accepted) && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {ocrSuggestions.filter(s => s.accepted).length} items selected
                      </p>
                      <p className="text-sm text-gray-600">
                        Total: {formatCurrency(
                          ocrSuggestions
                            .filter(s => s.accepted)
                            .reduce((sum, s) => sum + (s.suggestedItem.units * s.suggestedItem.rate), 0)
                        )}
                      </p>
                    </div>
                    <Button onClick={addAcceptedItems}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Bill
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}