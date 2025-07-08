export interface WhatsAppMessage {
  from: string
  text?: string
  type: "text" | "image" | "interactive"
  mediaUrl?: string
  mediaContentType?: string
}

export class WhatsAppAPI {
  private static readonly ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
  private static readonly AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
  private static readonly WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER! // e.g., "whatsapp:+14155238886"

  static async sendTextMessage(to: string, text: string): Promise<void> {
    await this.sendTwilioMessage(to, { Body: text })
  }

  static async sendButtonMessage(to: string, text: string, buttons: any[]): Promise<void> {
    // Twilio doesn't support interactive buttons in the same way
    // We'll send the text with numbered options
    let message = text + "\n\n"
    buttons.forEach((button, index) => {
      message += `${index + 1}. ${button.reply.title}\n`
    })
    message += "\nReply with the number of your choice."

    await this.sendTwilioMessage(to, { Body: message })
  }

  static async sendListMessage(to: string, text: string, buttonText: string, sections: any[]): Promise<void> {
    let message = text + "\n\n"
    let optionNumber = 1

    sections.forEach((section) => {
      message += `**${section.title}**\n`
      section.rows.forEach((row: any) => {
        message += `${optionNumber}. ${row.title}`
        if (row.description) {
          message += ` - ${row.description}`
        }
        message += "\n"
        optionNumber++
      })
      message += "\n"
    })

    message += "Reply with the number of your choice."
    await this.sendTwilioMessage(to, { Body: message })
  }

  static async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<void> {
    await this.sendTwilioMessage(to, {
      Body: caption || "",
      mediaUrl: [imageUrl],
    })
  }

  static async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${this.ACCOUNT_SID}:${this.AUTH_TOKEN}`).toString("base64"),
      },
    })
    return Buffer.from(await response.arrayBuffer())
  }

  private static async sendTwilioMessage(to: string, messageData: any): Promise<void> {
    console.log(`📤 Sending message to: ${to}`)
    console.log(`📤 From number: ${this.WHATSAPP_NUMBER}`)
    console.log(`📤 Message data:`, messageData)

    // Ensure both From and To are in WhatsApp format
    const fromNumber = this.WHATSAPP_NUMBER.startsWith("whatsapp:")
      ? this.WHATSAPP_NUMBER
      : `whatsapp:${this.WHATSAPP_NUMBER}`

    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`

    console.log(`📤 Formatted From: ${fromNumber}`)
    console.log(`📤 Formatted To: ${toNumber}`)

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.ACCOUNT_SID}/Messages.json`

    const formData = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: messageData.body || messageData.Body || "",
    })

    if (messageData.mediaUrl) {
      messageData.mediaUrl.forEach((url: string, index: number) => {
        formData.append("MediaUrl", url)
      })
    }

    console.log(`📤 Final form data:`, Object.fromEntries(formData.entries()))

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${this.ACCOUNT_SID}:${this.AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("❌ Twilio API Error Response:", error)
      console.error("❌ Response status:", response.status)
      console.error("❌ Response headers:", Object.fromEntries(response.headers.entries()))
      throw new Error(`Twilio API Error: ${response.status} - ${error}`)
    } else {
      const success = await response.text()
      console.log("✅ Twilio message sent successfully:", success)
    }
  }

  static async broadcastMessage(userIds: string[], messageData: any): Promise<void> {
    const promises = userIds.map((userId) => this.sendTwilioMessage(userId, messageData))
    await Promise.allSettled(promises)
  }
}
