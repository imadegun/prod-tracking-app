"use client"

import React, { useState, useEffect } from 'react'
import { DataGrid, Column } from '@/components/ui/data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Edit, AlertTriangle, CheckCircle, User, Calendar, Package } from 'lucide-react'

interface PerformanceAppraisal {
  id: number
  operatorId: number
  productionRecordId?: number
  appraisalDate: string
  appraisalType: 'success' | 'human_error'
  category: string
  description: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  impact?: string
  correctiveAction?: string
  preventionAction?: string
  isResolved: boolean
  resolvedAt?: string
  createdAt: string
  updatedAt: string
  operator: {
    id: number
    employeeId: string
    fullName: string
  }
  productionRecord?: {
    id: number
    workPlan: {
      product: {
        id: number
        code: string
        name: string
      }
      productionStage: {
        id: number
        name: string
        code: string
      }
    }
  }
  recorder: {
    id: number
    fullName: string
  }
  resolver?: {
    id: number
    fullName: string
  }
}

const APPRAISAL_CATEGORIES = [
  'Quality',
  'Efficiency',
  'Safety',
  'Teamwork',
  'Attendance',
  'Initiative',
  'Technical Skills',
  'Communication',
  'Problem Solving',
  'Compliance'
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

export default function PerformanceAppraisalsPage() {
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppraisal, setEditingAppraisal] = useState<PerformanceAppraisal | null>(null)
  const [formData, setFormData] = useState({
    operatorId: '',
    appraisalType: 'human_error' as 'success' | 'human_error',
    category: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    impact: '',
    correctiveAction: '',
    preventionAction: '',
    appraisalDate: new Date().toISOString().split('T')[0],
    isResolved: false
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  const columns: Column<PerformanceAppraisal>[] = [
    {
      key: 'appraisalDate',
      title: 'Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'operator',
      title: 'Operator',
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{value.fullName}</div>
            <div className="text-sm text-muted-foreground">{value.employeeId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'appraisalType',
      title: 'Type',
      filterable: true,
      filterOptions: [
        { value: 'success', label: 'Success' },
        { value: 'human_error', label: 'Human Error' }
      ],
      render: (value) => (
        <div className="flex items-center gap-2">
          {value === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={value === 'success' ? 'default' : 'destructive'}>
            {value === 'success' ? 'Success' : 'Human Error'}
          </Badge>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      filterable: true,
      filterOptions: APPRAISAL_CATEGORIES.map(cat => ({ value: cat, label: cat })),
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'severity',
      title: 'Severity',
      filterable: true,
      filterOptions: SEVERITY_LEVELS.map(level => ({ value: level.value, label: level.label })),
      render: (value) => {
        if (!value) return '-'
        const severity = SEVERITY_LEVELS.find(s => s.value === value)
        return (
          <Badge className={severity?.color || ''}>
            {severity?.label || value}
          </Badge>
        )
      }
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'isResolved',
      title: 'Status',
      filterable: true,
      filterOptions: [
        { value: 'true', label: 'Resolved' },
        { value: 'false', label: 'Pending' }
      ],
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Resolved' : 'Pending'}
        </Badge>
      )
    }
  ]

  useEffect(() => {
    fetchAppraisals()
    fetchOperators()
  }, [pagination.page])

  const fetchAppraisals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      const response = await fetch(`/api/performance-appraisals?${params}`)
      if (!response.ok) throw new Error('Failed to fetch appraisals')
      const data = await response.json()
      
      setAppraisals(data.data)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }))
    } catch (error) {
      toast.error('Failed to load performance appraisals')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators')
      if (!response.ok) throw new Error('Failed to fetch operators')
      const data = await response.json()
      setOperators(data.filter((op: any) => op.isActive))
    } catch (error) {
      console.error('Error fetching operators:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const url = editingAppraisal 
        ? `/api/performance-appraisals/${editingAppraisal.id}`
        : '/api/performance-appraisals'
      const method = editingAppraisal ? 'PUT' : 'POST'

      const submitData = {
        ...formData,
        operatorId: parseInt(formData.operatorId)
      }

      // Only include severity for human errors
      if (formData.appraisalType === 'success') {
        delete submitData.severity
        delete submitData.impact
        delete submitData.correctiveAction
        delete submitData.preventionAction
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) throw new Error('Failed to save appraisal')

      toast.success(`Performance appraisal ${editingAppraisal ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      resetForm()
      fetchAppraisals()
    } catch (error) {
      toast.error('Failed to save performance appraisal')
      console.error('Submit error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (appraisal: PerformanceAppraisal) => {
    setEditingAppraisal(appraisal)
    setFormData({
      operatorId: appraisal.operatorId.toString(),
      appraisalType: appraisal.appraisalType,
      category: appraisal.category,
      description: appraisal.description,
      severity: appraisal.severity || 'medium',
      impact: appraisal.impact || '',
      correctiveAction: appraisal.correctiveAction || '',
      preventionAction: appraisal.preventionAction || '',
      appraisalDate: new Date(appraisal.appraisalDate).toISOString().split('T')[0],
      isResolved: appraisal.isResolved
    })
    setDialogOpen(true)
  }

  const handleDelete = async (appraisal: PerformanceAppraisal) => {
    try {
      const response = await fetch(`/api/performance-appraisals/${appraisal.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete appraisal')
      }
      
      toast.success('Performance appraisal deleted successfully')
      fetchAppraisals()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete appraisal')
      console.error('Delete error:', error)
    }
  }

  const resetForm = () => {
    setEditingAppraisal(null)
    setFormData({
      operatorId: '',
      appraisalType: 'human_error',
      category: '',
      description: '',
      severity: 'medium',
      impact: '',
      correctiveAction: '',
      preventionAction: '',
      appraisalDate: new Date().toISOString().split('T')[0],
      isResolved: false
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Appraisals</h1>
        <p className="text-muted-foreground">Track successful performance and human errors in the production process</p>
      </div>

      <DataGrid
        data={appraisals}
        columns={columns}
        loading={loading}
        title="Performance Appraisals"
        searchPlaceholder="Search by operator, category, or description..."
        onAdd={() => {
          resetForm()
          setDialogOpen(true)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchAppraisals}
        emptyMessage="No performance appraisals found"
        pagination={pagination}
        onPaginationChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      {/* Add/Edit Appraisal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppraisal ? 'Edit Performance Appraisal' : 'Add New Performance Appraisal'}
            </DialogTitle>
            <DialogDescription>
              {editingAppraisal 
                ? 'Update the performance appraisal details below.'
                : 'Record a new performance appraisal for an operator.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatorId">Operator</Label>
                <Select
                  value={formData.operatorId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, operatorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id.toString()}>
                        {operator.fullName} ({operator.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appraisalType">Type</Label>
                <Select
                  value={formData.appraisalType}
                  onValueChange={(value: 'success' | 'human_error') => setFormData(prev => ({ ...prev, appraisalType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="human_error">Human Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPRAISAL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appraisalDate">Date</Label>
                <Input
                  id="appraisalDate"
                  type="date"
                  value={formData.appraisalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, appraisalDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed description of the performance or error..."
                rows={3}
                required
              />
            </div>

            {formData.appraisalType === 'human_error' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impact">Impact</Label>
                  <Textarea
                    id="impact"
                    value={formData.impact}
                    onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
                    placeholder="Describe the impact on production..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctiveAction">Corrective Action</Label>
                  <Textarea
                    id="correctiveAction"
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData(prev => ({ ...prev, correctiveAction: e.target.value }))}
                    placeholder="Action taken to address the error..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preventionAction">Prevention Action</Label>
                  <Textarea
                    id="preventionAction"
                    value={formData.preventionAction}
                    onChange={(e) => setFormData(prev => ({ ...prev, preventionAction: e.target.value }))}
                    placeholder="Future prevention measures..."
                    rows={2}
                  />
                </div>

                {editingAppraisal && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isResolved"
                      checked={formData.isResolved}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isResolved: checked as boolean }))}
                    />
                    <Label htmlFor="isResolved">Mark as Resolved</Label>
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? 'Saving...' : (editingAppraisal ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}