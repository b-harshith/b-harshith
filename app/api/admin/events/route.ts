import { NextResponse } from "next/server"
import { EnhancedDatabase } from "@/lib/enhanced-database"

export async function GET() {
  try {
    const events = await EnhancedDatabase.getEventsByStatus('PENDING')
    const approvedEvents = await EnhancedDatabase.getEventsByStatus('APPROVED')
    
    return NextResponse.json({ 
      pendingEvents: events,
      approvedEvents: approvedEvents
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const eventData = await request.json()
    
    const event = await EnhancedDatabase.createEvent({
      ...eventData,
      event_date: new Date(eventData.event_date),
      status: 'PENDING'
    })
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}