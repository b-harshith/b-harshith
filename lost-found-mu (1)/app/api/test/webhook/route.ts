import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test if webhook endpoint is accessible
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/webhook`, {
      method: "GET",
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Webhook endpoint is accessible and responding correctly",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Webhook endpoint returned status: ${response.status}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Webhook test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Webhook test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
