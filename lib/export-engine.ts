import { BillItem, BillCalculation } from './tariff-engine'
import { formatCurrency, formatDate } from './utils'

export interface ExportData {
  matter: {
    id: string
    title: string
    courtType: string
    caseNumber?: string
    parties: string
    attorney: string
    firmName: string
    firmAddress: string
    firmVAT?: string
  }
  bill: {
    id: string
    items: BillItem[]
    calculation: BillCalculation
    dateGenerated: Date
    billNumber: string
  }
  taxation?: {
    objections: Array<{
      itemId: string
      objection: string
      response?: string
      decision?: 'allowed' | 'disallowed' | 'reduced'
      reducedAmount?: number
    }>
  }
}

export interface ExportOptions {
  format: 'pdf' | 'docx'
  template: 'standard' | 'detailed' | 'taxation'
  includeVAT: boolean
  includeSource: boolean
  watermark?: string
}

export class ExportEngine {
  private static instance: ExportEngine
  
  static getInstance(): ExportEngine {
    if (!ExportEngine.instance) {
      ExportEngine.instance = new ExportEngine()
    }
    return ExportEngine.instance
  }

  async generateBill(data: ExportData, options: ExportOptions): Promise<Blob> {
    if (options.format === 'pdf') {
      return this.generatePDF(data, options)
    } else {
      return this.generateDOCX(data, options)
    }
  }

  private async generatePDF(data: ExportData, options: ExportOptions): Promise<Blob> {
    // Using pdfmake for PDF generation
    const docDefinition = this.createPDFDefinition(data, options)
    
    // In a real implementation, you would use pdfmake here
    // For now, we'll create a mock PDF blob
    const mockPDFContent = this.createMockPDFContent(data, options)
    return new Blob([mockPDFContent], { type: 'application/pdf' })
  }

  private async generateDOCX(data: ExportData, options: ExportOptions): Promise<Blob> {
    // Using docxtemplater for DOCX generation
    const docContent = this.createDOCXContent(data, options)
    
    // In a real implementation, you would use docxtemplater here
    // For now, we'll create a mock DOCX blob
    return new Blob([docContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
  }

  private createPDFDefinition(data: ExportData, options: ExportOptions) {
    const { matter, bill, taxation } = data
    
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        text: options.watermark || '',
        alignment: 'center',
        opacity: 0.3,
        fontSize: 48,
        color: 'gray'
      },
      content: [
        // Header
        {
          text: 'BILL OF COSTS',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Court and case details
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: 'IN THE ', bold: true },
                { text: this.getCourtName(matter.courtType), bold: true },
                '\n',
                { text: 'Case No: ', bold: true },
                matter.caseNumber || 'TBC'
              ]
            },
            {
              width: '50%',
              text: [
                { text: 'Bill No: ', bold: true },
                bill.billNumber,
                '\n',
                { text: 'Date: ', bold: true },
                formatDate(bill.dateGenerated)
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        
        // Parties
        {
          text: [
            { text: 'In the matter between:\n', bold: true },
            matter.parties
          ],
          margin: [0, 0, 0, 20]
        },
        
        // Attorney details
        {
          text: [
            { text: 'Attorney for Plaintiff/Applicant: ', bold: true },
            matter.attorney,
            '\n',
            { text: 'Firm: ', bold: true },
            matter.firmName,
            '\n',
            matter.firmAddress
          ],
          margin: [0, 0, 0, 30]
        },
        
        // Bill items table
        this.createBillTable(bill.items, bill.calculation, options),
        
        // Totals
        this.createTotalsSection(bill.calculation, options),
        
        // Taxation section (if applicable)
        ...(taxation && options.template === 'taxation' ? [this.createTaxationSection(taxation)] : []),
        
        // Footer
        {
          text: [
            '\n\nI CERTIFY that the above bill is correct and that the charges are fair and reasonable.\n\n',
            { text: 'ATTORNEY FOR PLAINTIFF/APPLICANT', bold: true },
            '\n\n_________________________\n',
            matter.attorney
          ],
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f0f0f0'
        },
        tableCell: {
          fontSize: 9
        }
      }
    }
  }

  private createBillTable(items: BillItem[], calculation: BillCalculation, options: ExportOptions) {
    const headers = ['Date', 'Item', 'Description', 'Units', 'Rate', 'Amount (Ex VAT)']
    if (options.includeVAT) headers.push('VAT')
    if (options.includeSource) headers.push('Source')

    const tableBody = [
      headers.map(h => ({ text: h, style: 'tableHeader' }))
    ]

    items.forEach(item => {
      const row = [
        { text: formatDate(item.date), style: 'tableCell' },
        { text: item.tariffItem?.label || 'Custom', style: 'tableCell' },
        { text: item.description, style: 'tableCell' },
        { text: item.units.toString(), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.rate), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.amountExVAT), style: 'tableCell', alignment: 'right' }
      ]
      
      if (options.includeVAT) {
        row.push({ text: formatCurrency(item.vat), style: 'tableCell', alignment: 'right' })
      }
      
      if (options.includeSource) {
        row.push({ text: item.source || 'Manual', style: 'tableCell' })
      }
      
      tableBody.push(row)
    })

    return {
      table: {
        headerRows: 1,
        widths: options.includeSource ? 
          ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'] :
          ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex: number) {
          return (rowIndex % 2 === 0) ? '#f9f9f9' : null
        }
      },
      margin: [0, 0, 0, 20]
    }
  }

  private createTotalsSection(calculation: BillCalculation, options: ExportOptions) {
    const totals = [
      ['Professional Fees:', formatCurrency(calculation.professionalFees)],
      ['Disbursements:', formatCurrency(calculation.disbursements)],
      ['Counsel Fees:', formatCurrency(calculation.counselFees)]
    ]

    if (options.includeVAT) {
      totals.push(['Subtotal (Ex VAT):', formatCurrency(calculation.subtotalExVAT)])
      totals.push(['VAT:', formatCurrency(calculation.vat)])
    }

    totals.push(['TOTAL:', formatCurrency(calculation.total)])

    return {
      table: {
        widths: ['*', 'auto'],
        body: totals.map(([label, amount], index) => [
          { text: label, bold: index === totals.length - 1, alignment: 'right' },
          { text: amount, bold: index === totals.length - 1, alignment: 'right' }
        ])
      },
      layout: 'noBorders',
      margin: [200, 0, 0, 0]
    }
  }

  private createTaxationSection(taxation: ExportData['taxation']) {
    if (!taxation) return {}

    return {
      text: 'TAXATION BUNDLE',
      style: 'header',
      pageBreak: 'before',
      margin: [0, 0, 0, 20]
    }
  }

  private createDOCXContent(data: ExportData, options: ExportOptions): string {
    const { matter, bill } = data
    
    // This would be a DOCX template in a real implementation
    return `
BILL OF COSTS

IN THE ${this.getCourtName(matter.courtType)}
Case No: ${matter.caseNumber || 'TBC'}

In the matter between:
${matter.parties}

Attorney: ${matter.attorney}
Firm: ${matter.firmName}

${this.createTextTable(bill.items, bill.calculation, options)}

I CERTIFY that the above bill is correct and that the charges are fair and reasonable.

ATTORNEY FOR PLAINTIFF/APPLICANT

_________________________
${matter.attorney}
    `.trim()
  }

  private createTextTable(items: BillItem[], calculation: BillCalculation, options: ExportOptions): string {
    let table = 'Date\t\tItem\t\tDescription\t\tUnits\t\tRate\t\tAmount\n'
    table += '='.repeat(80) + '\n'
    
    items.forEach(item => {
      table += `${formatDate(item.date)}\t\t${item.tariffItem?.label || 'Custom'}\t\t${item.description}\t\t${item.units}\t\t${formatCurrency(item.rate)}\t\t${formatCurrency(item.amountExVAT)}\n`
    })
    
    table += '='.repeat(80) + '\n'
    table += `Professional Fees:\t\t\t\t\t\t${formatCurrency(calculation.professionalFees)}\n`
    table += `Disbursements:\t\t\t\t\t\t${formatCurrency(calculation.disbursements)}\n`
    table += `Counsel Fees:\t\t\t\t\t\t${formatCurrency(calculation.counselFees)}\n`
    
    if (options.includeVAT) {
      table += `VAT:\t\t\t\t\t\t${formatCurrency(calculation.vat)}\n`
    }
    
    table += `TOTAL:\t\t\t\t\t\t${formatCurrency(calculation.total)}\n`
    
    return table
  }

  private createMockPDFContent(data: ExportData, options: ExportOptions): string {
    // This would be actual PDF binary content in a real implementation
    return `%PDF-1.4
Mock PDF content for ${data.matter.title}
Bill Total: ${formatCurrency(data.bill.calculation.total)}
Generated: ${formatDate(data.bill.dateGenerated)}
Format: ${options.format}
Template: ${options.template}`
  }

  private getCourtName(courtType: string): string {
    switch (courtType) {
      case 'MC': return 'MAGISTRATES\' COURT'
      case 'HC': return 'HIGH COURT'
      case 'SCA': return 'SUPREME COURT OF APPEAL'
      case 'CC': return 'CONSTITUTIONAL COURT'
      default: return 'COURT'
    }
  }

  async downloadBill(data: ExportData, options: ExportOptions, filename?: string): Promise<void> {
    const blob = await this.generateBill(data, options)
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `bill-${data.bill.billNumber}.${options.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  async previewBill(data: ExportData, options: ExportOptions): Promise<string> {
    const blob = await this.generateBill(data, options)
    return URL.createObjectURL(blob)
  }
}