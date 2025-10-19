import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateOperatorSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  skills: z.array(z.string()).default([]),
  hireDate: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const operator = await db.operator.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(operator)
  } catch (error) {
    console.error('Error fetching operator:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operator' },
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
    const validatedData = updateOperatorSchema.parse(body)

    // Check if employee ID already exists for another operator
    const existingOperator = await db.operator.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        id: { not: parseInt(params.id) }
      }
    })

    if (existingOperator) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      )
    }

    const operator = await db.operator.update({
      where: { id: parseInt(params.id) },
      data: {
        employeeId: validatedData.employeeId,
        fullName: validatedData.fullName,
        skills: validatedData.skills,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(operator)
  } catch (error) {
    console.error('Error updating operator:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update operator' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const operatorId = parseInt(params.id)

    // Check if operator has any work plans
    const workPlansCount = await db.workPlan.count({
      where: { operatorId }
    })

    if (workPlansCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete operator with existing work plans' },
        { status: 400 }
      )
    }

    await db.operator.delete({
      where: { id: operatorId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting operator:', error)
    return NextResponse.json(
      { error: 'Failed to delete operator' },
      { status: 500 }
    )
  }
}