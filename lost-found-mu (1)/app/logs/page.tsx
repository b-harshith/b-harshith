"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function LogAnalyzer() {
  const [logText, setLogText] = useState("")
  const [analysis, setAnalysis] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  const analyzeLog = () => {
    if (!logText.trim()) return

    const lines = logText.split("\n")
    const analysis = {
      webhookReceived: lines.some((line) => line.includes("📨 Webhook POST request received")),
      databaseInitialized: lines.some((line) => line.includes("✅ Database initialized successfully")),
      userCreated: lines.some((line) => line.includes("✅ User created successfully")),
      welcomeSent: lines.some((line) => line.includes("✅ Welcome message sent")),
      menuSent: lines.some((line) => line.includes("✅ Main menu sent successfully")),
      messageProcessed: lines.some((line) => line.includes("✅ Message processed successfully")),
      errors: lines.filter((line) => line.includes("❌")).length,
      warnings: lines.filter((line) => line.includes("⚠️")).length,
    }

    setAnalysis(analysis)
  }

  const runSystemTests = async () => {
    setTestResults([])

    const tests = [
      { name: "Database Status", endpoint: "/api/init-db", method: "GET" },
      { name: "Webhook Endpoint", endpoint: "/api/webhook", method: "GET" },
      { name: "Admin Dashboard", endpoint: "/api/admin/items", method: "GET" },
    ]

    for (const test of tests) {
      try {
        setTestResults((prev) => [...prev, { name: test.name, status: "testing", message: "Running..." }])

        const response = await fetch(test.endpoint, { method: test.method })
        const data = await response.json()

        setTestResults((prev) =>
          prev.map((result) =>
            result.name === test.name
              ? {
                  name: test.name,
                  status: response.ok ? "success" : "error",
                  message: response.ok ? "✅ Working" : `❌ Error: ${data.error || response.status}`,
                }
              : result,
          ),
        )
      } catch (error) {
        setTestResults((prev) =>
          prev.map((result) =>
            result.name === test.name
              ? {
                  name: test.name,
                  status: "error",
                  message: `❌ Network Error: ${error instanceof Error ? error.message : "Unknown"}`,
                }
              : result,
          ),
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">✅ Pass</Badge>
      case "error":
        return <Badge variant="destructive">❌ Fail</Badge>
      case "testing":
        return <Badge variant="outline">⏳ Testing...</Badge>
      default:
        return <Badge variant="outline">❓ Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">📊 Log Analysis & Monitoring</h1>
        <p className="text-gray-600">Analyze Vercel function logs and test system components</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Log Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Log Analyzer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Paste Vercel Logs Here:</label>
              <Textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Paste your Vercel function logs here..."
                className="h-32 font-mono text-xs"
              />
            </div>
            <Button onClick={analyzeLog} disabled={!logText.trim()}>
              🔍 Analyze Logs
            </Button>

            {analysis && (
              <div className="space-y-2">
                <h4 className="font-semibold">Analysis Results:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {analysis.webhookReceived ? "✅" : "❌"} Webhook Received
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.databaseInitialized ? "✅" : "❌"} DB Initialized
                  </div>
                  <div className="flex items-center gap-2">{analysis.userCreated ? "✅" : "❌"} User Created</div>
                  <div className="flex items-center gap-2">{analysis.welcomeSent ? "✅" : "❌"} Welcome Sent</div>
                  <div className="flex items-center gap-2">{analysis.menuSent ? "✅" : "❌"} Menu Sent</div>
                  <div className="flex items-center gap-2">
                    {analysis.messageProcessed ? "✅" : "❌"} Message Processed
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    <span className="text-red-600">❌ Errors: {analysis.errors}</span> |{" "}
                    <span className="text-yellow-600">⚠️ Warnings: {analysis.warnings}</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Tests */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 System Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runSystemTests} className="w-full">
              🚀 Run All Tests
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{result.name}</span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <span className="text-xs text-gray-600">{result.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📖 How to Monitor Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Step 1: Access Logs</h4>
              <p className="text-sm text-gray-600">
                Go to{" "}
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel Dashboard
                </a>{" "}
                → Your Project → Functions → View Logs
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold">Step 2: Send Test Message</h4>
              <p className="text-sm text-gray-600">
                Send "Hi" to your WhatsApp bot and watch the real-time logs for the initialization sequence
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold">Step 3: Analyze Results</h4>
              <p className="text-sm text-gray-600">
                Copy the logs and paste them in the analyzer above to check for success/error patterns
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🎯 What to Look For:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Database Initialization:</strong> "✅ Database initialized successfully"
              </li>
              <li>
                <strong>User Creation:</strong> "✅ User created successfully"
              </li>
              <li>
                <strong>Message Sending:</strong> "✅ Welcome message sent"
              </li>
              <li>
                <strong>Complete Flow:</strong> "✅ Message processed successfully"
              </li>
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Common Issues:</h4>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Database Errors:</strong> "relation does not exist" - Database not initialized
              </li>
              <li>
                <strong>Twilio Errors:</strong> "401 Unauthorized" - Check API credentials
              </li>
              <li>
                <strong>Network Errors:</strong> "ECONNREFUSED" - Service unavailable
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
