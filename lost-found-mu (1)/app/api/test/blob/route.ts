import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const testContent = `Test file created at ${new Date().toISOString()}`
    const blob = await put(`test/test-${Date.now()}.txt`, testContent, {
      access: "public",
    })

    if (blob.url) {
      return NextResponse.json({
        success: true,
        message: `Blob storage working! Test file uploaded: ${blob.url}`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Blob storage failed - no URL returned",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Blob test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Blob storage test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
