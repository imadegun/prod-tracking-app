import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const { clientId, deliveryDate, priority, status, notes, orderItems } = body

    // Validate input
    if (!clientId || !deliveryDate || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ 
        error: 'Client ID, delivery date, and at least one order item are required' 
      }, { status: 400 })
    }

    // Check if order exists and belongs to user's company
    const existingOrder = await db.productionOrder.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 })
    }

    // Validate order items
    for (const item of orderItems) {
      if (!item.productId || !item.qtyOrdered || parseInt(item.qtyOrdered) <= 0) {
        return NextResponse.json({ 
          error: 'Each order item must have a valid product and quantity' 
        }, { status: 400 })
      }
    }

    // Update production order and items in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the production order
      const productionOrder = await tx.productionOrder.update({
        where: { id },
        data: {
          clientId: parseInt(clientId),
          deliveryDate: new Date(deliveryDate),
          priority: parseInt(priority) || 1,
          status: status || 'pending',
          notes: notes || null
        }
      })

      // Delete existing order items
      await tx.productionOrderItem.deleteMany({
        where: { productionOrderId: id }
      })

      // Create new order items
      const createdItems = await Promise.all(
        orderItems.map((item: any) =>
          tx.productionOrderItem.create({
            data: {
              productionOrderId: productionOrder.id,
              productId: parseInt(item.productId),
              qtyOrdered: parseInt(item.qtyOrdered),
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

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error updating production order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)

    // Check if order exists and belongs to user's company
    const existingOrder = await db.productionOrder.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      },
      include: {
        _count: {
          select: {
            workPlans: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 })
    }

    // Check if order has existing work plans
    if (existingOrder._count.workPlans > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete order with existing work plans' 
      }, { status: 400 })
    }

    // Delete production order (cascade will delete order items)
    await db.productionOrder.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Production order deleted successfully' })

  } catch (error) {
    console.error('Error deleting production order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}