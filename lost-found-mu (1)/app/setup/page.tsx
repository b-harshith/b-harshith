import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SetupGuide() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🚀 Twilio WhatsApp Setup Guide</h1>
        <p className="text-gray-600">Follow these steps to set up your WhatsApp chatbot with Twilio</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 1</Badge>
              Create Twilio Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://www.twilio.com/try-twilio"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  twilio.com/try-twilio
                </a>
              </li>
              <li>Sign up for a free account (you get $15 credit)</li>
              <li>Verify your phone number</li>
              <li>Complete the onboarding questionnaire</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 2</Badge>
              Get Your Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">From Twilio Console:</h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.twilio.com"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    console.twilio.com
                  </a>
                </li>
                <li>
                  Find your <strong>Account SID</strong> and <strong>Auth Token</strong> on the dashboard
                </li>
                <li>Copy these values - you'll need them for environment variables</li>
              </ol>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Environment Variables:</h4>
              <pre className="text-sm bg-white p-2 rounded border">
                {`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 3</Badge>
              Enable WhatsApp Sandbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                In Twilio Console, go to <strong>Messaging</strong> → <strong>Try it out</strong> →{" "}
                <strong>Send a WhatsApp message</strong>
              </li>
              <li>You'll see a sandbox WhatsApp number (e.g., +1 415 523 8886)</li>
              <li>Follow the instructions to join the sandbox by sending a code to that number</li>
              <li>Copy the sandbox number for your environment variables</li>
            </ol>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Add to Environment Variables:</h4>
              <pre className="text-sm bg-white p-2 rounded border">
                {`TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 4</Badge>
              Configure Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Deploy your app to Vercel first</li>
              <li>
                In Twilio Console, go to <strong>Messaging</strong> → <strong>Settings</strong> →{" "}
                <strong>WhatsApp sandbox settings</strong>
              </li>
              <li>
                Set the webhook URL to:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">https://your-app.vercel.app/api/webhook</code>
              </li>
              <li>
                Set HTTP method to <strong>POST</strong>
              </li>
              <li>Save the configuration</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 5</Badge>
              Test Your Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Send "Hi" to your Twilio WhatsApp sandbox number</li>
              <li>You should receive the welcome message from L-Fy</li>
              <li>Try the menu options by replying with numbers (1, 2, 3)</li>
              <li>Test reporting a lost or found item</li>
            </ol>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">⚠️ Sandbox Limitations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Only pre-approved numbers can receive messages</li>
                <li>Messages expire after 24 hours of inactivity</li>
                <li>For production, you'll need to request WhatsApp Business API approval</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Step 6</Badge>
              Production Setup (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 mb-4">For production use with unlimited messaging:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Apply for WhatsApp Business API approval in Twilio Console</li>
              <li>Provide business verification documents</li>
              <li>Wait for approval (can take 1-2 weeks)</li>
              <li>Get your dedicated WhatsApp Business number</li>
              <li>Update environment variables with production credentials</li>
            </ol>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💰 Pricing:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Sandbox: Free for testing</li>
                <li>Production: ~$0.005 per message</li>
                <li>Business-initiated conversations: ~$0.016 per conversation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>✅</Badge>
              Complete Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {`# Database (from Neon integration)
DATABASE_URL=your_neon_database_url

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Vercel Blob Storage (from Blob integration)
BLOB_READ_WRITE_TOKEN=your_blob_token`}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 You're All Set!</h3>
        <p className="text-green-700">
          Once you've completed these steps, your Lost and Found@MU chatbot will be ready to help the Mahindra
          University community find their lost items!
        </p>
      </div>
    </div>
  )
}
