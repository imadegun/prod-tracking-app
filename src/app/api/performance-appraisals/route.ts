import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createAppraisalSchema = z.object({
  operatorId: z.number().positive('Operator ID is required'),
  productionRecordId: z.number().optional(),
  appraisalType: z.enum(['success', 'human_error']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  impact: z.string().optional(),
  correctiveAction: z.string().optional(),
  preventionAction: z.string().optional(),
  appraisalDate: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operatorId = searchParams.get('operatorId')
    const appraisalType = searchParams.get('appraisalType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (operatorId) {
      where.operatorId = parseInt(operatorId)
    }
    
    if (appraisalType) {
      where.appraisalType = appraisalType
    }

    const [appraisals, total] = await Promise.all([
      db.performanceAppraisal.findMany({
        where,
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
        },
        orderBy: [
          { appraisalDate: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.performanceAppraisal.count({ where })
    ])

    return NextResponse.json({
      data: appraisals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching performance appraisals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance appraisals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAppraisalSchema.parse(body)

    // Verify operator exists
    const operator = await db.operator.findUnique({
      where: { id: validatedData.operatorId }
    })

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // If production record is provided, verify it exists and belongs to the operator
    if (validatedData.productionRecordId) {
      const productionRecord = await db.productionRecord.findFirst({
        where: {
          id: validatedData.productionRecordId,
          workPlan: {
            operatorId: validatedData.operatorId
          }
        }
      })

      if (!productionRecord) {
        return NextResponse.json(
          { error: 'Production record not found or does not belong to this operator' },
          { status: 404 }
        )
      }
    }

    const appraisal = await db.performanceAppraisal.create({
      data: {
        operatorId: validatedData.operatorId,
        productionRecordId: validatedData.productionRecordId,
        appraisalType: validatedData.appraisalType,
        category: validatedData.category,
        description: validatedData.description,
        severity: validatedData.severity,
        impact: validatedData.impact,
        correctiveAction: validatedData.correctiveAction,
        preventionAction: validatedData.preventionAction,
        appraisalDate: validatedData.appraisalDate 
          ? new Date(validatedData.appraisalDate)
          : new Date(),
        recordedBy: 1 // TODO: Get from authenticated user
      },
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
        }
      }
    })

    return NextResponse.json(appraisal, { status: 201 })
  } catch (error) {
    console.error('Error creating performance appraisal:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create performance appraisal' },
      { status: 500 }
    )
  }
}