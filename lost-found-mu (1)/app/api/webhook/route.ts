import { type NextRequest, NextResponse } from "next/server"
import { BotLogic } from "@/lib/bot-logic"
import { Database } from "@/lib/database"

export async function GET(request: NextRequest) {
  console.log("🔍 Webhook GET request received - Twilio verification")

  // Add headers to prevent caching for API routes
  const response = new NextResponse("Webhook is active", {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })

  return response
}

export async function POST(request: NextRequest) {
  console.log("📨 Webhook POST request received")

  try {
    // Check if database is initialized
    const dbInitialized = await Database.isDatabaseInitialized()
    if (!dbInitialized) {
      console.log("⚠️ Database not initialized, attempting to initialize...")

      // Try to initialize database
      try {
        const initResponse = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/init-db`, {
          method: "POST",
        })

        if (initResponse.ok) {
          console.log("✅ Database initialized successfully")
        } else {
          console.error("❌ Failed to initialize database")
          return new NextResponse("Database initialization failed", { status: 500 })
        }
      } catch (initError) {
        console.error("❌ Database initialization error:", initError)
        return new NextResponse("Database initialization failed", { status: 500 })
      }
    }

    // Log request headers for debugging
    console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()))

    // Parse Twilio's form-encoded webhook data
    const formData = await request.formData()
    const twilioBody: any = {}

    for (const [key, value] of formData.entries()) {
      twilioBody[key] = value
    }

    console.log("📦 Parsed Twilio body:", {
      From: twilioBody.From,
      To: twilioBody.To,
      Body: twilioBody.Body,
      MessageSid: twilioBody.MessageSid,
      AccountSid: twilioBody.AccountSid,
      MediaUrl0: twilioBody.MediaUrl0 ? "Present" : "None",
    })

    // Verify this is a WhatsApp message
    if (twilioBody.From && twilioBody.From.startsWith("whatsapp:")) {
      console.log("✅ Valid WhatsApp message detected, processing...")
      await BotLogic.processMessage(twilioBody)
      console.log("✅ Message processed successfully")
    } else {
      console.log("❌ Not a WhatsApp message, ignoring:", twilioBody.From)
    }

    // Twilio expects an empty 200 response with no-cache headers
    const response = new NextResponse("", {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    return response
  } catch (error) {
    console.error("❌ Webhook error:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Still return 200 to Twilio to avoid retries, but with no-cache headers
    const response = new NextResponse("", {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    return response
  }
}

// Add OPTIONS method to handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log("🔧 Webhook OPTIONS request received")

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
