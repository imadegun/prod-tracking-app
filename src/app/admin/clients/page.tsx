"use client"

import React, { useState, useEffect } from 'react'
import { DataGrid, Column } from '@/components/ui/data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Building, MapPin, Globe } from 'lucide-react'

interface Client {
  id: number
  name: string
  region: string
  department: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    department: '',
    isActive: true
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  const columns: Column<Client>[] = [
    {
      key: 'name',
      title: 'Company Name',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      filterable: true,
      render: (value) => value || (
        <span className="text-muted-foreground italic">N/A</span>
      )
    },
    {
      key: 'region',
      title: 'Region',
      sortable: true,
      filterable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground italic">N/A</span>
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
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      toast.error('Failed to load clients')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const url = editingClient 
        ? `/api/clients/${editingClient.id}`
        : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save client')

      toast.success(`Client ${editingClient ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      resetForm()
      fetchClients()
    } catch (error) {
      toast.error('Failed to save client')
      console.error('Submit error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      region: client.region || '',
      department: client.department || '',
      isActive: client.isActive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (client: Client) => {
    // This will be handled by the DataGrid component
  }

  const resetForm = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      region: '',
      department: '',
      isActive: true
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clients Management</h1>
        <p className="text-muted-foreground">Manage client companies and their regional information</p>
      </div>

      <DataGrid
        data={clients}
        columns={columns}
        loading={loading}
        title="Clients"
        searchPlaceholder="Search by company name, region, or department..."
        onAdd={() => {
          resetForm()
          setDialogOpen(true)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchClients}
        emptyMessage="No clients found"
      />

      {/* Add/Edit Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription>
              {editingClient 
                ? 'Update the client information below.'
                : 'Fill in the information to add a new client.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Bvlgari"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="e.g., Bali"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., F&B"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active Client</Label>
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
                {submitLoading ? 'Saving...' : (editingClient ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}