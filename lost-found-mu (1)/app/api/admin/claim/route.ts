import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { claimCode } = await request.json()

    if (!claimCode) {
      return NextResponse.json({ error: "Claim code is required" }, { status: 400 })
    }

    const claimedItem = await Database.claimItem(claimCode)

    if (!claimedItem) {
      return NextResponse.json({ error: "No active item found with this claim code" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Item claimed successfully",
      item: claimedItem,
    })
  } catch (error) {
    console.error("Error claiming item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
