"use client"

import React, { useState, useEffect } from 'react'
import { DataGrid, Column } from '@/components/ui/data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Package, Calendar, User, AlertCircle, Trash2 } from 'lucide-react'

interface ProductionOrder {
  id: number
  poNo: string
  clientId: number
  client: {
    id: number
    name: string
    region: string
    department: string
  }
  deliveryDate: string
  priority: number
  status: string
  notes: string
  items: ProductionOrderItem[]
  createdAt: string
  updatedAt: string
}

interface ProductionOrderItem {
  id: number
  productionOrderId: number
  productId: number
  product: {
    id: number
    code: string
    name: string
    color: string
  }
  qtyOrdered: number
  qtyForming: number
  notes: string
}

interface Client {
  id: number
  name: string
  region: string
  department: string
}

interface Product {
  id: number
  code: string
  name: string
  color: string
}

const PRIORITY_LEVELS = [
  { value: 1, label: 'Normal', color: 'secondary' },
  { value: 2, label: 'High', color: 'default' },
  { value: 3, label: 'Urgent', color: 'destructive' }
]

const ORDER_STATUS = [
  { value: 'pending', label: 'Pending', color: 'secondary' },
  { value: 'in_progress', label: 'In Progress', color: 'default' },
  { value: 'completed', label: 'Completed', color: 'default' },
  { value: 'cancelled', label: 'Cancelled', color: 'destructive' }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null)
  const [formData, setFormData] = useState({
    poNo: '',
    clientId: '',
    deliveryDate: '',
    priority: 1,
    status: 'pending',
    notes: '',
    items: [] as Array<{
      productId: string
      qtyOrdered: string
      qtyForming: string
      notes: string
    }>
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'poNo',
      title: 'PO Number',
      sortable: true,
      filterable: true,
      width: '140px',
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'client',
      title: 'Client',
      sortable: true,
      filterable: true,
      render: (value: Client) => (
        <div>
          <div className="font-medium">{value.name}</div>
          <div className="text-sm text-muted-foreground">
            {value.region && `${value.region}`}
            {value.region && value.department && ' • '}
            {value.department && `${value.department}`}
          </div>
        </div>
      )
    },
    {
      key: 'deliveryDate',
      title: 'Delivery Date',
      sortable: true,
      render: (value) => {
        const date = new Date(value)
        const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString()
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
              {date.toLocaleDateString()}
            </span>
            {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        )
      }
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      filterable: true,
      filterOptions: PRIORITY_LEVELS.map(p => ({ value: p.value.toString(), label: p.label })),
      render: (value) => {
        const priority = PRIORITY_LEVELS.find(p => p.value === value)
        return (
          <Badge variant={priority?.color as any}>
            {priority?.label}
          </Badge>
        )
      }
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: ORDER_STATUS.map(s => ({ value: s.value, label: s.label })),
      render: (value) => {
        const status = ORDER_STATUS.find(s => s.value === value)
        return (
          <Badge variant={status?.color as any}>
            {status?.label}
          </Badge>
        )
      }
    },
    {
      key: 'items',
      title: 'Items',
      sortable: false,
      render: (value: ProductionOrderItem[]) => (
        <div>
          <div className="font-medium">{Array.isArray(value) ? value.length : 0} items</div>
          <div className="text-sm text-muted-foreground">
            {Array.isArray(value) ? value.reduce((sum, item) => sum + (item.qtyOrdered || 0), 0) : 0} total units
          </div>
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
    fetchOrders()
    fetchClients()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/production-orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data.map((order: any) => ({
        ...order,
        items: order.productionOrderItems,
        client: order.client
      })))
    } catch (error) {
      toast.error('Failed to load orders')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data.filter((c: Client) => c.isActive))
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.filter((p: Product) => p.isActive))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const url = editingOrder 
        ? `/api/production-orders/${editingOrder.id}`
        : '/api/production-orders'
      const method = editingOrder ? 'PUT' : 'POST'

      const orderData = {
        clientId: formData.clientId,
        poNo: formData.poNo,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes,
        orderItems: formData.items.map(item => ({
          productId: item.productId,
          qtyOrdered: item.qtyOrdered,
          qtyForming: item.qtyForming || Math.round(Number(item.qtyOrdered) * 1.15),
          notes: item.notes
        }))
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) throw new Error('Failed to save order')

      toast.success(`Order ${editingOrder ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      resetForm()
      fetchOrders()
    } catch (error) {
      toast.error('Failed to save order')
      console.error('Submit error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order)
    
    // Format the delivery date for the input field (YYYY-MM-DD)
    const formattedDeliveryDate = order.deliveryDate ? 
      new Date(order.deliveryDate).toISOString().split('T')[0] : ''
    
    setFormData({
      poNo: order.poNo,
      clientId: order.clientId.toString(),
      deliveryDate: formattedDeliveryDate,
      priority: order.priority,
      status: order.status,
      notes: order.notes || '',
      items: order.items.map(item => ({
        productId: item.productId.toString(),
        qtyOrdered: item.qtyOrdered.toString(),
        qtyForming: (item.qtyForming || Math.round(item.qtyOrdered * 1.15)).toString(),
        notes: item.notes || ''
      }))
    })
    setDialogOpen(true)
  }

  const handleDelete = async (order: ProductionOrder) => {
    try {
      const response = await fetch(`/api/production-orders/${order.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete order')

      toast.success('Order deleted successfully')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to delete order')
      console.error('Delete error:', error)
    }
  }

  const resetForm = () => {
    setEditingOrder(null)
    setFormData({
      poNo: '',
      clientId: '',
      deliveryDate: '',
      priority: 1,
      status: 'pending',
      notes: '',
      items: []
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', qtyOrdered: '', qtyForming: '', notes: '' }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-calculate qtyForming when qtyOrdered changes
          if (field === 'qtyOrdered' && value && !isNaN(Number(value))) {
            const qtyOrdered = Number(value)
            const calculatedForming = Math.round(qtyOrdered * 1.15) // Add 15% and round
            updatedItem.qtyForming = calculatedForming.toString()
          }
          
          return updatedItem
        }
        return item
      })
      
      return { ...prev, items: updatedItems }
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Production Orders</h1>
        <p className="text-muted-foreground">Manage client purchase orders and production requirements</p>
      </div>

      <DataGrid
        data={orders}
        columns={columns}
        loading={loading}
        title="Production Orders"
        searchPlaceholder="Search by PO number, client name..."
        onAdd={() => {
          resetForm()
          setDialogOpen(true)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchOrders}
        emptyMessage="No orders found"
      />

      {/* Add/Edit Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Production Order' : 'Add New Production Order'}
            </DialogTitle>
            <DialogDescription>
              {editingOrder 
                ? 'Update the production order information below.'
                : 'Fill in the information to create a new production order.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* First Row - Basic Order Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="poNo">PO Number *</Label>
                <Input
                  id="poNo"
                  value={formData.poNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, poNo: e.target.value }))}
                  placeholder="e.g., PO-2024-001"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}-{client.region || 'No Region'}-{client.department || 'No Department'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Delivery Date and Priority/Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value.toString()}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this order..."
                rows={4}
                className="w-full resize-none"
              />
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {formData.items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-md">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No items added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Item" to add products to this order</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.items.map((item, index) => (
                    <Card key={index} className="border-2 shadow-sm">
                      <CardContent className="p-6">
                        {/* Header with Remove Button */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium text-sm text-muted-foreground">Item {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Main Product and Quantity Fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor={`product-${index}`}>Product *</Label>
                            <Select 
                              value={item.productId} 
                              onValueChange={(value) => updateItem(index, 'productId', value)}
                            >
                              <SelectTrigger id={`product-${index}`} className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{product.code} - {product.name}</span>
                                      {product.color && (
                                        <span className="text-sm text-muted-foreground">Color: {product.color}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              value={item.qtyOrdered}
                              onChange={(e) => updateItem(index, 'qtyOrdered', e.target.value)}
                              placeholder="0"
                              required
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`qtyForming-${index}`}>Qty Forming *</Label>
                            <Input
                              id={`qtyForming-${index}`}
                              type="number"
                              min="1"
                              value={item.qtyForming}
                              onChange={(e) => updateItem(index, 'qtyForming', e.target.value)}
                              placeholder="Auto-calculated (15% extra)"
                              required
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Auto-calculated as Qty + 15% (editable)
                            </p>
                          </div>
                        </div>

                        {/* Full-width Notes Field */}
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${index}`}>Notes</Label>
                          <Textarea
                            id={`notes-${index}`}
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            placeholder="Enter any specific notes or requirements for this item..."
                            rows={3}
                            className="w-full resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
              <Button type="submit" disabled={submitLoading || formData.items.length === 0}>
                {submitLoading ? 'Saving...' : (editingOrder ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}