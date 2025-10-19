import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')
    const operatorId = searchParams.get('operatorId')
    const date = searchParams.get('date')

    // Build where clause
    const where: any = {
      companyId: session.user.companyId
    }

    if (weekStart) {
      where.weekStart = new Date(weekStart)
    }

    if (operatorId) {
      where.operatorId = parseInt(operatorId)
    }

    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.plannedDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const workPlans = await db.workPlan.findMany({
      where,
      include: {
        operator: true,
        product: true,
        productionStage: true,
        productionOrder: {
          include: {
            client: true
          }
        },
        productionOrderItem: true,
        productionRecords: {
          select: {
            id: true,
            recordedDate: true,
            completedQuantity: true,
            goodQuantity: true,
            rejectQuantity: true
          }
        }
      },
      orderBy: [
        { plannedDate: 'asc' },
        { productionStage: { displayOrder: 'asc' } }
      ]
    })

    return NextResponse.json(workPlans)

  } catch (error) {
    console.error('Error fetching work plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      weekStart,
      operatorId,
      productionOrderId,
      productionOrderItemId,
      productId,
      productionStageId,
      decorationDetail,
      targetQuantity,
      plannedDate,
      isOvertime,
      notes
    } = body

    // Validate input
    if (!weekStart || !operatorId || !productId || !productionStageId || !targetQuantity || !plannedDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if work plan already exists for this combination
    const existingWorkPlan = await db.workPlan.findFirst({
      where: {
        companyId: session.user.companyId,
        weekStart: new Date(weekStart),
        operatorId,
        plannedDate: new Date(plannedDate),
        productionStageId
      }
    })

    if (existingWorkPlan) {
      return NextResponse.json({ error: 'Work plan already exists for this operator, date, and stage' }, { status: 409 })
    }

    // Create work plan
    const workPlan = await db.workPlan.create({
      data: {
        companyId: session.user.companyId,
        weekStart: new Date(weekStart),
        operatorId,
        productionOrderId: productionOrderId || null,
        productionOrderItemId: productionOrderItemId || null,
        productId,
        productionStageId,
        decorationDetail: decorationDetail || null,
        targetQuantity,
        plannedDate: new Date(plannedDate),
        isOvertime: isOvertime || false,
        notes: notes || null
      },
      include: {
        operator: true,
        product: true,
        productionStage: true,
        productionOrder: {
          include: {
            client: true
          }
        }
      }
    })

    return NextResponse.json(workPlan, { status: 201 })

  } catch (error) {
    console.error('Error creating work plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}