import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateAppraisalSchema = z.object({
  appraisalType: z.enum(['success', 'human_error']).optional(),
  category: z.string().min(1, 'Category is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  impact: z.string().optional(),
  correctiveAction: z.string().optional(),
  preventionAction: z.string().optional(),
  isResolved: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appraisal = await db.performanceAppraisal.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        operator: {
          select: {
            id: true,
            employeeId: true,
            fullName: true
          }
        },
        productionRecord: {
          include: {
            workPlan: {
              include: {
                product: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                },
                productionStage: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        recorder: {
          select: {
            id: true,
            fullName: true
          }
        },
        resolver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    if (!appraisal) {
      return NextResponse.json(
        { error: 'Performance appraisal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(appraisal)
  } catch (error) {
    console.error('Error fetching performance appraisal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance appraisal' },
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
    const validatedData = updateAppraisalSchema.parse(body)

    // Check if appraisal exists
    const existingAppraisal = await db.performanceAppraisal.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!existingAppraisal) {
      return NextResponse.json(
        { error: 'Performance appraisal not found' },
        { status: 404 }
      )
    }

    const updateData: any = { ...validatedData }

    // If resolving an error, add resolution details
    if (validatedData.isResolved && !existingAppraisal.isResolved) {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = 1 // TODO: Get from authenticated user
    } else if (!validatedData.isResolved && existingAppraisal.isResolved) {
      updateData.resolvedAt = null
      updateData.resolvedBy = null
    }

    const appraisal = await db.performanceAppraisal.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        operator: {
          select: {
            id: true,
            employeeId: true,
            fullName: true
          }
        },
        productionRecord: {
          include: {
            workPlan: {
              include: {
                product: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                },
                productionStage: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        recorder: {
          select: {
            id: true,
            fullName: true
          }
        },
        resolver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    return NextResponse.json(appraisal)
  } catch (error) {
    console.error('Error updating performance appraisal:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update performance appraisal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appraisalId = parseInt(params.id)

    // Check if appraisal exists
    const existingAppraisal = await db.performanceAppraisal.findUnique({
      where: { id: appraisalId }
    })

    if (!existingAppraisal) {
      return NextResponse.json(
        { error: 'Performance appraisal not found' },
        { status: 404 }
      )
    }

    await db.performanceAppraisal.delete({
      where: { id: appraisalId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting performance appraisal:', error)
    return NextResponse.json(
      { error: 'Failed to delete performance appraisal' },
      { status: 500 }
    )
  }
}