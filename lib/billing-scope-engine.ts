/**
 * Billing Scope Engine for South African Legal Practice
 * Handles Party-and-Party vs Attorney-and-Client vs Own Client billing logic
 * Enforces proper scope constraints and calculation differences
 */

import { TariffItem } from '@/data/sa-tariffs'
import { enhancedTariffEngine } from './enhanced-tariff-engine'
import { complianceEngine } from './compliance-engine'

export type BillType = 'party-and-party' | 'attorney-and-client' | 'own-client'
export type CostsOrder = 'costs-in-the-cause' | 'costs-reserved' | 'wasted-costs' | 'punitive-scale' | 'no-order'

export interface BillingScopeResult {
  allowed: boolean
  reason?: string
  adjustedRate?: number
  cappedAmount?: number
  requiresVoucher: boolean
  taxationRisk: 'low' | 'medium' | 'high'
}

export interface BillingScopeContext {
  billType: BillType
  costsOrder: CostsOrder
  itemCode: string
  description: string
  amount: number
  workDate: Date
  isNecessary: boolean
  isReasonable: boolean
  hasVoucher: boolean
  courtType: string
  scale: string
}

class BillingScopeEngine {
  private static instance: BillingScopeEngine

  static getInstance(): BillingScopeEngine {
    if (!BillingScopeEngine.instance) {
      BillingScopeEngine.instance = new BillingScopeEngine()
    }
    return BillingScopeEngine.instance
  }

  /**
   * Validates if an item is allowable under the specified billing scope
   */
  validateBillingScope(context: BillingScopeContext): BillingScopeResult {
    switch (context.billType) {
      case 'party-and-party':
        return this.validatePartyAndParty(context)
      case 'attorney-and-client':
        return this.validateAttorneyAndClient(context)
      case 'own-client':
        return this.validateOwnClient(context)
      default:
        return {
          allowed: false,
          reason: 'Invalid bill type specified',
          requiresVoucher: false,
          taxationRisk: 'high'
        }
    }
  }

  /**
   * Party-and-Party: Strictest scope - only necessary costs
   * Based on Magistrates' Courts Rules and case law
   */
  private validatePartyAndParty(context: BillingScopeContext): BillingScopeResult {
    // Check if costs order allows recovery
    if (!this.isCostsOrderRecoverable(context.costsOrder)) {
      return {
        allowed: false,
        reason: `Costs order '${context.costsOrder}' does not permit recovery`,
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Necessity test - fundamental requirement
    if (!context.isNecessary) {
      return {
        allowed: false,
        reason: 'Item not necessary for the conduct of the case',
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Reasonableness test
    if (!context.isReasonable) {
      return {
        allowed: false,
        reason: 'Item not reasonable in amount or nature',
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Check for restricted items in party-and-party
    const restrictedItems = this.getPartyAndPartyRestrictions()
    const isRestricted = restrictedItems.some(restriction => 
      context.itemCode.includes(restriction.code) || 
      context.description.toLowerCase().includes(restriction.keyword)
    )

    if (isRestricted) {
      return {
        allowed: false,
        reason: 'Item not recoverable on party-and-party basis',
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Voucher requirements for disbursements
    const requiresVoucher = this.requiresVoucherEvidence(context.itemCode)
    if (requiresVoucher && !context.hasVoucher) {
      return {
        allowed: false,
        reason: 'Voucher required for disbursement recovery',
        requiresVoucher: true,
        taxationRisk: 'high'
      }
    }

    // Apply scale limitations
    const scaleResult = this.applyScaleLimitations(context)
    
    return {
      allowed: true,
      adjustedRate: scaleResult.adjustedRate,
      cappedAmount: scaleResult.cappedAmount,
      requiresVoucher,
      taxationRisk: this.assessTaxationRisk(context, 'party-and-party')
    }
  }

  /**
   * Attorney-and-Client: Broader scope but still reasonable
   * Includes items not recoverable on party-and-party
   */
  private validateAttorneyAndClient(context: BillingScopeContext): BillingScopeResult {
    // Reasonableness is key test (necessity less strict)
    if (!context.isReasonable) {
      return {
        allowed: false,
        reason: 'Item not reasonable for attorney-and-client billing',
        requiresVoucher: false,
        taxationRisk: 'medium'
      }
    }

    // Check for items completely prohibited
    const prohibitedItems = this.getAttorneyClientProhibitions()
    const isProhibited = prohibitedItems.some(prohibition => 
      context.itemCode.includes(prohibition.code) || 
      context.description.toLowerCase().includes(prohibition.keyword)
    )

    if (isProhibited) {
      return {
        allowed: false,
        reason: 'Item prohibited in attorney-and-client billing',
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Voucher requirements (more lenient than party-and-party)
    const requiresVoucher = this.requiresVoucherEvidence(context.itemCode) && context.amount > 500
    if (requiresVoucher && !context.hasVoucher) {
      return {
        allowed: true, // Allow but flag risk
        reason: 'Consider obtaining voucher for amounts over R500',
        requiresVoucher: true,
        taxationRisk: 'medium'
      }
    }

    return {
      allowed: true,
      requiresVoucher,
      taxationRisk: this.assessTaxationRisk(context, 'attorney-and-client')
    }
  }

  /**
   * Own Client: Contractual basis but must remain ethical
   * Subject to professional conduct rules
   */
  private validateOwnClient(context: BillingScopeContext): BillingScopeResult {
    // Check for unethical practices
    const ethicsViolations = this.checkEthicsViolations(context)
    if (ethicsViolations.length > 0) {
      return {
        allowed: false,
        reason: `Ethics violation: ${ethicsViolations.join(', ')}`,
        requiresVoucher: false,
        taxationRisk: 'high'
      }
    }

    // Reasonableness test (most lenient)
    if (context.amount > 50000 && !context.isReasonable) {
      return {
        allowed: true,
        reason: 'High amount - ensure reasonableness is documented',
        requiresVoucher: false,
        taxationRisk: 'medium'
      }
    }

    return {
      allowed: true,
      requiresVoucher: false,
      taxationRisk: 'low'
    }
  }

  /**
   * Determines if costs order permits recovery
   */
  private isCostsOrderRecoverable(costsOrder: CostsOrder): boolean {
    const recoverableOrders: CostsOrder[] = [
      'costs-in-the-cause',
      'punitive-scale',
      'wasted-costs'
    ]
    return recoverableOrders.includes(costsOrder)
  }

  /**
   * Items typically not recoverable on party-and-party basis
   */
  private getPartyAndPartyRestrictions() {
    return [
      { code: 'INTERNAL', keyword: 'internal consultation' },
      { code: 'OFFICE', keyword: 'office conference' },
      { code: 'RESEARCH', keyword: 'legal research' },
      { code: 'ADMIN', keyword: 'administrative' },
      { code: 'TRAVEL_LOCAL', keyword: 'local travel' },
      { code: 'PHOTOCOPY', keyword: 'photocopying' },
      { code: 'TELEPHONE', keyword: 'telephone call' }
    ]
  }

  /**
   * Items completely prohibited in attorney-client billing
   */
  private getAttorneyClientProhibitions() {
    return [
      { code: 'KICKBACK', keyword: 'referral fee' },
      { code: 'PERSONAL', keyword: 'personal expense' },
      { code: 'UNETHICAL', keyword: 'contingency fee' } // In SA context
    ]
  }

  /**
   * Checks for ethics violations in own client billing
   */
  private checkEthicsViolations(context: BillingScopeContext): string[] {
    const violations: string[] = []

    // Excessive fees
    if (context.amount > 100000) {
      violations.push('Potentially excessive fee - requires justification')
    }

    // Fee sharing indicators
    if (context.description.toLowerCase().includes('referral') || 
        context.description.toLowerCase().includes('commission')) {
      violations.push('Possible fee sharing with non-practitioner')
    }

    // Contingency fee (prohibited in SA)
    if (context.description.toLowerCase().includes('contingency') ||
        context.description.toLowerCase().includes('success fee')) {
      violations.push('Contingency fees prohibited in South Africa')
    }

    return violations
  }

  /**
   * Determines if voucher evidence is required
   */
  private requiresVoucherEvidence(itemCode: string): boolean {
    const voucherRequiredCodes = [
      'SHERIFF',
      'MEDICAL',
      'EXPERT',
      'TRANSCRIPT',
      'TRAVEL_LONG',
      'ACCOMMODATION',
      'COURT_FEES'
    ]
    return voucherRequiredCodes.some(code => itemCode.includes(code))
  }

  /**
   * Applies scale limitations and caps
   */
  private applyScaleLimitations(context: BillingScopeContext) {
    // Get tariff item for scale limitations
    const tariffResult = enhancedTariffEngine.lookupTariffItem(
      context.itemCode,
      context.courtType,
      context.scale,
      context.workDate
    )

    if (!tariffResult.found || !tariffResult.item) {
      return { adjustedRate: undefined, cappedAmount: undefined }
    }

    let adjustedRate = tariffResult.item.rate
    let cappedAmount = context.amount

    // Apply caps if specified
    if (tariffResult.item.cap && context.amount > tariffResult.item.cap) {
      cappedAmount = tariffResult.item.cap
    }

    // Scale adjustments for punitive orders
    if (context.costsOrder === 'punitive-scale') {
      adjustedRate = adjustedRate * 1.5 // 150% of normal scale
    }

    return { adjustedRate, cappedAmount }
  }

  /**
   * Assesses taxation risk based on bill type and context
   */
  private assessTaxationRisk(context: BillingScopeContext, billType: BillType): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Base risk by bill type
    switch (billType) {
      case 'party-and-party': riskScore += 3; break
      case 'attorney-and-client': riskScore += 1; break
      case 'own-client': riskScore += 0; break
    }

    // Amount-based risk
    if (context.amount > 10000) riskScore += 2
    if (context.amount > 50000) riskScore += 3

    // Evidence-based risk
    if (!context.hasVoucher && this.requiresVoucherEvidence(context.itemCode)) {
      riskScore += 2
    }

    // Necessity/reasonableness risk
    if (!context.isNecessary) riskScore += 3
    if (!context.isReasonable) riskScore += 2

    // Return risk level
    if (riskScore >= 6) return 'high'
    if (riskScore >= 3) return 'medium'
    return 'low'
  }

  /**
   * Generates billing scope summary for taxation pack
   */
  generateScopeJustification(context: BillingScopeContext): string {
    const result = this.validateBillingScope(context)
    
    if (!result.allowed) {
      return `Item excluded: ${result.reason}`
    }

    let justification = `Item allowed under ${context.billType} billing. `
    
    if (context.billType === 'party-and-party') {
      justification += 'Necessary and reasonable for conduct of case. '
    }
    
    if (result.requiresVoucher) {
      justification += 'Voucher evidence attached. '
    }
    
    if (result.adjustedRate) {
      justification += `Rate adjusted per tariff: R${result.adjustedRate}. `
    }
    
    if (result.cappedAmount && result.cappedAmount < context.amount) {
      justification += `Amount capped at R${result.cappedAmount}. `
    }
    
    justification += `Taxation risk: ${result.taxationRisk}.`
    
    return justification
  }
}

// Export singleton instance
export const billingScopeEngine = BillingScopeEngine.getInstance()