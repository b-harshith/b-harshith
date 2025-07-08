import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🗄️ Initializing database tables...")

    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(50) PRIMARY KEY,
          subscribed_status BOOLEAN DEFAULT TRUE,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("✅ Users table created/verified")

    // Create Items table
    await sql`
      CREATE TABLE IF NOT EXISTS items (
          item_id SERIAL PRIMARY KEY,
          reporter_id VARCHAR(50) REFERENCES users(user_id),
          report_type VARCHAR(10) CHECK (report_type IN ('LOST', 'FOUND')),
          category VARCHAR(50) CHECK (category IN ('ID & Finance', 'Electronics', 'Keys', 'Apparel', 'Personal Items', 'Sports Gear', 'Other')),
          description TEXT NOT NULL,
          photo_url VARCHAR(500),
          location VARCHAR(200),
          status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED')),
          claim_code VARCHAR(20) UNIQUE,
          reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          claimed_at TIMESTAMP
      )
    `

    console.log("✅ Items table created/verified")

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_items_reporter_id ON items(reporter_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_items_claim_code ON items(claim_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)`

    console.log("✅ Database indexes created/verified")

    // Test the tables by running a simple query
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const itemCount = await sql`SELECT COUNT(*) as count FROM items`

    console.log(`📊 Database initialized successfully. Users: ${userCount[0].count}, Items: ${itemCount[0].count}`)

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      stats: {
        users: userCount[0].count,
        items: itemCount[0].count,
      },
    })
  } catch (error) {
    console.error("❌ Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check if tables exist
    const tablesExist = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'items')
    `

    const userCount = tablesExist.length > 0 ? await sql`SELECT COUNT(*) as count FROM users` : [{ count: 0 }]
    const itemCount = tablesExist.length > 0 ? await sql`SELECT COUNT(*) as count FROM items` : [{ count: 0 }]

    return NextResponse.json({
      success: true,
      tablesExist: tablesExist.length === 2,
      tables: tablesExist.map((t: any) => t.table_name),
      stats: {
        users: userCount[0].count,
        items: itemCount[0].count,
      },
    })
  } catch (error) {
    console.error("❌ Database check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Database check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
