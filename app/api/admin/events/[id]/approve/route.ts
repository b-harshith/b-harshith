import { NextResponse } from "next/server"
import { EnhancedDatabase } from "@/lib/enhanced-database"
import { EnhancedBotLogic } from "@/lib/enhanced-bot-logic"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    
    const event = await EnhancedDatabase.approveEvent(eventId)
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Trigger broadcast process
    await EnhancedBotLogic.broadcastApprovedEvents()
    
    return NextResponse.json({ 
      message: "Event approved and broadcast initiated",
      event 
    })
  } catch (error) {
    console.error("Error approving event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}