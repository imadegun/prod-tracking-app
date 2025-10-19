'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

interface WorkPlan {
  id: number
  operator: {
    id: number
    fullName: string
    employeeId: string
  }
  product: {
    id: number
    code: string
    name: string
  }
  productionStage: {
    id: number
    name: string
    code: string
    backgroundColor: string
  }
  targetQuantity: number
  plannedDate: string
  decorationDetail?: string
}

interface ProductionRecord {
  completedQuantity: number
  goodQuantity: number
  rejectQuantity: number
  rejectReason?: string
  rejectStage?: string
  notes?: string
  startTime?: string
  endTime?: string
}

export default function ProductionRecordPage() {
  const { data: session } = useSession()
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<WorkPlan | null>(null)
  const [record, setRecord] = useState<ProductionRecord>({
    completedQuantity: 0,
    goodQuantity: 0,
    rejectQuantity: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch today's work plans
  const fetchWorkPlans = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const response = await fetch(`/api/work-plans?date=${today.toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        setWorkPlans(data)
      }
    } catch (error) {
      console.error('Failed to fetch work plans:', error)
      setMessage({ type: 'error', text: 'Failed to load work plans' })
    }
  }

  useEffect(() => {
    fetchWorkPlans()
  }, [])

  const handleQuantityChange = (field: 'completed' | 'good' | 'reject', value: string) => {
    const numValue = parseInt(value) || 0
    setRecord(prev => {
      const updated = { ...prev }
      
      if (field === 'completed') {
        updated.completedQuantity = numValue
        // Auto-adjust good and reject if completed is reduced
        if (numValue < prev.goodQuantity + prev.rejectQuantity) {
          const ratio = prev.goodQuantity / (prev.goodQuantity + prev.rejectQuantity)
          updated.goodQuantity = Math.floor(numValue * ratio)
          updated.rejectQuantity = numValue - updated.goodQuantity
        }
      } else if (field === 'good') {
        updated.goodQuantity = Math.min(numValue, updated.completedQuantity)
        updated.rejectQuantity = updated.completedQuantity - updated.goodQuantity
      } else if (field === 'reject') {
        updated.rejectQuantity = Math.min(numValue, updated.completedQuantity)
        updated.goodQuantity = updated.completedQuantity - updated.rejectQuantity
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

    setIsLoading(true)
    setMessage(null)

    try {
      // API call to save production record
      const response = await fetch('/api/production/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workPlanId: selectedPlan.id,
          ...record,
          recordedDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Production record saved successfully!' })
        // Reset form
        setRecord({
          completedQuantity: 0,
          goodQuantity: 0,
          rejectQuantity: 0
        })
        setSelectedPlan(null)
      } else {
        throw new Error('Failed to save record')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save production record' })
    } finally {
      setIsLoading(false)
    }
  }

  const rejectReasons = [
    'Cracked during drying',
    'Glaze defect',
    'Firing issue',
    'Shape deformation',
    'Surface blemish',
    'Color mismatch',
    'Size variation',
    'Other'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Production Recording</h1>
        <p className="text-muted-foreground">
          Record daily production results for operators
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Work Plan</CardTitle>
            <CardDescription>
              Choose the work plan to record production for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlan?.id === plan.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: plan.productionStage.backgroundColor }}
                        >
                          {plan.productionStage.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {plan.operator.fullName} ({plan.operator.employeeId})
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{plan.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.product.code} • Target: {plan.targetQuantity} units
                        </p>
                        {plan.decorationDetail && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.decorationDetail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(plan.plannedDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Production Record Form */}
        <Card>
          <CardHeader>
            <CardTitle>Production Record</CardTitle>
            <CardDescription>
              Enter the production results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPlan ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="completed">Completed</Label>
                    <Input
                      id="completed"
                      type="number"
                      min="0"
                      value={record.completedQuantity}
                      onChange={(e) => handleQuantityChange('completed', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="good">Good Quality</Label>
                    <Input
                      id="good"
                      type="number"
                      min="0"
                      value={record.goodQuantity}
                      onChange={(e) => handleQuantityChange('good', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reject">Rejected</Label>
                    <Input
                      id="reject"
                      type="number"
                      min="0"
                      value={record.rejectQuantity}
                      onChange={(e) => handleQuantityChange('reject', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {record.rejectQuantity > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Reject Details Required</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="rejectReason">Reject Reason</Label>
                        <Select
                          value={record.rejectReason}
                          onValueChange={(value) => setRecord(prev => ({ ...prev, rejectReason: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reject reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {rejectReasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rejectStage">Reject Stage</Label>
                        <Select
                          value={record.rejectStage}
                          onValueChange={(value) => setRecord(prev => ({ ...prev, rejectStage: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage where rejection occurred" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="throwing">Throwing</SelectItem>
                            <SelectItem value="trimming">Trimming</SelectItem>
                            <SelectItem value="decoration">Decoration</SelectItem>
                            <SelectItem value="drying">Drying</SelectItem>
                            <SelectItem value="bisquit_firing">Bisquit Firing</SelectItem>
                            <SelectItem value="high_fire">High Fire</SelectItem>
                            <SelectItem value="quality_control">Quality Control</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={record.startTime || ''}
                      onChange={(e) => setRecord(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={record.endTime || ''}
                      onChange={(e) => setRecord(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about the production..."
                    value={record.notes || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Record
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setRecord({
                      completedQuantity: 0,
                      goodQuantity: 0,
                      rejectQuantity: 0
                    })}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-4" />
                <p>Select a work plan to start recording production</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}