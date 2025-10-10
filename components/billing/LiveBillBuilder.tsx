'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Users, 
  Car,
  Search,
  Zap,
  DollarSign
} from 'lucide-react'
import { tariffEngine, BillItem, BillCalculation } from '@/lib/tariff-engine'
import { courtTypes } from '@/data/sa-tariffs'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { localStorageService, Bill } from '@/lib/localStorage'
import { DictationInput } from '@/components/dictation/DictationButton'

interface Matter {
  id: string
  title: string
  courtType: string
  scale: string
  parties: string
}

export function LiveBillBuilder() {
  const { profile } = useAuth()
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [calculation, setCalculation] = useState<BillCalculation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(true)
  const [currentBill, setCurrentBill] = useState<Bill | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state for adding new items
  const [newItem, setNewItem] = useState({
    itemNumber: '',
    description: '',
    units: 1,
    customRate: 0,
    useCustomRate: false
  })

  // Mock matter for demo
  useEffect(() => {
    setSelectedMatter({
      id: 'matter-1',
      title: 'Smith v Jones - Contract Dispute',
      courtType: 'HC',
      scale: 'A',
      parties: 'John Smith vs Mary Jones'
    })
  }, [])

  // Define functions before they are used
  const createNewBill = useCallback(async (matterId: string) => {
    try {
      const newBill = await localStorageService.createBill({
        matter_id: matterId,
        bill_number: `BILL-${Date.now()}`,
        status: 'draft',
        subtotal_fees: 0,
        subtotal_disbursements: 0,
        subtotal_counsel: 0,
        vat_amount: 0,
        total_amount: 0,
        created_by: profile?.id
      })
      setCurrentBill(newBill)
      setBillItems([])
    } catch (error) {
      console.error('Error creating new bill:', error)
    }
  }, [profile?.id])

  const loadExistingBill = useCallback(async (matterId: string) => {
    try {
      const bills = await localStorageService.getBills(matterId)
      const activeBill = bills.find(bill => bill.status === 'draft') || bills[0]
      
      if (activeBill) {
        setCurrentBill(activeBill)
        const items = await localStorageService.getBillItems(activeBill.id)
        
        // Transform localStorage bill items to BillItem format
        const transformedItems: BillItem[] = items.map(item => ({
          id: item.id,
          tariffItemId: item.tariff_item_id || 'CUSTOM',
          description: item.description,
          units: item.units,
          rateApplied: item.rate_applied,
          amountExVat: item.amount_ex_vat,
          vat: item.vat_amount,
          totalAmount: item.total_amount,
          source: item.source || 'manual',
          createdBy: item.created_by || profile?.id || 'user',
          createdAt: new Date(item.created_at)
        }))
        
        setBillItems(transformedItems)
      } else {
        // Create new bill for this matter
        await createNewBill(matterId)
      }
    } catch (error) {
      console.error('Error loading existing bill:', error)
      await createNewBill(matterId)
    }
  }, [profile?.id, createNewBill])

  const saveBillToStorage = useCallback(async (calculation: BillCalculation) => {
    if (!currentBill || saving) return
    
    try {
      setSaving(true)
      
      // Update bill totals
      await localStorageService.updateBill(currentBill.id, {
        subtotal_fees: calculation.subtotalFees,
        subtotal_disbursements: calculation.subtotalDisbursements,
        subtotal_counsel: calculation.subtotalCounsel,
        vat_amount: calculation.totalVat,
        total_amount: calculation.grandTotal
      })
      
      // Save bill items
      const existingItems = await localStorageService.getBillItems(currentBill.id)
      
      // Remove items that are no longer in the current list
      for (const existingItem of existingItems) {
        if (!billItems.find(item => item.id === existingItem.id)) {
          await localStorageService.deleteBillItem(existingItem.id)
        }
      }
      
      // Add or update current items
      for (const item of billItems) {
        const existingItem = existingItems.find(existing => existing.id === item.id)
        
        if (existingItem) {
          // Update existing item
          await localStorageService.updateBillItem(item.id, {
            description: item.description,
            units: item.units,
            rate_applied: item.rateApplied,
            amount_ex_vat: item.amountExVat,
            vat_amount: item.vat,
            total_amount: item.totalAmount
          })
        } else {
          // Create new item
          await localStorageService.createBillItem({
            bill_id: currentBill.id,
            tariff_item_id: item.tariffItemId === 'CUSTOM' ? undefined : item.tariffItemId,
            description: item.description,
            units: item.units,
            rate_applied: item.rateApplied,
            amount_ex_vat: item.amountExVat,
            vat_amount: item.vat,
            total_amount: item.totalAmount,
            source: item.source,
            created_by: item.createdBy
          })
        }
      }
    } catch (error) {
      console.error('Error saving bill to storage:', error)
    } finally {
      setSaving(false)
    }
  }, [currentBill, saving, billItems])

  // Calculate bill when items change
  useEffect(() => {
    if (billItems.length > 0) {
      const calc = tariffEngine.calculateBill(billItems)
      setCalculation(calc)
      // Auto-save bill when calculation changes
      saveBillToStorage(calc)
    } else {
      setCalculation(null)
    }
  }, [billItems, saveBillToStorage])

  // Load existing bill when matter changes
  useEffect(() => {
    if (selectedMatter) {
      loadExistingBill(selectedMatter.id)
    }
  }, [selectedMatter, loadExistingBill])

  // Get available tariff items for search
  const availableItems = useMemo(() => {
    if (!selectedMatter) return []
    
    const tariff = tariffEngine.getTariff(selectedMatter.courtType, selectedMatter.scale)
    if (!tariff) return []

    if (searchTerm) {
      return tariffEngine.searchTariffItems(selectedMatter.courtType, selectedMatter.scale, searchTerm)
    }

    return tariff.items.slice(0, 10) // Show first 10 items
  }, [selectedMatter, searchTerm])

  // Get quick add suggestions
  const quickAddItems = useMemo(() => {
    if (!selectedMatter) return []
    return tariffEngine.getQuickAddSuggestions(selectedMatter.courtType, selectedMatter.scale)
  }, [selectedMatter])

  const addBillItem = (itemNumber: string, units: number = 1, customDescription?: string) => {
    if (!selectedMatter) return

    const billItem = tariffEngine.calculateBillItem(
      selectedMatter.courtType,
      selectedMatter.scale,
      itemNumber,
      units,
      customDescription,
      'manual',
      profile?.id || 'user'
    )

    if (billItem) {
      // Ensure proper ID generation for localStorage persistence
      const itemWithProperID = {
        ...billItem,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      setBillItems(prev => [...prev, itemWithProperID])
      setNewItem({
        itemNumber: '',
        description: '',
        units: 1,
        customRate: 0,
        useCustomRate: false
      })
      setSearchTerm('')
    }
  }

  const addCustomItem = () => {
    if (!selectedMatter || !newItem.description) return

    const customBillItem: BillItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tariffItemId: 'CUSTOM',
      description: newItem.description,
      units: newItem.units,
      rateApplied: newItem.customRate,
      amountExVat: newItem.units * newItem.customRate,
      vat: 0, // Custom items default to no VAT
      totalAmount: newItem.units * newItem.customRate,
      source: 'custom',
      createdBy: profile?.id || 'user',
      createdAt: new Date()
    }

    setBillItems(prev => [...prev, customBillItem])
    setNewItem({
      itemNumber: '',
      description: '',
      units: 1,
      customRate: 0,
      useCustomRate: false
    })
  }

  const removeBillItem = (itemId: string) => {
    setBillItems(prev => prev.filter(item => item.id !== itemId))
  }

  const addDisbursement = () => {
    const description = prompt('Enter disbursement description:')
    const amountStr = prompt('Enter amount (excluding VAT):')
    
    if (description && amountStr) {
      const amount = parseFloat(amountStr)
      if (!isNaN(amount)) {
        const disbursement = tariffEngine.calculateDisbursement(
          description,
          amount,
          true,
          profile?.id || 'user'
        )
        setBillItems(prev => [...prev, disbursement])
      }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'preparation': return <FileText className="h-4 w-4" />
      case 'attendance': return <Users className="h-4 w-4" />
      case 'court': return <Users className="h-4 w-4" />
      case 'travel': return <Car className="h-4 w-4" />
      default: return <Calculator className="h-4 w-4" />
    }
  }

  if (!selectedMatter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No Matter Selected</h3>
          <p className="text-gray-500">Please select a matter to start building a bill.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Matter Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {selectedMatter.title}
          </CardTitle>
          <CardDescription>
            {selectedMatter.parties} • {courtTypes.find(c => c.code === selectedMatter.courtType)?.name} • Scale {selectedMatter.scale}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Add Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Add */}
          {showQuickAdd && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Add
                </CardTitle>
                <CardDescription>
                  Common items for {courtTypes.find(c => c.code === selectedMatter.courtType)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickAddItems.map((item) => (
                    <Button
                      key={item.itemNumber}
                      variant="outline"
                      className="justify-start h-auto p-3"
                      onClick={() => addBillItem(item.itemNumber)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getCategoryIcon(item.subcategory || '')}
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(item.rate)} {item.unit}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Add Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Tariff Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <DictationInput
                    placeholder="Search for tariff items..."
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                >
                  {showQuickAdd ? 'Hide' : 'Show'} Quick Add
                </Button>
              </div>

              {availableItems.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableItems.map((item) => (
                    <div
                      key={item.itemNumber}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                        <div className="text-sm text-blue-600">
                          {formatCurrency(item.rate)} {item.unit}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addBillItem(item.itemNumber)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Item */}
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <DictationInput
                    placeholder="Custom work description"
                    value={newItem.description}
                    onChange={(value) => setNewItem({ ...newItem, description: value })}
                  />
                </div>
                <div>
                  <Label htmlFor="units">Units</Label>
                  <Input
                    id="units"
                    type="number"
                    min="0"
                    step="0.25"
                    value={newItem.units}
                    onChange={(e) => setNewItem({ ...newItem, units: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate per unit"
                    value={newItem.customRate}
                    onChange={(e) => setNewItem({ ...newItem, customRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addCustomItem} className="w-full">
                    Add Custom Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disbursements */}
          <Card>
            <CardHeader>
              <CardTitle>Disbursements</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={addDisbursement} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Disbursement
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="space-y-6">
          {/* Live Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Live Bill Builder
              {saving && (
                <Badge variant="secondary" className="ml-2">
                  Saving...
                </Badge>
              )}
            </CardTitle>
            </CardHeader>
            <CardContent>
              {calculation ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Professional Fees:</span>
                    <span>{formatCurrency(calculation.subtotalFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disbursements:</span>
                    <span>{formatCurrency(calculation.subtotalDisbursements)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Counsel Fees:</span>
                    <span>{formatCurrency(calculation.subtotalCounsel)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Subtotal (ex VAT):</span>
                    <span>{formatCurrency(calculation.totalExVat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>{formatCurrency(calculation.totalVat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(calculation.grandTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Add items to see totals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Items */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Items ({billItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {billItems.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {billItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.units} × {formatCurrency(item.rateApplied)} = {formatCurrency(item.totalAmount)}
                        </div>
                        {item.source && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.source}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBillItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}