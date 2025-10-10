import { BillItem, BillCalculation } from './tariff-engine'
import { formatCurrency, formatDate } from './utils'
import { professionalBillFormatter, ProfessionalBillData, BillFormattingOptions } from './professional-bill-formatter'

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
    practiceNumber?: string
    telephoneNumber?: string
    emailAddress?: string
  }
  bill: {
    id: string
    items: BillItem[]
    calculation: BillCalculation
    dateGenerated: Date
    billNumber: string
    billType?: string
    costsOrder?: string
    taxationDate?: Date
  }
  client?: {
    name: string
    address?: string
    reference?: string
  }
  opposingParty?: {
    name: string
    attorney?: string
    address?: string
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
  format: 'pdf' | 'docx' | 'html'
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
    switch (options.format) {
      case 'pdf':
        return this.generatePDF(data, options)
      case 'docx':
        return this.generateDOCX(data, options)
      case 'html':
        return this.generateHTML(data, options)
      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }
  }

  async generateProfessionalBill(data: ExportData, options: ExportOptions): Promise<Blob> {
    const professionalData = this.convertToProfessionalBillData(data)
    const formattingOptions = this.convertToFormattingOptions(options)
    
    switch (options.format) {
      case 'html':
        const htmlContent = professionalBillFormatter.generateHTMLBill(professionalData, formattingOptions)
        return new Blob([htmlContent], { type: 'text/html' })
      case 'pdf':
        // For now, generate HTML and let the browser handle PDF conversion
        const htmlForPdf = professionalBillFormatter.generateHTMLBill(professionalData, formattingOptions)
        return new Blob([htmlForPdf], { type: 'text/html' })
      case 'docx':
        const textContent = professionalBillFormatter.generateProfessionalBill(professionalData, formattingOptions)
        return new Blob([textContent], { type: 'text/plain' })
      default:
        const defaultContent = professionalBillFormatter.generateProfessionalBill(professionalData, formattingOptions)
        return new Blob([defaultContent], { type: 'text/plain' })
    }
  }

  private convertToProfessionalBillData(data: ExportData): ProfessionalBillData {
    return {
      matter: {
        id: data.matter.id,
        title: data.matter.title,
        courtType: this.getCourtName(data.matter.courtType),
        caseNumber: data.matter.caseNumber,
        parties: data.matter.parties,
        attorney: data.matter.attorney,
        firmName: data.matter.firmName,
        firmAddress: data.matter.firmAddress,
        firmVAT: data.matter.firmVAT,
        practiceNumber: data.matter.practiceNumber,
        telephoneNumber: data.matter.telephoneNumber,
        emailAddress: data.matter.emailAddress
      },
      bill: {
        id: data.bill.id,
        items: data.bill.items,
        calculation: data.bill.calculation,
        dateGenerated: data.bill.dateGenerated,
        billNumber: data.bill.billNumber,
        billType: (data.bill.billType as 'party-and-party' | 'attorney-and-client' | 'own-client') || 'party-and-party',
        costsOrder: data.bill.costsOrder,
        taxationDate: data.bill.taxationDate
      },
      client: {
        name: data.client?.name || 'Client Name',
        address: data.client?.address,
        reference: data.client?.reference
      },
      opposingParty: data.opposingParty ? {
        name: data.opposingParty.name,
        attorney: data.opposingParty.attorney,
        address: data.opposingParty.address
      } : undefined
    }
  }

  private convertToFormattingOptions(options: ExportOptions): BillFormattingOptions {
    return {
      includeVAT: options.includeVAT,
      includeSource: options.includeSource,
      showItemNumbers: true,
      groupByCategory: true,
      includeCompliance: options.template === 'taxation',
      watermark: options.watermark
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

  private async generateHTML(data: ExportData, options: ExportOptions): Promise<Blob> {
    const htmlContent = this.createHTMLContent(data, options)
    return new Blob([htmlContent], { type: 'text/html' })
  }

  private async generateDOCX(data: ExportData, options: ExportOptions): Promise<Blob> {
    // Mock implementation - in a real app, you'd use a library like docx
    const content = this.createDOCXContent(data, options)
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
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
        { text: item.date ? formatDate(item.date) : '-', style: 'tableCell' },
        { text: item.tariffItem?.label || 'Custom', style: 'tableCell' },
        { text: item.description, style: 'tableCell' },
        { text: item.units.toString(), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.rate || item.rateApplied), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.amountExVAT || item.amountExVat), style: 'tableCell', alignment: 'right' }
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
      ['Professional Fees:', formatCurrency(calculation.professionalFees || 0)],
      ['Disbursements:', formatCurrency(calculation.disbursements || 0)],
      ['Counsel Fees:', formatCurrency(calculation.counselFees || 0)]
    ]

    if (options.includeVAT) {
      totals.push(['Subtotal (Ex VAT):', formatCurrency(calculation.subtotalExVAT || 0)])
      totals.push(['VAT:', formatCurrency(calculation.vat || 0)])
    }

    totals.push(['TOTAL:', formatCurrency(calculation.total || 0)])

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
      table += `${item.date ? formatDate(item.date) : '-'}\t\t${item.tariffItem?.label || 'Custom'}\t\t${item.description}\t\t${item.units}\t\t${formatCurrency(item.rate || item.rateApplied)}\t\t${formatCurrency(item.amountExVAT || item.amountExVat)}\n`
    })
    
    table += '='.repeat(80) + '\n'
    table += `Professional Fees:\t\t\t\t\t\t${formatCurrency(calculation.professionalFees || 0)}\n`
    table += `Disbursements:\t\t\t\t\t\t${formatCurrency(calculation.disbursements || 0)}\n`
    table += `Counsel Fees:\t\t\t\t\t\t${formatCurrency(calculation.counselFees || 0)}\n`
    
    if (options.includeVAT) {
      table += `VAT:\t\t\t\t\t\t${formatCurrency(calculation.vat || 0)}\n`
    }
    
    table += `TOTAL:\t\t\t\t\t\t${formatCurrency(calculation.total || 0)}\n`
    
    return table
  }

  private createMockPDFContent(data: ExportData, options: ExportOptions): string {
    // This would be actual PDF binary content in a real implementation
    return `%PDF-1.4
Mock PDF content for ${data.matter.title}
Bill Total: ${formatCurrency(data.bill.calculation.total || 0)}
Generated: ${formatDate(data.bill.dateGenerated)}
Format: ${options.format}
Template: ${options.template}`
  }

  private createHTMLContent(data: ExportData, options: ExportOptions): string {
    const { matter, bill } = data
    const { calculation, items } = bill
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill of Costs - ${matter.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .matter-info { margin-bottom: 20px; }
          .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .bill-table th, .bill-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .bill-table th { background-color: #f5f5f5; }
          .totals { margin-top: 20px; }
          .total-row { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BILL OF COSTS</h1>
          <h2>${matter.title}</h2>
        </div>
        
        <div class="matter-info">
          <p><strong>Case Number:</strong> ${matter.caseNumber || 'N/A'}</p>
          <p><strong>Court:</strong> ${this.getCourtName(matter.courtType)}</p>
          <p><strong>Parties:</strong> ${matter.parties}</p>
          <p><strong>Attorney:</strong> ${matter.attorney}</p>
          <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
          <p><strong>Date:</strong> ${formatDate(bill.dateGenerated)}</p>
        </div>
        
        <table class="bill-table">
          <thead>
            <tr>
              <th>Tariff Item</th>
              <th>Description</th>
              <th>Units</th>
              <th>Rate</th>
              <th>Amount Ex VAT</th>
              <th>VAT</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.tariffItemId}</td>
                <td>${item.description}</td>
                <td>${item.units}</td>
                <td>${formatCurrency(item.rateApplied)}</td>
                <td>${formatCurrency(item.amountExVat)}</td>
                <td>${formatCurrency(item.vat)}</td>
                <td>${formatCurrency(item.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Total Ex VAT:</strong> ${formatCurrency(calculation.totalExVat || 0)}</p>
          ${options.includeVAT ? `<p><strong>VAT:</strong> ${formatCurrency(calculation.totalVat || 0)}</p>` : ''}
          <p class="total-row"><strong>Grand Total:</strong> ${formatCurrency(calculation.grandTotal || 0)}</p>
        </div>
      </body>
      </html>
    `
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