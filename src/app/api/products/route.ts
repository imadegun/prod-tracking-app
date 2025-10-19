import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createProductSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      orderBy: [
        { isActive: 'desc' },
        { code: 'asc' }
      ]
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Check if product code already exists
    const existingProduct = await db.product.findFirst({
      where: { code: validatedData.code }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}