import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  user_id: string
  user_name: string
  subscribed_status: boolean
  is_admin: boolean
  created_at: Date
}

export interface Item {
  item_id: number
  reporter_id: string
  report_type: "LOST" | "FOUND"
  category: string
  description: string
  photo_url?: string
  location: string
  status: "ACTIVE" | "CLAIMED"
  claim_code?: string
  reported_at: Date
  claimed_at?: Date
}

export class Database {
  static async createUser(userId: string, userName?: string, isAdmin = false): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO users (user_id, user_name, is_admin)
        VALUES (${userId}, ${userName || "Friend"}, ${isAdmin})
        ON CONFLICT (user_id) DO UPDATE SET
          subscribed_status = EXCLUDED.subscribed_status
        RETURNING *
      `
      return result[0] as User
    } catch (error) {
      console.error("❌ Error creating user:", error)
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // The `updateUserName` function correctly updates the `user_name` field.
  // It is called after the user provides their name during the registration flow.
  static async updateUserName(userId: string, userName: string): Promise<User | null> {
    try {
      const result = await sql`
        UPDATE users 
        SET user_name = ${userName}
        WHERE user_id = ${userId}
        RETURNING *
      `
      return (result[0] as User) || null
    } catch (error) {
      console.error("❌ Error updating user name:", error)
      throw new Error(`Failed to update user name: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE user_id = ${userId}
      `
      return (result[0] as User) || null
    } catch (error) {
      console.error("❌ Error getting user:", error)
      // If table doesn't exist, return null instead of throwing
      if (error instanceof Error && error.message.includes("does not exist")) {
        return null
      }
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getSubscribedUsers(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE subscribed_status = true
      `
      return result as User[]
    } catch (error) {
      console.error("❌ Error getting subscribed users:", error)
      return []
    }
  }

  static async createItem(item: Omit<Item, "item_id" | "reported_at" | "claimed_at">): Promise<Item> {
    try {
      // Generate unique 6-character alphanumeric ItemID
      const itemId = this.generateItemId()

      const result = await sql`
        INSERT INTO items (reporter_id, report_type, category, description, photo_url, location, claim_code)
        VALUES (${item.reporter_id}, ${item.report_type}, ${item.category}, ${item.description}, ${item.photo_url || null}, ${item.location}, ${itemId})
        RETURNING *
      `
      return result[0] as Item
    } catch (error) {
      console.error("❌ Error creating item:", error)
      throw new Error(`Failed to create item: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getUserItems(userId: string): Promise<Item[]> {
    try {
      const result = await sql`
        SELECT * FROM items WHERE reporter_id = ${userId} ORDER BY reported_at DESC
      `
      return result as Item[]
    } catch (error) {
      console.error("❌ Error getting user items:", error)
      return []
    }
  }

  static async claimItem(itemId: string): Promise<Item | null> {
    try {
      const result = await sql`
        UPDATE items 
        SET status = 'CLAIMED', claimed_at = CURRENT_TIMESTAMP
        WHERE claim_code = ${itemId} AND status = 'ACTIVE'
        RETURNING *
      `
      return (result[0] as Item) || null
    } catch (error) {
      console.error("❌ Error claiming item:", error)
      return null
    }
  }

  static async getItemById(itemId: string): Promise<Item | null> {
    try {
      const result = await sql`
        SELECT * FROM items WHERE claim_code = ${itemId}
      `
      return (result[0] as Item) || null
    } catch (error) {
      console.error("❌ Error getting item by ID:", error)
      return null
    }
  }

  static async findMatchingItems(newItem: Item): Promise<Item[]> {
    try {
      const oppositeType = newItem.report_type === "LOST" ? "FOUND" : "LOST"

      const result = await sql`
        SELECT * FROM items 
        WHERE report_type = ${oppositeType} 
        AND category = ${newItem.category}
        AND status = 'ACTIVE'
        AND description ILIKE ${"%" + newItem.description.split(" ").slice(0, 3).join("%") + "%"}
        ORDER BY reported_at DESC
        LIMIT 5
      `
      return result as Item[]
    } catch (error) {
      console.error("❌ Error finding matching items:", error)
      return []
    }
  }

  static async getActiveItems(): Promise<Item[]> {
    try {
      const result = await sql`
        SELECT * FROM items ORDER BY reported_at DESC
      `
      return result as Item[]
    } catch (error) {
      console.error("❌ Error getting active items:", error)
      return []
    }
  }

  private static generateItemId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Add a method to check if database is initialized
  static async isDatabaseInitialized(): Promise<boolean> {
    try {
      await sql`SELECT 1 FROM users LIMIT 1`
      await sql`SELECT 1 FROM items LIMIT 1`
      return true
    } catch (error) {
      return false
    }
  }
}
