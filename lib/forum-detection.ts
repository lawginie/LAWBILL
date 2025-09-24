// Forum Detection System for South African Courts
// Determines appropriate court jurisdiction based on claim value and case type

export interface ForumDetectionResult {
  courtType: 'MC' | 'HC' | 'SCA' | 'CC'
  courtName: string
  scale: 'A' | 'B'
  jurisdiction: 'District' | 'Regional' | 'High Court' | 'Appeal'
  claimValueRange: string
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
  warnings?: string[]
}

export interface CaseDetails {
  claimValue?: number
  caseType: 'civil' | 'criminal' | 'appeal' | 'application' | 'review'
  isUrgent?: boolean
  hasConstitutionalIssue?: boolean
  isAppealFromHighCourt?: boolean
  isAppealFromMagistrates?: boolean
  specialJurisdiction?: 'family' | 'labour' | 'commercial' | 'tax'
}

// Magistrates' Court jurisdiction limits (2024)
const DISTRICT_COURT_LIMIT = 400000 // R400,000
const REGIONAL_COURT_LIMIT = 800000 // R800,000

/**
 * Detects the appropriate forum based on case details
 * Follows Magistrates' Courts Act and Superior Courts Act provisions
 */
export function detectForum(caseDetails: CaseDetails): ForumDetectionResult {
  const warnings: string[] = []
  
  // Handle appeals first
  if (caseDetails.caseType === 'appeal') {
    if (caseDetails.isAppealFromHighCourt) {
      return {
        courtType: 'SCA',
        courtName: 'Supreme Court of Appeal',
        scale: 'A',
        jurisdiction: 'Appeal',
        claimValueRange: 'No monetary limit',
        reasoning: 'Appeal from High Court goes to SCA',
        confidence: 'high'
      }
    }
    
    if (caseDetails.isAppealFromMagistrates) {
      return {
        courtType: 'HC',
        courtName: 'High Court',
        scale: 'A',
        jurisdiction: 'High Court',
        claimValueRange: 'No monetary limit on appeal',
        reasoning: 'Appeal from Magistrates Court goes to High Court',
        confidence: 'high'
      }
    }
  }
  
  // Handle constitutional issues
  if (caseDetails.hasConstitutionalIssue) {
    warnings.push('Constitutional issues may require High Court or Constitutional Court jurisdiction')
  }
  
  // Handle special jurisdictions
  if (caseDetails.specialJurisdiction) {
    switch (caseDetails.specialJurisdiction) {
      case 'labour':
        warnings.push('Labour matters may fall under Labour Court jurisdiction')
        break
      case 'tax':
        warnings.push('Tax matters may require Tax Court or High Court')
        break
      case 'commercial':
        if (caseDetails.claimValue && caseDetails.claimValue > 1000000) {
          warnings.push('High-value commercial matters often heard in High Court')
        }
        break
    }
  }
  
  // Determine forum based on claim value
  if (!caseDetails.claimValue) {
    // No claim value specified - default to Regional Court
    return {
      courtType: 'MC',
      courtName: "Regional Magistrates' Court",
      scale: 'A',
      jurisdiction: 'Regional',
      claimValueRange: 'Up to R800,000',
      reasoning: 'No claim value specified - defaulting to Regional Court',
      confidence: 'low',
      warnings: [...warnings, 'Claim value not specified - forum detection may be inaccurate']
    }
  }
  
  const claimValue = caseDetails.claimValue
  
  // District Magistrates' Court (up to R400,000)
  if (claimValue <= DISTRICT_COURT_LIMIT) {
    return {
      courtType: 'MC',
      courtName: "District Magistrates' Court",
      scale: 'A',
      jurisdiction: 'District',
      claimValueRange: 'Up to R400,000',
      reasoning: `Claim value of R${claimValue.toLocaleString()} falls within District Court jurisdiction`,
      confidence: 'high',
      warnings
    }
  }
  
  // Regional Magistrates' Court (R400,001 to R800,000)
  if (claimValue <= REGIONAL_COURT_LIMIT) {
    return {
      courtType: 'MC',
      courtName: "Regional Magistrates' Court",
      scale: 'A',
      jurisdiction: 'Regional',
      claimValueRange: 'R400,001 to R800,000',
      reasoning: `Claim value of R${claimValue.toLocaleString()} falls within Regional Court jurisdiction`,
      confidence: 'high',
      warnings
    }
  }
  
  // High Court (above R800,000 or special circumstances)
  return {
    courtType: 'HC',
    courtName: 'High Court',
    scale: 'A',
    jurisdiction: 'High Court',
    claimValueRange: 'Above R800,000',
    reasoning: `Claim value of R${claimValue.toLocaleString()} exceeds Regional Court jurisdiction`,
    confidence: 'high',
    warnings
  }
}

/**
 * Determines the appropriate scale (A or B) based on case complexity and value
 */
export function determineScale(forum: ForumDetectionResult, caseDetails: CaseDetails): 'A' | 'B' {
  // Scale B typically applies to more complex or higher-value matters
  if (caseDetails.claimValue && caseDetails.claimValue > 2000000) {
    return 'B'
  }
  
  if (caseDetails.caseType === 'appeal' || caseDetails.hasConstitutionalIssue) {
    return 'B'
  }
  
  if (caseDetails.specialJurisdiction === 'commercial' && caseDetails.claimValue && caseDetails.claimValue > 1000000) {
    return 'B'
  }
  
  return 'A'
}

/**
 * Gets jurisdiction limits for display purposes
 */
export function getJurisdictionLimits() {
  return {
    district: {
      name: 'District Magistrates\' Court',
      limit: DISTRICT_COURT_LIMIT,
      description: 'Civil claims up to R400,000'
    },
    regional: {
      name: 'Regional Magistrates\' Court',
      limit: REGIONAL_COURT_LIMIT,
      description: 'Civil claims from R400,001 to R800,000'
    },
    highCourt: {
      name: 'High Court',
      limit: null,
      description: 'Civil claims above R800,000 and special matters'
    }
  }
}

/**
 * Validates if the detected forum is appropriate for the case type
 */
export function validateForumSelection(forum: ForumDetectionResult, caseDetails: CaseDetails): {
  isValid: boolean
  errors: string[]
  suggestions: string[]
} {
  const errors: string[] = []
  const suggestions: string[] = []
  
  // Check for obvious mismatches
  if (caseDetails.caseType === 'criminal' && forum.courtType !== 'MC') {
    errors.push('Criminal matters are typically heard in Magistrates\' Courts')
  }
  
  if (caseDetails.hasConstitutionalIssue && forum.courtType === 'MC') {
    suggestions.push('Constitutional issues may require High Court jurisdiction')
  }
  
  if (caseDetails.isUrgent && forum.courtType === 'MC') {
    suggestions.push('Urgent matters may be better suited to High Court for faster resolution')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  }
}

/**
 * Gets the appropriate tariff table for the detected forum
 */
export function getTariffTableKey(forum: ForumDetectionResult): string {
  return `${forum.courtType}_${forum.scale}`
}