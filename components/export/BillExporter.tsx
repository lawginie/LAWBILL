'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Eye, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { ExportEngine, ExportData, ExportOptions } from '@/lib/export-engine'
import { BillItem, BillCalculation } from '@/lib/tariff-engine'
import { formatCurrency, formatDate } from '@/lib/utils'

interface BillExporterProps {
  matterId: string
  matterTitle: string
  courtType: string
  caseNumber?: string
  parties: string
  attorney: string
  firmName: string
  firmAddress: string
  firmVAT?: string
  billItems: BillItem[]
  billCalculation: BillCalculation
  onExportComplete?: (exportId: string) => void
}

export function BillExporter({
  matterId,
  matterTitle,
  courtType,
  caseNumber,
  parties,
  attorney,
  firmName,
  firmAddress,
  firmVAT,
  billItems,
  billCalculation,
  onExportComplete
}: BillExporterProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    template: 'standard',
    includeVAT: true,
    includeSource: false
  })
  const [customFilename, setCustomFilename] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string
    date: Date
    format: string
    template: string
    filename: string
  }>>([])

  const exportEngine = ExportEngine.getInstance()

  const generateBillNumber = (): string => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const time = String(date.getTime()).slice(-4)
    return `BILL-${year}${month}${day}-${time}`
  }

  const createExportData = (): ExportData => {
    return {
      matter: {
        id: matterId,
        title: matterTitle,
        courtType,
        caseNumber,
        parties,
        attorney,
        firmName,
        firmAddress,
        firmVAT
      },
      bill: {
        id: `bill-${Date.now()}`,
        items: billItems,
        calculation: billCalculation,
        dateGenerated: new Date(),
        billNumber: generateBillNumber()
      }
    }
  }

  const handlePreview = async () => {
    if (billItems.length === 0) {
      alert('No bill items to export')
      return
    }

    setIsPreviewing(true)
    try {
      const exportData = createExportData()
      
      // Use professional bill formatter for better legal formatting
      const blob = await exportEngine.generateProfessionalBill(exportData, {
        ...exportOptions,
        format: 'html' // Always use HTML for preview
      })
      
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      
      // Open preview in new window
      window.open(url, '_blank')
    } catch (error) {
      console.error('Preview failed:', error)
      alert('Failed to generate preview')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleExport = async () => {
    if (billItems.length === 0) {
      alert('No bill items to export')
      return
    }

    setIsExporting(true)
    try {
      const exportData = createExportData()
      const filename = customFilename || `${matterTitle.replace(/[^a-zA-Z0-9]/g, '_')}_bill`
      
      // Use professional bill formatter for proper legal document formatting
      const blob = await exportEngine.generateProfessionalBill(exportData, exportOptions)
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.${exportOptions.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      // Add to export history
      const newExport = {
        id: `export-${Date.now()}`,
        date: new Date(),
        format: exportOptions.format,
        template: exportOptions.template,
        filename: `${filename}.${exportOptions.format}`
      }
      setExportHistory(prev => [newExport, ...prev])
      
      // Trigger per-matter fee if this is the first export
      if (exportHistory.length === 0 && onExportComplete) {
        onExportComplete(newExport.id)
      }
      
      alert('Bill exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export bill')
    } finally {
      setIsExporting(false)
    }
  }

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'standard':
        return 'Basic bill format with itemized costs'
      case 'detailed':
        return 'Comprehensive format with additional details and source references'
      case 'taxation':
        return 'Format suitable for taxation proceedings with objection columns'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Configure how your bill will be generated and formatted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format">File Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: 'pdf' | 'docx') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Recommended)</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={exportOptions.template}
                onValueChange={(value: 'standard' | 'detailed' | 'taxation') => 
                  setExportOptions(prev => ({ ...prev, template: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Bill</SelectItem>
                  <SelectItem value="detailed">Detailed Bill</SelectItem>
                  <SelectItem value="taxation">Taxation Bundle</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {getTemplateDescription(exportOptions.template)}
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeVAT"
                checked={exportOptions.includeVAT}
                onChange={(e) => 
                  setExportOptions(prev => ({ ...prev, includeVAT: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="includeVAT">Include VAT breakdown</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeSource"
                checked={exportOptions.includeSource}
                onChange={(e) => 
                  setExportOptions(prev => ({ ...prev, includeSource: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="includeSource">Include source references (OCR, manual entry)</Label>
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Custom Filename (optional)</Label>
            <Input
              id="filename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave blank for auto-generated name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bill Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Items</div>
              <div className="text-lg font-semibold">{billItems.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Professional Fees</div>
              <div className="text-lg font-semibold">{formatCurrency(billCalculation.professionalFees ?? 0)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Disbursements</div>
              <div className="text-lg font-semibold">{formatCurrency(billCalculation.disbursements ?? 0)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-lg font-semibold text-blue-600">{formatCurrency(billCalculation.total ?? 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handlePreview}
          variant="outline"
          disabled={isPreviewing || billItems.length === 0}
        >
          {isPreviewing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          Preview
        </Button>

        <Button
          onClick={handleExport}
          disabled={isExporting || billItems.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Bill
        </Button>
      </div>

      {/* Warnings */}
      {billItems.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No bill items to export. Please add items to your bill before exporting.
          </AlertDescription>
        </Alert>
      )}

      {exportHistory.length === 0 && billItems.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will be your first export for this matter. A per-matter fee may apply according to your subscription plan.
          </AlertDescription>
        </Alert>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportHistory.map((export_) => (
                <div key={export_.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{export_.filename}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(export_.date)} • {export_.format.toUpperCase()} • {export_.template}
                    </div>
                  </div>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Exported
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}