"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface DashboardData {
  userStats: {
    totalUsers: number
    activeUsers: number
    completedOnboarding: number
    byInterest: { interest: string; count: number }[]
  }
  eventStats: {
    totalEvents: number
    approvedEvents: number
    pendingEvents: number
    upcomingEvents: number
  }
  queueStats: {
    pending: number
    sent: number
    failed: number
    total: number
  }
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/queue/process', { method: 'POST' })
      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Message queue processed successfully",
      })
      
      // Refresh data
      fetchDashboardData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process queue",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Failed to load dashboard data</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loki Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline">
            Refresh
          </Button>
          <Button onClick={processQueue} disabled={processing}>
            {processing ? 'Processing...' : 'Process Queue'}
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userStats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.userStats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onboarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.userStats.completedOnboarding}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.userStats.totalUsers > 0 
                ? Math.round((data.userStats.completedOnboarding / data.userStats.totalUsers) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Event Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.eventStats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.eventStats.pendingEvents}</div>
              <div className="text-sm text-gray-600">Pending Approval</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.eventStats.approvedEvents}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.eventStats.upcomingEvents}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle>Message Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.queueStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.queueStats.sent}</div>
              <div className="text-sm text-gray-600">Sent (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.queueStats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.queueStats.total}</div>
              <div className="text-sm text-gray-600">Total (24h)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Interests Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Interests Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.userStats.byInterest.map((interest) => (
              <div key={interest.interest} className="text-center">
                <div className="text-xl font-bold">{interest.count}</div>
                <div className="text-sm text-gray-600">{interest.interest}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => window.location.href = '/admin/events'}
              className="h-20 flex flex-col"
            >
              <span className="text-2xl mb-1">🎉</span>
              <span>Manage Events</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/faqs'}
              className="h-20 flex flex-col"
              variant="outline"
            >
              <span className="text-2xl mb-1">❓</span>
              <span>Manage FAQs</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="h-20 flex flex-col"
              variant="outline"
            >
              <span className="text-2xl mb-1">🔍</span>
              <span>Lost & Found</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/search'}
              className="h-20 flex flex-col"
              variant="outline"
            >
              <span className="text-2xl mb-1">🔎</span>
              <span>Search Portal</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}