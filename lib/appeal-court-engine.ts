/**
 * Appeal Court Support Engine for South African Legal Practice
 * Handles SCA Rule 18 compliance with quarter-hour billing and per-page logic
 * Supports Supreme Court of Appeal, Constitutional Court, and High Court appeals
 */

export interface AppealCourtConfig {
  courtType: 'SCA' | 'Constitutional' | 'High Court' | 'Labour Appeal'
  jurisdiction: string
  rules: string[]
  billingMethod: 'quarter-hour' | 'per-page' | 'fixed-fee' | 'hybrid'
  baseRates: AppealRateStructure
  caps: AppealCaps
  specialRequirements: string[]
}

export interface AppealRateStructure {
  preparation: {
    perQuarterHour: number
    perPage: number
    minimumFee: number
    maximumFee?: number
  }
  appearance: {
    perQuarterHour: number
    perDay: number
    minimumFee: number
    maximumFee?: number
  }
  research: {
    perQuarterHour: number
    perPage: number
    minimumFee: number
    maximumFee?: number
  }
  drafting: {
    perQuarterHour: number
    perPage: number
    minimumFee: number
    maximumFee?: number
  }
  consultation: {
    perQuarterHour: number
    minimumFee: number
    maximumFee?: number
  }
}

export interface AppealCaps {
  totalPreparation?: number
  totalAppearance?: number
  totalResearch?: number
  totalDrafting?: number
  overallCap?: number
  perDayCap?: number
}

export interface AppealBillItem {
  id: string
  date: Date
  description: string
  category: 'preparation' | 'appearance' | 'research' | 'drafting' | 'consultation' | 'disbursement'
  billingMethod: 'quarter-hour' | 'per-page' | 'fixed-fee'
  timeSpent?: number // in minutes
  pageCount?: number
  rate: number
  amount: number
  isCompliant: boolean
  complianceNotes: string[]
  recordReference: string
  tariffCode: string
}

export interface AppealContext {
  courtType: 'SCA' | 'Constitutional' | 'High Court' | 'Labour Appeal'
  caseNumber: string
  appealType: 'leave-to-appeal' | 'appeal' | 'cross-appeal' | 'condonation'
  recordLength: number // pages
  hearingDuration: number // minutes
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'highly-complex'
  urgency: 'normal' | 'urgent' | 'expedited'
  counselInvolved: boolean
  multipleAppellants: boolean
  constitutionalIssues: boolean
}

export interface AppealBillValidation {
  isValid: boolean
  totalAmount: number
  cappedAmount: number
  reductionApplied: number
  complianceIssues: string[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
  taxationRisk: number // percentage
}

export interface QuarterHourCalculation {
  totalMinutes: number
  quarterHours: number
  roundedQuarterHours: number
  rate: number
  amount: number
  roundingAdjustment: number
}

export interface PageBasedCalculation {
  pageCount: number
  rate: number
  amount: number
  complexity: number
  adjustedAmount: number
}

class AppealCourtEngine {
  private static instance: AppealCourtEngine
  
  // SCA Rule 18 specific configurations
  private readonly SCA_CONFIG: AppealCourtConfig = {
    courtType: 'SCA',
    jurisdiction: 'National',
    rules: ['SCA Rule 18', 'Uniform Rules', 'Superior Courts Act'],
    billingMethod: 'quarter-hour',
    baseRates: {
      preparation: {
        perQuarterHour: 450,
        perPage: 85,
        minimumFee: 1800,
        maximumFee: 25000
      },
      appearance: {
        perQuarterHour: 650,
        perDay: 5200,
        minimumFee: 2600,
        maximumFee: 15600
      },
      research: {
        perQuarterHour: 400,
        perPage: 75,
        minimumFee: 1600,
        maximumFee: 20000
      },
      drafting: {
        perQuarterHour: 500,
        perPage: 95,
        minimumFee: 2000,
        maximumFee: 30000
      },
      consultation: {
        perQuarterHour: 550,
        minimumFee: 2200,
        maximumFee: 8800
      }
    },
    caps: {
      totalPreparation: 50000,
      totalAppearance: 31200,
      totalResearch: 40000,
      totalDrafting: 60000,
      overallCap: 150000,
      perDayCap: 15600
    },
    specialRequirements: [
      'Record heads must be cross-referenced',
      'Hearing duration must be documented',
      'Quarter-hour rounding applies',
      'Page count verification required'
    ]
  }

  // Constitutional Court configuration
  private readonly CONSTITUTIONAL_CONFIG: AppealCourtConfig = {
    courtType: 'Constitutional',
    jurisdiction: 'National',
    rules: ['Constitutional Court Rules', 'Constitution'],
    billingMethod: 'hybrid',
    baseRates: {
      preparation: {
        perQuarterHour: 500,
        perPage: 95,
        minimumFee: 2000,
        maximumFee: 35000
      },
      appearance: {
        perQuarterHour: 750,
        perDay: 6000,
        minimumFee: 3000,
        maximumFee: 18000
      },
      research: {
        perQuarterHour: 450,
        perPage: 85,
        minimumFee: 1800,
        maximumFee: 25000
      },
      drafting: {
        perQuarterHour: 550,
        perPage: 105,
        minimumFee: 2200,
        maximumFee: 40000
      },
      consultation: {
        perQuarterHour: 600,
        minimumFee: 2400,
        maximumFee: 12000
      }
    },
    caps: {
      totalPreparation: 70000,
      totalAppearance: 36000,
      totalResearch: 50000,
      totalDrafting: 80000,
      overallCap: 200000,
      perDayCap: 18000
    },
    specialRequirements: [
      'Constitutional issues must be identified',
      'Precedent research required',
      'Public interest considerations',
      'Enhanced documentation standards'
    ]
  }

  static getInstance(): AppealCourtEngine {
    if (!AppealCourtEngine.instance) {
      AppealCourtEngine.instance = new AppealCourtEngine()
    }
    return AppealCourtEngine.instance
  }

  /**
   * Gets the appropriate court configuration
   */
  getCourtConfig(courtType: 'SCA' | 'Constitutional' | 'High Court' | 'Labour Appeal'): AppealCourtConfig {
    switch (courtType) {
      case 'SCA':
        return this.SCA_CONFIG
      case 'Constitutional':
        return this.CONSTITUTIONAL_CONFIG
      case 'High Court':
        return this.createHighCourtConfig()
      case 'Labour Appeal':
        return this.createLabourAppealConfig()
      default:
        return this.SCA_CONFIG
    }
  }

  /**
   * Calculates quarter-hour based billing (SCA Rule 18)
   */
  calculateQuarterHourBilling(
    timeInMinutes: number,
    ratePerQuarterHour: number,
    category: string
  ): QuarterHourCalculation {
    // Convert to quarter hours and round up
    const exactQuarterHours = timeInMinutes / 15
    const roundedQuarterHours = Math.ceil(exactQuarterHours)
    
    const amount = roundedQuarterHours * ratePerQuarterHour
    const roundingAdjustment = (roundedQuarterHours - exactQuarterHours) * ratePerQuarterHour
    
    return {
      totalMinutes: timeInMinutes,
      quarterHours: exactQuarterHours,
      roundedQuarterHours,
      rate: ratePerQuarterHour,
      amount,
      roundingAdjustment
    }
  }

  /**
   * Calculates page-based billing for document preparation
   */
  calculatePageBasedBilling(
    pageCount: number,
    ratePerPage: number,
    complexityMultiplier: number = 1
  ): PageBasedCalculation {
    const baseAmount = pageCount * ratePerPage
    const adjustedAmount = baseAmount * complexityMultiplier
    
    return {
      pageCount,
      rate: ratePerPage,
      amount: baseAmount,
      complexity: complexityMultiplier,
      adjustedAmount
    }
  }

  /**
   * Creates an appeal bill item with compliance validation
   */
  createAppealBillItem(
    context: AppealContext,
    itemData: {
      date: Date
      description: string
      category: 'preparation' | 'appearance' | 'research' | 'drafting' | 'consultation' | 'disbursement'
      timeSpent?: number
      pageCount?: number
      recordReference: string
    }
  ): AppealBillItem {
    const config = this.getCourtConfig(context.courtType)
    const rates = config.baseRates[itemData.category as keyof AppealRateStructure]
    
    let amount = 0
    let billingMethod: 'quarter-hour' | 'per-page' | 'fixed-fee' = 'quarter-hour'
    const complianceNotes: string[] = []
    
    // Determine billing method and calculate amount
    if (itemData.timeSpent && itemData.timeSpent > 0) {
      billingMethod = 'quarter-hour'
      const calculation = this.calculateQuarterHourBilling(
        itemData.timeSpent,
        rates.perQuarterHour,
        itemData.category
      )
      amount = calculation.amount
      
      if (calculation.roundingAdjustment > 0) {
        complianceNotes.push(`Time rounded up by ${calculation.roundingAdjustment.toFixed(2)} minutes`)
      }
    } else if (itemData.pageCount && itemData.pageCount > 0 && 'perPage' in rates) {
      billingMethod = 'per-page'
      const complexityMultiplier = this.getComplexityMultiplier(context.complexityLevel)
      const calculation = this.calculatePageBasedBilling(
        itemData.pageCount,
        rates.perPage,
        complexityMultiplier
      )
      amount = calculation.adjustedAmount
      
      if (complexityMultiplier !== 1) {
        complianceNotes.push(`Complexity adjustment applied: ${complexityMultiplier}x`)
      }
    } else {
      billingMethod = 'fixed-fee'
      amount = rates.minimumFee
      complianceNotes.push('Minimum fee applied - no time or page count specified')
    }
    
    // Apply caps
    const cappedAmount = this.applyCaps(amount, itemData.category, config.caps)
    if (cappedAmount < amount) {
      complianceNotes.push(`Amount capped from ${amount.toFixed(2)} to ${cappedAmount.toFixed(2)}`)
      amount = cappedAmount
    }
    
    // Validate compliance
    const isCompliant = this.validateItemCompliance(itemData, context, config)
    if (!isCompliant) {
      complianceNotes.push('Item may not comply with court rules - review required')
    }
    
    return {
      id: this.generateItemId(),
      date: itemData.date,
      description: itemData.description,
      category: itemData.category,
      billingMethod,
      timeSpent: itemData.timeSpent,
      pageCount: itemData.pageCount,
      rate: billingMethod === 'quarter-hour' ? rates.perQuarterHour : ('perPage' in rates ? rates.perPage : rates.perQuarterHour),
      amount,
      isCompliant,
      complianceNotes,
      recordReference: itemData.recordReference,
      tariffCode: this.generateTariffCode(context.courtType, itemData.category)
    }
  }

  /**
   * Validates an entire appeal bill
   */
  validateAppealBill(
    items: AppealBillItem[],
    context: AppealContext
  ): AppealBillValidation {
    const config = this.getCourtConfig(context.courtType)
    const complianceIssues: string[] = []
    const recommendations: string[] = []
    
    // Calculate totals by category
    const totals = this.calculateCategoryTotals(items)
    const totalAmount = Object.values(totals).reduce((sum, total) => sum + total, 0)
    
    // Apply overall cap
    let cappedAmount = totalAmount
    if (config.caps.overallCap && totalAmount > config.caps.overallCap) {
      cappedAmount = config.caps.overallCap
      complianceIssues.push(`Total amount exceeds overall cap of R${config.caps.overallCap.toLocaleString()}`)
    }
    
    // Check category-specific caps
    Object.entries(totals).forEach(([category, total]) => {
      const capKey = `total${category.charAt(0).toUpperCase() + category.slice(1)}` as keyof AppealCaps
      const cap = config.caps[capKey] as number
      
      if (cap && total > cap) {
        complianceIssues.push(`${category} total exceeds cap of R${cap.toLocaleString()}`)
      }
    })
    
    // Validate record references
    const missingReferences = items.filter(item => !item.recordReference || item.recordReference.trim() === '')
    if (missingReferences.length > 0) {
      complianceIssues.push(`${missingReferences.length} items missing record references`)
    }
    
    // Check for reasonable time allocations
    const timeValidation = this.validateTimeAllocations(items, context)
    complianceIssues.push(...timeValidation.issues)
    recommendations.push(...timeValidation.recommendations)
    
    // Calculate taxation risk
    const taxationRisk = this.calculateTaxationRisk(items, context, complianceIssues.length)
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (taxationRisk > 30) riskLevel = 'high'
    else if (taxationRisk > 15) riskLevel = 'medium'
    
    // Generate recommendations
    if (riskLevel === 'high') {
      recommendations.push('Consider reducing bill or providing additional justification')
      recommendations.push('Ensure all time records are contemporaneous and detailed')
    }
    
    if (context.complexityLevel === 'highly-complex' && taxationRisk > 20) {
      recommendations.push('Prepare detailed complexity justification for taxation')
    }
    
    return {
      isValid: complianceIssues.length === 0,
      totalAmount,
      cappedAmount,
      reductionApplied: totalAmount - cappedAmount,
      complianceIssues,
      recommendations,
      riskLevel,
      taxationRisk
    }
  }

  /**
   * Generates SCA Rule 18 compliant bill format
   */
  generateSCABill(
    items: AppealBillItem[],
    context: AppealContext,
    clientDetails: {
      name: string
      caseNumber: string
      court: string
    }
  ): string {
    const config = this.getCourtConfig(context.courtType)
    const validation = this.validateAppealBill(items, context)
    
    let bill = `BILL OF COSTS - ${config.courtType}\n`
    bill += `Case: ${clientDetails.caseNumber}\n`
    bill += `Client: ${clientDetails.name}\n`
    bill += `Court: ${clientDetails.court}\n`
    bill += `Generated: ${new Date().toLocaleDateString('en-ZA')}\n\n`
    
    bill += `APPLICABLE RULES: ${config.rules.join(', ')}\n`
    bill += `BILLING METHOD: ${config.billingMethod}\n\n`
    
    // Group items by category
    const groupedItems = this.groupItemsByCategory(items)
    
    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      bill += `${category.toUpperCase()}:\n`
      bill += `Date\tDescription\tTime/Pages\tRate\tAmount\tRef\n`
      bill += `${'='.repeat(80)}\n`
      
      let categoryTotal = 0
      categoryItems.forEach(item => {
        const timeOrPages = item.billingMethod === 'quarter-hour' 
          ? `${Math.ceil((item.timeSpent || 0) / 15)} x 15min`
          : `${item.pageCount || 0} pages`
        
        bill += `${item.date.toLocaleDateString('en-ZA')}\t`
        bill += `${item.description}\t`
        bill += `${timeOrPages}\t`
        bill += `R${item.rate.toFixed(2)}\t`
        bill += `R${item.amount.toFixed(2)}\t`
        bill += `${item.recordReference}\n`
        
        categoryTotal += item.amount
      })
      
      bill += `\nCategory Total: R${categoryTotal.toFixed(2)}\n\n`
    })
    
    bill += `SUMMARY:\n`
    bill += `Total Amount: R${validation.totalAmount.toFixed(2)}\n`
    if (validation.reductionApplied > 0) {
      bill += `Less: Cap Reduction: R${validation.reductionApplied.toFixed(2)}\n`
      bill += `Net Amount: R${validation.cappedAmount.toFixed(2)}\n`
    }
    
    if (validation.complianceIssues.length > 0) {
      bill += `\nCOMPLIANCE ISSUES:\n`
      validation.complianceIssues.forEach(issue => {
        bill += `- ${issue}\n`
      })
    }
    
    if (validation.recommendations.length > 0) {
      bill += `\nRECOMMENDATIONS:\n`
      validation.recommendations.forEach(rec => {
        bill += `- ${rec}\n`
      })
    }
    
    bill += `\nTaxation Risk: ${validation.taxationRisk.toFixed(1)}% (${validation.riskLevel})\n`
    
    return bill
  }

  // Helper methods

  private createHighCourtConfig(): AppealCourtConfig {
    return {
      courtType: 'High Court',
      jurisdiction: 'Provincial',
      rules: ['Uniform Rules', 'High Court Rules'],
      billingMethod: 'quarter-hour',
      baseRates: {
        preparation: {
          perQuarterHour: 400,
          perPage: 75,
          minimumFee: 1600,
          maximumFee: 20000
        },
        appearance: {
          perQuarterHour: 600,
          perDay: 4800,
          minimumFee: 2400,
          maximumFee: 14400
        },
        research: {
          perQuarterHour: 350,
          perPage: 65,
          minimumFee: 1400,
          maximumFee: 15000
        },
        drafting: {
          perQuarterHour: 450,
          perPage: 85,
          minimumFee: 1800,
          maximumFee: 25000
        },
        consultation: {
          perQuarterHour: 500,
          minimumFee: 2000,
          maximumFee: 8000
        }
      },
      caps: {
        totalPreparation: 40000,
        totalAppearance: 28800,
        totalResearch: 30000,
        totalDrafting: 50000,
        overallCap: 120000,
        perDayCap: 14400
      },
      specialRequirements: [
        'Provincial jurisdiction rules apply',
        'Local court practices must be considered',
        'Standard quarter-hour rounding'
      ]
    }
  }

  private createLabourAppealConfig(): AppealCourtConfig {
    return {
      courtType: 'Labour Appeal',
      jurisdiction: 'Specialized',
      rules: ['Labour Relations Act', 'Labour Court Rules'],
      billingMethod: 'quarter-hour',
      baseRates: {
        preparation: {
          perQuarterHour: 380,
          perPage: 70,
          minimumFee: 1520,
          maximumFee: 18000
        },
        appearance: {
          perQuarterHour: 580,
          perDay: 4640,
          minimumFee: 2320,
          maximumFee: 13920
        },
        research: {
          perQuarterHour: 330,
          perPage: 60,
          minimumFee: 1320,
          maximumFee: 14000
        },
        drafting: {
          perQuarterHour: 420,
          perPage: 80,
          minimumFee: 1680,
          maximumFee: 22000
        },
        consultation: {
          perQuarterHour: 480,
          minimumFee: 1920,
          maximumFee: 7680
        }
      },
      caps: {
        totalPreparation: 36000,
        totalAppearance: 27840,
        totalResearch: 28000,
        totalDrafting: 44000,
        overallCap: 110000,
        perDayCap: 13920
      },
      specialRequirements: [
        'Labour law specialization required',
        'Industrial relations context',
        'Expedited procedures may apply'
      ]
    }
  }

  private getComplexityMultiplier(level: 'simple' | 'moderate' | 'complex' | 'highly-complex'): number {
    switch (level) {
      case 'simple': return 0.8
      case 'moderate': return 1.0
      case 'complex': return 1.2
      case 'highly-complex': return 1.5
      default: return 1.0
    }
  }

  private applyCaps(amount: number, category: string, caps: AppealCaps): number {
    const capKey = `total${category.charAt(0).toUpperCase() + category.slice(1)}` as keyof AppealCaps
    const cap = caps[capKey] as number
    
    if (cap && amount > cap) {
      return cap
    }
    
    return amount
  }

  private validateItemCompliance(
    itemData: any,
    context: AppealContext,
    config: AppealCourtConfig
  ): boolean {
    // Basic validation rules
    if (!itemData.recordReference || itemData.recordReference.trim() === '') {
      return false
    }
    
    if (!itemData.description || itemData.description.trim().length < 10) {
      return false
    }
    
    // Time-based validation
    if (itemData.timeSpent && itemData.timeSpent > 480) { // More than 8 hours
      return false
    }
    
    return true
  }

  private calculateCategoryTotals(items: AppealBillItem[]): Record<string, number> {
    const totals: Record<string, number> = {}
    
    items.forEach(item => {
      if (!totals[item.category]) {
        totals[item.category] = 0
      }
      totals[item.category] += item.amount
    })
    
    return totals
  }

  private validateTimeAllocations(
    items: AppealBillItem[],
    context: AppealContext
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check for excessive time on simple tasks
    const excessiveItems = items.filter(item => 
      item.timeSpent && item.timeSpent > 240 && // More than 4 hours
      context.complexityLevel === 'simple'
    )
    
    if (excessiveItems.length > 0) {
      issues.push('Excessive time allocated for simple matter complexity')
      recommendations.push('Review time allocations for reasonableness')
    }
    
    // Check for insufficient time on complex tasks
    const insufficientItems = items.filter(item =>
      item.timeSpent && item.timeSpent < 60 && // Less than 1 hour
      context.complexityLevel === 'highly-complex' &&
      item.category === 'preparation'
    )
    
    if (insufficientItems.length > 0) {
      recommendations.push('Consider if time allocations are sufficient for complex matter')
    }
    
    return { issues, recommendations }
  }

  private calculateTaxationRisk(
    items: AppealBillItem[],
    context: AppealContext,
    complianceIssueCount: number
  ): number {
    let risk = 0
    
    // Base risk from compliance issues
    risk += complianceIssueCount * 5
    
    // Risk from high amounts
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    if (totalAmount > 100000) risk += 15
    else if (totalAmount > 50000) risk += 10
    else if (totalAmount > 25000) risk += 5
    
    // Risk from complexity mismatch
    if (context.complexityLevel === 'simple' && totalAmount > 30000) {
      risk += 20
    }
    
    // Risk from missing documentation
    const missingRefs = items.filter(item => !item.recordReference).length
    risk += missingRefs * 3
    
    return Math.min(risk, 100) // Cap at 100%
  }

  private groupItemsByCategory(items: AppealBillItem[]): Record<string, AppealBillItem[]> {
    const grouped: Record<string, AppealBillItem[]> = {}
    
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })
    
    return grouped
  }

  private generateItemId(): string {
    return `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTariffCode(courtType: string, category: string): string {
    const courtPrefix = courtType === 'SCA' ? 'SCA' : 
                       courtType === 'Constitutional' ? 'CC' :
                       courtType === 'High Court' ? 'HC' : 'LAC'
    
    const categoryCode = category.substring(0, 3).toUpperCase()
    
    return `${courtPrefix}-${categoryCode}`
  }
}

// Export singleton instance
export const appealCourtEngine = AppealCourtEngine.getInstance()