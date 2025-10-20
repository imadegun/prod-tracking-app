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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Edit, User, Calendar } from 'lucide-react'

interface Operator {
  id: number
  employeeId: string
  fullName: string
  hireDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
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
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </div>
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
      employeeId: operator.employeeId || '',
      fullName: operator.fullName || '',
      hireDate: operator.hireDate ? new Date(operator.hireDate).toISOString().split('T')[0] : '',
      isActive: operator.isActive ?? true
    })
    setDialogOpen(true)
  }

  const handleDelete = async (operator: Operator) => {
    try {
      const response = await fetch(`/api/operators/${operator.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete operator')
      }
      
      toast.success('Operator deleted successfully')
      fetchOperators()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete operator')
      console.error('Delete error:', error)
    }
  }

  const resetForm = () => {
    setEditingOperator(null)
    setFormData({
      employeeId: '',
      fullName: '',
      hireDate: '',
      isActive: true
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Operators Management</h1>
        <p className="text-muted-foreground">Manage production operators</p>
      </div>

      <DataGrid
        data={operators}
        columns={columns}
        loading={loading}
        title="Operators"
        searchPlaceholder="Search by name or employee ID..."
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
        <DialogContent className="max-w-md">
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

            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
              />
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