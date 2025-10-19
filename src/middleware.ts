import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirect based on role if accessing root
    if (pathname === '/') {
      if (token?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin/companies', req.url))
      } else if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (token?.role === 'inputdata') {
        return NextResponse.redirect(new URL('/input/record', req.url))
      }
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && token?.role !== 'admin' && token?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (pathname.startsWith('/superadmin') && token?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (pathname.startsWith('/input') && token?.role !== 'inputdata' && token?.role !== 'admin' && token?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)',
  ]
}