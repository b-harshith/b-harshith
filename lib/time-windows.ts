import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface TimeWindow {
  window_id: number
  day_of_week: number
  start_time: string
  end_time: string
  window_type: 'QUIET' | 'SEND'
  description: string
  is_active: boolean
}

export class TimeWindowManager {
  /**
   * Check if current time is within a SEND window
   */
  static async isCurrentlySendWindow(): Promise<boolean> {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sunday, 6=Saturday
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM time_windows
        WHERE day_of_week = ${dayOfWeek}
        AND window_type = 'SEND'
        AND start_time <= ${currentTime}
        AND end_time >= ${currentTime}
        AND is_active = true
      `

      return (result[0] as any).count > 0
    } catch (error) {
      console.error("Error checking time window:", error)
      // Default to allowing sends if there's an error
      return true
    }
  }

  /**
   * Get the next available send window
   */
  static async getNextSendWindow(): Promise<Date | null> {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5)

    try {
      // First, try to find a send window today after current time
      const todayResult = await sql`
        SELECT start_time, end_time
        FROM time_windows
        WHERE day_of_week = ${dayOfWeek}
        AND window_type = 'SEND'
        AND start_time > ${currentTime}
        AND is_active = true
        ORDER BY start_time
        LIMIT 1
      `

      if (todayResult.length > 0) {
        const window = todayResult[0] as any
        const nextWindow = new Date()
        const [hours, minutes] = window.start_time.split(':')
        nextWindow.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        return nextWindow
      }

      // If no window today, find the earliest window tomorrow or later
      const futureResult = await sql`
        SELECT day_of_week, start_time
        FROM time_windows
        WHERE window_type = 'SEND'
        AND is_active = true
        AND (
          day_of_week > ${dayOfWeek}
          OR day_of_week < ${dayOfWeek}
        )
        ORDER BY 
          CASE WHEN day_of_week > ${dayOfWeek} THEN day_of_week ELSE day_of_week + 7 END,
          start_time
        LIMIT 1
      `

      if (futureResult.length > 0) {
        const window = futureResult[0] as any
        const nextWindow = new Date()
        const daysToAdd = window.day_of_week > dayOfWeek 
          ? window.day_of_week - dayOfWeek 
          : 7 - dayOfWeek + window.day_of_week

        nextWindow.setDate(nextWindow.getDate() + daysToAdd)
        const [hours, minutes] = window.start_time.split(':')
        nextWindow.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        return nextWindow
      }

      return null
    } catch (error) {
      console.error("Error getting next send window:", error)
      return null
    }
  }

  /**
   * Check if it's currently a quiet period (classes in session)
   */
  static async isCurrentlyQuietWindow(): Promise<boolean> {
    const sendWindow = await this.isCurrentlySendWindow()
    return !sendWindow
  }

  /**
   * Get all time windows for a specific day
   */
  static async getTimeWindowsForDay(dayOfWeek: number): Promise<TimeWindow[]> {
    try {
      const result = await sql`
        SELECT *
        FROM time_windows
        WHERE day_of_week = ${dayOfWeek}
        AND is_active = true
        ORDER BY start_time
      `
      return result as TimeWindow[]
    } catch (error) {
      console.error("Error getting time windows for day:", error)
      return []
    }
  }
}