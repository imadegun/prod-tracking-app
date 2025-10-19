'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ProfessionalHeader } from './professional-header'
import { ProfessionalSidebar } from './professional-sidebar'
import { cn } from '@/lib/utils'

interface ProfessionalLayoutProps {
  role: 'admin' | 'input' | 'superadmin'
  children: React.ReactNode
  className?: string
}

export function ProfessionalLayout({ role, children, className }: ProfessionalLayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Default to hidden

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleSidebarClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "w-0 lg:w-0 overflow-hidden" : "w-64 lg:w-64"
      )}>
        <ProfessionalSidebar
          role={role}
          isOpen={!sidebarCollapsed}
          onClose={handleSidebarClose}
          className="h-full"
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <ProfessionalHeader
          role={role}
          companyName={session?.user?.company?.name}
          onMenuClick={handleMenuClick}
          showMenuButton={true}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page content */}
        <main className={cn("flex-1 container px-4 py-6 lg:px-6", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}