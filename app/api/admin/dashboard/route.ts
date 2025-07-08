import { NextResponse } from "next/server"
import { EnhancedDatabase } from "@/lib/enhanced-database"
import { MessageQueue } from "@/lib/message-queue"

export async function GET() {
  try {
    const userStats = await EnhancedDatabase.getUserEngagementStats()
    const eventStats = await EnhancedDatabase.getEventStats()
    const queueStats = await MessageQueue.getQueueStats()
    
    return NextResponse.json({
      userStats,
      eventStats,
      queueStats
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}