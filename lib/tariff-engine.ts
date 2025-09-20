import { allTariffs, counselFees, VAT_RATE, TariffItem, CourtTariff } from '@/data/sa-tariffs'
import { roundToMinutes, calculateVAT } from '@/lib/utils'

export interface BillItem {
  id: string
  tariffItemId: string
  description: string
  units: number
  rateApplied: number
  amountExVat: number
  vat: number
  totalAmount: number
  source?: string
  createdBy: string
  createdAt: Date
}

export interface BillCalculation {
  items: BillItem[]
  subtotalFees: number
  subtotalDisbursements: number
  subtotalCounsel: number
  totalExVat: number
  totalVat: number
  grandTotal: number
}

export class TariffEngine {
  private tariffs: CourtTariff[]
  private vatRate: number
  private roundingMinutes: number

  constructor(vatRate: number = VAT_RATE, roundingMinutes: number = 15) {
    this.tariffs = allTariffs
    this.vatRate = vatRate
    this.roundingMinutes = roundingMinutes
  }

  // Get available tariffs for a court type
  getTariffsForCourt(courtCode: string): CourtTariff[] {
    return this.tariffs.filter(tariff => tariff.courtCode === courtCode)
  }

  // Get specific tariff by court and scale
  getTariff(courtCode: string, scale: string): CourtTariff | null {
    return this.tariffs.find(
      tariff => tariff.courtCode === courtCode && tariff.scale === scale
    ) || null
  }

  // Get tariff item by ID
  getTariffItem(courtCode: string, scale: string, itemNumber: string): TariffItem | null {
    const tariff = this.getTariff(courtCode, scale)
    if (!tariff) return null
    
    return tariff.items.find(item => item.itemNumber === itemNumber) || null
  }

  // Search tariff items by description
  searchTariffItems(courtCode: string, scale: string, searchTerm: string): TariffItem[] {
    const tariff = this.getTariff(courtCode, scale)
    if (!tariff) return []

    const term = searchTerm.toLowerCase()
    return tariff.items.filter(item => 
      item.label.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    )
  }

  // Calculate bill item amount
  calculateBillItem(
    courtCode: string,
    scale: string,
    itemNumber: string,
    units: number,
    description?: string,
    source?: string,
    createdBy: string = 'system'
  ): BillItem | null {
    const tariffItem = this.getTariffItem(courtCode, scale, itemNumber)
    if (!tariffItem) return null

    // Apply rounding for time-based items
    let adjustedUnits = units
    if (tariffItem.unit === 'per hour') {
      adjustedUnits = roundToMinutes(units, this.roundingMinutes)
    }

    // Apply minimum units
    if (tariffItem.minimumUnits && adjustedUnits < tariffItem.minimumUnits) {
      adjustedUnits = tariffItem.minimumUnits
    }

    // Apply maximum units
    if (tariffItem.maximumUnits && adjustedUnits > tariffItem.maximumUnits) {
      adjustedUnits = tariffItem.maximumUnits
    }

    // Calculate base amount
    let amountExVat = adjustedUnits * tariffItem.rate

    // Apply cap if specified
    if (tariffItem.capAmount && amountExVat > tariffItem.capAmount) {
      amountExVat = tariffItem.capAmount
    }

    // Calculate VAT
    const vat = tariffItem.vatApplicable ? calculateVAT(amountExVat, this.vatRate) : 0
    const totalAmount = amountExVat + vat

    return {
      id: `bill-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tariffItemId: `${courtCode}-${scale}-${itemNumber}`,
      description: description || tariffItem.description,
      units: adjustedUnits,
      rateApplied: tariffItem.rate,
      amountExVat,
      vat,
      totalAmount,
      source,
      createdBy,
      createdAt: new Date()
    }
  }

  // Calculate counsel fee
  calculateCounselFee(
    itemNumber: string,
    units: number = 1,
    description?: string,
    vatApplicable: boolean = false,
    createdBy: string = 'system'
  ): BillItem | null {
    const counselItem = counselFees.find(item => item.itemNumber === itemNumber)
    if (!counselItem) return null

    const amountExVat = units * counselItem.rate
    const vat = vatApplicable ? calculateVAT(amountExVat, this.vatRate) : 0
    const totalAmount = amountExVat + vat

    return {
      id: `counsel-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tariffItemId: itemNumber,
      description: description || counselItem.description,
      units,
      rateApplied: counselItem.rate,
      amountExVat,
      vat,
      totalAmount,
      source: 'counsel',
      createdBy,
      createdAt: new Date()
    }
  }

  // Calculate disbursement
  calculateDisbursement(
    description: string,
    amount: number,
    vatApplicable: boolean = true,
    createdBy: string = 'system'
  ): BillItem {
    const vat = vatApplicable ? calculateVAT(amount, this.vatRate) : 0
    const totalAmount = amount + vat

    return {
      id: `disbursement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tariffItemId: 'DISBURSEMENT',
      description,
      units: 1,
      rateApplied: amount,
      amountExVat: amount,
      vat,
      totalAmount,
      source: 'disbursement',
      createdBy,
      createdAt: new Date()
    }
  }

  // Calculate total bill
  calculateBill(items: BillItem[]): BillCalculation {
    const fees = items.filter(item => 
      !item.source || item.source === 'fees' || item.tariffItemId.includes('-')
    )
    const disbursements = items.filter(item => item.source === 'disbursement')
    const counsel = items.filter(item => item.source === 'counsel')

    const subtotalFees = fees.reduce((sum, item) => sum + item.amountExVat, 0)
    const subtotalDisbursements = disbursements.reduce((sum, item) => sum + item.amountExVat, 0)
    const subtotalCounsel = counsel.reduce((sum, item) => sum + item.amountExVat, 0)

    const totalExVat = subtotalFees + subtotalDisbursements + subtotalCounsel
    const totalVat = items.reduce((sum, item) => sum + item.vat, 0)
    const grandTotal = totalExVat + totalVat

    return {
      items,
      subtotalFees,
      subtotalDisbursements,
      subtotalCounsel,
      totalExVat,
      totalVat,
      grandTotal
    }
  }

  // Get quick add suggestions based on common items
  getQuickAddSuggestions(courtCode: string, scale: string): TariffItem[] {
    const tariff = this.getTariff(courtCode, scale)
    if (!tariff) return []

    // Common items that attorneys frequently use
    const commonItems = [
      '1.1', // Perusal
      '1.2', // Drafting
      '1.3', // Consultations
      '2.1', // Court attendance - unopposed
      '2.2', // Court attendance - opposed
      '3.1', // Travel time
      '4.3'  // Photocopying
    ]

    return tariff.items.filter(item => 
      commonItems.includes(item.itemNumber)
    )
  }

  // Parse OCR text and suggest tariff items
  parseOCRAndSuggest(ocrText: string, courtCode: string, scale: string): Array<{
    suggestion: TariffItem
    confidence: number
    extractedInfo: {
      units?: number
      description?: string
    }
  }> {
    const suggestions: Array<{
      suggestion: TariffItem
      confidence: number
      extractedInfo: {
        units?: number
        description?: string
      }
    }> = []

    const tariff = this.getTariff(courtCode, scale)
    if (!tariff) return suggestions

    const text = ocrText.toLowerCase()

    // Common patterns and their corresponding tariff items
    const patterns = [
      {
        regex: /tel(?:ephone)?\s+(?:opp|opponent|client)\s+(\d+)m/i,
        itemNumber: '1.4',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]) / 60,
        confidence: 0.9
      },
      {
        regex: /perusal?\s+(\d+)\s*p(?:ages?)?/i,
        itemNumber: '1.1',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.85
      },
      {
        regex: /draft(?:ing)?\s+(\d+)\s*p(?:ages?)?/i,
        itemNumber: '1.2',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.85
      },
      {
        regex: /consult(?:ation)?\s+(\d+)(?:h|hr|hour)/i,
        itemNumber: '1.3',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.8
      },
      {
        regex: /court\s+attend(?:ance)?\s+(\d+)(?:h|hr|hour)/i,
        itemNumber: '2.2',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.8
      },
      {
        regex: /travel\s+(\d+)(?:h|hr|hour)/i,
        itemNumber: '3.1',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.75
      },
      {
        regex: /photocopy(?:ing)?\s+(\d+)\s*p(?:ages?)?/i,
        itemNumber: '4.3',
        extractUnits: (match: RegExpMatchArray) => parseInt(match[1]),
        confidence: 0.7
      }
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match) {
        const tariffItem = tariff.items.find(item => item.itemNumber === pattern.itemNumber)
        if (tariffItem) {
          suggestions.push({
            suggestion: tariffItem,
            confidence: pattern.confidence,
            extractedInfo: {
              units: pattern.extractUnits(match),
              description: match[0]
            }
          })
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  // Update VAT rate
  setVATRate(rate: number): void {
    this.vatRate = rate
  }

  // Update rounding minutes
  setRoundingMinutes(minutes: number): void {
    this.roundingMinutes = minutes
  }
}

// Export singleton instance
export const tariffEngine = new TariffEngine()