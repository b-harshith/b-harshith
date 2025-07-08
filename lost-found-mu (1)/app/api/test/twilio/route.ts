import { NextResponse } from "next/server"

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken || !whatsappNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Twilio environment variables. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER",
        },
        { status: 400 },
      )
    }

    // Test Twilio API connection
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: `Twilio connection successful! Account: ${data.friendly_name || accountSid}`,
      })
    } else {
      const error = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: `Twilio API error: ${response.status} - ${error}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Twilio test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Twilio test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
