"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SetupDatabase() {
  const [status, setStatus] = useState<"idle" | "checking" | "initializing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [dbStats, setDbStats] = useState<{ users: number; items: number } | null>(null)

  const checkDatabase = async () => {
    setStatus("checking")
    setMessage("Checking database status...")

    try {
      const response = await fetch("/api/init-db", { method: "GET" })
      const data = await response.json()

      if (data.success) {
        if (data.tablesExist) {
          setStatus("success")
          setMessage("Database is already initialized and ready!")
          setDbStats(data.stats)
        } else {
          setStatus("error")
          setMessage("Database tables do not exist. Click 'Initialize Database' to create them.")
        }
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to check database status")
      }
    } catch (error) {
      setStatus("error")
      setMessage(`Error checking database: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const initializeDatabase = async () => {
    setStatus("initializing")
    setMessage("Creating database tables...")

    try {
      const response = await fetch("/api/init-db", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Database initialized successfully! Your bot is ready to use.")
        setDbStats(data.stats)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to initialize database")
      }
    } catch (error) {
      setStatus("error")
      setMessage(`Error initializing database: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">✅ Ready</Badge>
      case "error":
        return <Badge variant="destructive">❌ Error</Badge>
      case "checking":
      case "initializing":
        return <Badge variant="outline">⏳ Working...</Badge>
      default:
        return <Badge variant="outline">❓ Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🗄️ Database Setup</h1>
        <p className="text-gray-600">Initialize your Lost and Found@MU database tables</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Database Status
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{message || "Click 'Check Database' to verify your setup."}</p>

          {dbStats && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Database Statistics:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>👥 Users: {dbStats.users}</li>
                <li>📦 Items: {dbStats.items}</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={checkDatabase} disabled={status === "checking" || status === "initializing"}>
              {status === "checking" ? "Checking..." : "🔍 Check Database"}
            </Button>
            <Button
              onClick={initializeDatabase}
              disabled={status === "checking" || status === "initializing" || status === "success"}
              variant={status === "error" ? "default" : "outline"}
            >
              {status === "initializing" ? "Initializing..." : "🚀 Initialize Database"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Step 1: Check Database</h4>
              <p className="text-sm text-gray-600">Verify if your database tables already exist</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold">Step 2: Initialize (if needed)</h4>
              <p className="text-sm text-gray-600">Create the users and items tables with proper indexes</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold">Step 3: Test Your Bot</h4>
              <p className="text-sm text-gray-600">
                Once initialized, send "Hi" to your WhatsApp bot to test the complete flow
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>This only needs to be done once per database</li>
              <li>The webhook will auto-initialize if tables are missing</li>
              <li>All data is stored securely in your Neon database</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
