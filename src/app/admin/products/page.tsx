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
import { Plus, Edit, Copy, Package, Palette, Layers, Clock } from 'lucide-react'

interface Product {
  id: number
  code: string
  name: string
  color: string
  texture: string
  material: string
  notes: string
  standardTime: number
  difficultyLevel: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const DIFFICULTY_LEVELS = [
  { value: 1, label: '1 - Very Easy' },
  { value: 2, label: '2 - Easy' },
  { value: 3, label: '3 - Medium' },
  { value: 4, label: '4 - Hard' },
  { value: 5, label: '5 - Very Hard' }
]

const COMMON_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 
  'Brown', 'Gray', 'Orange', 'Purple', 'Pink', 'Turquoise'
]

const COMMON_TEXTURES = [
  'Smooth', 'Rough', 'Matte', 'Glossy', 'Textured', 'Polished',
  'Crackled', 'Speckled', 'Marbled', 'Glazed', 'Unglazed'
]

const COMMON_MATERIALS = [
  'Stoneware', 'Porcelain', 'Earthenware', 'Kaolin', 'Ball Clay',
  'Fire Clay', 'Terra Cotta', 'Raku', 'Porcelaneous'
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: '',
    texture: '',
    material: '',
    notes: '',
    standardTime: '',
    difficultyLevel: 3,
    isActive: true
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  const columns: Column<Product>[] = [
    {
      key: 'code',
      title: 'Product Code',
      sortable: true,
      filterable: true,
      width: '120px',
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'name',
      title: 'Product Name',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'color',
      title: 'Color',
      filterable: true,
      filterOptions: COMMON_COLORS.map(color => ({ value: color, label: color })),
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border border-gray-300" 
            style={{ 
              backgroundColor: value.toLowerCase() === 'white' ? '#f3f4f6' : 
                           value.toLowerCase() === 'black' ? '#000000' :
                           value.toLowerCase() === 'red' ? '#ef4444' :
                           value.toLowerCase() === 'blue' ? '#3b82f6' :
                           value.toLowerCase() === 'green' ? '#10b981' :
                           value.toLowerCase() === 'yellow' ? '#eab308' :
                           value.toLowerCase() === 'orange' ? '#f97316' :
                           value.toLowerCase() === 'purple' ? '#a855f7' :
                           value.toLowerCase() === 'pink' ? '#ec4899' :
                           '#6b7280'
            }}
          />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground italic">N/A</span>
      )
    },
    {
      key: 'texture',
      title: 'Texture',
      filterable: true,
      filterOptions: COMMON_TEXTURES.map(texture => ({ value: texture, label: texture })),
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground italic">N/A</span>
      )
    },
    {
      key: 'material',
      title: 'Material',
      filterable: true,
      filterOptions: COMMON_MATERIALS.map(material => ({ value: material, label: material })),
      render: (value) => value || (
        <span className="text-muted-foreground italic">N/A</span>
      )
    },
    {
      key: 'standardTime',
      title: 'Standard Time',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{value}h</span>
        </div>
      ) : (
        <span className="text-muted-foreground italic">N/A</span>
      )
    },
    {
      key: 'difficultyLevel',
      title: 'Difficulty',
      sortable: true,
      filterable: true,
      filterOptions: DIFFICULTY_LEVELS.map(level => ({ value: level.value.toString(), label: level.label })),
      render: (value) => (
        <Badge 
          variant={value <= 2 ? 'secondary' : value <= 3 ? 'default' : 'destructive'}
          className="w-16 justify-center"
        >
          {value}
        </Badge>
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
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          color: formData.color === 'none' ? '' : formData.color,
          texture: formData.texture === 'none' ? '' : formData.texture,
          material: formData.material === 'none' ? '' : formData.material,
          standardTime: formData.standardTime ? parseFloat(formData.standardTime) : null
        })
      })

      if (!response.ok) throw new Error('Failed to save product')

      toast.success(`Product ${editingClient ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      toast.error('Failed to save product')
      console.error('Submit error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsDuplicating(false)
    setFormData({
      code: product.code,
      name: product.name,
      color: product.color || 'none',
      texture: product.texture || 'none',
      material: product.material || 'none',
      notes: product.notes || '',
      standardTime: product.standardTime?.toString() || '',
      difficultyLevel: product.difficultyLevel || 3,
      isActive: product.isActive
    })
    setDialogOpen(true)
  }

  const handleDuplicate = (product: Product) => {
    setEditingProduct(product)
    setIsDuplicating(true)
    setFormData({
      code: `${product.code}-COPY`,
      name: `${product.name} (Copy)`,
      color: product.color || 'none',
      texture: product.texture || 'none',
      material: product.material || 'none',
      notes: product.notes || '',
      standardTime: product.standardTime?.toString() || '',
      difficultyLevel: product.difficultyLevel || 3,
      isActive: product.isActive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    // This will be handled by the DataGrid component
  }

  const resetForm = () => {
    setEditingProduct(null)
    setIsDuplicating(false)
    setFormData({
      code: '',
      name: '',
      color: 'none',
      texture: 'none',
      material: 'none',
      notes: '',
      standardTime: '',
      difficultyLevel: 3,
      isActive: true
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <p className="text-muted-foreground">Manage ceramic products and their specifications</p>
      </div>

      <DataGrid
        data={products}
        columns={columns}
        loading={loading}
        title="Products"
        searchPlaceholder="Search by product code, name, color, or material..."
        onAdd={() => {
          resetForm()
          setDialogOpen(true)
        }}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRefresh={fetchProducts}
        emptyMessage="No products found"
      />

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isDuplicating ? 'Duplicate Product' : (editingProduct ? 'Edit Product' : 'Add New Product')}
            </DialogTitle>
            <DialogDescription>
              {isDuplicating 
                ? 'Create a copy of this product with a new code.'
                : editingProduct 
                  ? 'Update the product information below.'
                  : 'Fill in the information to add a new product.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Product Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., CER001"
                  required
                  disabled={isDuplicating}
                />
                {isDuplicating && (
                  <p className="text-xs text-muted-foreground">
                    Modify the code to make it unique
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ceramic Vase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No color</SelectItem>
                    {COMMON_COLORS.map(color => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="texture">Texture</Label>
                <Select value={formData.texture} onValueChange={(value) => setFormData(prev => ({ ...prev, texture: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select texture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No texture</SelectItem>
                    {COMMON_TEXTURES.map(texture => (
                      <SelectItem key={texture} value={texture}>{texture}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={formData.material} onValueChange={(value) => setFormData(prev => ({ ...prev, material: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No material</SelectItem>
                    {COMMON_MATERIALS.map(material => (
                      <SelectItem key={material} value={material}>{material}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardTime">Standard Time (hours)</Label>
                <Input
                  id="standardTime"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.standardTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, standardTime: e.target.value }))}
                  placeholder="e.g., 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                <Select 
                  value={formData.difficultyLevel.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficultyLevel: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this product..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active Product</Label>
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
                {submitLoading ? 'Saving...' : (isDuplicating ? 'Duplicate' : (editingProduct ? 'Update' : 'Create'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}