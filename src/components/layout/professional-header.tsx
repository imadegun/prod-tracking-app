'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  HelpCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface ProfessionalHeaderProps {
  role: 'admin' | 'input' | 'superadmin'
  companyName?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
}

const roleConfig = {
  admin: {
    title: 'Production Administrator',
    color: 'bg-gradient-teal',
    settingsPath: '/admin/settings'
  },
  input: {
    title: 'Data Entry Operator',
    color: 'bg-gradient-orange',
    settingsPath: '/input/settings'
  },
  superadmin: {
    title: 'System Administrator',
    color: 'bg-gradient-accent',
    settingsPath: '/superadmin/settings'
  }
}

export function ProfessionalHeader({ 
  role, 
  companyName, 
  onMenuClick,
  showMenuButton = false,
  onToggleSidebar,
  sidebarCollapsed = false
}: ProfessionalHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const config = roleConfig[role]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <header className="w-full border-b border-gradient-teal bg-gradient-hero bg-opacity-10 backdrop-blur-lg supports-[backdrop-filter]:bg-gradient-hero/10">
      <div className="container flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          )}

          {/* Desktop Sidebar Toggle */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex hover-gradient-teal transition-all duration-300"
              onClick={onToggleSidebar}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg ${config.color} flex items-center justify-center`}>
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gradient-teal">TrackPro</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Production Tracking</p>
              </div>
            </div>

            {companyName && (
              <div className="hidden md:block">
                <Badge variant="outline" className="text-xs border-gradient-orange/30 text-gradient-orange bg-orange-50/50">
                  {companyName}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gradient-teal" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gradient-teal/30 focus:border-gradient-teal bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hover-gradient-teal transition-all duration-300">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-orange rounded-full"></span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" className="hover-gradient-orange transition-all duration-300">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover-gradient-teal transition-all duration-300">
                <Avatar className="h-9 w-9 ring-2 ring-gradient-teal/20">
                  <AvatarFallback className="bg-gradient-teal text-white font-semibold">
                    {session?.user?.fullName?.charAt(0) || session?.user?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.fullName || session?.user?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  <Badge variant="secondary" className="w-fit mt-1 bg-gradient-accent text-white">
                    {config.title}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={config.settingsPath} className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}