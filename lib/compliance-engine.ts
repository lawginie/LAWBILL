// Legal Compliance Validation Engine
// Real-time compliance checking with red/amber/green status indicators

import { ForumDetectionResult } from './forum-detection'
import { TariffLookupResult, BillLineItem, TariffCalculationContext } from './enhanced-tariff-engine'

export type ComplianceStatus = 'compliant' | 'warning' | 'non-compliant'

export interface ComplianceRule {
  id: string
  name: string
  description: string
  category: 'procedural' | 'substantive' | 'ethical' | 'timing' | 'documentation'
  severity: 'error' | 'warning' | 'info'
  applicableTo: string[] // Bill types, forums, etc.
  checkFunction: (context: ComplianceContext) => ComplianceResult
}

export interface ComplianceResult {
  ruleId: string
  status: ComplianceStatus
  message: string
  recommendation?: string
  autoFix?: () => void
  references?: string[] // Rule references
}

export interface ComplianceContext {
  billType: 'party-and-party' | 'attorney-and-client' | 'own-client'
  forum: ForumDetectionResult
  lineItems: BillLineItem[]
  tariffResults: TariffLookupResult[]
  costsOrder?: string
  keyDates: {
    issueDate?: string
    serviceDate?: string
    trialDate?: string
    judgmentDate?: string
    billDate: string
  }
  clientInfo: {
    type: 'individual' | 'corporate' | 'government'
    isVATVendor: boolean
  }
  practitionerInfo: {
    isVATVendor: boolean
    admissionDate?: string
    practiceType: 'attorney' | 'advocate' | 'candidate'
  }
}

export interface ComplianceReport {
  overallStatus: ComplianceStatus
  score: number // 0-100
  totalRules: number
  passedRules: number
  warningRules: number
  failedRules: number
  results: ComplianceResult[]
  recommendations: string[]
  criticalIssues: string[]
  timeline: {
    inspectionDeadline?: string
    objectionDeadline?: string
    setDownEligible?: boolean
  }
}

/**
 * Legal Compliance Validation Engine
 */
export class ComplianceEngine {
  private rules: Map<string, ComplianceRule> = new Map()
  private readonly HOLIDAY_BLACKOUT_START = '12-16' // Dec 16
  private readonly HOLIDAY_BLACKOUT_END = '01-15'   // Jan 15
  
  constructor() {
    this.initializeRules()
  }
  
  /**
   * Initialize all compliance rules
   */
  private initializeRules(): void {
    const rules: ComplianceRule[] = [
      // Procedural Rules
      {
        id: 'forum-jurisdiction',
        name: 'Forum Jurisdiction',
        description: 'Verify correct court jurisdiction based on claim value and case type',
        category: 'procedural',
        severity: 'error',
        applicableTo: ['all'],
        checkFunction: this.checkForumJurisdiction.bind(this)
      },
      
      {
        id: 'costs-order-compliance',
        name: 'Costs Order Compliance',
        description: 'Ensure bill complies with specific costs order wording',
        category: 'procedural',
        severity: 'error',
        applicableTo: ['party-and-party'],
        checkFunction: this.checkCostsOrderCompliance.bind(this)
      },
      
      {
        id: 'party-party-scope',
        name: 'Party-and-Party Scope',
        description: 'Verify only necessary and reasonable costs are claimed',
        category: 'substantive',
        severity: 'error',
        applicableTo: ['party-and-party'],
        checkFunction: this.checkPartyPartyScope.bind(this)
      },
      
      {
        id: 'voucher-requirements',
        name: 'Voucher Requirements',
        description: 'Ensure all disbursements are properly vouched',
        category: 'documentation',
        severity: 'error',
        applicableTo: ['all'],
        checkFunction: this.checkVoucherRequirements.bind(this)
      },
      
      {
        id: 'holiday-blackout',
        name: 'Holiday Blackout Period',
        description: 'Check for work during 16 Dec - 15 Jan blackout period',
        category: 'timing',
        severity: 'warning',
        applicableTo: ['all'],
        checkFunction: this.checkHolidayBlackout.bind(this)
      },
      
      {
        id: 'vat-compliance',
        name: 'VAT Compliance',
        description: 'Verify correct VAT calculation and display',
        category: 'substantive',
        severity: 'error',
        applicableTo: ['all'],
        checkFunction: this.checkVATCompliance.bind(this)
      },
      
      {
        id: 'travel-reasonableness',
        name: 'Travel Cost Reasonableness',
        description: 'Verify travel costs are necessary and reasonable',
        category: 'substantive',
        severity: 'warning',
        applicableTo: ['party-and-party'],
        checkFunction: this.checkTravelReasonableness.bind(this)
      },
      
      {
        id: 'counsel-fees',
        name: 'Counsel Fees Compliance',
        description: 'Verify counsel fees are properly documented and reasonable',
        category: 'substantive',
        severity: 'warning',
        applicableTo: ['all'],
        checkFunction: this.checkCounselFees.bind(this)
      },
      
      {
        id: 'narrative-quality',
        name: 'Narrative Quality',
        description: 'Ensure narratives are specific, audit-ready, and include purpose',
        category: 'documentation',
        severity: 'warning',
        applicableTo: ['all'],
        checkFunction: this.checkNarrativeQuality.bind(this)
      },
      
      {
        id: 'ethical-compliance',
        name: 'Ethical Compliance',
        description: 'Check for fee sharing and ethical violations',
        category: 'ethical',
        severity: 'error',
        applicableTo: ['all'],
        checkFunction: this.checkEthicalCompliance.bind(this)
      }
    ]
    
    rules.forEach(rule => this.rules.set(rule.id, rule))
  }
  
  /**
   * Run comprehensive compliance check
   */
  public validateCompliance(context: ComplianceContext): ComplianceReport {
    const results: ComplianceResult[] = []
    const recommendations: string[] = []
    const criticalIssues: string[] = []
    
    // Run all applicable rules
    for (const rule of this.rules.values()) {
      if (this.isRuleApplicable(rule, context)) {
        const result = rule.checkFunction(context)
        results.push(result)
        
        if (result.recommendation) {
          recommendations.push(result.recommendation)
        }
        
        if (result.status === 'non-compliant' && rule.severity === 'error') {
          criticalIssues.push(result.message)
        }
      }
    }
    
    // Calculate compliance metrics
    const totalRules = results.length
    const passedRules = results.filter(r => r.status === 'compliant').length
    const warningRules = results.filter(r => r.status === 'warning').length
    const failedRules = results.filter(r => r.status === 'non-compliant').length
    
    const score = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100
    
    // Determine overall status
    let overallStatus: ComplianceStatus = 'compliant'
    if (failedRules > 0) {
      overallStatus = 'non-compliant'
    } else if (warningRules > 0) {
      overallStatus = 'warning'
    }
    
    // Calculate timeline deadlines
    const timeline = this.calculateTimeline(context)
    
    return {
      overallStatus,
      score,
      totalRules,
      passedRules,
      warningRules,
      failedRules,
      results,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      criticalIssues,
      timeline
    }
  }
  
  /**
   * Check if rule is applicable to current context
   */
  private isRuleApplicable(rule: ComplianceRule, context: ComplianceContext): boolean {
    return rule.applicableTo.includes('all') || 
           rule.applicableTo.includes(context.billType) ||
           rule.applicableTo.includes(context.forum.courtType)
  }
  
  /**
   * Check forum jurisdiction compliance
   */
  private checkForumJurisdiction(context: ComplianceContext): ComplianceResult {
    const { forum } = context
    
    if (forum.confidence === 'low') {
      return {
        ruleId: 'forum-jurisdiction',
        status: 'warning',
        message: `Low confidence in jurisdiction: ${forum.reasoning}`,
        recommendation: 'Review case details and consider alternative forum',
        references: ['Magistrates Courts Act 32 of 1944']
      }
    }
    
    if (forum.warnings && forum.warnings.length > 0) {
      return {
        ruleId: 'forum-jurisdiction',
        status: 'warning',
        message: `Forum warnings: ${forum.warnings.join(', ')}`,
        recommendation: 'Review warnings and consider implications',
        references: ['Magistrates Courts Act 32 of 1944']
      }
    }
    
    return {
      ruleId: 'forum-jurisdiction',
      status: 'compliant',
      message: `Correct jurisdiction: ${forum.courtType} Scale ${forum.scale}`
    }
  }
  
  /**
   * Check costs order compliance
   */
  private checkCostsOrderCompliance(context: ComplianceContext): ComplianceResult {
    if (!context.costsOrder) {
      return {
        ruleId: 'costs-order-compliance',
        status: 'non-compliant',
        message: 'No costs order specified',
        recommendation: 'Specify the exact wording of the costs order'
      }
    }
    
    const order = context.costsOrder.toLowerCase()
    
    if (order.includes('wasted costs') || order.includes('punitive')) {
      return {
        ruleId: 'costs-order-compliance',
        status: 'warning',
        message: 'Special costs order detected',
        recommendation: 'Ensure compliance with punitive/wasted costs requirements'
      }
    }
    
    return {
      ruleId: 'costs-order-compliance',
      status: 'compliant',
      message: 'Costs order appears standard'
    }
  }
  
  /**
   * Check party-and-party scope limitations
   */
  private checkPartyPartyScope(context: ComplianceContext): ComplianceResult {
    const issues: string[] = []
    
    context.tariffResults.forEach((result, index) => {
      const item = result.item
      
      // Check for non-recoverable items
      if (item.subcategory === 'admin' && item.category === 'disbursements') {
        issues.push(`Line ${index + 1}: Administrative costs may not be recoverable`)
      }
      
      if (item.description.includes('internal') || item.description.includes('office')) {
        issues.push(`Line ${index + 1}: Internal/office costs typically not recoverable`)
      }
    })
    
    if (issues.length > 0) {
      return {
        ruleId: 'party-party-scope',
        status: 'warning',
        message: `${issues.length} potentially non-recoverable items found`,
        recommendation: 'Review party-and-party scope limitations'
      }
    }
    
    return {
      ruleId: 'party-party-scope',
      status: 'compliant',
      message: 'All items appear within party-and-party scope'
    }
  }
  
  /**
   * Check voucher requirements
   */
  private checkVoucherRequirements(context: ComplianceContext): ComplianceResult {
    const unvouchedItems: number[] = []
    
    context.lineItems.forEach((item, index) => {
      const tariffResult = context.tariffResults[index]
      if (tariffResult && tariffResult.item.category === 'disbursements' && !item.isVouched) {
        unvouchedItems.push(index + 1)
      }
    })
    
    if (unvouchedItems.length > 0) {
      return {
        ruleId: 'voucher-requirements',
        status: 'non-compliant',
        message: `Lines ${unvouchedItems.join(', ')} require vouchers`,
        recommendation: 'Provide proof of payment for all disbursements'
      }
    }
    
    return {
      ruleId: 'voucher-requirements',
      status: 'compliant',
      message: 'All disbursements properly vouched'
    }
  }
  
  /**
   * Check holiday blackout period
   */
  private checkHolidayBlackout(context: ComplianceContext): ComplianceResult {
    const blackoutItems: number[] = []
    
    context.lineItems.forEach((item, index) => {
      if (this.isInHolidayBlackout(item.date)) {
        blackoutItems.push(index + 1)
      }
    })
    
    if (blackoutItems.length > 0) {
      return {
        ruleId: 'holiday-blackout',
        status: 'warning',
        message: `Lines ${blackoutItems.join(', ')} fall within holiday blackout period`,
        recommendation: 'Verify if work was truly necessary during 16 Dec - 15 Jan period'
      }
    }
    
    return {
      ruleId: 'holiday-blackout',
      status: 'compliant',
      message: 'No work during holiday blackout period'
    }
  }
  
  /**
   * Check VAT compliance
   */
  private checkVATCompliance(context: ComplianceContext): ComplianceResult {
    if (!context.practitionerInfo.isVATVendor) {
      // Check that no VAT is being charged
      const vatChargedItems = context.tariffResults.filter(r => r.vatAmount > 0)
      if (vatChargedItems.length > 0) {
        return {
          ruleId: 'vat-compliance',
          status: 'non-compliant',
          message: 'VAT charged but practitioner is not VAT vendor',
          recommendation: 'Remove VAT charges or update VAT vendor status'
        }
      }
    }
    
    return {
      ruleId: 'vat-compliance',
      status: 'compliant',
      message: 'VAT handling appears correct'
    }
  }
  
  /**
   * Check travel cost reasonableness
   */
  private checkTravelReasonableness(context: ComplianceContext): ComplianceResult {
    const travelItems = context.tariffResults.filter(r => 
      r.item.subcategory === 'travel' || 
      r.item.description.toLowerCase().includes('travel')
    )
    
    if (travelItems.length === 0) {
      return {
        ruleId: 'travel-reasonableness',
        status: 'compliant',
        message: 'No travel costs claimed'
      }
    }
    
    // Check for excessive travel costs
    const totalTravel = travelItems.reduce((sum, item) => sum + item.calculatedAmount, 0)
    const totalBill = context.tariffResults.reduce((sum, item) => sum + item.calculatedAmount, 0)
    
    if (totalTravel > totalBill * 0.2) { // More than 20% of bill
      return {
        ruleId: 'travel-reasonableness',
        status: 'warning',
        message: 'Travel costs exceed 20% of total bill',
        recommendation: 'Provide justification for travel necessity and reasonableness'
      }
    }
    
    return {
      ruleId: 'travel-reasonableness',
      status: 'compliant',
      message: 'Travel costs appear reasonable'
    }
  }
  
  /**
   * Check counsel fees compliance
   */
  private checkCounselFees(context: ComplianceContext): ComplianceResult {
    const counselItems = context.tariffResults.filter(r => 
      r.item.description.toLowerCase().includes('counsel') ||
      r.item.description.toLowerCase().includes('advocate')
    )
    
    if (counselItems.length === 0) {
      return {
        ruleId: 'counsel-fees',
        status: 'compliant',
        message: 'No counsel fees claimed'
      }
    }
    
    // Check for proper documentation
    const undocumentedCounsel = counselItems.filter((_, index) => {
      const lineItem = context.lineItems[context.tariffResults.indexOf(counselItems[index])]
      return !lineItem.isVouched
    })
    
    if (undocumentedCounsel.length > 0) {
      return {
        ruleId: 'counsel-fees',
        status: 'warning',
        message: 'Some counsel fees lack proper documentation',
        recommendation: 'Provide brief fees and appearance records for all counsel'
      }
    }
    
    return {
      ruleId: 'counsel-fees',
      status: 'compliant',
      message: 'Counsel fees properly documented'
    }
  }
  
  /**
   * Check narrative quality
   */
  private checkNarrativeQuality(context: ComplianceContext): ComplianceResult {
    const poorNarratives: number[] = []
    
    context.lineItems.forEach((item, index) => {
      const narrative = item.narrative.toLowerCase()
      
      // Check for vague narratives
      if (narrative.length < 10 || 
          narrative.includes('various') ||
          narrative.includes('sundry') ||
          !narrative.includes('pp') && item.description.includes('perusal')) {
        poorNarratives.push(index + 1)
      }
    })
    
    if (poorNarratives.length > 0) {
      return {
        ruleId: 'narrative-quality',
        status: 'warning',
        message: `Lines ${poorNarratives.join(', ')} have vague narratives`,
        recommendation: 'Improve narratives with specific details, page counts, and purpose'
      }
    }
    
    return {
      ruleId: 'narrative-quality',
      status: 'compliant',
      message: 'Narratives are specific and audit-ready'
    }
  }
  
  /**
   * Check ethical compliance
   */
  private checkEthicalCompliance(context: ComplianceContext): ComplianceResult {
    // Basic ethical checks
    const issues: string[] = []
    
    // Check for candidate attorney limitations
    if (context.practitionerInfo.practiceType === 'candidate') {
      const courtAppearances = context.lineItems.filter(item => 
        item.description.toLowerCase().includes('appearance') ||
        item.description.toLowerCase().includes('hearing')
      )
      
      if (courtAppearances.length > 0) {
        issues.push('Candidate attorneys have limited court appearance rights')
      }
    }
    
    if (issues.length > 0) {
      return {
        ruleId: 'ethical-compliance',
        status: 'warning',
        message: issues.join('; '),
        recommendation: 'Review ethical compliance requirements'
      }
    }
    
    return {
      ruleId: 'ethical-compliance',
      status: 'compliant',
      message: 'No ethical issues detected'
    }
  }
  
  /**
   * Check if date falls within holiday blackout period
   */
  private isInHolidayBlackout(dateString: string): boolean {
    const date = new Date(dateString)
    const month = date.getMonth() + 1 // 0-based to 1-based
    const day = date.getDate()
    
    // December 16-31
    if (month === 12 && day >= 16) return true
    
    // January 1-15
    if (month === 1 && day <= 15) return true
    
    return false
  }
  
  /**
   * Calculate important timeline deadlines
   */
  private calculateTimeline(context: ComplianceContext): ComplianceReport['timeline'] {
    const billDate = new Date(context.keyDates.billDate)
    
    // Rule 33 timelines (simplified)
    const inspectionDeadline = new Date(billDate)
    inspectionDeadline.setDate(billDate.getDate() + 10) // 10 days for inspection
    
    const objectionDeadline = new Date(inspectionDeadline)
    objectionDeadline.setDate(inspectionDeadline.getDate() + 10) // 10 days for objections
    
    // Skip holiday blackout periods
    if (this.isInHolidayBlackout(inspectionDeadline.toISOString())) {
      inspectionDeadline.setMonth(0, 16) // Move to Jan 16
    }
    
    if (this.isInHolidayBlackout(objectionDeadline.toISOString())) {
      objectionDeadline.setMonth(0, 16) // Move to Jan 16
    }
    
    return {
      inspectionDeadline: inspectionDeadline.toISOString().split('T')[0],
      objectionDeadline: objectionDeadline.toISOString().split('T')[0],
      setDownEligible: new Date() > objectionDeadline
    }
  }
}

// Export singleton instance
export const complianceEngine = new ComplianceEngine()