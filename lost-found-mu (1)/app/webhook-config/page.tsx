"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function WebhookConfig() {
  const [currentUrl, setCurrentUrl] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const url = window.location.origin
      setCurrentUrl(url)
      setWebhookUrl(`${url}/api/webhook`)
    }
  }, [])

  const testWebhook = async () => {
    if (!mounted) return

    setTesting(true)
    setTestResult(null)

    try {
      // Test GET request (webhook verification)
      const getResponse = await fetch("/api/webhook", { method: "GET" })

      if (getResponse.ok) {
        setTestResult({
          status: "success",
          message: "Webhook endpoint is accessible and responding correctly!",
        })
      } else {
        setTestResult({
          status: "error",
          message: `Webhook GET test failed with status: ${getResponse.status}`,
        })
      }
    } catch (error) {
      setTestResult({
        status: "error",
        message: `Webhook test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }

    setTesting(false)
  }

  const copyToClipboard = (text: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🔗 Webhook Configuration</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔗 Webhook Configuration</h1>
        <p className="text-gray-600">Configure your Twilio WhatsApp webhook to connect with your bot</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Webhook URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono" />
              <Button onClick={() => copyToClipboard(webhookUrl)} variant="outline">
                Copy
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={testWebhook} disabled={testing}>
                {testing ? "Testing..." : "🧪 Test Webhook"}
              </Button>
            </div>
            {testResult && (
              <div
                className={`p-3 rounded-lg ${testResult.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <div className="flex items-center gap-2">
                  {testResult.status === "success" ? (
                    <Badge className="bg-green-500">✅ Success</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Error</Badge>
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Twilio Configuration Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">Step 1: Open Twilio Console</h4>
                <p className="text-sm text-gray-600">
                  Go to{" "}
                  <a
                    href="https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Twilio WhatsApp Sandbox Settings
                  </a>
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">Step 2: Configure Webhook</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>When a message comes in:</strong>
                  </p>
                  <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">{webhookUrl}</div>
                  <p>
                    <strong>HTTP Method:</strong> POST
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">Step 3: Save & Test</h4>
                <p className="text-sm text-gray-600">
                  Click "Save Configuration" in Twilio, then send "Hi" to your WhatsApp sandbox number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔍 Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Common Issues:</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Still getting default message:</strong> Webhook URL might be incorrect or not saved
                  </li>
                  <li>
                    <strong>No response at all:</strong> Check if your app is deployed and accessible
                  </li>
                  <li>
                    <strong>Error responses:</strong> Check Vercel function logs for errors
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Verification Steps:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Ensure your app is deployed to Vercel</li>
                  <li>Test the webhook URL above shows ✅ Success</li>
                  <li>Copy the exact webhook URL to Twilio (no extra spaces)</li>
                  <li>Make sure HTTP method is set to POST</li>
                  <li>Save the configuration in Twilio</li>
                  <li>Wait 1-2 minutes for changes to take effect</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📱 Test Your Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">After configuring the webhook:</h4>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Send "Hi" to your Twilio WhatsApp sandbox number</li>
                <li>You should receive: "👋 Welcome to Lost and Found@MU! I'm L-Fy..."</li>
                <li>If you still get the default message, double-check your webhook URL</li>
                <li>Check Vercel function logs for any errors</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
