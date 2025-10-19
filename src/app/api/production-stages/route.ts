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
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: any = {
      companyId: session.user.companyId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const productionStages = await db.productionStage.findMany({
      where,
      orderBy: {
        displayOrder: 'asc'
      }
    })

    return NextResponse.json(productionStages)

  } catch (error) {
    console.error('Error fetching production stages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}