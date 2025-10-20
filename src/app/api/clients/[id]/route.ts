import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  region: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
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
    const validatedData = updateClientSchema.parse(body)

    const client = await db.client.update({
      where: { id: parseInt(params.id) },
      data: {
        name: validatedData.name,
        region: validatedData.region || null,
        department: validatedData.department || null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id)

    // Check if client has any production orders
    const ordersCount = await db.productionOrder.count({
      where: { clientId }
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing production orders' },
        { status: 400 }
      )
    }

    await db.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}