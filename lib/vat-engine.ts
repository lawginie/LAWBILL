/**
 * VAT Calculation Engine for South African Legal Practice
 * Handles VAT vendor status, rates, exemptions, and compliant display
 * Based on South African VAT Act and SARS requirements
 */

export interface VATVendorProfile {
  isVATVendor: boolean
  vatNumber?: string
  registrationDate?: Date
  exemptionReason?: string
  turnoverThreshold: number
  currentTurnover: number
}

export interface VATLineItem {
  description: string
  amount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  exemptionCode?: string
  exemptionReason?: string
}

export interface VATCalculationResult {
  subtotal: number
  totalVAT: number
  grandTotal: number
  lineItems: VATLineItem[]
  vendorStatus: VATVendorProfile
  complianceNotes: string[]
  displayFormat: {
    exVAT: string
    vat: string
    inclVAT: string
  }
}

export interface VATContext {
  vendorProfile: VATVendorProfile
  serviceDate: Date
  clientType: 'individual' | 'business' | 'government' | 'npo'
  serviceType: 'legal-fees' | 'disbursements' | 'court-fees' | 'expert-fees'
  amount: number
  description: string
}

class VATEngine {
  private static instance: VATEngine
  
  // Current SA VAT rate (as of 2024)
  private readonly STANDARD_VAT_RATE = 0.15 // 15%
  private readonly VAT_REGISTRATION_THRESHOLD = 1000000 // R1,000,000 annually
  
  // VAT rate history for historical calculations
  private readonly VAT_RATE_HISTORY = [
    { effectiveFrom: new Date('2018-04-01'), rate: 0.15 },
    { effectiveFrom: new Date('1993-09-29'), rate: 0.14 },
    { effectiveFrom: new Date('1991-04-01'), rate: 0.10 }
  ]

  static getInstance(): VATEngine {
    if (!VATEngine.instance) {
      VATEngine.instance = new VATEngine()
    }
    return VATEngine.instance
  }

  /**
   * Calculates VAT for a bill with multiple line items
   */
  calculateVAT(items: VATContext[]): VATCalculationResult {
    if (items.length === 0) {
      return this.createEmptyResult()
    }

    const vendorProfile = items[0].vendorProfile
    const lineItems: VATLineItem[] = []
    const complianceNotes: string[] = []

    // Check vendor status compliance
    const vendorCompliance = this.validateVendorStatus(vendorProfile)
    complianceNotes.push(...vendorCompliance.notes)

    for (const item of items) {
      const lineItem = this.calculateLineItemVAT(item)
      lineItems.push(lineItem)
      
      // Add item-specific compliance notes
      const itemCompliance = this.validateItemVAT(item, lineItem)
      complianceNotes.push(...itemCompliance)
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const totalVAT = lineItems.reduce((sum, item) => sum + item.vatAmount, 0)
    const grandTotal = subtotal + totalVAT

    return {
      subtotal,
      totalVAT,
      grandTotal,
      lineItems,
      vendorStatus: vendorProfile,
      complianceNotes: [...new Set(complianceNotes)], // Remove duplicates
      displayFormat: this.formatVATDisplay(subtotal, totalVAT, grandTotal, vendorProfile)
    }
  }

  /**
   * Calculates VAT for a single line item
   */
  private calculateLineItemVAT(context: VATContext): VATLineItem {
    const vatRate = this.getApplicableVATRate(context)
    const exemption = this.checkVATExemption(context)
    
    let vatAmount = 0
    let exemptionCode: string | undefined
    let exemptionReason: string | undefined

    if (exemption.isExempt) {
      exemptionCode = exemption.code
      exemptionReason = exemption.reason
    } else if (context.vendorProfile.isVATVendor) {
      vatAmount = context.amount * vatRate
    }

    return {
      description: context.description,
      amount: context.amount,
      vatRate,
      vatAmount,
      totalAmount: context.amount + vatAmount,
      exemptionCode,
      exemptionReason
    }
  }

  /**
   * Gets the applicable VAT rate for the service date
   */
  private getApplicableVATRate(context: VATContext): number {
    const exemption = this.checkVATExemption(context)
    if (exemption.isExempt) {
      return 0
    }

    // Find the applicable rate based on service date
    const applicableRate = this.VAT_RATE_HISTORY
      .filter(rate => context.serviceDate >= rate.effectiveFrom)
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0]

    return applicableRate?.rate || this.STANDARD_VAT_RATE
  }

  /**
   * Checks if a service is exempt from VAT
   */
  private checkVATExemption(context: VATContext): { isExempt: boolean; code?: string; reason?: string } {
    // Legal services are generally not exempt, but some specific cases are
    
    // Court fees paid to the state
    if (context.serviceType === 'court-fees') {
      return {
        isExempt: true,
        code: 'COURT_FEES',
        reason: 'Court fees paid to government are VAT exempt'
      }
    }

    // Services to certain NPOs
    if (context.clientType === 'npo' && this.isQualifyingNPO()) {
      return {
        isExempt: true,
        code: 'NPO_EXEMPT',
        reason: 'Services to qualifying NPO are VAT exempt'
      }
    }

    // International services (if applicable)
    if (this.isInternationalService()) {
      return {
        isExempt: true,
        code: 'INTERNATIONAL',
        reason: 'International services are zero-rated'
      }
    }

    return { isExempt: false }
  }

  /**
   * Validates vendor VAT status and compliance
   */
  private validateVendorStatus(profile: VATVendorProfile): { isValid: boolean; notes: string[] } {
    const notes: string[] = []
    let isValid = true

    // Check if should be VAT registered
    if (!profile.isVATVendor && profile.currentTurnover > this.VAT_REGISTRATION_THRESHOLD) {
      notes.push(`Warning: Turnover (R${profile.currentTurnover.toLocaleString()}) exceeds VAT registration threshold`)
      isValid = false
    }

    // Check VAT number format if registered
    if (profile.isVATVendor) {
      if (!profile.vatNumber) {
        notes.push('VAT number required for VAT vendor')
        isValid = false
      } else if (!this.isValidVATNumber(profile.vatNumber)) {
        notes.push('Invalid VAT number format')
        isValid = false
      }
    }

    // Check registration date
    if (profile.isVATVendor && profile.registrationDate) {
      const daysSinceRegistration = Math.floor(
        (Date.now() - profile.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceRegistration < 0) {
        notes.push('VAT registration date cannot be in the future')
        isValid = false
      }
    }

    return { isValid, notes }
  }

  /**
   * Validates VAT calculation for a line item
   */
  private validateItemVAT(context: VATContext, lineItem: VATLineItem): string[] {
    const notes: string[] = []

    // Check for potential issues
    if (lineItem.vatAmount > 0 && !context.vendorProfile.isVATVendor) {
      notes.push(`Warning: VAT charged but vendor not registered for VAT`)
    }

    if (lineItem.vatAmount === 0 && context.vendorProfile.isVATVendor && !lineItem.exemptionCode) {
      notes.push(`Warning: No VAT charged by VAT vendor without exemption`)
    }

    // Check for high VAT amounts that might indicate errors
    if (lineItem.vatAmount > lineItem.amount * 0.2) {
      notes.push(`Warning: VAT amount seems high (${(lineItem.vatRate * 100).toFixed(1)}%)`)
    }

    return notes
  }

  /**
   * Formats VAT display according to SA requirements
   */
  private formatVATDisplay(subtotal: number, totalVAT: number, grandTotal: number, profile: VATVendorProfile) {
    const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`

    if (!profile.isVATVendor) {
      return {
        exVAT: 'N/A (Not VAT registered)',
        vat: 'N/A',
        inclVAT: formatCurrency(grandTotal)
      }
    }

    return {
      exVAT: formatCurrency(subtotal),
      vat: formatCurrency(totalVAT),
      inclVAT: formatCurrency(grandTotal)
    }
  }

  /**
   * Validates South African VAT number format
   */
  private isValidVATNumber(vatNumber: string): boolean {
    // SA VAT number format: 4xxxxxxxxxx (10 digits starting with 4)
    const vatRegex = /^4\d{9}$/
    return vatRegex.test(vatNumber.replace(/\s/g, ''))
  }

  /**
   * Checks if NPO qualifies for VAT exemption
   */
  private isQualifyingNPO(): boolean {
    // This would typically check against a database of qualifying NPOs
    // For now, return false as most legal services to NPOs are still taxable
    return false
  }

  /**
   * Checks if service qualifies as international (zero-rated)
   */
  private isInternationalService(): boolean {
    // This would check if the service is provided to non-residents
    // or relates to international matters
    return false
  }

  /**
   * Creates empty result for edge cases
   */
  private createEmptyResult(): VATCalculationResult {
    const emptyProfile: VATVendorProfile = {
      isVATVendor: false,
      turnoverThreshold: this.VAT_REGISTRATION_THRESHOLD,
      currentTurnover: 0
    }

    return {
      subtotal: 0,
      totalVAT: 0,
      grandTotal: 0,
      lineItems: [],
      vendorStatus: emptyProfile,
      complianceNotes: [],
      displayFormat: {
        exVAT: 'R0.00',
        vat: 'R0.00',
        inclVAT: 'R0.00'
      }
    }
  }

  /**
   * Generates VAT compliance statement for invoices
   */
  generateVATStatement(result: VATCalculationResult): string {
    if (!result.vendorStatus.isVATVendor) {
      return 'This invoice does not include VAT as the service provider is not registered for VAT.'
    }

    let statement = `VAT Registration Number: ${result.vendorStatus.vatNumber}\n`
    statement += `VAT is calculated at ${(this.STANDARD_VAT_RATE * 100).toFixed(0)}% on applicable services.\n`
    
    const exemptItems = result.lineItems.filter(item => item.exemptionCode)
    if (exemptItems.length > 0) {
      statement += `\nVAT Exempt Items:\n`
      exemptItems.forEach(item => {
        statement += `- ${item.description}: ${item.exemptionReason}\n`
      })
    }

    if (result.complianceNotes.length > 0) {
      statement += `\nCompliance Notes:\n`
      result.complianceNotes.forEach(note => {
        statement += `- ${note}\n`
      })
    }

    return statement
  }

  /**
   * Calculates VAT for a specific amount (utility function)
   */
  calculateSimpleVAT(amount: number, isVATVendor: boolean, serviceDate: Date = new Date()): {
    exVAT: number
    vat: number
    inclVAT: number
  } {
    if (!isVATVendor) {
      return {
        exVAT: amount,
        vat: 0,
        inclVAT: amount
      }
    }

    const vatRate = this.VAT_RATE_HISTORY
      .filter(rate => serviceDate >= rate.effectiveFrom)
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0]?.rate || this.STANDARD_VAT_RATE

    const vat = amount * vatRate
    
    return {
      exVAT: amount,
      vat,
      inclVAT: amount + vat
    }
  }
}

// Export singleton instance
export const vatEngine = VATEngine.getInstance()