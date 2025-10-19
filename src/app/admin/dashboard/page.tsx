'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  Target, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  BarChart3,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session } = useSession()

  const stats = [
    {
      title: 'Active Operators',
      value: '12',
      change: '+2 from last month',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Weekly Plans',
      value: '48',
      change: '+8 from last week',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Monthly Target',
      value: '85%',
      change: '+5% from last month',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'Active Alerts',
      value: '3',
      change: '-2 from yesterday',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ]

  const quickActions = [
    {
      title: 'Create Work Plan',
      description: 'Generate weekly production schedules',
      icon: Calendar,
      href: '/admin/planning',
      color: 'bg-blue-500'
    },
    {
      title: 'Add Operator',
      description: 'Register new production operator',
      icon: Users,
      href: '/admin/operators',
      color: 'bg-green-500'
    },
    {
      title: 'Production Report',
      description: 'View detailed analytics',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.fullName || session?.user?.username}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {session?.user?.company?.name}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {action.description}
              </p>
              <Link href={action.href}>
                <Button size="sm" className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest production updates and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New work plan created for Week 45</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Production target achieved: 95%</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quality alert: Reject limit exceeded</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}