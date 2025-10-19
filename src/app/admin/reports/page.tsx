'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Package,
  Download,
  Calendar
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

interface ReportData {
  targetAchievement: Array<{
    date: string
    target: number
    actual: number
    percentage: number
  }>
  operatorPerformance: Array<{
    operatorName: string
    targetQuantity: number
    completedQuantity: number
    goodQuantity: number
    rejectQuantity: number
    achievementRate: number
  }>
  rejectAnalysis: Array<{
    reason: string
    count: number
    percentage: number
  }>
  productPerformance: Array<{
    productName: string
    targetQuantity: number
    completedQuantity: number
    goodQuantity: number
    rejectQuantity: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - replace with API calls
  useEffect(() => {
    const mockData: ReportData = {
      targetAchievement: [
        { date: 'Mon', target: 100, actual: 95, percentage: 95 },
        { date: 'Tue', target: 120, actual: 110, percentage: 92 },
        { date: 'Wed', target: 110, actual: 115, percentage: 105 },
        { date: 'Thu', target: 130, actual: 125, percentage: 96 },
        { date: 'Fri', target: 140, actual: 135, percentage: 96 },
      ],
      operatorPerformance: [
        { 
          operatorName: 'John Smith', 
          targetQuantity: 200, 
          completedQuantity: 190, 
          goodQuantity: 180, 
          rejectQuantity: 10,
          achievementRate: 95 
        },
        { 
          operatorName: 'Sarah Johnson', 
          targetQuantity: 180, 
          completedQuantity: 175, 
          goodQuantity: 165, 
          rejectQuantity: 10,
          achievementRate: 97 
        },
        { 
          operatorName: 'Mike Wilson', 
          targetQuantity: 160, 
          completedQuantity: 140, 
          goodQuantity: 130, 
          rejectQuantity: 10,
          achievementRate: 88 
        },
      ],
      rejectAnalysis: [
        { reason: 'Cracked during drying', count: 15, percentage: 30 },
        { reason: 'Glaze defect', count: 12, percentage: 24 },
        { reason: 'Firing issue', count: 10, percentage: 20 },
        { reason: 'Shape deformation', count: 8, percentage: 16 },
        { reason: 'Surface blemish', count: 5, percentage: 10 },
      ],
      productPerformance: [
        { 
          productName: 'Classic Vase', 
          targetQuantity: 150, 
          completedQuantity: 145, 
          goodQuantity: 140, 
          rejectQuantity: 5 
        },
        { 
          productName: 'Decorative Bowl', 
          targetQuantity: 120, 
          completedQuantity: 115, 
          goodQuantity: 110, 
          rejectQuantity: 5 
        },
        { 
          productName: 'Coffee Mug Set', 
          targetQuantity: 200, 
          completedQuantity: 195, 
          goodQuantity: 185, 
          rejectQuantity: 10 
        },
      ]
    }
    setReportData(mockData)
  }, [selectedPeriod])

  const handleExportReport = () => {
    // Mock export functionality
    alert('Export functionality would be implemented here')
  }

  const overallAchievement = reportData ? 
    Math.round(
      reportData.targetAchievement.reduce((sum, day) => sum + day.percentage, 0) / 
      reportData.targetAchievement.length
    ) : 0

  const totalRejects = reportData ? 
    reportData.rejectAnalysis.reduce((sum, item) => sum + item.count, 0) : 0

  if (!reportData) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for production performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAchievement}%</div>
            <p className="text-xs text-muted-foreground">
              {overallAchievement >= 95 ? 'Excellent' : overallAchievement >= 85 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.targetAchievement.reduce((sum, day) => sum + day.actual, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Units produced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rejects</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalRejects}</div>
            <p className="text-xs text-muted-foreground">
              Quality issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.operatorPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Target Achievement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Target Achievement Trend</CardTitle>
            <CardDescription>
              Daily target vs actual production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.targetAchievement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Target"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reject Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Reject Analysis</CardTitle>
            <CardDescription>
              Breakdown of rejection reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.rejectAnalysis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.rejectAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Operator Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operator Performance</CardTitle>
          <CardDescription>
            Individual operator achievement rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.operatorPerformance.map((operator, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{operator.operatorName}</h4>
                    <Badge variant={operator.achievementRate >= 95 ? "default" : "secondary"}>
                      {operator.achievementRate}% Achievement
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-medium">{operator.targetQuantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed: </span>
                      <span className="font-medium">{operator.completedQuantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Good: </span>
                      <span className="font-medium text-green-600">{operator.goodQuantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rejects: </span>
                      <span className="font-medium text-red-600">{operator.rejectQuantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>
            Production metrics by product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.productPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="targetQuantity" fill="#8884d8" name="Target" />
              <Bar dataKey="completedQuantity" fill="#82ca9d" name="Completed" />
              <Bar dataKey="goodQuantity" fill="#ffc658" name="Good Quality" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}