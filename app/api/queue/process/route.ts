import { NextResponse } from "next/server"
import { MessageQueue } from "@/lib/message-queue"

export async function POST() {
  try {
    await MessageQueue.processQueue()
    const stats = await MessageQueue.getQueueStats()
    
    return NextResponse.json({ 
      message: "Queue processed successfully",
      stats 
    })
  } catch (error) {
    console.error("Error processing queue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stats = await MessageQueue.getQueueStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error getting queue stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}