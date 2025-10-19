'use client'

import { ProfessionalLayout } from '@/components/layout/professional-layout'

export default function InputLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfessionalLayout role="input">
      {children}
    </ProfessionalLayout>
  )
}