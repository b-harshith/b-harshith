"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, SearchIcon } from "lucide-react"

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

export default function SearchPage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [dateFilter, setDateFilter] = useState("all")

  const categories = ["ID & Finance", "Electronics", "Keys", "Apparel", "Personal Items", "Sports Gear", "Other"]

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, categoryFilter, typeFilter, statusFilter, dateFilter])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/admin/items")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = [...items]

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          (item.claim_code && item.claim_code.toLowerCase().includes(term)),
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.report_type === typeFilter)
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((item) => item.status === "ACTIVE")
    } else if (statusFilter === "claimed") {
      filtered = filtered.filter((item) => item.status === "CLAIMED")
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((item) => new Date(item.reported_at) >= filterDate)
    }

    setFilteredItems(filtered)
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

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setTypeFilter("all")
    setStatusFilter("active")
    setDateFilter("all")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading items...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔎 Lost and Found@MU - Search Portal</h1>
        <p className="text-gray-600">Search through all reported lost and found items on campus</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by description, location, category, or ItemID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={clearFilters} variant="outline">
              Clear All
            </Button>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LOST">Lost Items</SelectItem>
                <SelectItem value="FOUND">Found Items</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="claimed">Claimed Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredItems.length} of {items.length} items
            </span>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.item_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={item.report_type === "FOUND" ? "default" : "destructive"}>
                        {item.report_type}
                      </Badge>
                      <Badge variant="secondary">{item.category}</Badge>
                      <Badge variant={item.status === "ACTIVE" ? "outline" : "default"}>{item.status}</Badge>
                      {item.claim_code && (
                        <Badge variant="outline" className="font-mono">
                          {item.claim_code}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{item.description}</h3>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p className="flex items-center gap-1">
                        📍 <span className="font-medium">Location:</span> {item.location}
                      </p>
                      <p className="flex items-center gap-1">
                        📅 <span className="font-medium">Reported:</span> {formatDate(item.reported_at)}
                      </p>
                      {item.claimed_at && (
                        <p className="flex items-center gap-1">
                          ✅ <span className="font-medium">Claimed:</span> {formatDate(item.claimed_at)}
                        </p>
                      )}
                    </div>

                    {item.status === "ACTIVE" && item.report_type === "FOUND" && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>📞 To claim this item:</strong> Visit the ECOLE main block reception with your MU
                          Student ID and provide specific details about the item.
                        </p>
                      </div>
                    )}

                    {item.status === "ACTIVE" && item.report_type === "LOST" && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>🔍 Found this item?</strong> Please take it to the ECOLE main block reception or
                          report it via WhatsApp.
                        </p>
                      </div>
                    )}
                  </div>

                  {item.photo_url && (
                    <div className="ml-6">
                      <img
                        src={item.photo_url || "/placeholder.svg"}
                        alt="Item photo"
                        className="w-32 h-32 object-cover rounded-lg border"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Send "Hi" to our WhatsApp bot to report lost or found items, or get personalized assistance.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Results
            </Button>
            <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
