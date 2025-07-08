import { neon } from "@neondatabase/serverless"
import { Database as BaseDatabase } from "./database"

const sql = neon(process.env.DATABASE_URL!)

export interface Event {
  event_id: number
  title: string
  description: string
  category: string
  event_date: Date
  location: string
  poster_url?: string
  organizer_id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  target_audience: string[]
  max_participants?: number
  registration_required: boolean
  registration_link?: string
  created_at: Date
  updated_at: Date
  broadcast_sent: boolean
}

export interface FAQ {
  faq_id: number
  question: string
  answer: string
  keywords: string[]
  category: string
  created_by: string
  is_active: boolean
  view_count: number
  created_at: Date
  updated_at: Date
}

export interface UserProfile {
  user_id: string
  user_name: string
  interests: string[]
  year_of_study?: number
  department?: string
  onboarding_completed: boolean
  subscribed_status: boolean
  is_admin: boolean
  last_active: Date
  created_at: Date
}

export class EnhancedDatabase extends BaseDatabase {
  // ==================== USER MANAGEMENT ====================

  /**
   * Complete user onboarding with interests and profile data
   */
  static async completeOnboarding(
    userId: string,
    interests: string[],
    yearOfStudy?: number,
    department?: string
  ): Promise<void> {
    try {
      // Update user profile
      await sql`
        UPDATE users 
        SET 
          interests = ${interests},
          year_of_study = ${yearOfStudy || null},
          department = ${department || null},
          onboarding_completed = true,
          last_active = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `

      // Insert user interests
      for (const interest of interests) {
        await sql`
          INSERT INTO user_interests (user_id, interest)
          VALUES (${userId}, ${interest})
          ON CONFLICT (user_id, interest) DO NOTHING
        `
      }

      console.log(`✅ Onboarding completed for user ${userId}`)
    } catch (error) {
      console.error("Error completing onboarding:", error)
      throw error
    }
  }

  /**
   * Update user interests
   */
  static async updateUserInterests(userId: string, interests: string[]): Promise<void> {
    try {
      // Remove existing interests
      await sql`DELETE FROM user_interests WHERE user_id = ${userId}`

      // Add new interests
      for (const interest of interests) {
        await sql`
          INSERT INTO user_interests (user_id, interest)
          VALUES (${userId}, ${interest})
        `
      }

      // Update user table
      await sql`
        UPDATE users 
        SET interests = ${interests}, last_active = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `

      console.log(`✅ Interests updated for user ${userId}`)
    } catch (error) {
      console.error("Error updating user interests:", error)
      throw error
    }
  }

  /**
   * Get enhanced user profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const result = await sql`
        SELECT 
          u.*,
          COALESCE(
            ARRAY_AGG(ui.interest) FILTER (WHERE ui.interest IS NOT NULL),
            '{}'::text[]
          ) as user_interests
        FROM users u
        LEFT JOIN user_interests ui ON u.user_id = ui.user_id
        WHERE u.user_id = ${userId}
        GROUP BY u.user_id
      `

      if (result.length === 0) return null

      const user = result[0] as any
      return {
        ...user,
        interests: user.user_interests || []
      } as UserProfile
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  /**
   * Get users by interests for targeted messaging
   */
  static async getUsersByInterests(interests: string[]): Promise<string[]> {
    try {
      const result = await sql`
        SELECT DISTINCT u.user_id
        FROM users u
        JOIN user_interests ui ON u.user_id = ui.user_id
        WHERE ui.interest = ANY(${interests})
        AND u.subscribed_status = true
        AND u.onboarding_completed = true
      `

      return result.map((row: any) => row.user_id)
    } catch (error) {
      console.error("Error getting users by interests:", error)
      return []
    }
  }

  // ==================== EVENT MANAGEMENT ====================

  /**
   * Create a new event
   */
  static async createEvent(event: Omit<Event, 'event_id' | 'created_at' | 'updated_at' | 'broadcast_sent'>): Promise<Event> {
    try {
      const result = await sql`
        INSERT INTO events (
          title, description, category, event_date, location, poster_url,
          organizer_id, status, target_audience, max_participants,
          registration_required, registration_link
        )
        VALUES (
          ${event.title}, ${event.description}, ${event.category}, 
          ${event.event_date.toISOString()}, ${event.location}, ${event.poster_url || null},
          ${event.organizer_id}, ${event.status}, ${event.target_audience},
          ${event.max_participants || null}, ${event.registration_required},
          ${event.registration_link || null}
        )
        RETURNING *
      `

      return result[0] as Event
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  }

  /**
   * Get events by status
   */
  static async getEventsByStatus(status: Event['status']): Promise<Event[]> {
    try {
      const result = await sql`
        SELECT * FROM events 
        WHERE status = ${status}
        ORDER BY event_date ASC
      `

      return result as Event[]
    } catch (error) {
      console.error("Error getting events by status:", error)
      return []
    }
  }

  /**
   * Approve event and mark for broadcast
   */
  static async approveEvent(eventId: number): Promise<Event | null> {
    try {
      const result = await sql`
        UPDATE events 
        SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ${eventId}
        RETURNING *
      `

      return result[0] as Event || null
    } catch (error) {
      console.error("Error approving event:", error)
      return null
    }
  }

  /**
   * Mark event as broadcast sent
   */
  static async markEventBroadcastSent(eventId: number): Promise<void> {
    try {
      await sql`
        UPDATE events 
        SET broadcast_sent = true, updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ${eventId}
      `
    } catch (error) {
      console.error("Error marking event broadcast sent:", error)
    }
  }

  /**
   * Get events ready for broadcast
   */
  static async getEventsReadyForBroadcast(): Promise<Event[]> {
    try {
      const result = await sql`
        SELECT * FROM events 
        WHERE status = 'APPROVED' 
        AND broadcast_sent = false
        AND event_date > CURRENT_TIMESTAMP
        ORDER BY created_at ASC
      `

      return result as Event[]
    } catch (error) {
      console.error("Error getting events ready for broadcast:", error)
      return []
    }
  }

  // ==================== FAQ MANAGEMENT ====================

  /**
   * Create a new FAQ
   */
  static async createFAQ(faq: Omit<FAQ, 'faq_id' | 'view_count' | 'created_at' | 'updated_at'>): Promise<FAQ> {
    try {
      const result = await sql`
        INSERT INTO faqs (question, answer, keywords, category, created_by, is_active)
        VALUES (${faq.question}, ${faq.answer}, ${faq.keywords}, ${faq.category}, ${faq.created_by}, ${faq.is_active})
        RETURNING *
      `

      return result[0] as FAQ
    } catch (error) {
      console.error("Error creating FAQ:", error)
      throw error
    }
  }

  /**
   * Search FAQs by keywords
   */
  static async searchFAQs(query: string): Promise<FAQ[]> {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
      
      if (searchTerms.length === 0) return []

      const result = await sql`
        SELECT *, 
          (
            SELECT COUNT(*)
            FROM unnest(keywords) AS keyword
            WHERE keyword ILIKE ANY(${searchTerms.map(term => `%${term}%`)})
          ) as match_count
        FROM faqs
        WHERE is_active = true
        AND (
          question ILIKE ANY(${searchTerms.map(term => `%${term}%`)})
          OR answer ILIKE ANY(${searchTerms.map(term => `%${term}%`)})
          OR keywords && ${searchTerms}
        )
        ORDER BY match_count DESC, view_count DESC
        LIMIT 5
      `

      return result as FAQ[]
    } catch (error) {
      console.error("Error searching FAQs:", error)
      return []
    }
  }

  /**
   * Increment FAQ view count
   */
  static async incrementFAQViewCount(faqId: number): Promise<void> {
    try {
      await sql`
        UPDATE faqs 
        SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE faq_id = ${faqId}
      `
    } catch (error) {
      console.error("Error incrementing FAQ view count:", error)
    }
  }

  /**
   * Get all active FAQs
   */
  static async getAllFAQs(): Promise<FAQ[]> {
    try {
      const result = await sql`
        SELECT * FROM faqs 
        WHERE is_active = true
        ORDER BY category, question
      `

      return result as FAQ[]
    } catch (error) {
      console.error("Error getting all FAQs:", error)
      return []
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get user engagement statistics
   */
  static async getUserEngagementStats(): Promise<{
    totalUsers: number
    activeUsers: number
    completedOnboarding: number
    byInterest: { interest: string; count: number }[]
  }> {
    try {
      const totalUsers = await sql`SELECT COUNT(*) as count FROM users`
      const activeUsers = await sql`
        SELECT COUNT(*) as count FROM users 
        WHERE last_active > NOW() - INTERVAL '7 days'
      `
      const completedOnboarding = await sql`
        SELECT COUNT(*) as count FROM users 
        WHERE onboarding_completed = true
      `
      const byInterest = await sql`
        SELECT interest, COUNT(*) as count
        FROM user_interests
        GROUP BY interest
        ORDER BY count DESC
      `

      return {
        totalUsers: (totalUsers[0] as any).count,
        activeUsers: (activeUsers[0] as any).count,
        completedOnboarding: (completedOnboarding[0] as any).count,
        byInterest: byInterest as any[]
      }
    } catch (error) {
      console.error("Error getting user engagement stats:", error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        completedOnboarding: 0,
        byInterest: []
      }
    }
  }

  /**
   * Get event statistics
   */
  static async getEventStats(): Promise<{
    totalEvents: number
    approvedEvents: number
    pendingEvents: number
    upcomingEvents: number
  }> {
    try {
      const totalEvents = await sql`SELECT COUNT(*) as count FROM events`
      const approvedEvents = await sql`SELECT COUNT(*) as count FROM events WHERE status = 'APPROVED'`
      const pendingEvents = await sql`SELECT COUNT(*) as count FROM events WHERE status = 'PENDING'`
      const upcomingEvents = await sql`
        SELECT COUNT(*) as count FROM events 
        WHERE status = 'APPROVED' AND event_date > CURRENT_TIMESTAMP
      `

      return {
        totalEvents: (totalEvents[0] as any).count,
        approvedEvents: (approvedEvents[0] as any).count,
        pendingEvents: (pendingEvents[0] as any).count,
        upcomingEvents: (upcomingEvents[0] as any).count
      }
    } catch (error) {
      console.error("Error getting event stats:", error)
      return {
        totalEvents: 0,
        approvedEvents: 0,
        pendingEvents: 0,
        upcomingEvents: 0
      }
    }
  }
}