/**
 * Professional Ethics Compliance Module for South African Legal Practice
 * Handles fee sharing validation, proper record keeping, and client invoice transparency
 * Based on Legal Practice Act, Attorneys Act, and professional conduct rules
 */

export interface EthicsRule {
  id: string
  category: 'fee-sharing' | 'record-keeping' | 'client-transparency' | 'conflict-of-interest' | 'trust-accounting'
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  legalBasis: string[]
  requirements: string[]
  penalties: string[]
}

export interface FeeArrangement {
  id: string
  clientId: string
  arrangementType: 'hourly' | 'fixed-fee' | 'contingency' | 'retainer' | 'success-fee'
  description: string
  rateStructure: {
    baseRate?: number
    seniorRate?: number
    candidateRate?: number
    contingencyPercentage?: number
    successFeePercentage?: number
    cappedAmount?: number
  }
  isWritten: boolean
  clientConsent: boolean
  dateAgreed: Date
  isCompliant: boolean
  complianceIssues: string[]
}

export interface RecordKeepingRequirement {
  category: 'time-records' | 'financial-records' | 'client-files' | 'trust-records' | 'correspondence'
  description: string
  retentionPeriod: number // years
  format: 'physical' | 'electronic' | 'both'
  accessRequirements: string[]
  backupRequirements: string[]
}

export interface ClientInvoiceCompliance {
  invoiceId: string
  hasDetailedDescription: boolean
  separatesFeesDisbursements: boolean
  showsVATCorrectly: boolean
  includesTrustBalance: boolean
  hasPaymentTerms: boolean
  isInPlainLanguage: boolean
  complianceScore: number
  issues: string[]
  recommendations: string[]
}

export interface TrustAccountTransaction {
  id: string
  date: Date
  clientId: string
  type: 'receipt' | 'payment' | 'transfer' | 'interest'
  amount: number
  description: string
  reference: string
  balance: number
  isReconciled: boolean
  hasVoucher: boolean
}

export interface EthicsViolation {
  id: string
  ruleId: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  evidence: string[]
  recommendedAction: string
  reportingRequired: boolean
  disciplinaryRisk: boolean
}

export interface ComplianceAudit {
  auditId: string
  date: Date
  scope: string[]
  findings: EthicsViolation[]
  overallRating: 'compliant' | 'minor-issues' | 'major-issues' | 'non-compliant'
  actionPlan: string[]
  nextAuditDate: Date
}

class EthicsComplianceEngine {
  private static instance: EthicsComplianceEngine
  
  // Core ethics rules based on Legal Practice Act and professional conduct
  private readonly ETHICS_RULES: EthicsRule[] = [
    {
      id: 'fee-sharing-001',
      category: 'fee-sharing',
      title: 'No Fee Sharing with Non-Practitioners',
      description: 'Legal practitioners may not share fees with persons who are not admitted attorneys',
      severity: 'critical',
      legalBasis: ['Legal Practice Act 28 of 2014', 'Attorneys Act 53 of 1979'],
      requirements: [
        'All fee recipients must be admitted attorneys',
        'Partnership agreements must comply with Act',
        'Referral fees must be to qualified practitioners'
      ],
      penalties: ['Disciplinary action', 'Striking from roll', 'Criminal charges']
    },
    {
      id: 'record-keeping-001',
      category: 'record-keeping',
      title: 'Contemporaneous Time Records',
      description: 'All billable time must be recorded contemporaneously with detailed descriptions',
      severity: 'high',
      legalBasis: ['Legal Practice Act', 'Professional conduct rules'],
      requirements: [
        'Record time as work is performed',
        'Include detailed task descriptions',
        'Maintain for minimum 5 years',
        'Available for client inspection'
      ],
      penalties: ['Professional misconduct', 'Costs disallowed', 'Disciplinary action']
    },
    {
      id: 'client-transparency-001',
      category: 'client-transparency',
      title: 'Clear Fee Disclosure',
      description: 'Clients must be informed of fee structure and basis of charging in writing',
      severity: 'high',
      legalBasis: ['Legal Practice Act', 'Consumer Protection Act'],
      requirements: [
        'Written fee agreement before work commences',
        'Clear explanation of billing method',
        'Estimate of likely costs',
        'Regular cost updates for large matters'
      ],
      penalties: ['Fee reduction', 'Professional misconduct', 'Client complaints']
    },
    {
      id: 'trust-accounting-001',
      category: 'trust-accounting',
      title: 'Trust Account Compliance',
      description: 'Client funds must be held in separate trust accounts with proper records',
      severity: 'critical',
      legalBasis: ['Legal Practice Act', 'Trust Account Rules'],
      requirements: [
        'Separate trust account for client funds',
        'Monthly reconciliations',
        'Detailed transaction records',
        'Annual trust account certificates'
      ],
      penalties: ['Immediate suspension', 'Criminal charges', 'Striking from roll']
    },
    {
      id: 'conflict-interest-001',
      category: 'conflict-of-interest',
      title: 'Conflict of Interest Management',
      description: 'Practitioners must identify and manage conflicts of interest appropriately',
      severity: 'high',
      legalBasis: ['Legal Practice Act', 'Professional conduct rules'],
      requirements: [
        'Conflict checking systems',
        'Client consent for manageable conflicts',
        'Withdrawal where conflicts cannot be managed',
        'Information barriers where appropriate'
      ],
      penalties: ['Professional misconduct', 'Costs orders', 'Disciplinary action']
    }
  ]

  static getInstance(): EthicsComplianceEngine {
    if (!EthicsComplianceEngine.instance) {
      EthicsComplianceEngine.instance = new EthicsComplianceEngine()
    }
    return EthicsComplianceEngine.instance
  }

  /**
   * Validates fee arrangement compliance
   */
  validateFeeArrangement(arrangement: Partial<FeeArrangement>): FeeArrangement {
    const issues: string[] = []
    
    // Check if arrangement is in writing
    if (!arrangement.isWritten) {
      issues.push('Fee arrangement must be in writing')
    }
    
    // Check client consent
    if (!arrangement.clientConsent) {
      issues.push('Client consent to fee arrangement required')
    }
    
    // Validate contingency fees
    if (arrangement.arrangementType === 'contingency') {
      if (!arrangement.rateStructure?.contingencyPercentage) {
        issues.push('Contingency percentage must be specified')
      } else if (arrangement.rateStructure.contingencyPercentage > 25) {
        issues.push('Contingency fee exceeds recommended 25% maximum')
      }
    }
    
    // Validate success fees
    if (arrangement.arrangementType === 'success-fee') {
      if (!arrangement.rateStructure?.successFeePercentage) {
        issues.push('Success fee percentage must be specified')
      }
      if (!arrangement.rateStructure?.cappedAmount) {
        issues.push('Success fee should have a cap to ensure reasonableness')
      }
    }
    
    // Check rate reasonableness
    if (arrangement.rateStructure?.baseRate && arrangement.rateStructure.baseRate > 8000) {
      issues.push('Hourly rate appears excessive - ensure reasonableness')
    }
    
    return {
      id: arrangement.id || this.generateId(),
      clientId: arrangement.clientId || '',
      arrangementType: arrangement.arrangementType || 'hourly',
      description: arrangement.description || '',
      rateStructure: arrangement.rateStructure || {},
      isWritten: arrangement.isWritten || false,
      clientConsent: arrangement.clientConsent || false,
      dateAgreed: arrangement.dateAgreed || new Date(),
      isCompliant: issues.length === 0,
      complianceIssues: issues
    }
  }

  /**
   * Validates client invoice compliance
   */
  validateClientInvoice(invoice: {
    description: string
    lineItems: Array<{
      type: 'fee' | 'disbursement'
      description: string
      amount: number
      vatAmount?: number
    }>
    trustBalance?: number
    paymentTerms?: string
  }): ClientInvoiceCompliance {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check detailed descriptions
    const hasDetailedDescription = invoice.lineItems.every(item => 
      item.description && item.description.length > 10
    )
    if (!hasDetailedDescription) {
      issues.push('Invoice items need more detailed descriptions')
    }
    
    // Check fee/disbursement separation
    const hasFees = invoice.lineItems.some(item => item.type === 'fee')
    const hasDisbursements = invoice.lineItems.some(item => item.type === 'disbursement')
    const separatesFeesDisbursements = hasFees && hasDisbursements ? 
      invoice.lineItems.filter(item => item.type === 'fee').length > 0 &&
      invoice.lineItems.filter(item => item.type === 'disbursement').length > 0 : true
    
    // Check VAT compliance
    const showsVATCorrectly = invoice.lineItems.every(item => {
      if (item.type === 'fee' && item.amount > 0) {
        return item.vatAmount !== undefined
      }
      return true
    })
    if (!showsVATCorrectly) {
      issues.push('VAT must be shown separately for professional fees')
    }
    
    // Check trust balance disclosure
    const includesTrustBalance = invoice.trustBalance !== undefined
    if (!includesTrustBalance) {
      recommendations.push('Consider including trust account balance for transparency')
    }
    
    // Check payment terms
    const hasPaymentTerms = !!invoice.paymentTerms
    if (!hasPaymentTerms) {
      issues.push('Payment terms must be specified')
    }
    
    // Check plain language
    const isInPlainLanguage = this.assessPlainLanguage(invoice.description)
    if (!isInPlainLanguage) {
      recommendations.push('Use plain language that clients can understand')
    }
    
    // Calculate compliance score
    const checks = [
      hasDetailedDescription,
      separatesFeesDisbursements,
      showsVATCorrectly,
      includesTrustBalance,
      hasPaymentTerms,
      isInPlainLanguage
    ]
    const complianceScore = (checks.filter(Boolean).length / checks.length) * 100
    
    return {
      invoiceId: this.generateId(),
      hasDetailedDescription,
      separatesFeesDisbursements,
      showsVATCorrectly,
      includesTrustBalance,
      hasPaymentTerms,
      isInPlainLanguage,
      complianceScore,
      issues,
      recommendations
    }
  }

  /**
   * Validates trust account transaction
   */
  validateTrustTransaction(transaction: Partial<TrustAccountTransaction>): {
    isValid: boolean
    issues: string[]
    requirements: string[]
  } {
    const issues: string[] = []
    const requirements: string[] = []
    
    // Check required fields
    if (!transaction.clientId) {
      issues.push('Client ID is required for trust transactions')
    }
    
    if (!transaction.description || transaction.description.trim().length < 5) {
      issues.push('Detailed description required for trust transaction')
    }
    
    if (!transaction.reference) {
      issues.push('Reference number/document required')
    }
    
    if (!transaction.hasVoucher && transaction.type === 'payment') {
      issues.push('Voucher/receipt required for trust account payments')
    }
    
    // Check reconciliation
    if (!transaction.isReconciled) {
      requirements.push('Transaction must be reconciled monthly')
    }
    
    // Check amount reasonableness
    if (transaction.amount && Math.abs(transaction.amount) > 1000000) {
      requirements.push('Large transactions require additional authorization')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      requirements
    }
  }

  /**
   * Checks for fee sharing violations
   */
  checkFeeSharing(arrangement: {
    recipients: Array<{
      name: string
      isAdmittedAttorney: boolean
      practiceNumber?: string
      percentage: number
    }>
    totalAmount: number
    description: string
  }): {
    isCompliant: boolean
    violations: EthicsViolation[]
    recommendations: string[]
  } {
    const violations: EthicsViolation[] = []
    const recommendations: string[] = []
    
    // Check all recipients are admitted attorneys
    const nonAttorneyRecipients = arrangement.recipients.filter(r => !r.isAdmittedAttorney)
    if (nonAttorneyRecipients.length > 0) {
      violations.push({
        id: this.generateId(),
        ruleId: 'fee-sharing-001',
        severity: 'critical',
        description: `Fee sharing with non-attorneys: ${nonAttorneyRecipients.map(r => r.name).join(', ')}`,
        evidence: [`${nonAttorneyRecipients.length} non-attorney recipients identified`],
        recommendedAction: 'Remove non-attorneys from fee sharing arrangement',
        reportingRequired: true,
        disciplinaryRisk: true
      })
    }
    
    // Check practice numbers for attorneys
    const attorneysWithoutPracticeNumbers = arrangement.recipients.filter(r => 
      r.isAdmittedAttorney && !r.practiceNumber
    )
    if (attorneysWithoutPracticeNumbers.length > 0) {
      recommendations.push('Verify practice numbers for all attorney recipients')
    }
    
    // Check percentage totals
    const totalPercentage = arrangement.recipients.reduce((sum, r) => sum + r.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      violations.push({
        id: this.generateId(),
        ruleId: 'fee-sharing-001',
        severity: 'medium',
        description: `Fee sharing percentages do not total 100% (${totalPercentage}%)`,
        evidence: [`Total percentage: ${totalPercentage}%`],
        recommendedAction: 'Adjust percentages to total exactly 100%',
        reportingRequired: false,
        disciplinaryRisk: false
      })
    }
    
    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Performs comprehensive ethics audit
   */
  performEthicsAudit(practiceData: {
    feeArrangements: FeeArrangement[]
    invoices: any[]
    trustTransactions: TrustAccountTransaction[]
    timeRecords: any[]
  }): ComplianceAudit {
    const findings: EthicsViolation[] = []
    const actionPlan: string[] = []
    
    // Audit fee arrangements
    const nonCompliantFees = practiceData.feeArrangements.filter(f => !f.isCompliant)
    if (nonCompliantFees.length > 0) {
      findings.push({
        id: this.generateId(),
        ruleId: 'client-transparency-001',
        severity: 'high',
        description: `${nonCompliantFees.length} non-compliant fee arrangements`,
        evidence: nonCompliantFees.map(f => f.complianceIssues.join('; ')),
        recommendedAction: 'Review and update fee arrangements',
        reportingRequired: false,
        disciplinaryRisk: true
      })
      actionPlan.push('Update all fee arrangements to ensure compliance')
    }
    
    // Audit trust account transactions
    const unreconciledTransactions = practiceData.trustTransactions.filter(t => !t.isReconciled)
    if (unreconciledTransactions.length > 0) {
      findings.push({
        id: this.generateId(),
        ruleId: 'trust-accounting-001',
        severity: 'critical',
        description: `${unreconciledTransactions.length} unreconciled trust transactions`,
        evidence: [`Unreconciled amount: R${unreconciledTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`],
        recommendedAction: 'Immediately reconcile all trust account transactions',
        reportingRequired: true,
        disciplinaryRisk: true
      })
      actionPlan.push('Implement monthly trust account reconciliation process')
    }
    
    // Audit time records
    const oldTimeRecords = practiceData.timeRecords.filter(r => {
      const recordDate = new Date(r.date)
      const daysSince = (Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 7 && !r.description
    })
    
    if (oldTimeRecords.length > 0) {
      findings.push({
        id: this.generateId(),
        ruleId: 'record-keeping-001',
        severity: 'medium',
        description: `${oldTimeRecords.length} time records lack contemporaneous descriptions`,
        evidence: ['Time records completed more than 7 days after work performed'],
        recommendedAction: 'Implement daily time recording discipline',
        reportingRequired: false,
        disciplinaryRisk: false
      })
      actionPlan.push('Train staff on contemporaneous time recording requirements')
    }
    
    // Determine overall rating
    const criticalFindings = findings.filter(f => f.severity === 'critical').length
    const highFindings = findings.filter(f => f.severity === 'high').length
    
    let overallRating: 'compliant' | 'minor-issues' | 'major-issues' | 'non-compliant'
    if (criticalFindings > 0) {
      overallRating = 'non-compliant'
    } else if (highFindings > 2) {
      overallRating = 'major-issues'
    } else if (findings.length > 0) {
      overallRating = 'minor-issues'
    } else {
      overallRating = 'compliant'
    }
    
    // Set next audit date
    const nextAuditDate = new Date()
    nextAuditDate.setMonth(nextAuditDate.getMonth() + (overallRating === 'compliant' ? 12 : 6))
    
    return {
      auditId: this.generateId(),
      date: new Date(),
      scope: ['fee-arrangements', 'trust-accounting', 'time-records', 'client-invoicing'],
      findings,
      overallRating,
      actionPlan,
      nextAuditDate
    }
  }

  /**
   * Generates ethics compliance report
   */
  generateComplianceReport(audit: ComplianceAudit): string {
    let report = `PROFESSIONAL ETHICS COMPLIANCE REPORT\n`
    report += `Audit Date: ${audit.date.toLocaleDateString('en-ZA')}\n`
    report += `Audit ID: ${audit.auditId}\n`
    report += `Overall Rating: ${audit.overallRating.toUpperCase()}\n\n`
    
    report += `SCOPE OF AUDIT:\n`
    audit.scope.forEach(scope => {
      report += `- ${scope.replace('-', ' ').toUpperCase()}\n`
    })
    report += `\n`
    
    if (audit.findings.length > 0) {
      report += `FINDINGS:\n`
      audit.findings.forEach((finding, index) => {
        report += `\n${index + 1}. ${finding.description}\n`
        report += `   Severity: ${finding.severity.toUpperCase()}\n`
        report += `   Rule: ${finding.ruleId}\n`
        report += `   Evidence: ${finding.evidence.join('; ')}\n`
        report += `   Action Required: ${finding.recommendedAction}\n`
        if (finding.disciplinaryRisk) {
          report += `   ⚠️  DISCIPLINARY RISK IDENTIFIED\n`
        }
        if (finding.reportingRequired) {
          report += `   📋 REPORTING TO REGULATORY BODY REQUIRED\n`
        }
      })
    } else {
      report += `FINDINGS: No compliance issues identified\n`
    }
    
    if (audit.actionPlan.length > 0) {
      report += `\nACTION PLAN:\n`
      audit.actionPlan.forEach((action, index) => {
        report += `${index + 1}. ${action}\n`
      })
    }
    
    report += `\nNEXT AUDIT: ${audit.nextAuditDate.toLocaleDateString('en-ZA')}\n`
    
    // Add regulatory references
    report += `\nREGULATORY FRAMEWORK:\n`
    this.ETHICS_RULES.forEach(rule => {
      report += `- ${rule.title}: ${rule.legalBasis.join(', ')}\n`
    })
    
    return report
  }

  /**
   * Gets all ethics rules
   */
  getEthicsRules(): EthicsRule[] {
    return [...this.ETHICS_RULES]
  }

  /**
   * Gets record keeping requirements
   */
  getRecordKeepingRequirements(): RecordKeepingRequirement[] {
    return [
      {
        category: 'time-records',
        description: 'Detailed time records for all billable work',
        retentionPeriod: 5,
        format: 'both',
        accessRequirements: ['Client inspection rights', 'Taxation officer access'],
        backupRequirements: ['Daily backups', 'Offsite storage', 'Recovery testing']
      },
      {
        category: 'financial-records',
        description: 'All financial transactions and accounting records',
        retentionPeriod: 5,
        format: 'both',
        accessRequirements: ['SARS inspection', 'Client access', 'Auditor access'],
        backupRequirements: ['Monthly backups', 'Secure storage', 'Audit trail']
      },
      {
        category: 'client-files',
        description: 'Complete client matter files and correspondence',
        retentionPeriod: 20,
        format: 'both',
        accessRequirements: ['Client access', 'Court orders', 'Regulatory inspection'],
        backupRequirements: ['Regular backups', 'Long-term preservation', 'Migration planning']
      },
      {
        category: 'trust-records',
        description: 'Trust account records and reconciliations',
        retentionPeriod: 5,
        format: 'both',
        accessRequirements: ['Regulatory inspection', 'Annual certificates', 'Client statements'],
        backupRequirements: ['Daily backups', 'Immediate recovery', 'Audit compliance']
      }
    ]
  }

  // Helper methods

  private assessPlainLanguage(text: string): boolean {
    // Simple heuristics for plain language assessment
    const words = text.split(/\s+/)
    const longWords = words.filter(word => word.length > 12).length
    const longWordRatio = longWords / words.length
    
    // Check for legal jargon
    const legalJargon = [
      'hereinafter', 'whereas', 'aforementioned', 'heretofore',
      'notwithstanding', 'pursuant', 'inter alia', 'prima facie'
    ]
    const jargonCount = legalJargon.filter(jargon => 
      text.toLowerCase().includes(jargon)
    ).length
    
    return longWordRatio < 0.2 && jargonCount === 0
  }

  private generateId(): string {
    return `ethics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const ethicsComplianceEngine = EthicsComplianceEngine.getInstance()