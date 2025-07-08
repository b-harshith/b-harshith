import { neon } from "@neondatabase/serverless"
import { TimeWindowManager } from "./time-windows"
import { WhatsAppAPI } from "./whatsapp"

const sql = neon(process.env.DATABASE_URL!)

export interface QueuedMessage {
  queue_id: number
  recipient_id: string
  message_type: 'EVENT_BROADCAST' | 'MATCH_NOTIFICATION' | 'SYSTEM_UPDATE' | 'DIRECT_REPLY'
  priority: number
  message_content: string
  media_url?: string
  scheduled_for?: Date
  attempts: number
  max_attempts: number
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'
  created_at: Date
  sent_at?: Date
  metadata: any
}

export class MessageQueue {
  /**
   * Add a message to the queue with intelligent scheduling
   */
  static async enqueueMessage(
    recipientId: string,
    messageType: QueuedMessage['message_type'],
    content: string,
    options: {
      priority?: number
      mediaUrl?: string
      metadata?: any
      forceImmediate?: boolean
    } = {}
  ): Promise<void> {
    const {
      priority = 5,
      mediaUrl,
      metadata = {},
      forceImmediate = false
    } = options

    try {
      let scheduledFor: Date | null = null

      // Check if we should send immediately or queue for later
      if (forceImmediate || messageType === 'DIRECT_REPLY') {
        // Direct replies and forced messages go out immediately
        scheduledFor = new Date()
      } else {
        // Check if it's currently a send window
        const canSendNow = await TimeWindowManager.isCurrentlySendWindow()
        
        if (canSendNow) {
          // Check anti-spam: max 3 messages per user in 20 minutes
          const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000)
          const recentMessages = await sql`
            SELECT COUNT(*) as count
            FROM message_queue
            WHERE recipient_id = ${recipientId}
            AND sent_at > ${twentyMinutesAgo.toISOString()}
            AND status = 'SENT'
          `

          const recentCount = (recentMessages[0] as any).count
          if (recentCount < 3) {
            scheduledFor = new Date()
          } else {
            // User has received too many messages recently, schedule for next window
            scheduledFor = await TimeWindowManager.getNextSendWindow()
          }
        } else {
          // It's a quiet window, schedule for next send window
          scheduledFor = await TimeWindowManager.getNextSendWindow()
        }
      }

      // Insert into queue
      await sql`
        INSERT INTO message_queue (
          recipient_id, message_type, priority, message_content, 
          media_url, scheduled_for, metadata
        )
        VALUES (
          ${recipientId}, ${messageType}, ${priority}, ${content},
          ${mediaUrl || null}, ${scheduledFor?.toISOString() || null}, ${JSON.stringify(metadata)}
        )
      `

      console.log(`📬 Message queued for ${recipientId}, scheduled for: ${scheduledFor?.toISOString() || 'immediate'}`)

      // If scheduled for immediate sending, process it now
      if (scheduledFor && scheduledFor <= new Date()) {
        await this.processQueue()
      }
    } catch (error) {
      console.error("Error enqueueing message:", error)
      throw error
    }
  }

  /**
   * Process the message queue and send ready messages
   */
  static async processQueue(): Promise<void> {
    try {
      const now = new Date()

      // Get messages ready to be sent, ordered by priority (lower number = higher priority)
      const readyMessages = await sql`
        SELECT *
        FROM message_queue
        WHERE status = 'PENDING'
        AND (scheduled_for IS NULL OR scheduled_for <= ${now.toISOString()})
        AND attempts < max_attempts
        ORDER BY priority ASC, created_at ASC
        LIMIT 50
      `

      console.log(`📤 Processing ${readyMessages.length} messages from queue`)

      for (const message of readyMessages as QueuedMessage[]) {
        try {
          // Check anti-spam again before sending
          const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000)
          const recentMessages = await sql`
            SELECT COUNT(*) as count
            FROM message_queue
            WHERE recipient_id = ${message.recipient_id}
            AND sent_at > ${twentyMinutesAgo.toISOString()}
            AND status = 'SENT'
          `

          const recentCount = (recentMessages[0] as any).count
          if (recentCount >= 3 && message.message_type !== 'DIRECT_REPLY') {
            // Reschedule for later
            const nextWindow = await TimeWindowManager.getNextSendWindow()
            await sql`
              UPDATE message_queue
              SET scheduled_for = ${nextWindow?.toISOString() || null}
              WHERE queue_id = ${message.queue_id}
            `
            continue
          }

          // Send the message
          if (message.media_url) {
            await WhatsAppAPI.sendImageMessage(
              message.recipient_id,
              message.media_url,
              message.message_content
            )
          } else {
            await WhatsAppAPI.sendTextMessage(
              message.recipient_id,
              message.message_content
            )
          }

          // Mark as sent
          await sql`
            UPDATE message_queue
            SET status = 'SENT', sent_at = ${now.toISOString()}
            WHERE queue_id = ${message.queue_id}
          `

          console.log(`✅ Message sent to ${message.recipient_id}`)

        } catch (error) {
          console.error(`❌ Failed to send message ${message.queue_id}:`, error)

          // Increment attempts and potentially mark as failed
          const newAttempts = message.attempts + 1
          const newStatus = newAttempts >= message.max_attempts ? 'FAILED' : 'PENDING'

          await sql`
            UPDATE message_queue
            SET attempts = ${newAttempts}, status = ${newStatus}
            WHERE queue_id = ${message.queue_id}
          `
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error("Error processing message queue:", error)
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    pending: number
    sent: number
    failed: number
    total: number
  }> {
    try {
      const stats = await sql`
        SELECT 
          status,
          COUNT(*) as count
        FROM message_queue
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
      `

      const result = {
        pending: 0,
        sent: 0,
        failed: 0,
        total: 0
      }

      for (const stat of stats as any[]) {
        result[stat.status.toLowerCase() as keyof typeof result] = parseInt(stat.count)
        result.total += parseInt(stat.count)
      }

      return result
    } catch (error) {
      console.error("Error getting queue stats:", error)
      return { pending: 0, sent: 0, failed: 0, total: 0 }
    }
  }

  /**
   * Cancel pending messages for a user (useful for unsubscribing)
   */
  static async cancelPendingMessages(userId: string, messageType?: string): Promise<void> {
    try {
      if (messageType) {
        await sql`
          UPDATE message_queue
          SET status = 'CANCELLED'
          WHERE recipient_id = ${userId}
          AND message_type = ${messageType}
          AND status = 'PENDING'
        `
      } else {
        await sql`
          UPDATE message_queue
          SET status = 'CANCELLED'
          WHERE recipient_id = ${userId}
          AND status = 'PENDING'
        `
      }
    } catch (error) {
      console.error("Error cancelling messages:", error)
    }
  }
}