"use client"

import React, { useState, useMemo } from 'react'
import { Input } from './input'
import { Button } from './button'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Label } from './label'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  X,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

export interface Column<T> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  filterOptions?: { value: string; label: string }[]
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: string
}

export interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onAdd?: () => void
  onEdit?: (record: T) => void
  onDelete?: (record: T) => Promise<void>
  onDuplicate?: (record: T) => void
  onView?: (record: T) => void
  onRefresh?: () => void
  title?: string
  searchPlaceholder?: string
  emptyMessage?: string
  pageSize?: number
  showActions?: boolean
  customActions?: (record: T) => React.ReactNode
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onRefresh,
  title,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  pageSize = 10,
  showActions = true,
  customActions,
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<T | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(record =>
        columns.some(column => {
          const value = record[column.key]
          return value && 
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(record => {
          const recordValue = record[key]
          return recordValue && recordValue.toString() === value
        })
      }
    })

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        let comparison = 0
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue)
        } else {
          comparison = aValue - bValue
        }
        
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return
    
    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column.key as keyof T)
      setSortDirection('asc')
    }
  }

  const handleFilter = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
    setCurrentPage(1)
  }

  const handleDelete = async (record: T) => {
    if (!onDelete) return
    
    setDeleteLoading(true)
    try {
      await onDelete(record)
      toast.success('Record deleted successfully')
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
      onRefresh?.()
    } catch (error) {
      toast.error('Failed to delete record')
      console.error('Delete error:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const confirmDelete = (record: T) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({})
    setSortColumn(null)
    setSortDirection('asc')
    setCurrentPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            )}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            {(searchTerm || Object.values(filters).some(v => v && v !== 'all')) && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
          
          {/* Column Filters */}
          <div className="flex gap-2 flex-wrap">
            {columns.filter(col => col.filterable && col.filterOptions).map(column => (
              <Select
                key={String(column.key)}
                value={filters[String(column.key)] || 'all'}
                onValueChange={(value) => handleFilter(String(column.key), value)}
              >
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={`Filter by ${column.title}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {column.title}</SelectItem>
                  {column.filterOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead 
                        key={String(column.key)}
                        style={{ width: column.width }}
                        className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center gap-2">
                          {column.title}
                          {column.sortable && sortColumn === column.key && (
                            <span className="text-xs">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    {showActions && (
                      <TableHead className="w-24">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="text-center py-8">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((record, index) => (
                      <TableRow key={record.id || index}>
                        {columns.map((column) => (
                          <TableCell key={String(column.key)}>
                            {column.render 
                              ? column.render(record[column.key], record, index)
                              : record[column.key]
                            }
                          </TableCell>
                        ))}
                        {showActions && (
                          <TableCell>
                            <div className="flex gap-1">
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onView(record)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDuplicate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDuplicate(record)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDelete(record)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {customActions?.(record)}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => recordToDelete && handleDelete(recordToDelete)}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}