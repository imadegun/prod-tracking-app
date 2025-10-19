'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Building,
  FileText,
  Factory,
  Target,
  AlertTriangle,
  TrendingUp,
  Archive,
  HelpCircle
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
  description?: string
  group?: string
}

interface ProfessionalSidebarProps {
  role: 'admin' | 'input' | 'superadmin'
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

const navigationConfig = {
  admin: {
    items: [
      {
        group: 'Main',
        items: [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, description: 'Overview and statistics' },
          { name: 'Planning', href: '/admin/planning', icon: Calendar, description: 'Work planning and scheduling' },
        ]
      },
      {
        group: 'Management',
        items: [
          { name: 'Operators', href: '/admin/operators', icon: Users, description: 'Manage operators' },
          { name: 'Clients', href: '/admin/clients', icon: Building, description: 'Client management' },
          { name: 'Products', href: '/admin/products', icon: Package, description: 'Product catalog' },
          { name: 'Orders', href: '/admin/orders', icon: FileText, description: 'Production orders' },
        ]
      },
      {
        group: 'Analytics',
        items: [
          { name: 'Reports', href: '/admin/reports', icon: BarChart3, description: 'Reports and analytics' },
          { name: 'Targets', href: '/admin/targets', icon: Target, description: 'Monthly targets' },
          { name: 'Alerts', href: '/admin/alerts', icon: AlertTriangle, description: 'System alerts', badge: '3' },
        ]
      },
      {
        group: 'System',
        items: [
          { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'System settings' },
        ]
      }
    ]
  },
  input: {
    items: [
      {
        group: 'Production',
        items: [
          { name: 'Production Record', href: '/input/record', icon: Factory, description: 'Record daily production' },
          { name: 'My Progress', href: '/input/progress', icon: TrendingUp, description: 'View my progress' },
        ]
      },
      {
        group: 'Support',
        items: [
          { name: 'Help', href: '/input/help', icon: HelpCircle, description: 'Get help' },
        ]
      }
    ]
  },
  superadmin: {
    items: [
      {
        group: 'System Management',
        items: [
          { name: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard, description: 'System overview' },
          { name: 'Companies', href: '/superadmin/companies', icon: Building, description: 'Manage companies' },
          { name: 'Users', href: '/superadmin/users', icon: Users, description: 'User management' },
        ]
      },
      {
        group: 'System',
        items: [
          { name: 'Settings', href: '/superadmin/settings', icon: Settings, description: 'System configuration' },
          { name: 'Archive', href: '/superadmin/archive', icon: Archive, description: 'Data archive' },
        ]
      }
    ]
  }
}

export function ProfessionalSidebar({ 
  role, 
  isOpen = true, 
  onClose, 
  className 
}: ProfessionalSidebarProps) {
  const pathname = usePathname()
  const config = navigationConfig[role]

  const renderNavigationGroup = (group: { group: string; items: NavigationItem[] }) => (
    <div key={group.group} className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold text-gradient-teal uppercase tracking-wider">
        {group.group}
      </h3>
      <div className="space-y-1">
        {group.items.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <TooltipProvider key={item.name}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-teal text-white shadow-gradient-teal"
                        : "text-muted-foreground hover:text-white hover:bg-gradient-teal/80"
                    )}
                    onClick={() => onClose?.()}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-gradient-orange text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right" className="flex flex-col gap-1">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-br from-teal-50 to-orange-50 border-r border-gradient-teal transition-all duration-300",
      isOpen ? "w-64" : "w-16",
      className
    )}>
      {/* Logo/Brand Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gradient-teal/20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-teal flex items-center justify-center shadow-gradient-teal">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {isOpen && (
            <div>
              <h2 className="text-lg font-semibold text-gradient-teal">TrackPro</h2>
              <p className="text-xs text-gradient-orange capitalize">{role} Panel</p>
            </div>
          )}
        </div>
        {isOpen && onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex hover-gradient-orange transition-all duration-300"
            onClick={onClose}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {config.items.map(renderNavigationGroup)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gradient-teal/20">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-gradient-teal rounded-full shadow-gradient-teal"></div>
          {isOpen && (
            <span className="text-xs text-gradient-teal">System Online</span>
          )}
        </div>
      </div>
    </div>
  )
}