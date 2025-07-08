import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Lost and Found@MU</h1>
          <p className="text-xl text-gray-600 mb-8">WhatsApp Chatbot for Mahindra University Community</p>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 mb-6">
              Loki is your friendly campus assistant for reporting and finding lost items. Connect with our WhatsApp bot
              to report lost items, help others find their belongings, and stay updated with community alerts.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🔍 Report Lost Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Quickly report lost items with photos and descriptions. Get instant community alerts when similar items
                are found.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🙌 Report Found Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Help fellow students by reporting found items. All found items are securely stored at the ECOLE main
                block reception.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📱 WhatsApp Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Easy-to-use WhatsApp interface with buttons and menus. Get real-time notifications about lost and found
                items.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Start chatting with Loki on WhatsApp:</p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-mono text-lg text-green-800">+91 XXXXX XXXXX</p>
                <p className="text-sm text-green-600 mt-2">Send "Hi" to get started!</p>
              </div>
              <p className="text-xs text-gray-500">* WhatsApp number will be provided after deployment</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/admin">
            <Button variant="outline" size="lg">
              Admin Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2">1. Message Loki</h3>
                <p className="text-sm text-gray-600">Send "Hi" to our WhatsApp bot to get started</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold mb-2">2. Report Item</h3>
                <p className="text-sm text-gray-600">Choose lost or found, add details and photos</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📢</span>
                </div>
                <h3 className="font-semibold mb-2">3. Community Alert</h3>
                <p className="text-sm text-gray-600">Your report is broadcast to all MU students</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="font-semibold mb-2">4. Collect at Reception</h3>
                <p className="text-sm text-gray-600">Found items are collected at ECOLE main block reception</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
