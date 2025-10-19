'use client'

import { ProfessionalLayout } from '@/components/layout/professional-layout'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfessionalLayout role="superadmin">
      {children}
    </ProfessionalLayout>
  )
}