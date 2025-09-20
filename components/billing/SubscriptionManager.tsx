'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Crown, 
  Zap, 
  Building, 
  Check, 
  X,
  AlertTriangle,
  DollarSign,
  FileText,
  Users,
  Camera,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingPeriod: 'monthly' | 'yearly'
  features: string[]
  limits: {
    matters: number
    users: number
    ocrPages: number
    storage: string
  }
  popular?: boolean
}

interface MatterCharge {
  id: string
  matterId: string
  matterTitle: string
  chargeType: 'flat' | 'percentage'
  amount: number
  billTotal: number
  status: 'pending' | 'paid' | 'failed'
  createdAt: Date
  paidAt?: Date
}

interface Invoice {
  id: string
  firmId: string
  amount: number
  description: string
  status: 'pending' | 'paid' | 'overdue'
  dueDate: Date
  createdAt: Date
  paidAt?: Date
  lineItems: {
    description: string
    amount: number
    type: 'subscription' | 'matter_fee' | 'addon'
  }[]
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    description: 'Perfect for trying out the platform',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      '2 active matters',
      '1 user account',
      '10 OCR pages/month',
      'Basic templates',
      'Email support'
    ],
    limits: {
      matters: 2,
      users: 1,
      ocrPages: 10,
      storage: '100MB'
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small practices',
    price: 299,
    billingPeriod: 'monthly',
    features: [
      '10 active matters',
      '3 user accounts',
      '100 OCR pages/month',
      'All templates',
      'Priority email support',
      'Basic analytics'
    ],
    limits: {
      matters: 10,
      users: 3,
      ocrPages: 100,
      storage: '1GB'
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For growing practices',
    price: 599,
    billingPeriod: 'monthly',
    popular: true,
    features: [
      '50 active matters',
      '10 user accounts',
      '500 OCR pages/month',
      'Premium templates',
      'Phone & email support',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    limits: {
      matters: 50,
      users: 10,
      ocrPages: 500,
      storage: '10GB'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large firms',
    price: 1299,
    billingPeriod: 'monthly',
    features: [
      'Unlimited matters',
      'Unlimited users',
      'Unlimited OCR pages',
      'Custom templates',
      'Dedicated support',
      'Advanced analytics',
      'White-label solution',
      'Custom integrations',
      'SLA guarantee'
    ],
    limits: {
      matters: -1, // Unlimited
      users: -1,
      ocrPages: -1,
      storage: 'Unlimited'
    }
  }
]

export function SubscriptionManager() {
  const { profile } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(subscriptionPlans[0])
  const [matterCharges, setMatterCharges] = useState<MatterCharge[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState({
    matters: 3,
    users: 2,
    ocrPages: 45,
    storage: '250MB'
  })

  // Mock data
  useEffect(() => {
    setCurrentPlan(subscriptionPlans[1]) // Starter plan
    
    setMatterCharges([
      {
        id: 'charge-1',
        matterId: 'matter-1',
        matterTitle: 'Smith v Jones - Contract Dispute',
        chargeType: 'flat',
        amount: 50,
        billTotal: 15750.00,
        status: 'paid',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'charge-2',
        matterId: 'matter-2',
        matterTitle: 'Brown v Green - Property Dispute',
        chargeType: 'percentage',
        amount: 236.25, // 1.5% of R15,750
        billTotal: 15750.00,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ])

    setInvoices([
      {
        id: 'inv-1',
        firmId: 'firm-1',
        amount: 349,
        description: 'Monthly subscription and matter fees',
        status: 'paid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        lineItems: [
          { description: 'Starter Plan - Monthly', amount: 299, type: 'subscription' },
          { description: 'Matter Fee - Smith v Jones', amount: 50, type: 'matter_fee' }
        ]
      },
      {
        id: 'inv-2',
        firmId: 'firm-1',
        amount: 535.25,
        description: 'Monthly subscription and matter fees',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lineItems: [
          { description: 'Starter Plan - Monthly', amount: 299, type: 'subscription' },
          { description: 'Matter Fee - Brown v Green (1.5%)', amount: 236.25, type: 'matter_fee' }
        ]
      }
    ])
  }, [])

  const upgradePlan = (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId)
    if (plan) {
      setCurrentPlan(plan)
      // In real app, this would trigger payment flow
      alert(`Upgrading to ${plan.name} plan. Payment flow would be triggered here.`)
    }
  }

  const payInvoice = (invoiceId: string) => {
    setInvoices(prev => 
      prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'paid' as const, paidAt: new Date() }
          : inv
      )
    )
    alert('Payment processed successfully!')
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100'
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap className="h-5 w-5" />
      case 'starter': return <FileText className="h-5 w-5" />
      case 'pro': return <Crown className="h-5 w-5" />
      case 'enterprise': return <Building className="h-5 w-5" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription & Billing
          </CardTitle>
          <CardDescription>
            Manage your subscription plan and billing preferences
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="plans">Upgrade</TabsTrigger>
          <TabsTrigger value="charges">Matter Fees</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlanIcon(currentPlan.id)}
                  <CardTitle>{currentPlan.name}</CardTitle>
                  {currentPlan.popular && (
                    <Badge variant="default">Popular</Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(currentPlan.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {currentPlan.billingPeriod}
                  </div>
                </div>
              </div>
              <CardDescription>{currentPlan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usage */}
              <div>
                <h4 className="font-medium mb-3">Current Usage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Matters</span>
                      <span>
                        {usage.matters} / {currentPlan.limits.matters === -1 ? '∞' : currentPlan.limits.matters}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.matters, currentPlan.limits.matters))}`}
                        style={{ width: `${getUsagePercentage(usage.matters, currentPlan.limits.matters)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Users</span>
                      <span>
                        {usage.users} / {currentPlan.limits.users === -1 ? '∞' : currentPlan.limits.users}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.users, currentPlan.limits.users))}`}
                        style={{ width: `${getUsagePercentage(usage.users, currentPlan.limits.users)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>OCR Pages</span>
                      <span>
                        {usage.ocrPages} / {currentPlan.limits.ocrPages === -1 ? '∞' : currentPlan.limits.ocrPages}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.ocrPages, currentPlan.limits.ocrPages))}`}
                        style={{ width: `${getUsagePercentage(usage.ocrPages, currentPlan.limits.ocrPages)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage</span>
                      <span>{usage.storage} / {currentPlan.limits.storage}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-green-100 text-green-600" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Notice */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <strong>Billing Model:</strong> Your subscription covers platform access. 
              Per-matter fees (R50 flat or 1-3% of bill value) apply when you first export a bill. 
              These are clearly marked as software fees, not fee-sharing arrangements.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-blue-600">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {plan.billingPeriod}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant={plan.id === currentPlan.id ? 'outline' : 'default'}
                    disabled={plan.id === currentPlan.id}
                    onClick={() => upgradePlan(plan.id)}
                  >
                    {plan.id === currentPlan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Per-Matter Fees</CardTitle>
              <CardDescription>
                Fees charged when you first export a bill for each matter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matterCharges.length > 0 ? (
                <div className="space-y-3">
                  {matterCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{charge.matterTitle}</div>
                        <div className="text-sm text-gray-600">
                          Bill Total: {formatCurrency(charge.billTotal)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(charge.createdAt)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">
                          {formatCurrency(charge.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {charge.chargeType === 'flat' ? 'Flat Fee' : `${((charge.amount / charge.billTotal) * 100).toFixed(1)}%`}
                        </div>
                        <Badge 
                          variant={charge.status === 'paid' ? 'default' : 'secondary'}
                          className={charge.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {charge.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No matter fees yet</p>
                  <p className="text-sm">Fees will appear when you export your first bill</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice #{invoice.id.slice(-6).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {invoice.description} • Due {formatDate(invoice.dueDate)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                      className={
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        invoice.status === 'overdue' ? '' : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Line Items */}
                <div className="space-y-2">
                  {invoice.lineItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created {formatDate(invoice.createdAt)}
                    {invoice.paidAt && ` • Paid ${formatDate(invoice.paidAt)}`}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button size="sm" onClick={() => payInvoice(invoice.id)}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}