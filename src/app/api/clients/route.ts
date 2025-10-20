import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  region: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const clients = await db.client.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Get company info for single-tenant setup
    const company = await db.company.findFirst()
    if (!company) {
      return NextResponse.json(
        { error: 'No company found. Please set up a company first.' },
        { status: 400 }
      )
    }

    const client = await db.client.create({
      data: {
        companyId: company.id,
        name: validatedData.name,
        region: validatedData.region || null,
        department: validatedData.department || null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}