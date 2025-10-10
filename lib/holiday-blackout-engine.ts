/**
 * Holiday Blackout Period Engine for South African Legal Practice
 * Handles 16 Dec to 15 Jan blackout with automatic date skipping and exception handling
 * Based on Magistrates' Courts Rules and legal practice requirements
 */

export interface BlackoutPeriod {
  year: number
  startDate: Date
  endDate: Date
  description: string
  exceptions: BlackoutException[]
}

export interface BlackoutException {
  type: 'urgent-application' | 'interim-relief' | 'criminal-matter' | 'appeal-deadline' | 'court-order'
  description: string
  criteria: string[]
  requiresJustification: boolean
}

export interface DateAdjustmentResult {
  originalDate: Date
  adjustedDate: Date
  wasAdjusted: boolean
  reason: string
  blackoutPeriod?: BlackoutPeriod
  daysSkipped: number
}

export interface BlackoutValidationResult {
  isInBlackout: boolean
  blackoutPeriod?: BlackoutPeriod
  applicableExceptions: BlackoutException[]
  canProceed: boolean
  justificationRequired: boolean
  warningMessage?: string
}

export interface DeadlineCalculationContext {
  baseDate: Date
  deadlineType: 'inspection' | 'objection' | 'set-down' | 'appeal' | 'service' | 'filing'
  daysToAdd: number
  includeWeekends: boolean
  courtType: string
  matterType: 'civil' | 'criminal' | 'appeal' | 'urgent'
  isUrgent: boolean
}

class HolidayBlackoutEngine {
  private static instance: HolidayBlackoutEngine
  
  // Standard blackout period: 16 December to 15 January
  private readonly BLACKOUT_START_MONTH = 12
  private readonly BLACKOUT_START_DAY = 16
  private readonly BLACKOUT_END_MONTH = 1
  private readonly BLACKOUT_END_DAY = 15
  
  // Additional public holidays that may affect court operations
  private readonly PUBLIC_HOLIDAYS = [
    { month: 1, day: 1, name: 'New Year\'s Day' },
    { month: 3, day: 21, name: 'Human Rights Day' },
    { month: 4, day: 27, name: 'Freedom Day' },
    { month: 5, day: 1, name: 'Workers\' Day' },
    { month: 6, day: 16, name: 'Youth Day' },
    { month: 8, day: 9, name: 'National Women\'s Day' },
    { month: 9, day: 24, name: 'Heritage Day' },
    { month: 12, day: 16, name: 'Day of Reconciliation' },
    { month: 12, day: 25, name: 'Christmas Day' },
    { month: 12, day: 26, name: 'Day of Goodwill' }
  ]

  static getInstance(): HolidayBlackoutEngine {
    if (!HolidayBlackoutEngine.instance) {
      HolidayBlackoutEngine.instance = new HolidayBlackoutEngine()
    }
    return HolidayBlackoutEngine.instance
  }

  /**
   * Gets the blackout period for a specific year
   */
  getBlackoutPeriod(year: number): BlackoutPeriod {
    const startDate = new Date(year, this.BLACKOUT_START_MONTH - 1, this.BLACKOUT_START_DAY)
    const endDate = new Date(year + 1, this.BLACKOUT_END_MONTH - 1, this.BLACKOUT_END_DAY)
    
    return {
      year,
      startDate,
      endDate,
      description: 'Annual court holiday blackout period',
      exceptions: this.getBlackoutExceptions()
    }
  }

  /**
   * Checks if a date falls within the blackout period
   */
  isInBlackoutPeriod(date: Date): BlackoutValidationResult {
    const year = date.getFullYear()
    const blackoutPeriod = this.getBlackoutPeriod(year)
    
    // Check current year blackout
    let isInBlackout = date >= blackoutPeriod.startDate && date <= blackoutPeriod.endDate
    let relevantBlackout = blackoutPeriod
    
    // Check previous year blackout (for January dates)
    if (!isInBlackout && date.getMonth() === 0) {
      const prevYearBlackout = this.getBlackoutPeriod(year - 1)
      isInBlackout = date >= prevYearBlackout.startDate && date <= prevYearBlackout.endDate
      relevantBlackout = prevYearBlackout
    }
    
    if (!isInBlackout) {
      return {
        isInBlackout: false,
        applicableExceptions: [],
        canProceed: true,
        justificationRequired: false
      }
    }
    
    const applicableExceptions = this.getBlackoutExceptions()
    
    return {
      isInBlackout: true,
      blackoutPeriod: relevantBlackout,
      applicableExceptions,
      canProceed: applicableExceptions.length > 0,
      justificationRequired: true,
      warningMessage: 'Date falls within holiday blackout period. Special justification may be required.'
    }
  }

  /**
   * Adjusts a date to skip the blackout period
   */
  adjustDateForBlackout(date: Date, skipForward: boolean = true): DateAdjustmentResult {
    const validation = this.isInBlackoutPeriod(date)
    
    if (!validation.isInBlackout) {
      return {
        originalDate: date,
        adjustedDate: date,
        wasAdjusted: false,
        reason: 'Date not in blackout period',
        daysSkipped: 0
      }
    }
    
    const blackoutPeriod = validation.blackoutPeriod!
    let adjustedDate: Date
    let daysSkipped: number
    
    if (skipForward) {
      // Move to day after blackout ends
      adjustedDate = new Date(blackoutPeriod.endDate)
      adjustedDate.setDate(adjustedDate.getDate() + 1)
      daysSkipped = Math.ceil((adjustedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      // Move to day before blackout starts
      adjustedDate = new Date(blackoutPeriod.startDate)
      adjustedDate.setDate(adjustedDate.getDate() - 1)
      daysSkipped = Math.ceil((date.getTime() - adjustedDate.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    // Ensure adjusted date is a business day
    adjustedDate = this.adjustToBusinessDay(adjustedDate, skipForward)
    
    return {
      originalDate: date,
      adjustedDate,
      wasAdjusted: true,
      reason: `Date adjusted to skip ${blackoutPeriod.description}`,
      blackoutPeriod,
      daysSkipped
    }
  }

  /**
   * Calculates deadline with blackout period consideration
   */
  calculateDeadlineWithBlackout(context: DeadlineCalculationContext): DateAdjustmentResult {
    let targetDate = new Date(context.baseDate)
    
    // Add the required days
    if (context.includeWeekends) {
      targetDate.setDate(targetDate.getDate() + context.daysToAdd)
    } else {
      targetDate = this.addBusinessDays(targetDate, context.daysToAdd)
    }
    
    // Check if target date falls in blackout
    const validation = this.isInBlackoutPeriod(targetDate)
    
    if (!validation.isInBlackout) {
      return {
        originalDate: context.baseDate,
        adjustedDate: targetDate,
        wasAdjusted: false,
        reason: 'Deadline not affected by blackout period',
        daysSkipped: 0
      }
    }
    
    // Check if matter qualifies for exception
    const hasException = this.checkExceptionApplicability(context, validation.applicableExceptions)
    
    if (hasException.applicable) {
      return {
        originalDate: context.baseDate,
        adjustedDate: targetDate,
        wasAdjusted: false,
        reason: `Exception applies: ${hasException.reason}`,
        blackoutPeriod: validation.blackoutPeriod,
        daysSkipped: 0
      }
    }
    
    // Adjust date to skip blackout
    return this.adjustDateForBlackout(targetDate, true)
  }

  /**
   * Gets all business days within a date range, excluding blackout periods
   */
  getBusinessDaysExcludingBlackout(startDate: Date, endDate: Date): Date[] {
    const businessDays: Date[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      if (this.isBusinessDay(currentDate) && !this.isInBlackoutPeriod(currentDate).isInBlackout) {
        businessDays.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return businessDays
  }

  /**
   * Calculates the next available court date
   */
  getNextAvailableCourtDate(fromDate: Date = new Date()): DateAdjustmentResult {
    const nextDate = new Date(fromDate)
    nextDate.setDate(nextDate.getDate() + 1) // Start from next day
    
    // Find next business day not in blackout
    while (true) {
      if (this.isBusinessDay(nextDate) && !this.isInBlackoutPeriod(nextDate).isInBlackout) {
        break
      }
      nextDate.setDate(nextDate.getDate() + 1)
    }
    
    const daysSkipped = Math.ceil((nextDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      originalDate: fromDate,
      adjustedDate: nextDate,
      wasAdjusted: daysSkipped > 1,
      reason: daysSkipped > 1 ? 'Adjusted to skip weekends and/or blackout period' : 'Next business day',
      daysSkipped
    }
  }

  /**
   * Validates if a proposed court date is acceptable
   */
  validateCourtDate(date: Date, matterType: 'civil' | 'criminal' | 'appeal' | 'urgent' = 'civil'): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check if it's a business day
    if (!this.isBusinessDay(date)) {
      issues.push('Date falls on weekend or public holiday')
      recommendations.push('Select a business day')
    }
    
    // Check blackout period
    const blackoutValidation = this.isInBlackoutPeriod(date)
    if (blackoutValidation.isInBlackout) {
      if (matterType === 'urgent' && blackoutValidation.applicableExceptions.length > 0) {
        recommendations.push('Urgent matter may proceed with proper justification')
      } else {
        issues.push('Date falls within holiday blackout period')
        recommendations.push('Select date after blackout period ends')
      }
    }
    
    // Check if too close to blackout period
    const daysToBlackout = this.getDaysUntilNextBlackout(date)
    if (daysToBlackout <= 5 && daysToBlackout > 0) {
      recommendations.push('Consider potential delays due to approaching blackout period')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  // Helper methods

  private getBlackoutExceptions(): BlackoutException[] {
    return [
      {
        type: 'urgent-application',
        description: 'Urgent applications requiring immediate relief',
        criteria: [
          'Imminent harm or prejudice',
          'Constitutional rights at stake',
          'Time-sensitive commercial matters'
        ],
        requiresJustification: true
      },
      {
        type: 'interim-relief',
        description: 'Interim relief applications',
        criteria: [
          'Preservation of status quo',
          'Prevention of irreparable harm',
          'Interim interdicts'
        ],
        requiresJustification: true
      },
      {
        type: 'criminal-matter',
        description: 'Criminal matters with custody implications',
        criteria: [
          'Bail applications',
          'Custody time limits',
          'Constitutional deadlines'
        ],
        requiresJustification: false
      },
      {
        type: 'appeal-deadline',
        description: 'Appeal deadlines that cannot be extended',
        criteria: [
          'Statutory appeal periods',
          'Constitutional Court deadlines',
          'SCA filing deadlines'
        ],
        requiresJustification: false
      },
      {
        type: 'court-order',
        description: 'Compliance with existing court orders',
        criteria: [
          'Court-ordered deadlines',
          'Contempt proceedings',
          'Mandated timelines'
        ],
        requiresJustification: false
      }
    ]
  }

  private checkExceptionApplicability(
    context: DeadlineCalculationContext, 
    exceptions: BlackoutException[]
  ): { applicable: boolean; reason: string } {
    if (context.isUrgent) {
      return {
        applicable: true,
        reason: 'Urgent matter exception applies'
      }
    }
    
    if (context.matterType === 'criminal') {
      return {
        applicable: true,
        reason: 'Criminal matter exception applies'
      }
    }
    
    if (context.deadlineType === 'appeal' && context.matterType === 'appeal') {
      return {
        applicable: true,
        reason: 'Appeal deadline exception applies'
      }
    }
    
    return {
      applicable: false,
      reason: 'No applicable exceptions found'
    }
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let addedDays = 0
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1)
      
      if (this.isBusinessDay(result)) {
        addedDays++
      }
    }
    
    return result
  }

  private adjustToBusinessDay(date: Date, forward: boolean = true): Date {
    const adjustedDate = new Date(date)
    
    while (!this.isBusinessDay(adjustedDate)) {
      if (forward) {
        adjustedDate.setDate(adjustedDate.getDate() + 1)
      } else {
        adjustedDate.setDate(adjustedDate.getDate() - 1)
      }
    }
    
    return adjustedDate
  }

  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay()
    
    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false
    }
    
    // Check if public holiday
    return !this.isPublicHoliday(date)
  }

  private isPublicHoliday(date: Date): boolean {
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    return this.PUBLIC_HOLIDAYS.some(holiday => 
      holiday.month === month && holiday.day === day
    )
  }

  private getDaysUntilNextBlackout(fromDate: Date): number {
    const year = fromDate.getFullYear()
    let nextBlackout = this.getBlackoutPeriod(year)
    
    // If current blackout has passed, get next year's
    if (fromDate > nextBlackout.endDate) {
      nextBlackout = this.getBlackoutPeriod(year + 1)
    }
    
    const timeDiff = nextBlackout.startDate.getTime() - fromDate.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  }

  /**
   * Generates a blackout period report for a given year
   */
  generateBlackoutReport(year: number): string {
    const blackoutPeriod = this.getBlackoutPeriod(year)
    const exceptions = this.getBlackoutExceptions()
    
    let report = `HOLIDAY BLACKOUT PERIOD REPORT - ${year}\n\n`
    report += `Blackout Period: ${blackoutPeriod.startDate.toLocaleDateString('en-ZA')} to ${blackoutPeriod.endDate.toLocaleDateString('en-ZA')}\n`
    report += `Duration: ${Math.ceil((blackoutPeriod.endDate.getTime() - blackoutPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24))} days\n\n`
    
    report += `GENERAL RULE:\n`
    report += `- No ordinary taxation set-downs during blackout period\n`
    report += `- All deadlines automatically adjusted to skip blackout\n`
    report += `- Business days calculation excludes blackout period\n\n`
    
    report += `EXCEPTIONS (with justification required):\n`
    exceptions.forEach(exception => {
      report += `\n${exception.type.toUpperCase()}:\n`
      report += `- ${exception.description}\n`
      exception.criteria.forEach(criterion => {
        report += `  • ${criterion}\n`
      })
      report += `- Justification required: ${exception.requiresJustification ? 'Yes' : 'No'}\n`
    })
    
    return report
  }
}

// Export singleton instance
export const holidayBlackoutEngine = HolidayBlackoutEngine.getInstance()