import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    // Test database connection by trying to create a test user
    const testUserId = `test_${Date.now()}`
    const user = await Database.createUser(testUserId, false)

    if (user && user.user_id === testUserId) {
      return NextResponse.json({
        success: true,
        message: "Database connection successful! Tables are accessible and user creation works.",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed - user creation returned unexpected result",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
