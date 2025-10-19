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
    const isResolved = searchParams.get('isResolved')
    const severity = searchParams.get('severity')

    // Build where clause
    const where: any = {
      companyId: session.user.companyId
    }

    if (isResolved !== null) {
      where.isResolved = isResolved === 'true'
    }

    if (severity) {
      where.severity = severity
    }

    const alerts = await db.alert.findMany({
      where,
      include: {
        resolver: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      },
      orderBy: [
        { isResolved: 'asc' },
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(alerts)

  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      alertType,
      severity,
      title,
      message,
      relatedRecordId,
      relatedRecordType
    } = body

    // Validate input
    if (!alertType || !title || !message) {
      return NextResponse.json({ error: 'Alert type, title, and message are required' }, { status: 400 })
    }

    // Create alert
    const alert = await db.alert.create({
      data: {
        companyId: session.user.companyId,
        alertType,
        severity: severity || 'medium',
        title,
        message,
        relatedRecordId: relatedRecordId || null,
        relatedRecordType: relatedRecordType || null
      }
    })

    return NextResponse.json(alert, { status: 201 })

  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}