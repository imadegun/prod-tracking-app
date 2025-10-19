'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar as CalendarIcon, 
  Users, 
  Package, 
  Target,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'

interface WorkPlan {
  id: number
  weekStart: string
  plannedDate: string
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
  isOvertime: boolean
  productionRecords: Array<{
    completedQuantity: number
    goodQuantity: number
    rejectQuantity: number
  }>
}

export default function PlanningPage() {
  const { data: session } = useSession()
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productionStages, setProductionStages] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [selectedOperator, setSelectedOperator] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch data from APIs
  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators')
      if (response.ok) {
        const data = await response.json()
        setOperators(data)
      }
    } catch (error) {
      console.error('Failed to fetch operators:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchProductionStages = async () => {
    try {
      const response = await fetch('/api/production-stages')
      if (response.ok) {
        const data = await response.json()
        setProductionStages(data)
      }
    } catch (error) {
      console.error('Failed to fetch production stages:', error)
    }
  }

  const fetchWorkPlans = async () => {
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
      const response = await fetch(`/api/work-plans?weekStart=${weekStart.toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        setWorkPlans(data)
      }
    } catch (error) {
      console.error('Failed to fetch work plans:', error)
    }
  }

  useEffect(() => {
    fetchOperators()
    fetchProducts()
    fetchProductionStages()
  }, [])

  useEffect(() => {
    fetchWorkPlans()
  }, [selectedWeek])

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    )
  }

  const filteredWorkPlans = workPlans.filter(plan => 
    selectedOperator === 'all' || plan.operator.id.toString() === selectedOperator
  )

  const getWeekDays = () => {
    const days = []
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 })
    
    // Tuesday to Monday work week
    const workDays = [
      { day: 1, name: 'Tuesday' },
      { day: 2, name: 'Wednesday' },
      { day: 3, name: 'Thursday' },
      { day: 4, name: 'Friday' },
      { day: 6, name: 'Monday' }
    ]

    for (const workDay of workDays) {
      const date = new Date(start)
      date.setDate(start.getDate() + workDay.day)
      days.push({
        date,
        name: workDay.name,
        isWeekend: workDay.day === 0 || workDay.day === 5 // Saturday, Sunday
      })
    }

    return days
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Planning</h1>
          <p className="text-muted-foreground">
            Create and manage weekly production schedules
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Work Plan
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h3 className="font-medium">
                  Week of {format(weekStart, 'MMM dd, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(weekEnd, 'MMM dd, yyyy')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {operators.map((operator) => (
                    <SelectItem key={operator.id} value={operator.id.toString()}>
                      {operator.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Work Week Calendar */}
      <div className="grid gap-4">
        {getWeekDays().map((weekDay) => (
          <Card key={weekDay.name}>
            <CardHeader>
              <CardTitle className="text-lg">
                {weekDay.name} - {format(weekDay.date, 'MMM dd, yyyy')}
                {weekDay.isWeekend && (
                  <Badge variant="secondary" className="ml-2">
                    Overtime
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredWorkPlans
                  .filter(plan => 
                    format(new Date(plan.plannedDate), 'yyyy-MM-dd') === 
                    format(weekDay.date, 'yyyy-MM-dd')
                  )
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: plan.productionStage.backgroundColor }}
                          className="text-white"
                        >
                          {plan.productionStage.name}
                        </Badge>
                        <div>
                          <p className="font-medium">{plan.operator.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.product.name} ({plan.product.code})
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{plan.targetQuantity} units</p>
                          <p className="text-sm text-muted-foreground">Target</p>
                        </div>
                        
                        {plan.productionRecords.length > 0 && (
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {plan.productionRecords[0].goodQuantity} good
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {plan.productionRecords[0].completedQuantity} completed
                            </p>
                          </div>
                        )}
                        
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {filteredWorkPlans.filter(plan => 
                  format(new Date(plan.plannedDate), 'yyyy-MM-dd') === 
                  format(weekDay.date, 'yyyy-MM-dd')
                ).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
                    <p>No work plans scheduled for {weekDay.name}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Work Plan
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans This Week</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredWorkPlans.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {operators.length} operators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredWorkPlans.reduce((sum, plan) => sum + plan.targetQuantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Units to produce
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredWorkPlans.map(plan => plan.operator.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}