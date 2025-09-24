'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Calculator, 
  Users, 
  Camera,
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  Settings,
  Bell
} from 'lucide-react'
import { LiveBillBuilder } from '@/components/billing/LiveBillBuilder'
import { OCRIntake } from '@/components/ocr/OCRIntake'
import { OpposingPartyWorkflow } from '@/components/collaboration/OpposingPartyWorkflow'
import { SubscriptionManager } from '@/components/billing/SubscriptionManager'
import BillWizard from '@/components/BillWizard'
import { BillItem } from '@/lib/tariff-engine'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { localStorageService, Matter as LocalMatter, Bill as LocalBill } from '@/lib/localStorage'

interface Matter {
  id: string
  title: string
  courtType: string
  scale: string
  parties: string
  status: 'active' | 'draft' | 'completed'
  billTotal: number
  lastActivity: Date
  itemCount: number
}

export function MainDashboard() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)

  // Load matters from localStorage
  useEffect(() => {
    const loadMatters = async () => {
      try {
        setLoading(true)
        const localMatters = await localStorageService.getMatters(profile?.firm?.id)
        const bills = await localStorageService.getBills()
        
        // Transform localStorage matters to dashboard format
        const transformedMatters: Matter[] = await Promise.all(
          localMatters.map(async (matter) => {
            const matterBills = bills.filter(bill => bill.matter_id === matter.id)
            const billTotal = matterBills.reduce((sum, bill) => sum + bill.total_amount, 0)
            const billItems = await localStorageService.getBillItems()
            const itemCount = billItems.filter(item => 
              matterBills.some(bill => bill.id === item.bill_id)
            ).length
            
            return {
              id: matter.id,
              title: matter.matter_description || `${matter.plaintiff || 'Unknown'} v ${matter.defendant || 'Unknown'}`,
              courtType: matter.court_type_id || 'HC',
              scale: matter.scale,
              parties: `${matter.plaintiff || 'Unknown'} vs ${matter.defendant || 'Unknown'}`,
              status: matter.status as 'active' | 'draft' | 'completed',
              billTotal,
              lastActivity: new Date(matter.updated_at),
              itemCount
            }
          })
        )
        
        setMatters(transformedMatters)
        
        // If no matters exist, create some sample data
        if (transformedMatters.length === 0 && profile?.firm?.id) {
          await createSampleMatters(profile.firm.id)
        }
      } catch (error) {
        console.error('Error loading matters:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.firm?.id) {
      loadMatters()
    }
  }, [profile?.firm?.id])

  const createSampleMatters = async (firmId: string) => {
    try {
      const sampleMatters = [
        {
          firm_id: firmId,
          case_number: 'HC001/2024',
          court_type_id: 'hc',
          scale: 'A',
          plaintiff: 'John Smith',
          defendant: 'Mary Jones',
          matter_description: 'Contract Dispute',
          status: 'active',
          created_by: profile?.id
        },
        {
          firm_id: firmId,
          case_number: 'MC002/2024',
          court_type_id: 'mc',
          scale: 'B',
          plaintiff: 'Alice Brown',
          defendant: 'Bob Green',
          matter_description: 'Property Dispute',
          status: 'draft',
          created_by: profile?.id
        }
      ]

      for (const matterData of sampleMatters) {
        await localStorageService.createMatter(matterData)
      }
      
      // Reload matters after creating samples
      const localMatters = await localStorageService.getMatters(firmId)
      const transformedMatters: Matter[] = localMatters.map(matter => ({
        id: matter.id,
        title: matter.matter_description || `${matter.plaintiff || 'Unknown'} v ${matter.defendant || 'Unknown'}`,
        courtType: matter.court_type_id || 'HC',
        scale: matter.scale,
        parties: `${matter.plaintiff || 'Unknown'} vs ${matter.defendant || 'Unknown'}`,
        status: matter.status as 'active' | 'draft' | 'completed',
        billTotal: 0,
        lastActivity: new Date(matter.updated_at),
        itemCount: 0
      }))
      
      setMatters(transformedMatters)
    } catch (error) {
      console.error('Error creating sample matters:', error)
    }
  }

  const handleItemsAdded = (newItems: BillItem[]) => {
    setBillItems(prev => [...prev, ...newItems])
  }

  const handleObjectionResolved = (objectionId: string, resolution: 'accepted' | 'rejected', response?: string) => {
    console.log('Objection resolved:', { objectionId, resolution, response })
    // In real app, this would update the bill items and recalculate totals
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    totalMatters: matters.length,
    activeMatters: matters.filter(m => m.status === 'active').length,
    totalBilled: matters.reduce((sum, m) => sum + m.billTotal, 0),
    avgBillValue: matters.length > 0 ? matters.reduce((sum, m) => sum + m.billTotal, 0) / matters.length : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">LawBill Pro</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                South African Legal Billing
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || 'User'}</div>
                <div className="text-gray-500">{profile?.email}</div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wizard">Bill Wizard</TabsTrigger>
            <TabsTrigger value="billing">Bill Builder</TabsTrigger>
            <TabsTrigger value="ocr">OCR Intake</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="subscription">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Matters</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMatters}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeMatters} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalBilled)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all matters
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Bill Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.avgBillValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Per matter
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2h</div>
                  <p className="text-xs text-muted-foreground">
                    Last bill update
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Matters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Matters</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Matter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matters.map((matter) => (
                    <div
                      key={matter.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedMatter(matter)
                        setActiveTab('billing')
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{matter.title}</div>
                        <div className="text-sm text-gray-600">{matter.parties}</div>
                        <div className="text-sm text-gray-500">
                          {matter.itemCount} items • Last updated {formatDate(matter.lastActivity)}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(matter.status)}
                        <div className="font-medium">{formatCurrency(matter.billTotal)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('billing')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Start Billing
                  </CardTitle>
                  <CardDescription>
                    Create a new bill or continue working on existing matters
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('ocr')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Scan Documents
                  </CardTitle>
                  <CardDescription>
                    Upload or photograph documents for automatic item extraction
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('collaboration')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaborate
                  </CardTitle>
                  <CardDescription>
                    Invite opposing parties and manage objections
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wizard">
            <BillWizard />
          </TabsContent>

          <TabsContent value="billing">
            <LiveBillBuilder />
          </TabsContent>

          <TabsContent value="ocr">
            {selectedMatter ? (
              <OCRIntake
                matterId={selectedMatter.id}
                courtType={selectedMatter.courtType}
                scale={selectedMatter.scale}
                onItemsAdded={handleItemsAdded}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Matter Selected</h3>
                  <p className="text-gray-500 mb-4">
                    Please select a matter from the overview to use OCR functionality.
                  </p>
                  <Button onClick={() => setActiveTab('overview')}>
                    Go to Overview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collaboration">
            {selectedMatter ? (
              <OpposingPartyWorkflow
                matterId={selectedMatter.id}
                billItems={billItems}
                onObjectionResolved={handleObjectionResolved}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Matter Selected</h3>
                  <p className="text-gray-500 mb-4">
                    Please select a matter from the overview to manage collaboration.
                  </p>
                  <Button onClick={() => setActiveTab('overview')}>
                    Go to Overview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}