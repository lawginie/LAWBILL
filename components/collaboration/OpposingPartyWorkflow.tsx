'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Mail, 
  Flag, 
  MessageSquare, 
  Check, 
  X,
  Clock,
  AlertTriangle,
  FileText,
  Gavel,
  Send,
  Eye,
  Download
} from 'lucide-react'
import { BillItem } from '@/lib/tariff-engine'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface Objection {
  id: string
  billItemId: string
  objectedBy: string
  objectedByEmail: string
  reason: string
  proposedAmount: number
  status: 'pending' | 'accepted' | 'rejected' | 'taxing_master'
  createdAt: Date
  response?: string
  respondedAt?: Date
  respondedBy?: string
}

interface OpponentUser {
  id: string
  email: string
  name: string
  firm: string
  status: 'invited' | 'active' | 'inactive'
  invitedAt: Date
  lastActive?: Date
}

interface OpposingPartyWorkflowProps {
  matterId: string
  billItems: BillItem[]
  onObjectionResolved: (objectionId: string, resolution: 'accepted' | 'rejected', response?: string) => void
}

export function OpposingPartyWorkflow({ 
  matterId, 
  billItems, 
  onObjectionResolved 
}: OpposingPartyWorkflowProps) {
  const { profile } = useAuth()
  const [opponents, setOpponents] = useState<OpponentUser[]>([])
  const [objections, setObjections] = useState<Objection[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteFirm, setInviteFirm] = useState('')
  const [selectedObjection, setSelectedObjection] = useState<Objection | null>(null)
  const [responseText, setResponseText] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  // Mock data for demo
  useEffect(() => {
    // Mock opponents
    setOpponents([
      {
        id: 'opp-1',
        email: 'opponent@lawfirm.co.za',
        name: 'Sarah Johnson',
        firm: 'Johnson & Associates',
        status: 'active',
        invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ])

    // Mock objections
    if (billItems.length > 0) {
      setObjections([
        {
          id: 'obj-1',
          billItemId: billItems[0]?.id || 'item-1',
          objectedBy: 'Sarah Johnson',
          objectedByEmail: 'opponent@lawfirm.co.za',
          reason: 'Time spent appears excessive for the complexity of the matter. Requesting reduction to 1 hour.',
          proposedAmount: 850.00,
          status: 'pending',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: 'obj-2',
          billItemId: billItems[1]?.id || 'item-2',
          objectedBy: 'Sarah Johnson',
          objectedByEmail: 'opponent@lawfirm.co.za',
          reason: 'This consultation was not necessary and should be removed entirely.',
          proposedAmount: 0,
          status: 'rejected',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          response: 'Consultation was essential for case preparation as evidenced by attached correspondence.',
          respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          respondedBy: profile?.id || 'user'
        }
      ])
    }
  }, [billItems, profile])

  const inviteOpponent = async () => {
    if (!inviteEmail || !inviteName || !inviteFirm) return

    setIsInviting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newOpponent: OpponentUser = {
        id: `opp-${Date.now()}`,
        email: inviteEmail,
        name: inviteName,
        firm: inviteFirm,
        status: 'invited',
        invitedAt: new Date()
      }

      setOpponents(prev => [...prev, newOpponent])
      setInviteEmail('')
      setInviteName('')
      setInviteFirm('')
    } catch (error) {
      console.error('Failed to invite opponent:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const respondToObjection = (objectionId: string, action: 'accepted' | 'rejected') => {
    const objection = objections.find(o => o.id === objectionId)
    if (!objection) return

    setObjections(prev => 
      prev.map(obj => 
        obj.id === objectionId 
          ? {
              ...obj,
              status: action,
              response: responseText,
              respondedAt: new Date(),
              respondedBy: profile?.id || 'user'
            }
          : obj
      )
    )

    onObjectionResolved(objectionId, action, responseText)
    setSelectedObjection(null)
    setResponseText('')
  }

  const sendToTaxingMaster = (objectionId: string) => {
    setObjections(prev => 
      prev.map(obj => 
        obj.id === objectionId 
          ? { ...obj, status: 'taxing_master' }
          : obj
      )
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'taxing_master':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Taxing Master</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getObjectedItem = (billItemId: string) => {
    return billItems.find(item => item.id === billItemId)
  }

  const generateTaxationBundle = () => {
    // In a real app, this would generate a PDF/DOCX taxation bundle
    console.log('Generating taxation bundle with objections:', objections)
    alert('Taxation bundle generated! (This would download a PDF in the real app)')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Opposing Party Collaboration
          </CardTitle>
          <CardDescription>
            Invite opposing parties to review and object to bill items
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="opponents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opponents">Opponents</TabsTrigger>
          <TabsTrigger value="objections">
            Objections ({objections.filter(o => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="taxation">Taxation</TabsTrigger>
        </TabsList>

        <TabsContent value="opponents" className="space-y-4">
          {/* Invite Opponent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite Opposing Party
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="opponent-email">Email Address</Label>
                  <Input
                    id="opponent-email"
                    type="email"
                    placeholder="opponent@lawfirm.co.za"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="opponent-name">Attorney Name</Label>
                  <Input
                    id="opponent-name"
                    placeholder="John Smith"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="opponent-firm">Law Firm</Label>
                  <Input
                    id="opponent-firm"
                    placeholder="Smith & Associates"
                    value={inviteFirm}
                    onChange={(e) => setInviteFirm(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={inviteOpponent} 
                disabled={!inviteEmail || !inviteName || !inviteFirm || isInviting}
                className="w-full md:w-auto"
              >
                {isInviting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Opponents */}
          <Card>
            <CardHeader>
              <CardTitle>Current Opponents ({opponents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {opponents.length > 0 ? (
                <div className="space-y-3">
                  {opponents.map((opponent) => (
                    <div key={opponent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{opponent.name}</div>
                        <div className="text-sm text-gray-600">{opponent.firm}</div>
                        <div className="text-sm text-gray-500">{opponent.email}</div>
                      </div>
                      <div className="text-right space-y-1">
                        {getStatusBadge(opponent.status)}
                        <div className="text-xs text-gray-500">
                          {opponent.lastActive 
                            ? `Active ${formatDate(opponent.lastActive)}`
                            : `Invited ${formatDate(opponent.invitedAt)}`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No opponents invited yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections" className="space-y-4">
          {objections.length > 0 ? (
            <div className="space-y-4">
              {objections.map((objection) => {
                const objectedItem = getObjectedItem(objection.billItemId)
                return (
                  <Card key={objection.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Flag className="h-5 w-5" />
                            Objection by {objection.objectedBy}
                          </CardTitle>
                          <CardDescription>
                            {formatDate(objection.createdAt)} • {objection.objectedByEmail}
                          </CardDescription>
                        </div>
                        {getStatusBadge(objection.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Original Item */}
                      {objectedItem && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium mb-2">Original Item</h4>
                          <div className="text-sm">
                            <div>{objectedItem.description}</div>
                            <div className="text-gray-600">
                              {objectedItem.units} × {formatCurrency(objectedItem.rateApplied)} = {formatCurrency(objectedItem.totalAmount)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Objection Details */}
                      <div>
                        <h4 className="font-medium mb-2">Objection Reason</h4>
                        <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border-l-4 border-red-200">
                          {objection.reason}
                        </p>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Proposed Amount: </span>
                          <span className={objection.proposedAmount === 0 ? 'text-red-600' : 'text-blue-600'}>
                            {objection.proposedAmount === 0 ? 'Remove entirely' : formatCurrency(objection.proposedAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Response */}
                      {objection.response && (
                        <div>
                          <h4 className="font-medium mb-2">Your Response</h4>
                          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-200">
                            {objection.response}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            Responded {formatDate(objection.respondedAt!)}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {objection.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedObjection(objection)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Respond
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => sendToTaxingMaster(objection.id)}
                          >
                            <Gavel className="h-4 w-4 mr-2" />
                            Send to Taxing Master
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Objections Yet</h3>
                <p className="text-gray-500">
                  Opposing parties haven't raised any objections to your bill items.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="taxation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Taxation Bundle
              </CardTitle>
              <CardDescription>
                Generate final taxed bill and taxation bundle for court submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {objections.filter(o => o.status === 'pending').length}
                  </div>
                  <div className="text-sm text-blue-800">Pending Objections</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {objections.filter(o => o.status === 'accepted').length}
                  </div>
                  <div className="text-sm text-green-800">Accepted Objections</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {objections.filter(o => o.status === 'rejected').length}
                  </div>
                  <div className="text-sm text-red-800">Rejected Objections</div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={generateTaxationBundle} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Taxation Bundle
                </Button>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The taxation bundle includes all objections, responses, and final bill amounts for court submission.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Modal */}
      {selectedObjection && (
        <Card className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Respond to Objection</CardTitle>
              <CardDescription>
                Provide your response to {selectedObjection.objectedBy}'s objection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium mb-1">Objection:</h4>
                <p className="text-sm">{selectedObjection.reason}</p>
              </div>

              <div>
                <Label htmlFor="response">Your Response</Label>
                <textarea
                  id="response"
                  className="w-full p-3 border rounded-lg min-h-[100px]"
                  placeholder="Provide your detailed response to this objection..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedObjection(null)
                    setResponseText('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => respondToObjection(selectedObjection.id, 'rejected')}
                  disabled={!responseText.trim()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Objection
                </Button>
                <Button
                  onClick={() => respondToObjection(selectedObjection.id, 'accepted')}
                  disabled={!responseText.trim()}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Objection
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  )
}