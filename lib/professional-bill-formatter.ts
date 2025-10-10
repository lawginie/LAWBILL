import { BillItem, BillCalculation } from './tariff-engine'
import { formatCurrency, formatDate } from './utils'

export interface ProfessionalBillData {
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
    billType: 'party-and-party' | 'attorney-and-client' | 'own-client'
    costsOrder?: string
    taxationDate?: Date
  }
  client: {
    name: string
    address?: string
    reference?: string
  }
  opposingParty?: {
    name: string
    attorney?: string
    address?: string
  }
}

export interface BillFormattingOptions {
  includeVAT: boolean
  includeSource: boolean
  showItemNumbers: boolean
  groupByCategory: boolean
  includeCompliance: boolean
  watermark?: string
}

export class ProfessionalBillFormatter {
  private static instance: ProfessionalBillFormatter
  
  static getInstance(): ProfessionalBillFormatter {
    if (!ProfessionalBillFormatter.instance) {
      ProfessionalBillFormatter.instance = new ProfessionalBillFormatter()
    }
    return ProfessionalBillFormatter.instance
  }

  generateProfessionalBill(data: ProfessionalBillData, options: BillFormattingOptions): string {
    const { matter, bill, client, opposingParty } = data
    
    let billContent = ''
    
    // Header Section
    billContent += this.generateHeader(matter, bill)
    billContent += '\n\n'
    
    // Case Information
    billContent += this.generateCaseInformation(matter, client, opposingParty)
    billContent += '\n\n'
    
    // Bill Items
    billContent += this.generateBillItems(bill.items, options)
    billContent += '\n\n'
    
    // Summary and Totals
    billContent += this.generateSummary(bill.calculation, options)
    billContent += '\n\n'
    
    // Compliance and Certification
    if (options.includeCompliance) {
      billContent += this.generateCompliance(matter, bill)
      billContent += '\n\n'
    }
    
    // Footer
    billContent += this.generateFooter(matter, bill)
    
    return billContent
  }

  private generateHeader(matter: any, bill: any): string {
    return `
IN THE ${matter.courtType.toUpperCase()}
${matter.caseNumber ? `CASE NO: ${matter.caseNumber}` : ''}

BILL OF COSTS
${bill.billType.toUpperCase().replace(/-/g, ' AND ')}

Bill No: ${bill.billNumber}
Date: ${formatDate(bill.dateGenerated)}
    `.trim()
  }

  private generateCaseInformation(matter: any, client: any, opposingParty?: any): string {
    const content = `
BETWEEN:

${client.name.toUpperCase()}                                                    PLAINTIFF/APPLICANT
${client.reference ? `(Client Reference: ${client.reference})` : ''}

AND

${opposingParty?.name?.toUpperCase() || 'TO BE ADVISED'}                        DEFENDANT/RESPONDENT

IN THE MATTER OF: ${matter.title}

ATTORNEY FOR PLAINTIFF/APPLICANT:
${matter.attorney}
${matter.firmName}
${matter.firmAddress}
${matter.practiceNumber ? `Practice Number: ${matter.practiceNumber}` : ''}
${matter.telephoneNumber ? `Tel: ${matter.telephoneNumber}` : ''}
${matter.emailAddress ? `Email: ${matter.emailAddress}` : ''}
${matter.firmVAT ? `VAT No: ${matter.firmVAT}` : ''}
    `.trim()
    
    return content
  }

  private generateBillItems(items: BillItem[], options: BillFormattingOptions): string {
    let content = `
BILL OF COSTS

Item | Description | Scale | Amount
-----|-------------|-------|--------
    `.trim()
    
    let itemNumber = 1
    let categoryTotal = 0
    const currentCategory = ''
    
    // Group items by category if requested
    const groupedItems = options.groupByCategory ? this.groupItemsByCategory(items) : { 'All Items': items }
    
    for (const [category, categoryItems] of Object.entries(groupedItems)) {
      if (options.groupByCategory && category !== 'All Items') {
        content += `\n\n${category.toUpperCase()}\n`
        content += '='.repeat(category.length) + '\n'
      }
      
      categoryTotal = 0
      
      for (const item of categoryItems) {
        const itemNo = options.showItemNumbers ? `${itemNumber}.` : ''
        const description = this.formatItemDescription(item)
        const scale = item.scale || 'N/A'
        const amount = formatCurrency(item.amount ?? 0)
        
        content += `\n${itemNo.padEnd(5)} | ${description.padEnd(50)} | ${scale.padEnd(8)} | ${amount.padStart(12)}`
        
        if (item.details) {
          content += `\n      | ${item.details.padEnd(50)} |          |`
        }
        
        categoryTotal += (item.amount ?? 0)
        itemNumber++
      }
      
      if (options.groupByCategory && category !== 'All Items') {
        content += `\n      | ${'SUBTOTAL:'.padEnd(50)} |          | ${formatCurrency(categoryTotal).padStart(12)}`
      }
    }
    
    return content
  }

  private generateSummary(calculation: BillCalculation, options: BillFormattingOptions): string {
    let content = `
SUMMARY OF COSTS

Professional Fees:                    ${formatCurrency(calculation.professionalFees ?? 0)}
Disbursements:                         ${formatCurrency(calculation.disbursements ?? 0)}
    `.trim()
    
    if (options.includeVAT && (calculation.vat ?? 0) > 0) {
      content += `\nSubtotal:                              ${formatCurrency(calculation.subtotal ?? 0)}`
      content += `\nVAT (15%):                             ${formatCurrency(calculation.vat ?? 0)}`
    }
    
    content += `\n${'='.repeat(50)}`
    content += `\nTOTAL AMOUNT CLAIMED:                  ${formatCurrency(calculation.total ?? 0)}`
    
    if (calculation.previousPayments && calculation.previousPayments > 0) {
      content += `\nLess: Previous Payments:               ${formatCurrency(calculation.previousPayments)}`
      content += `\nBALANCE DUE:                           ${formatCurrency((calculation.total ?? 0) - calculation.previousPayments)}`
    }
    
    return content
  }

  private generateCompliance(matter: any, bill: any): string {
    return `
COMPLIANCE CERTIFICATE

I, ${matter.attorney}, being the attorney for the Plaintiff/Applicant in the above matter, do hereby certify that:

1. This Bill of Costs has been prepared in accordance with the applicable tariff and rules of court.
2. All work claimed for has been necessarily and properly performed.
3. The charges are fair and reasonable having regard to the nature and importance of the matter.
4. No arrangement exists between myself and my client which would affect the costs recoverable.
5. This bill complies with the requirements of the Legal Practice Act and the Rules of Court.

Date: ${formatDate(bill.dateGenerated)}

_________________________
${matter.attorney}
Attorney for Plaintiff/Applicant
Practice Number: ${matter.practiceNumber || 'N/A'}
    `.trim()
  }

  private generateFooter(matter: any, bill: any): string {
    return `
---
Generated by LAWBill Professional
${formatDate(new Date())}
Bill ID: ${bill.id}
    `.trim()
  }

  private groupItemsByCategory(items: BillItem[]): Record<string, BillItem[]> {
    const grouped: Record<string, BillItem[]> = {}
    
    for (const item of items) {
      const category = item.category || 'Miscellaneous'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(item)
    }
    
    return grouped
  }

  private formatItemDescription(item: BillItem): string {
    let description = item.description
    
    if (item.date) {
      description = `${formatDate(item.date)}: ${description}`
    }
    
    if (item.timeSpent) {
      description += ` (${item.timeSpent})`
    }
    
    return description
  }

  // Generate HTML version for preview
  generateHTMLBill(data: ProfessionalBillData, options: BillFormattingOptions): string {
    const textBill = this.generateProfessionalBill(data, options)

    const { matter, client, opposingParty, bill } = data
    const courtTitle = `IN THE ${matter.courtType.toUpperCase()}`
    const caseNo = matter.caseNumber ? `Case No: ${matter.caseNumber}` : ''
    const clientName = client.name || 'Client'
    const clientAddress = client.address ? client.address : ''
    const oppName = opposingParty?.name || 'To be advised'
    const oppAddress = opposingParty?.address || ''

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bill of Costs - ${bill.billNumber}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            margin: 2cm;
            color: #000;
        }
        .letterhead {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .firm {
            font-weight: bold;
            font-size: 14pt;
        }
        .firm-details {
            font-size: 10pt;
            white-space: pre-line;
        }
        .meta {
            text-align: right;
            font-size: 10pt;
        }
        .watermark {
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64pt;
            color: rgba(0,0,0,0.06);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
        }
        .court-header {
            text-align: center;
            font-weight: bold;
            margin: 24px 0 12px 0;
        }
        .case-line {
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
        }
        .parties {
            margin: 18px 0;
        }
        .parties .side {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
        }
        .label {
            font-weight: bold;
        }
        .pre-content {
            position: relative;
            z-index: 1;
        }
        @media print {
            body { margin: 1cm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
    <header class="letterhead">
        <div>
            <div class="firm">${matter.firmName}</div>
            <div class="firm-details">${matter.firmAddress}${matter.telephoneNumber ? `\nTel: ${matter.telephoneNumber}` : ''}${matter.emailAddress ? `\nEmail: ${matter.emailAddress}` : ''}${matter.firmVAT ? `\nVAT: ${matter.firmVAT}` : ''}${matter.practiceNumber ? `\nPractice No: ${matter.practiceNumber}` : ''}</div>
        </div>
        <div class="meta">
            <div><span class="label">Bill No:</span> ${bill.billNumber}</div>
            <div><span class="label">Date:</span> ${formatDate(bill.dateGenerated)}</div>
            <div><span class="label">Type:</span> ${bill.billType.toUpperCase().replace(/-/g, ' AND ')}</div>
        </div>
    </header>

    <section class="court-header">
        <div>${courtTitle}</div>
        <div class="case-line">
            <div>In the matter between:</div>
            <div>${caseNo}</div>
        </div>
    </section>

    <section class="parties">
        <div class="side">
            <div><span class="label">Plaintiff/Applicant:</span> ${clientName}</div>
            <div>PLAINTIFF/APPLICANT</div>
        </div>
        ${clientAddress ? `<div style="font-size:10pt; margin-top:4px;">${clientAddress}</div>` : ''}
        <div style="margin:8px 0;">AND</div>
        <div class="side">
            <div><span class="label">Defendant/Respondent:</span> ${oppName}</div>
            <div>DEFENDANT/RESPONDENT</div>
        </div>
        ${oppAddress ? `<div style="font-size:10pt; margin-top:4px;">${oppAddress}</div>` : ''}
    </section>

    <main class="pre-content">
        <pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif;">${textBill}</pre>
    </main>
</body>
</html>
    `.trim()
  }
}

// Export singleton instance
export const professionalBillFormatter = ProfessionalBillFormatter.getInstance()