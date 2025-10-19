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
import { Plus, Edit, User, Calendar, MapPin, Mail, Phone } from 'lucide-react'

interface Operator {
  id: number
  employeeId: string
  fullName: string
  skills: string[]
  hireDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const AVAILABLE_SKILLS = [
  'Throwing',
  'Trimming', 
  'Decoration',
  'Drying',
  'Bisquit Loading',
  'Bisquit Firing',
  'Bisquit Exit',
  'Sanding/Waxing',
  'Glazing',
  'High-Fire',
  'Quality Control'
]

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    skills: [] as string[],
    hireDate: '',
    isActive: true
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  const columns: Column<Operator>[] = [
    {
      key: 'employeeId',
      title: 'Employee ID',
      sortable: true,
      filterable: true,
      width: '120px'
    },
    {
      key: 'fullName',
      title: 'Full Name',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'skills',
      title: 'Skills',
      filterable: true,
      filterOptions: AVAILABLE_SKILLS.map(skill => ({ value: skill, label: skill })),
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(value) && value.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {Array.isArray(value) && value.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 3} more
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'hireDate',
      title: 'Hire Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{value ? new Date(value).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      filterable: true,
      filterOptions: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ]

  useEffect(() => {
    fetchOperators()
  }, [])

  const fetchOperators = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operators')
      if (!response.ok) throw new Error('Failed to fetch operators')
      const data = await response.json()
      setOperators(data)
    } catch (error) {
      toast.error('Failed to load operators')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const url = editingOperator 
        ? `/api/operators/${editingOperator.id}`
        : '/api/operators'
      const method = editingOperator ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save operator')

      toast.success(`Operator ${editingOperator ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      resetForm()
      fetchOperators()
    } catch (error) {
      toast.error('Failed to save operator')
      console.error('Submit error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator)
    setFormData({
      employeeId: operator.employeeId,
      fullName: operator.fullName,
      skills: operator.skills,
      hireDate: operator.hireDate,
      isActive: operator.isActive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (operator: Operator) => {
    // This will be handled by the DataGrid component
  }

  const resetForm = () => {
    setEditingOperator(null)
    setFormData({
      employeeId: '',
      fullName: '',
      skills: [],
      hireDate: '',
      isActive: true
    })
  }

  const handleSkillToggle = (skill: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      skills: checked 
        ? [...prev.skills, skill]
        : prev.skills.filter(s => s !== skill)
    }))
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Operators Management</h1>
        <p className="text-muted-foreground">Manage production operators and their skills</p>
      </div>

      <DataGrid
        data={operators}
        columns={columns}
        loading={loading}
        title="Operators"
        searchPlaceholder="Search by name, employee ID, or skills..."
        onAdd={() => {
          resetForm()
          setDialogOpen(true)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchOperators}
        emptyMessage="No operators found"
      />

      {/* Add/Edit Operator Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOperator ? 'Edit Operator' : 'Add New Operator'}
            </DialogTitle>
            <DialogDescription>
              {editingOperator 
                ? 'Update the operator information below.'
                : 'Fill in the information to add a new operator.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="e.g., EMP001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Skills</Label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-md">
                {AVAILABLE_SKILLS.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={formData.skills.includes(skill)}
                      onCheckedChange={(checked) => handleSkillToggle(skill, checked as boolean)}
                    />
                    <Label htmlFor={skill} className="text-sm font-normal">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active Operator</Label>
            </div>

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
                {submitLoading ? 'Saving...' : (editingOperator ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}