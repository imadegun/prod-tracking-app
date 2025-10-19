'use client'

import { ProfessionalLayout } from '@/components/layout/professional-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfessionalLayout role="admin">
      {children}
    </ProfessionalLayout>
  )
}