import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const items = await Database.getActiveItems()

    // Calculate stats
    const totalItems = items.length
    const activeItems = items.filter((item) => item.status === "ACTIVE").length
    const claimedItems = items.filter((item) => item.status === "CLAIMED").length
    const foundItems = items.filter((item) => item.report_type === "FOUND").length
    const recoveryRate = foundItems > 0 ? Math.round((claimedItems / foundItems) * 100) : 0

    const stats = {
      totalItems,
      activeItems,
      claimedItems,
      recoveryRate,
    }

    return NextResponse.json({ items, stats })
  } catch (error) {
    console.error("Error fetching admin data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
