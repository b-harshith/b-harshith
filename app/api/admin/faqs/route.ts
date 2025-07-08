import { NextResponse } from "next/server"
import { EnhancedDatabase } from "@/lib/enhanced-database"

export async function GET() {
  try {
    const faqs = await EnhancedDatabase.getAllFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const faqData = await request.json()
    
    const faq = await EnhancedDatabase.createFAQ({
      ...faqData,
      created_by: 'admin', // In real app, get from auth
      is_active: true
    })
    
    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Error creating FAQ:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}