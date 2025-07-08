"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TestResult {
  test: string
  status: "pending" | "success" | "error"
  message: string
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    setResults([])

    const tests = [
      { name: "Database Connection", endpoint: "/api/test/database" },
      { name: "Twilio Configuration", endpoint: "/api/test/twilio" },
      { name: "Blob Storage", endpoint: "/api/test/blob" },
      { name: "Webhook Endpoint", endpoint: "/api/test/webhook" },
    ]

    for (const test of tests) {
      setResults((prev) => [...prev, { test: test.name, status: "pending", message: "Testing..." }])

      try {
        const response = await fetch(test.endpoint)
        const data = await response.json()

        setResults((prev) =>
          prev.map((result) =>
            result.test === test.name
              ? {
                  test: test.name,
                  status: response.ok ? "success" : "error",
                  message: data.message || data.error || "Unknown error",
                }
              : result,
          ),
        )
      } catch (error) {
        setResults((prev) =>
          prev.map((result) =>
            result.test === test.name
              ? {
                  test: test.name,
                  status: "error",
                  message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
                }
              : result,
          ),
        )
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setTesting(false)
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">✅ Pass</Badge>
      case "error":
        return <Badge variant="destructive">❌ Fail</Badge>
      case "pending":
        return <Badge variant="outline">⏳ Testing...</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🧪 System Health Check</h1>
        <p className="text-gray-600">Test all components of your Lost and Found@MU chatbot</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run System Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={testing} className="w-full">
            {testing ? "Running Tests..." : "🚀 Start Tests"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{result.test}</h3>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📱 WhatsApp Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Step 1: Join Twilio Sandbox</h4>
            <p className="text-sm">
              Send this message to your Twilio WhatsApp number:{" "}
              <code className="bg-white px-2 py-1 rounded">join [your-sandbox-code]</code>
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Step 2: Test the Bot</h4>
            <p className="text-sm">Send "Hi" to start chatting with L-Fy</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Step 3: Test Features</h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Try reporting a lost item (option 1)</li>
              <li>Try reporting a found item (option 2)</li>
              <li>Check your activity (option 3)</li>
              <li>Upload a photo during reporting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
