// South African Court Tariffs (2024/2025)
// Based on LSSA Legal Costs Guide and official court schedules

export interface TariffItem {
  itemNumber: string
  label: string
  description: string
  rate: number
  unit: string
  minimumUnits?: number
  maximumUnits?: number
  capAmount?: number
  vatApplicable: boolean
  category: 'fees' | 'disbursements' | 'counsel'
  subcategory?: string
}

export interface CourtTariff {
  courtType: string
  courtCode: string
  scale: string
  effectiveFrom: string
  effectiveTo?: string
  items: TariffItem[]
}

// Magistrates' Court Tariffs (September 2024)
export const magistratesCourtTariffs: CourtTariff[] = [
  {
    courtType: "Magistrates' Court",
    courtCode: "MC",
    scale: "A",
    effectiveFrom: "2024-09-01",
    items: [
      // Preparation and Perusal
      {
        itemNumber: "1.1",
        label: "Perusal of documents",
        description: "Reading and examining documents, correspondence, pleadings",
        rate: 285.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.2", 
        label: "Drafting of documents",
        description: "Preparation of pleadings, correspondence, affidavits",
        rate: 570.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.3",
        label: "Attendance at consultations",
        description: "Meetings with clients, witnesses, experts",
        rate: 2280.00,
        unit: "per hour",
        minimumUnits: 0.25,
        vatApplicable: true,
        category: "fees",
        subcategory: "attendance"
      },
      {
        itemNumber: "1.4",
        label: "Telephone consultations",
        description: "Telephone calls with clients, opponents, court officials",
        rate: 1140.00,
        unit: "per hour",
        minimumUnits: 0.1,
        vatApplicable: true,
        category: "fees",
        subcategory: "attendance"
      },
      // Court Attendances
      {
        itemNumber: "2.1",
        label: "Court attendance - unopposed matters",
        description: "Attendance at court for unopposed applications",
        rate: 1710.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.2",
        label: "Court attendance - opposed matters",
        description: "Attendance at court for opposed matters, trials",
        rate: 2280.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.3",
        label: "Waiting time at court",
        description: "Time spent waiting at court when matter is postponed",
        rate: 1140.00,
        unit: "per hour",
        minimumUnits: 0.5,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      // Travel
      {
        itemNumber: "3.1",
        label: "Travel time",
        description: "Time spent travelling to court, consultations",
        rate: 1140.00,
        unit: "per hour",
        vatApplicable: true,
        category: "fees",
        subcategory: "travel"
      },
      {
        itemNumber: "3.2",
        label: "Travel expenses",
        description: "Actual travel costs, mileage allowance",
        rate: 4.50,
        unit: "per km",
        vatApplicable: true,
        category: "disbursements",
        subcategory: "travel"
      },
      // Disbursements
      {
        itemNumber: "4.1",
        label: "Court filing fees",
        description: "Official court fees for filing documents",
        rate: 0,
        unit: "actual cost",
        vatApplicable: false,
        category: "disbursements",
        subcategory: "court_fees"
      },
      {
        itemNumber: "4.2",
        label: "Sheriff's fees",
        description: "Service of court documents by sheriff",
        rate: 0,
        unit: "actual cost",
        vatApplicable: false,
        category: "disbursements",
        subcategory: "service"
      },
      {
        itemNumber: "4.3",
        label: "Photocopying",
        description: "Copying of documents, court papers",
        rate: 2.50,
        unit: "per page",
        vatApplicable: true,
        category: "disbursements",
        subcategory: "admin"
      },
      {
        itemNumber: "4.4",
        label: "Telephone calls",
        description: "Long distance calls, international calls",
        rate: 0,
        unit: "actual cost",
        vatApplicable: true,
        category: "disbursements",
        subcategory: "communication"
      }
    ]
  },
  {
    courtType: "Magistrates' Court",
    courtCode: "MC", 
    scale: "B",
    effectiveFrom: "2024-09-01",
    items: [
      // Scale B rates (higher for complex matters)
      {
        itemNumber: "1.1",
        label: "Perusal of documents",
        description: "Reading and examining documents, correspondence, pleadings",
        rate: 380.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.2",
        label: "Drafting of documents", 
        description: "Preparation of pleadings, correspondence, affidavits",
        rate: 760.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.3",
        label: "Attendance at consultations",
        description: "Meetings with clients, witnesses, experts",
        rate: 3040.00,
        unit: "per hour",
        minimumUnits: 0.25,
        vatApplicable: true,
        category: "fees",
        subcategory: "attendance"
      },
      {
        itemNumber: "2.1",
        label: "Court attendance - unopposed matters",
        description: "Attendance at court for unopposed applications",
        rate: 2280.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.2",
        label: "Court attendance - opposed matters",
        description: "Attendance at court for opposed matters, trials",
        rate: 3040.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      }
    ]
  }
]

// High Court Tariffs
export const highCourtTariffs: CourtTariff[] = [
  {
    courtType: "High Court",
    courtCode: "HC",
    scale: "A",
    effectiveFrom: "2024-09-01",
    items: [
      {
        itemNumber: "1.1",
        label: "Perusal of documents",
        description: "Reading and examining documents, correspondence, pleadings",
        rate: 380.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.2",
        label: "Drafting of documents",
        description: "Preparation of pleadings, correspondence, affidavits",
        rate: 760.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.3",
        label: "Attendance at consultations",
        description: "Meetings with clients, witnesses, experts",
        rate: 3040.00,
        unit: "per hour",
        minimumUnits: 0.25,
        vatApplicable: true,
        category: "fees",
        subcategory: "attendance"
      },
      {
        itemNumber: "2.1",
        label: "Court attendance - applications",
        description: "Attendance at court for applications, case management",
        rate: 3800.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.2",
        label: "Court attendance - trials",
        description: "Attendance at court for trials, hearings",
        rate: 4560.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.3",
        label: "Day fees",
        description: "Full day attendance at court proceedings",
        rate: 22800.00,
        unit: "per day",
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      }
    ]
  },
  {
    courtType: "High Court",
    courtCode: "HC",
    scale: "B",
    effectiveFrom: "2024-09-01", 
    items: [
      {
        itemNumber: "1.1",
        label: "Perusal of documents",
        description: "Reading and examining documents, correspondence, pleadings",
        rate: 570.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.2",
        label: "Drafting of documents",
        description: "Preparation of pleadings, correspondence, affidavits",
        rate: 1140.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "2.1",
        label: "Court attendance - applications",
        description: "Attendance at court for applications, case management",
        rate: 5700.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      },
      {
        itemNumber: "2.2",
        label: "Court attendance - trials",
        description: "Attendance at court for trials, hearings",
        rate: 6840.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      }
    ]
  }
]

// Supreme Court of Appeal Tariffs
export const scaTariffs: CourtTariff[] = [
  {
    courtType: "Supreme Court of Appeal",
    courtCode: "SCA",
    scale: "A",
    effectiveFrom: "2024-09-01",
    items: [
      {
        itemNumber: "1.1",
        label: "Perusal of documents",
        description: "Reading and examining documents, correspondence, pleadings",
        rate: 570.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "1.2",
        label: "Drafting of documents",
        description: "Preparation of pleadings, correspondence, affidavits",
        rate: 1140.00,
        unit: "per page",
        vatApplicable: true,
        category: "fees",
        subcategory: "preparation"
      },
      {
        itemNumber: "2.1",
        label: "Court attendance",
        description: "Attendance at SCA hearings",
        rate: 9120.00,
        unit: "per hour",
        minimumUnits: 1,
        vatApplicable: true,
        category: "fees",
        subcategory: "court"
      }
    ]
  }
]

// Counsel fees (separate from attorney fees)
export const counselFees: TariffItem[] = [
  {
    itemNumber: "C1",
    label: "Junior Counsel - Opinion",
    description: "Written legal opinion by junior counsel",
    rate: 5000.00,
    unit: "per opinion",
    vatApplicable: false, // Counsel fees may be VAT exempt
    category: "counsel",
    subcategory: "opinion"
  },
  {
    itemNumber: "C2",
    label: "Senior Counsel - Opinion", 
    description: "Written legal opinion by senior counsel",
    rate: 12000.00,
    unit: "per opinion",
    vatApplicable: false,
    category: "counsel",
    subcategory: "opinion"
  },
  {
    itemNumber: "C3",
    label: "Junior Counsel - Court appearance",
    description: "Court appearance by junior counsel",
    rate: 8000.00,
    unit: "per day",
    vatApplicable: false,
    category: "counsel",
    subcategory: "appearance"
  },
  {
    itemNumber: "C4",
    label: "Senior Counsel - Court appearance",
    description: "Court appearance by senior counsel", 
    rate: 20000.00,
    unit: "per day",
    vatApplicable: false,
    category: "counsel",
    subcategory: "appearance"
  }
]

// All tariffs combined
export const allTariffs = [
  ...magistratesCourtTariffs,
  ...highCourtTariffs,
  ...scaTariffs
]

// Court types
export const courtTypes = [
  { code: "MC", name: "Magistrates' Court", description: "Regional and District Magistrates' Courts" },
  { code: "HC", name: "High Court", description: "Provincial and Local Divisions of the High Court" },
  { code: "SCA", name: "Supreme Court of Appeal", description: "Supreme Court of Appeal" },
  { code: "CC", name: "Constitutional Court", description: "Constitutional Court of South Africa" }
]

// VAT rate for South Africa
export const VAT_RATE = 0.15 // 15%

// Rounding options
export const ROUNDING_OPTIONS = [
  { value: 6, label: "6 minutes (0.1 hour)" },
  { value: 15, label: "15 minutes (0.25 hour)" },
  { value: 30, label: "30 minutes (0.5 hour)" }
]