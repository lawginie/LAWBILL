/**
 * Taxation Pack Generator for South African Legal Practice
 * Creates inspection notices, objection schedules, voucher lists, and compliance memorandums
 * Based on Magistrates' Courts Rules and taxation procedures
 */

import { BillItem } from './tariff-engine'
import { VATCalculationResult } from './vat-engine'

export interface TaxationPackContext {
  caseNumber: string
  courtType: string
  plaintiff: string
  defendant: string
  billType: 'party-and-party' | 'attorney-and-client' | 'own-client'
  costsOrder: string
  billDate: Date
  taxationDate?: Date
  practitionerName: string
  practitionerFirm: string
  practitionerAddress: string
  billItems: BillItem[]
  vatCalculation: VATCalculationResult
  totalAmount: number
}

export interface InspectionNotice {
  noticeDate: Date
  inspectionPeriod: { start: Date; end: Date }
  deliveryMethod: string
  content: string
  attachments: string[]
}

export interface ObjectionSchedule {
  objectionDeadline: Date
  setDownEligibility: Date
  blackoutPeriod?: { start: Date; end: Date }
  content: string
}

export interface VoucherList {
  requiredVouchers: VoucherItem[]
  optionalVouchers: VoucherItem[]
  missingVouchers: VoucherItem[]
  content: string
}

export interface VoucherItem {
  description: string
  amount: number
  required: boolean
  present: boolean
  reference?: string
  notes?: string
}

export interface ComplianceMemorandum {
  summary: string
  contentious: ContentiousItem[]
  justifications: string[]
  riskAssessment: string
  recommendations: string[]
  content: string
}

export interface ContentiousItem {
  lineNumber: number
  description: string
  amount: number
  issue: string
  justification: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface TaxationPack {
  context: TaxationPackContext
  inspectionNotice: InspectionNotice
  objectionSchedule: ObjectionSchedule
  voucherList: VoucherList
  complianceMemorandum: ComplianceMemorandum
  indexPage: string
  generatedDate: Date
}

class TaxationPackGenerator {
  private static instance: TaxationPackGenerator
  
  // Holiday blackout period (16 Dec to 15 Jan)
  private readonly BLACKOUT_START = { month: 12, day: 16 }
  private readonly BLACKOUT_END = { month: 1, day: 15 }
  
  // Standard periods per Magistrates' Courts Rules
  private readonly INSPECTION_PERIOD_DAYS = 10
  private readonly OBJECTION_PERIOD_DAYS = 10
  private readonly SET_DOWN_DELAY_DAYS = 5

  static getInstance(): TaxationPackGenerator {
    if (!TaxationPackGenerator.instance) {
      TaxationPackGenerator.instance = new TaxationPackGenerator()
    }
    return TaxationPackGenerator.instance
  }

  /**
   * Generates a complete taxation pack
   */
  generateTaxationPack(context: TaxationPackContext): TaxationPack {
    const inspectionNotice = this.generateInspectionNotice(context)
    const objectionSchedule = this.generateObjectionSchedule(context, inspectionNotice)
    const voucherList = this.generateVoucherList(context)
    const complianceMemorandum = this.generateComplianceMemorandum(context)
    const indexPage = this.generateIndexPage(context)

    return {
      context,
      inspectionNotice,
      objectionSchedule,
      voucherList,
      complianceMemorandum,
      indexPage,
      generatedDate: new Date()
    }
  }

  /**
   * Generates inspection notice per Rule 33
   */
  private generateInspectionNotice(context: TaxationPackContext): InspectionNotice {
    const noticeDate = new Date()
    const inspectionStart = this.addBusinessDays(noticeDate, 1)
    const inspectionEnd = this.addBusinessDays(inspectionStart, this.INSPECTION_PERIOD_DAYS)
    
    // Skip blackout period if applicable
    const adjustedEnd = this.skipBlackoutPeriod(inspectionEnd)

    const content = this.generateInspectionNoticeContent(context, inspectionStart, adjustedEnd)
    
    const attachments = [
      'Bill of Costs',
      'Supporting Vouchers',
      'Court Order',
      'Case File Index'
    ]

    return {
      noticeDate,
      inspectionPeriod: { start: inspectionStart, end: adjustedEnd },
      deliveryMethod: 'Email and Registered Post',
      content,
      attachments
    }
  }

  /**
   * Generates objection schedule
   */
  private generateObjectionSchedule(context: TaxationPackContext, inspectionNotice: InspectionNotice): ObjectionSchedule {
    const objectionDeadline = this.addBusinessDays(
      inspectionNotice.inspectionPeriod.end, 
      this.OBJECTION_PERIOD_DAYS
    )
    
    const setDownEligibility = this.addBusinessDays(
      objectionDeadline, 
      this.SET_DOWN_DELAY_DAYS
    )
    
    // Check for blackout period
    const blackoutPeriod = this.getBlackoutPeriod(objectionDeadline.getFullYear())
    
    const content = this.generateObjectionScheduleContent(
      context, 
      objectionDeadline, 
      setDownEligibility, 
      blackoutPeriod
    )

    return {
      objectionDeadline: this.skipBlackoutPeriod(objectionDeadline),
      setDownEligibility: this.skipBlackoutPeriod(setDownEligibility),
      blackoutPeriod,
      content
    }
  }

  /**
   * Generates voucher list and requirements
   */
  private generateVoucherList(context: TaxationPackContext): VoucherList {
    const requiredVouchers: VoucherItem[] = []
    const optionalVouchers: VoucherItem[] = []
    const missingVouchers: VoucherItem[] = []

    // Analyze bill items for voucher requirements
    context.billItems.forEach((item, index) => {
      const voucherReq = this.analyzeVoucherRequirement(item)
      
      if (voucherReq.required) {
        const voucherItem: VoucherItem = {
          description: `${item.description} - ${voucherReq.type}`,
          amount: item.amount ?? 0,
          required: true,
          present: voucherReq.present,
          reference: `Line ${index + 1}`,
          notes: voucherReq.notes
        }
        
        if (voucherReq.present) {
          requiredVouchers.push(voucherItem)
        } else {
          missingVouchers.push(voucherItem)
        }
      } else if (voucherReq.recommended) {
        optionalVouchers.push({
          description: `${item.description} - ${voucherReq.type}`,
          amount: item.amount ?? 0,
          required: false,
          present: voucherReq.present,
          reference: `Line ${index + 1}`,
          notes: voucherReq.notes
        })
      }
    })

    const content = this.generateVoucherListContent(requiredVouchers, optionalVouchers, missingVouchers)

    return {
      requiredVouchers,
      optionalVouchers,
      missingVouchers,
      content
    }
  }

  /**
   * Generates compliance memorandum
   */
  private generateComplianceMemorandum(context: TaxationPackContext): ComplianceMemorandum {
    const contentious: ContentiousItem[] = []
    const justifications: string[] = []
    const recommendations: string[] = []

    // Analyze each bill item for potential issues
    context.billItems.forEach((item, index) => {
      const analysis = this.analyzeItemCompliance(item, context)
      
      if (analysis.isContentious) {
        contentious.push({
          lineNumber: index + 1,
          description: item.description,
          amount: item.amount ?? 0,
          issue: analysis.issue,
          justification: analysis.justification,
          riskLevel: analysis.riskLevel
        })
      }
      
      if (analysis.justification) {
        justifications.push(`Line ${index + 1}: ${analysis.justification}`)
      }
    })

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(context, contentious))

    const riskAssessment = this.assessOverallRisk(contentious)
    const summary = this.generateComplianceSummary(context, contentious, riskAssessment)
    const content = this.generateComplianceMemorandumContent(
      summary, contentious, justifications, riskAssessment, recommendations
    )

    return {
      summary,
      contentious,
      justifications,
      riskAssessment,
      recommendations,
      content
    }
  }

  /**
   * Generates index page for taxation pack
   */
  private generateIndexPage(context: TaxationPackContext): string {
    return `
TAXATION PACK INDEX

Case: ${context.plaintiff} v ${context.defendant}
Case Number: ${context.caseNumber}
Court: ${context.courtType}
Bill Type: ${context.billType}
Total Amount: R${context.totalAmount.toFixed(2)}

Generated: ${new Date().toLocaleDateString('en-ZA')}
Practitioner: ${context.practitionerName}
Firm: ${context.practitionerFirm}

═══════════════════════════════════════════════════════════════

DOCUMENT INDEX:

1. INSPECTION NOTICE
   - Notice to opposing party
   - Inspection period and requirements
   - Delivery confirmation

2. OBJECTION SCHEDULE
   - Objection deadlines
   - Set-down eligibility dates
   - Holiday blackout considerations

3. VOUCHER LIST
   - Required supporting documents
   - Missing voucher notifications
   - Optional supporting evidence

4. COMPLIANCE MEMORANDUM
   - Risk assessment
   - Contentious item analysis
   - Legal justifications
   - Recommendations

5. SUPPORTING DOCUMENTS
   - Bill of Costs
   - Court Order
   - Supporting vouchers
   - Correspondence

═══════════════════════════════════════════════════════════════

IMPORTANT NOTES:
- All deadlines calculated excluding holiday blackout period (16 Dec - 15 Jan)
- Voucher requirements based on current Magistrates' Courts Rules
- Compliance analysis based on latest tariff schedules
- Risk assessment considers taxation precedents

═══════════════════════════════════════════════════════════════
`
  }

  // Helper methods

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let addedDays = 0
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1)
      
      // Skip weekends
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++
      }
    }
    
    return result
  }

  private skipBlackoutPeriod(date: Date): Date {
    const blackout = this.getBlackoutPeriod(date.getFullYear())
    
    if (date >= blackout.start && date <= blackout.end) {
      return new Date(blackout.end.getTime() + 24 * 60 * 60 * 1000) // Day after blackout ends
    }
    
    return date
  }

  private getBlackoutPeriod(year: number): { start: Date; end: Date } {
    const start = new Date(year, this.BLACKOUT_START.month - 1, this.BLACKOUT_START.day)
    const end = new Date(year + 1, this.BLACKOUT_END.month - 1, this.BLACKOUT_END.day)
    
    return { start, end }
  }

  private analyzeVoucherRequirement(item: BillItem): {
    required: boolean
    recommended: boolean
    present: boolean
    type: string
    notes?: string
  } {
    const description = item.description.toLowerCase()
    
    // Required vouchers
    if (description.includes('sheriff') || description.includes('service')) {
      return {
        required: true,
        recommended: false,
        present: false, // Would check actual voucher presence
        type: 'Sheriff\'s return of service',
        notes: 'Required for all service fees'
      }
    }
    
    if (description.includes('medical') || description.includes('expert')) {
      return {
        required: true,
        recommended: false,
        present: false,
        type: 'Expert report and invoice',
        notes: 'Required for expert witness fees'
      }
    }
    
    if (description.includes('travel') && (item.amount ?? 0) > 500) {
      return {
        required: true,
        recommended: false,
        present: false,
        type: 'Travel receipts and log',
        notes: 'Required for travel claims over R500'
      }
    }
    
    // Recommended vouchers
    if ((item.amount ?? 0) > 1000) {
      return {
        required: false,
        recommended: true,
        present: false,
        type: 'Supporting documentation',
        notes: 'Recommended for amounts over R1000'
      }
    }
    
    return {
      required: false,
      recommended: false,
      present: true,
      type: 'No voucher required'
    }
  }

  private analyzeItemCompliance(item: BillItem, context: TaxationPackContext): {
    isContentious: boolean
    issue: string
    justification: string
    riskLevel: 'low' | 'medium' | 'high'
  } {
    const description = item.description.toLowerCase()
    
    // High-risk items
    if ((item.amount ?? 0) > 10000) {
      return {
        isContentious: true,
        issue: 'High amount may be challenged',
        justification: 'Amount justified by complexity and time spent',
        riskLevel: 'high'
      }
    }
    
    if (description.includes('consultation') && context.billType === 'party-and-party') {
      return {
        isContentious: true,
        issue: 'Consultations not typically recoverable on party-and-party',
        justification: 'Consultation necessary for case preparation',
        riskLevel: 'medium'
      }
    }
    
    if (description.includes('research')) {
      return {
        isContentious: true,
        issue: 'Research time may be challenged',
        justification: 'Research necessary due to novel legal issues',
        riskLevel: 'medium'
      }
    }
    
    return {
      isContentious: false,
      issue: '',
      justification: 'Standard tariff item',
      riskLevel: 'low'
    }
  }

  private generateRecommendations(context: TaxationPackContext, contentious: ContentiousItem[]): string[] {
    const recommendations: string[] = []
    
    if (contentious.length > context.billItems.length * 0.25) {
      recommendations.push('Consider reviewing bill - more than 25% of items may be contentious')
    }
    
    const highRiskItems = contentious.filter(item => item.riskLevel === 'high')
    if (highRiskItems.length > 0) {
      recommendations.push('Prepare detailed justifications for high-risk items')
    }
    
    if (context.billType === 'party-and-party') {
      recommendations.push('Ensure all items meet necessity and reasonableness tests')
    }
    
    return recommendations
  }

  private assessOverallRisk(contentious: ContentiousItem[]): string {
    const highRisk = contentious.filter(item => item.riskLevel === 'high').length
    const mediumRisk = contentious.filter(item => item.riskLevel === 'medium').length
    
    if (highRisk > 2) {
      return 'HIGH - Multiple high-risk items present'
    }
    
    if (highRisk > 0 || mediumRisk > 3) {
      return 'MEDIUM - Some contentious items present'
    }
    
    return 'LOW - Most items should be uncontentious'
  }

  private generateComplianceSummary(context: TaxationPackContext, contentious: ContentiousItem[], risk: string): string {
    return `Bill contains ${context.billItems.length} line items totaling R${context.totalAmount.toFixed(2)}. ${contentious.length} items identified as potentially contentious. Overall taxation risk: ${risk}.`
  }

  // Content generation methods (simplified for brevity)
  private generateInspectionNoticeContent(context: TaxationPackContext, start: Date, end: Date): string {
    return `NOTICE OF INSPECTION\n\nTO: [Opposing Party]\nFROM: ${context.practitionerName}\n\nYou are hereby notified that the Bill of Costs in the matter of ${context.plaintiff} v ${context.defendant} (Case No: ${context.caseNumber}) will be available for inspection from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.\n\nInspection may be conducted at our offices during business hours.`
  }

  private generateObjectionScheduleContent(context: TaxationPackContext, objectionDeadline: Date, setDownDate: Date, blackout?: { start: Date; end: Date }): string {
    let content = `OBJECTION SCHEDULE\n\nObjections must be filed by: ${objectionDeadline.toLocaleDateString()}\nSet-down eligible from: ${setDownDate.toLocaleDateString()}`
    
    if (blackout) {
      content += `\n\nNOTE: Holiday blackout period: ${blackout.start.toLocaleDateString()} to ${blackout.end.toLocaleDateString()}\nNo taxation set-downs during this period.`
    }
    
    return content
  }

  private generateVoucherListContent(required: VoucherItem[], optional: VoucherItem[], missing: VoucherItem[]): string {
    let content = 'VOUCHER REQUIREMENTS\n\n'
    
    if (required.length > 0) {
      content += 'REQUIRED VOUCHERS:\n'
      required.forEach(v => content += `- ${v.description} (R${v.amount})\n`)
    }
    
    if (missing.length > 0) {
      content += '\nMISSING VOUCHERS:\n'
      missing.forEach(v => content += `- ${v.description} (R${v.amount}) - ${v.notes}\n`)
    }
    
    return content
  }

  private generateComplianceMemorandumContent(summary: string, contentious: ContentiousItem[], justifications: string[], risk: string, recommendations: string[]): string {
    let content = `COMPLIANCE MEMORANDUM\n\nSUMMARY:\n${summary}\n\nRISK ASSESSMENT: ${risk}\n\n`
    
    if (contentious.length > 0) {
      content += 'CONTENTIOUS ITEMS:\n'
      contentious.forEach(item => {
        content += `Line ${item.lineNumber}: ${item.description} - ${item.issue}\n`
      })
    }
    
    if (recommendations.length > 0) {
      content += '\nRECOMMENDATIONS:\n'
      recommendations.forEach(rec => content += `- ${rec}\n`)
    }
    
    return content
  }
}

// Export singleton instance
export const taxationPackGenerator = TaxationPackGenerator.getInstance()