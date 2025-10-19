import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateProductSchema = z.object({
  code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  color: z.string().optional(),
  texture: z.string().optional(),
  material: z.string().optional(),
  notes: z.string().optional(),
  standardTime: z.number().positive().optional(),
  difficultyLevel: z.number().int().min(1).max(5).default(3),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Check if product code already exists for another product
    const existingProduct = await db.product.findFirst({
      where: {
        code: validatedData.code,
        id: { not: parseInt(params.id) }
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 }
      )
    }

    const product = await db.product.update({
      where: { id: parseInt(params.id) },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        color: validatedData.color || null,
        texture: validatedData.texture || null,
        material: validatedData.material || null,
        notes: validatedData.notes || null,
        standardTime: validatedData.standardTime || null,
        difficultyLevel: validatedData.difficultyLevel,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)

    // Check if product has any production order items
    const orderItemsCount = await db.productionOrderItem.count({
      where: { productId }
    })

    if (orderItemsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing order items' },
        { status: 400 }
      )
    }

    // Check if product has any work plans
    const workPlansCount = await db.workPlan.count({
      where: { productId }
    })

    if (workPlansCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing work plans' },
        { status: 400 }
      )
    }

    // Check if product has any monthly targets
    const targetsCount = await db.monthlyTarget.count({
      where: { productId }
    })

    if (targetsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing monthly targets' },
        { status: 400 }
      )
    }

    await db.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}