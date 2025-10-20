import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createOperatorSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  hireDate: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const operators = await db.operator.findMany({
      orderBy: [
        { isActive: 'desc' },
        { fullName: 'asc' }
      ]
    })

    return NextResponse.json(operators)
  } catch (error) {
    console.error('Error fetching operators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createOperatorSchema.parse(body)

    // Check if employee ID already exists
    const existingOperator = await db.operator.findFirst({
      where: { employeeId: validatedData.employeeId }
    })

    if (existingOperator) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      )
    }

    const operator = await db.operator.create({
      data: {
        employeeId: validatedData.employeeId,
        fullName: validatedData.fullName,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(operator, { status: 201 })
  } catch (error) {
    console.error('Error creating operator:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create operator' },
      { status: 500 }
    )
  }
}