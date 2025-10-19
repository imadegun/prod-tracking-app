import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    role: string
    fullName: string
    companyId: number
    company: {
      id: number
      name: string
      code: string
      settings: string
    }
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      username: string
      role: string
      fullName: string
      companyId: number
      company: {
        id: number
        name: string
        code: string
        settings: string
      }
    } & DefaultSession['user']
  }
}