import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workPlanId,
      completedQuantity,
      goodQuantity,
      rejectQuantity,
      rejectReason,
      rejectStage,
      notes,
      startTime,
      endTime,
      recordedDate
    } = body

    // Validate input
    if (!workPlanId || completedQuantity === undefined || goodQuantity === undefined || rejectQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate quantities
    if (completedQuantity < 0 || goodQuantity < 0 || rejectQuantity < 0) {
      return NextResponse.json({ error: 'Quantities cannot be negative' }, { status: 400 })
    }

    if (goodQuantity + rejectQuantity !== completedQuantity) {
      return NextResponse.json({ error: 'Good quantity plus reject quantity must equal completed quantity' }, { status: 400 })
    }

    // Check if work plan exists and user has access
    const workPlan = await db.workPlan.findFirst({
      where: {
        id: workPlanId,
        companyId: session.user.companyId
      }
    })

    if (!workPlan) {
      return NextResponse.json({ error: 'Work plan not found' }, { status: 404 })
    }

    // Check if record already exists for this date
    const existingRecord = await db.productionRecord.findFirst({
      where: {
        workPlanId,
        recordedDate: new Date(recordedDate)
      }
    })

    if (existingRecord) {
      return NextResponse.json({ error: 'Production record already exists for this date' }, { status: 409 })
    }

    // Create production record
    const productionRecord = await db.productionRecord.create({
      data: {
        workPlanId,
        recordedDate: new Date(recordedDate),
        recordedBy: parseInt(session.user.id),
        completedQuantity,
        goodQuantity,
        rejectQuantity,
        rejectReason: rejectQuantity > 0 ? rejectReason : null,
        rejectStage: rejectQuantity > 0 ? rejectStage : null,
        notes: notes || null,
        startTime: startTime ? new Date(`2000-01-01T${startTime}`) : null,
        endTime: endTime ? new Date(`2000-01-01T${endTime}`) : null
      },
      include: {
        workPlan: {
          include: {
            operator: true,
            product: true,
            productionStage: true
          }
        },
        recorder: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    // Check for alerts (reject limit exceeded)
    if (rejectQuantity > 0) {
      const companySettings = JSON.parse(session.user.company.settings || '{}')
      const rejectLimit = companySettings.rejectLimit || 10

      if (rejectQuantity > rejectLimit) {
        await db.alert.create({
          data: {
            companyId: session.user.companyId,
            alertType: 'reject_limit_exceeded',
            severity: 'high',
            title: 'Reject Limit Exceeded',
            message: `Reject quantity (${rejectQuantity}) exceeds limit (${rejectLimit}) for ${workPlan.product.name} at ${workPlan.productionStage.name} stage`,
            relatedRecordId: productionRecord.id,
            relatedRecordType: 'production_record'
          }
        })
      }
    }

    return NextResponse.json(productionRecord, { status: 201 })

  } catch (error) {
    console.error('Error creating production record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const operatorId = searchParams.get('operatorId')
    const stageId = searchParams.get('stageId')

    // Build where clause
    const where: any = {
      workPlan: {
        companyId: session.user.companyId
      }
    }

    if (date) {
      where.recordedDate = new Date(date)
    }

    if (operatorId) {
      where.workPlan.operatorId = parseInt(operatorId)
    }

    if (stageId) {
      where.workPlan.productionStageId = parseInt(stageId)
    }

    const productionRecords = await db.productionRecord.findMany({
      where,
      include: {
        workPlan: {
          include: {
            operator: true,
            product: true,
            productionStage: true
          }
        },
        recorder: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      },
      orderBy: {
        recordedDate: 'desc'
      }
    })

    return NextResponse.json(productionRecords)

  } catch (error) {
    console.error('Error fetching production records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}