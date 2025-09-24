// Enhanced South African Tariff Engine
// Handles versioned tariffs, effective dates, and automatic rate selection

import { TariffItem, CourtTariff, allTariffs } from '../data/sa-tariffs'
import { ForumDetectionResult } from './forum-detection'

export interface TariffLookupResult {
  item: TariffItem
  effectiveRate: number
  tariffVersion: string
  effectiveDate: string
  calculatedAmount: number
  vatAmount: number
  totalAmount: number
  warnings: string[]
  compliance: {
    isCompliant: boolean
    issues: string[]
    recommendations: string[]
  }
}

export interface BillLineItem {
  id: string
  date: string // ISO date string
  tariffCode: string
  description: string
  quantity: number
  unit: string
  narrative: string
  isVouched?: boolean
  voucherReference?: string
}

export interface TariffCalculationContext {
  forum: ForumDetectionResult
  billType: 'party-and-party' | 'attorney-and-client' | 'own-client'
  workDate: string
  isVATVendor: boolean
  clientType: 'individual' | 'corporate' | 'government'
}

/**
 * Enhanced tariff engine with date-aware calculations
 */
export class EnhancedTariffEngine {
  private tariffCache: Map<string, CourtTariff[]> = new Map()
  private readonly VAT_RATE = 0.15
  
  constructor() {
    this.initializeTariffCache()
  }
  
  /**
   * Initialize tariff cache with all available tariffs
   */
  private initializeTariffCache(): void {
    // Group tariffs by court type and scale
    allTariffs.forEach(tariff => {
      const key = `${tariff.courtCode}_${tariff.scale}`
      if (!this.tariffCache.has(key)) {
        this.tariffCache.set(key, [])
      }
      this.tariffCache.get(key)!.push(tariff)
    })
    
    // Sort by effective date (newest first)
    this.tariffCache.forEach(tariffs => {
      tariffs.sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())
    })
  }
  
  /**
   * Get the appropriate tariff for a given date and forum
   */
  private getTariffForDate(forum: ForumDetectionResult, workDate: string): CourtTariff | null {
    const key = `${forum.courtType}_${forum.scale}`
    const tariffs = this.tariffCache.get(key)
    
    if (!tariffs || tariffs.length === 0) {
      return null
    }
    
    const workDateTime = new Date(workDate).getTime()
    
    // Find the tariff that was effective on the work date
    for (const tariff of tariffs) {
      const effectiveFrom = new Date(tariff.effectiveFrom).getTime()
      const effectiveTo = tariff.effectiveTo ? new Date(tariff.effectiveTo).getTime() : Date.now()
      
      if (workDateTime >= effectiveFrom && workDateTime <= effectiveTo) {
        return tariff
      }
    }
    
    // If no exact match, return the most recent tariff before the work date
    for (const tariff of tariffs) {
      if (new Date(tariff.effectiveFrom).getTime() <= workDateTime) {
        return tariff
      }
    }
    
    return null
  }
  
  /**
   * Find a tariff item by code or semantic description
   */
  private findTariffItem(tariff: CourtTariff, tariffCode: string): TariffItem | null {
    // First try exact match by item number
    let item = tariff.items.find(item => item.itemNumber === tariffCode)
    
    if (!item) {
      // Try semantic matching by label or description
      const searchTerm = tariffCode.toLowerCase()
      item = tariff.items.find(item => 
        item.label.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
    }
    
    return item || null
  }
  
  /**
   * Calculate tariff amount with compliance checking
   */
  public calculateTariff(
    lineItem: BillLineItem,
    context: TariffCalculationContext
  ): TariffLookupResult {
    const warnings: string[] = []
    const complianceIssues: string[] = []
    const recommendations: string[] = []
    
    // Get appropriate tariff for the work date
    const tariff = this.getTariffForDate(context.forum, lineItem.date)
    
    if (!tariff) {
      throw new Error(`No tariff found for ${context.forum.courtType} Scale ${context.forum.scale} on ${lineItem.date}`)
    }
    
    // Find the specific tariff item
    const tariffItem = this.findTariffItem(tariff, lineItem.tariffCode)
    
    if (!tariffItem) {
      throw new Error(`Tariff item ${lineItem.tariffCode} not found in ${tariff.courtType} tariff`)
    }
    
    // Validate quantity and units
    this.validateQuantityAndUnits(lineItem, tariffItem, warnings, complianceIssues)
    
    // Apply bill type constraints
    this.applyBillTypeConstraints(tariffItem, context.billType, complianceIssues, recommendations)
    
    // Calculate base amount
    let effectiveRate = tariffItem.rate
    let quantity = lineItem.quantity
    
    // Apply minimum units if specified
    if (tariffItem.minimumUnits && quantity < tariffItem.minimumUnits) {
      quantity = tariffItem.minimumUnits
      warnings.push(`Quantity rounded up to minimum ${tariffItem.minimumUnits} ${tariffItem.unit}`)
    }
    
    // Apply maximum units if specified
    if (tariffItem.maximumUnits && quantity > tariffItem.maximumUnits) {
      quantity = tariffItem.maximumUnits
      warnings.push(`Quantity capped at maximum ${tariffItem.maximumUnits} ${tariffItem.unit}`)
    }
    
    let calculatedAmount = effectiveRate * quantity
    
    // Apply cap amount if specified
    if (tariffItem.capAmount && calculatedAmount > tariffItem.capAmount) {
      calculatedAmount = tariffItem.capAmount
      warnings.push(`Amount capped at R${tariffItem.capAmount.toFixed(2)}`)
    }
    
    // Calculate VAT
    let vatAmount = 0
    if (tariffItem.vatApplicable && context.isVATVendor) {
      vatAmount = calculatedAmount * this.VAT_RATE
    }
    
    const totalAmount = calculatedAmount + vatAmount
    
    // Check for voucher requirements
    this.checkVoucherRequirements(tariffItem, lineItem, complianceIssues)
    
    return {
      item: tariffItem,
      effectiveRate,
      tariffVersion: `${tariff.courtType} Scale ${tariff.scale} (${tariff.effectiveFrom})`,
      effectiveDate: tariff.effectiveFrom,
      calculatedAmount,
      vatAmount,
      totalAmount,
      warnings,
      compliance: {
        isCompliant: complianceIssues.length === 0,
        issues: complianceIssues,
        recommendations
      }
    }
  }
  
  /**
   * Validate quantity and units
   */
  private validateQuantityAndUnits(
    lineItem: BillLineItem,
    tariffItem: TariffItem,
    warnings: string[],
    issues: string[]
  ): void {
    if (lineItem.quantity <= 0) {
      issues.push('Quantity must be greater than zero')
    }
    
    if (lineItem.unit !== tariffItem.unit) {
      issues.push(`Unit mismatch: expected ${tariffItem.unit}, got ${lineItem.unit}`)
    }
    
    // Check for reasonable quantities
    if (tariffItem.unit === 'per hour' && lineItem.quantity > 24) {
      warnings.push('More than 24 hours in a single day may require justification')
    }
    
    if (tariffItem.unit === 'per page' && lineItem.quantity > 1000) {
      warnings.push('Large page counts may require justification')
    }
  }
  
  /**
   * Apply bill type constraints
   */
  private applyBillTypeConstraints(
    tariffItem: TariffItem,
    billType: string,
    issues: string[],
    recommendations: string[]
  ): void {
    if (billType === 'party-and-party') {
      // Party-and-party bills have stricter requirements
      if (tariffItem.category === 'disbursements' && tariffItem.subcategory === 'admin') {
        recommendations.push('Administrative disbursements may not be recoverable on party-and-party basis')
      }
      
      if (tariffItem.subcategory === 'travel' && !tariffItem.description.includes('necessary')) {
        recommendations.push('Travel costs must be necessary and reasonable for party-and-party recovery')
      }
    }
  }
  
  /**
   * Check voucher requirements
   */
  private checkVoucherRequirements(
    tariffItem: TariffItem,
    lineItem: BillLineItem,
    issues: string[]
  ): void {
    const requiresVoucher = (
      tariffItem.category === 'disbursements' ||
      tariffItem.subcategory === 'travel' ||
      tariffItem.rate === 0 // Actual cost items
    )
    
    if (requiresVoucher && !lineItem.isVouched) {
      issues.push(`${tariffItem.label} requires voucher/proof of payment`)
    }
  }
  
  /**
   * Get all available tariff items for a forum
   */
  public getAvailableTariffItems(forum: ForumDetectionResult, workDate: string): TariffItem[] {
    const tariff = this.getTariffForDate(forum, workDate)
    return tariff ? tariff.items : []
  }
  
  /**
   * Get tariff history for an item
   */
  public getTariffHistory(forum: ForumDetectionResult, itemNumber: string): {
    effectiveFrom: string
    effectiveTo?: string
    rate: number
  }[] {
    const key = `${forum.courtType}_${forum.scale}`
    const tariffs = this.tariffCache.get(key) || []
    
    return tariffs
      .map(tariff => {
        const item = tariff.items.find(i => i.itemNumber === itemNumber)
        return item ? {
          effectiveFrom: tariff.effectiveFrom,
          effectiveTo: tariff.effectiveTo,
          rate: item.rate
        } : null
      })
      .filter(Boolean) as any[]
  }
  
  /**
   * Validate a complete bill for compliance
   */
  public validateBill(
    lineItems: BillLineItem[],
    context: TariffCalculationContext
  ): {
    isCompliant: boolean
    totalIssues: number
    lineResults: TariffLookupResult[]
    billSummary: {
      totalFees: number
      totalDisbursements: number
      totalVAT: number
      grandTotal: number
    }
  } {
    const lineResults = lineItems.map(item => this.calculateTariff(item, context))
    const totalIssues = lineResults.reduce((sum, result) => sum + result.compliance.issues.length, 0)
    
    const billSummary = lineResults.reduce(
      (summary, result) => {
        if (result.item.category === 'fees') {
          summary.totalFees += result.calculatedAmount
        } else {
          summary.totalDisbursements += result.calculatedAmount
        }
        summary.totalVAT += result.vatAmount
        summary.grandTotal += result.totalAmount
        return summary
      },
      { totalFees: 0, totalDisbursements: 0, totalVAT: 0, grandTotal: 0 }
    )
    
    return {
      isCompliant: totalIssues === 0,
      totalIssues,
      lineResults,
      billSummary
    }
  }
}

// Export singleton instance
export const tariffEngine = new EnhancedTariffEngine()