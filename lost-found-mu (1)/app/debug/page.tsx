"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function DebugPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook`)
    }
  }, [])

  const runWebhookTests = async () => {
    if (!mounted || !webhookUrl) return

    setTesting(true)
    setTestResults([])

    const tests = [
      {
        name: "GET Request Test",
        method: "GET",
        url: webhookUrl,
      },
      {
        name: "POST Request Test",
        method: "POST",
        url: webhookUrl,
        body: new URLSearchParams({
          From: "whatsapp:+1234567890",
          To: "whatsapp:+14155238886",
          Body: "Test message",
          MessageSid: "test123",
          AccountSid: "test456",
        }),
      },
      {
        name: "OPTIONS Request Test",
        method: "OPTIONS",
        url: webhookUrl,
      },
    ]

    for (const test of tests) {
      try {
        setTestResults((prev) => [
          ...prev,
          {
            name: test.name,
            status: "testing",
            message: "Running...",
          },
        ])

        const response = await fetch(test.url, {
          method: test.method,
          body: test.body,
          headers: test.body
            ? {
                "Content-Type": "application/x-www-form-urlencoded",
              }
            : undefined,
        })

        const responseText = await response.text()
        const cacheHeader = response.headers.get("x-vercel-cache") || "Not cached"

        setTestResults((prev) =>
          prev.map((result) =>
            result.name === test.name
              ? {
                  name: test.name,
                  status: response.ok ? "success" : "error",
                  message: `Status: ${response.status}, Cache: ${cacheHeader}, Response: ${responseText.substring(0, 100)}`,
                  details: {
                    status: response.status,
                    cache: cacheHeader,
                    headers: Object.fromEntries(response.headers.entries()),
                  },
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
                  message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                }
              : result,
          ),
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setTesting(false)
  }

  const clearCache = async () => {
    if (!mounted || !webhookUrl) return

    try {
      // Force a cache bust by adding a timestamp
      const timestamp = Date.now()
      const response = await fetch(`/api/webhook?t=${timestamp}`, {
        method: "GET",
        cache: "no-cache",
      })

      alert(`Cache cleared! Response: ${response.status}`)
    } catch (error) {
      alert(`Error clearing cache: ${error}`)
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

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🐛 Webhook Debug Tool</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🐛 Webhook Debug Tool</h1>
        <p className="text-gray-600">Debug the 405 Method Not Allowed error</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={webhookUrl} readOnly className="font-mono" />
          <div className="flex gap-2">
            <Button onClick={runWebhookTests} disabled={testing || !webhookUrl}>
              {testing ? "Testing..." : "🧪 Test All Methods"}
            </Button>
            <Button onClick={clearCache} variant="outline" disabled={!webhookUrl}>
              🗑️ Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.name}</h3>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600">View Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🔧 Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">405 Method Not Allowed - Causes:</h4>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Edge cache is serving a cached GET response for POST requests</li>
              <li>API route doesn't properly export POST method</li>
              <li>Vercel routing configuration issues</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Solutions Applied:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Added no-cache headers to all responses</li>
              <li>Added OPTIONS method handler</li>
              <li>Updated next.config.mjs with cache headers</li>
              <li>Added vercel.json configuration</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Deploy the updated code</li>
              <li>Run the tests above to verify all methods work</li>
              <li>Update Twilio webhook URL if needed</li>
              <li>Test with WhatsApp message</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
