import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, address, phone, email } = body

    // Validate input
    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Check if company code already exists
    const existingCompany = await db.company.findUnique({
      where: { code }
    })

    if (existingCompany) {
      return NextResponse.json({ error: 'Company code already exists' }, { status: 409 })
    }

    // Create company
    const company = await db.company.create({
      data: {
        name,
        code: code.toUpperCase(),
        address: address || null,
        phone: phone || null,
        email: email || null,
        settings: JSON.stringify({
          workingDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'monday'],
          overtimeDays: ['saturday', 'sunday'],
          rejectLimit: 10
        })
      }
    })

    // Create default production stages for the new company
    const stages = [
      { name: 'Throwing', code: 'throwing', backgroundColor: '#FF6B6B', displayOrder: 1, description: 'Initial shaping of ceramic pieces' },
      { name: 'Trimming', code: 'trimming', backgroundColor: '#4ECDC4', displayOrder: 2, description: 'Refining and trimming excess clay' },
      { name: 'Decoration', code: 'decoration', backgroundColor: '#45B7D1', displayOrder: 3, description: 'Applying decorative elements' },
      { name: 'Drying', code: 'drying', backgroundColor: '#96CEB4', displayOrder: 4, description: 'Air drying before firing' },
      { name: 'Bisquit Loading', code: 'bisquit_loading', backgroundColor: '#FFEAA7', displayOrder: 5, description: 'Loading into bisquit kiln' },
      { name: 'Bisquit Firing', code: 'bisquit_firing', backgroundColor: '#DDA0DD', displayOrder: 6, description: 'First firing process' },
      { name: 'Bisquit Exit', code: 'bisquit_exit', backgroundColor: '#98D8C8', displayOrder: 7, description: 'Unloading from bisquit kiln' },
      { name: 'Sanding/Waxing', code: 'sanding_waxing', backgroundColor: '#F7DC6F', displayOrder: 8, description: 'Surface preparation' },
      { name: 'Glazing', code: 'glazing', backgroundColor: '#BB8FCE', displayOrder: 9, description: 'Applying glaze coating' },
      { name: 'High-Fire', code: 'high_fire', backgroundColor: '#85C1E9', displayOrder: 10, description: 'Final firing at high temperature' },
      { name: 'Quality Control', code: 'quality_control', backgroundColor: '#F8C471', displayOrder: 11, description: 'Final inspection and testing' }
    ]

    for (const stage of stages) {
      await db.productionStage.create({
        data: {
          companyId: company.id,
          ...stage
        }
      })
    }

    return NextResponse.json(company, { status: 201 })

  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companies = await db.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            operators: true,
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(companies)

  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}