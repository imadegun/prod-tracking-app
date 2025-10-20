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
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    // Build where clause
    const where: any = {
      companyId: session.user.companyId
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = parseInt(clientId)
    }

    const orders = await db.productionOrder.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            department: true
          }
        },
        productionOrderItems: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            workPlans: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { deliveryDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(orders)

  } catch (error) {
    console.error('Error fetching production orders:', error)
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
    const { clientId, poNo, deliveryDate, priority, status, notes, orderItems } = body

    // Validate input
    if (!clientId || !poNo || !deliveryDate || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ 
        error: 'Client ID, PO number, delivery date, and at least one order item are required' 
      }, { status: 400 })
    }

    // Check if PO number already exists
    const existingOrder = await db.productionOrder.findFirst({
      where: {
        poNo,
        companyId: session.user.companyId
      }
    })

    if (existingOrder) {
      return NextResponse.json({ error: 'PO number already exists' }, { status: 409 })
    }

    // Validate order items
    for (const item of orderItems) {
      if (!item.productId || !item.qtyOrdered || parseInt(item.qtyOrdered) <= 0) {
        return NextResponse.json({ 
          error: 'Each order item must have a valid product and quantity' 
        }, { status: 400 })
      }
      
      // Validate qtyForming or calculate it
      const qtyForming = item.qtyForming ? parseInt(item.qtyForming) : Math.round(parseInt(item.qtyOrdered) * 1.15)
      if (qtyForming <= 0) {
        return NextResponse.json({ 
          error: 'Each order item must have a valid forming quantity' 
        }, { status: 400 })
      }
    }

    // Create production order with items in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the production order
      const productionOrder = await tx.productionOrder.create({
        data: {
          companyId: session.user.companyId,
          clientId: parseInt(clientId),
          poNo,
          deliveryDate: new Date(deliveryDate),
          priority: parseInt(priority) || 1,
          status: status || 'pending',
          notes: notes || null
        }
      })

      // Create order items
      const createdItems = await Promise.all(
        orderItems.map((item: any) =>
          tx.productionOrderItem.create({
            data: {
              productionOrderId: productionOrder.id,
              productId: parseInt(item.productId),
              qtyOrdered: parseInt(item.qtyOrdered),
              qtyForming: item.qtyForming ? parseInt(item.qtyForming) : Math.round(parseInt(item.qtyOrdered) * 1.15),
              notes: item.notes || null
            }
          })
        )
      )

      return {
        ...productionOrder,
        productionOrderItems: createdItems
      }
    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Error creating production order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}