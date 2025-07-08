"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

interface Item {
  item_id: number
  reporter_id: string
  report_type: "LOST" | "FOUND"
  category: string
  description: string
  photo_url?: string
  location: string
  status: "ACTIVE" | "CLAIMED"
  claim_code?: string
  reported_at: string
  claimed_at?: string
}

interface Stats {
  totalItems: number
  activeItems: number
  claimedItems: number
  recoveryRate: number
}

export default function AdminDashboard() {
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<Stats>({ totalItems: 0, activeItems: 0, claimedItems: 0, recoveryRate: 0 })
  const [claimCode, setClaimCode] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/items")
      const data = await response.json()
      setItems(data.items)
      setStats(data.stats)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimItem = async () => {
    if (!claimCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a claim code",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimCode: claimCode.trim() }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Item "${result.item.description}" has been marked as claimed`,
        })
        setClaimCode("")
        fetchData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to claim item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim item",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lost and Found@MU - Admin Dashboard</h1>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Claimed Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.claimedItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.recoveryRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Claim Item Section */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter claim code (e.g., MU-4F8F)"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleClaimItem}>Mark as Claimed</Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Tabs */}
      <Tabs defaultValue="found" className="space-y-4">
        <TabsList>
          <TabsTrigger value="found">Found Items</TabsTrigger>
          <TabsTrigger value="lost">Lost Items</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Items</TabsTrigger>
        </TabsList>

        <TabsContent value="found" className="space-y-4">
          <div className="grid gap-4">
            {items
              .filter((item) => item.report_type === "FOUND" && item.status === "ACTIVE")
              .map((item) => (
                <Card key={item.item_id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">Found</Badge>
                          {item.claim_code && <Badge variant="default">{item.claim_code}</Badge>}
                        </div>
                        <h3 className="font-semibold mb-1">{item.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">📍 {item.location}</p>
                        <p className="text-xs text-gray-500">Reported: {formatDate(item.reported_at)}</p>
                      </div>
                      {item.photo_url && (
                        <img
                          src={item.photo_url || "/placeholder.svg"}
                          alt="Item photo"
                          className="w-20 h-20 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="lost" className="space-y-4">
          <div className="grid gap-4">
            {items
              .filter((item) => item.report_type === "LOST" && item.status === "ACTIVE")
              .map((item) => (
                <Card key={item.item_id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="destructive">Lost</Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{item.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">📍 Last seen: {item.location}</p>
                        <p className="text-xs text-gray-500">Reported: {formatDate(item.reported_at)}</p>
                      </div>
                      {item.photo_url && (
                        <img
                          src={item.photo_url || "/placeholder.svg"}
                          alt="Item photo"
                          className="w-20 h-20 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          <div className="grid gap-4">
            {items
              .filter((item) => item.status === "CLAIMED")
              .map((item) => (
                <Card key={item.item_id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant={item.report_type === "FOUND" ? "outline" : "destructive"}>
                            {item.report_type}
                          </Badge>
                          <Badge variant="default">Claimed</Badge>
                          {item.claim_code && <Badge variant="outline">{item.claim_code}</Badge>}
                        </div>
                        <h3 className="font-semibold mb-1">{item.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">📍 {item.location}</p>
                        <div className="text-xs text-gray-500">
                          <p>Reported: {formatDate(item.reported_at)}</p>
                          {item.claimed_at && <p>Claimed: {formatDate(item.claimed_at)}</p>}
                        </div>
                      </div>
                      {item.photo_url && (
                        <img
                          src={item.photo_url || "/placeholder.svg"}
                          alt="Item photo"
                          className="w-20 h-20 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
