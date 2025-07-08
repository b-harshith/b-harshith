import { Database, type Item, type User } from "./database"
import { WhatsAppAPI, type WhatsAppMessage } from "./whatsapp"
import { put } from "@vercel/blob"

interface UserSession {
  state:
    | "initial"
    | "awaiting_name"
    | "reporting_lost"
    | "reporting_found"
    | "awaiting_category"
    | "awaiting_description"
    | "awaiting_photo"
    | "awaiting_location"
  reportType?: "LOST" | "FOUND"
  category?: string
  description?: string
  photoUrl?: string
  userName?: string
}

const userSessions = new Map<string, UserSession>()

// Template variations for more natural conversations
const Templates = {
  welcome: [
    "👋 Hey! Welcome to Lost and Found@MU. I'm *Loki*, your go-to for finding things on campus. So, who am I talking to? What's your name?\n\n(Submit only your name)",
    "👋 Hi there! I'm *Loki*, your friendly campus assistant for lost and found items at MU. Before we get started, what should I call you?\n\n(Just your name please)",
    "👋 Welcome to Lost and Found@MU! I'm *Loki*, and I'm here to help you find lost items or report found ones. First things first - what's your name?\n\n(Submit only your name)",
    "👋 Hello! *Loki* here, your campus lost and found helper at MU. To get started, I'd love to know your name!\n\n(Just submit your name)",
  ],

  firstTimeGreeting: [
    "Got it, nice to meet you, {name}! Quick heads-up: by using this service, you'll get campus-wide alerts for lost and found items. So, how can I help you?",
    "Great to meet you, {name}! Just so you know, you'll receive notifications about lost and found items across campus. What can I do for you today?",
    "Nice to meet you, {name}! You're now part of our campus-wide lost and found network. How can I assist you?",
    "Awesome, {name}! You'll now get alerts whenever items are reported lost or found on campus. What brings you here today?",
  ],

  returningGreeting: [
    "Hello, {name}! How can I help you today?",
    "Hey {name}! What can I do for you?",
    "Hi there, {name}! How can I assist you today?",
    "Good to see you again, {name}! What do you need help with?",
  ],

  lostItemStart: [
    "Ah, got it {name}. Let's get a report filed and see if we can track it down. First, what kind of item are we looking for?",
    "No worries {name}, let's get this sorted! I'll help you file a report. What type of item did you lose?",
    "Alright {name}, let's find your missing item! First, I need to know what category it falls under.",
    "Don't worry {name}, we'll get this reported right away. What kind of item are we dealing with?",
  ],

  foundItemStart: [
    "Awesome, {name}! Thanks for helping out. Let's get this logged so we can find its owner. What kind of item did you find?",
    "You're amazing, {name}! Let's get this item back to its owner. What type of item did you discover?",
    "Great job, {name}! Thanks for being a good samaritan. What category does this found item belong to?",
    "Fantastic, {name}! Let's reunite this item with its owner. First, what kind of item is it?",
  ],

  descriptionRequest: [
    "Okay. Now, describe the item for me. The more details, the better!",
    "Perfect! Now give me a detailed description of the item. Every detail helps!",
    "Great choice! Please describe the item in as much detail as possible.",
    "Excellent! Now tell me about the item - the more specific, the better the chances of finding it!",
  ],

  photoRequestLost: [
    "Got it. Do you have a picture of it, or something similar? It massively helps people recognize it.\n\n1. ✅ Yes, I have a photo\n2. ❌ No photo available\n\nReply with 1 or 2.",
    "Perfect! Do you happen to have a photo of the item? Visual aids really boost our success rate.\n\n1. ✅ I have a photo\n2. ❌ No photo\n\nJust reply with 1 or 2.",
    "Nice! Got a picture of it? Photos make a huge difference in helping people identify items.\n\n1. ✅ Yes, photo available\n2. ❌ No photo\n\nChoose 1 or 2.",
    "Excellent! Any chance you have a photo? It really increases the odds of someone recognizing it.\n\n1. ✅ Photo ready\n2. ❌ No photo\n\nReply 1 or 2.",
  ],

  photoRequestFound: [
    "Great, thanks. Now, please upload a clear photo of the item. This is the most important step!",
    "Perfect! Please share a clear photo of the item - this is crucial for the owner to identify it!",
    "Excellent! Now upload a good photo of the item. This will help the owner recognize it immediately!",
    "Awesome! Please take and upload a clear photo - it's the key to reuniting the item with its owner!",
  ],

  locationRequestLost: [
    "Perfect. And where on campus did you last see it?",
    "Great! Where was the last place you remember having it on campus?",
    "Excellent! What's the last location on campus where you had it?",
    "Nice! Where on campus do you think you might have lost it?",
  ],

  locationRequestFound: [
    "Perfect. Where and when did you find it?",
    "Excellent! Tell me where and when you discovered it.",
    "Great! Where exactly did you find this item?",
    "Perfect! What's the location and time you found it?",
  ],

  lostItemConfirmation: [
    "✅ Alright, {name}, your report is filed. An alert is going out to the MU community now with *ItemID: {itemId}*. I'll let you know directly if a match is found.\n\nJust say 'hi' if you need anything else.",
    "✅ Perfect, {name}! Your lost item report is now active with *ItemID: {itemId}*. The campus community will be notified, and I'll update you on any matches.\n\nType 'hi' anytime you need help!",
    "✅ Done, {name}! Your report is live with *ItemID: {itemId}*. I've sent out a campus-wide alert and will notify you of any potential matches.\n\nJust say 'hi' whenever you need assistance!",
    "✅ All set, {name}! Report filed with *ItemID: {itemId}*. The MU community is now on the lookout, and I'll ping you if anything turns up.\n\nSay 'hi' anytime for more help!",
  ],

  foundItemConfirmation: [
    "You're a star, {name}! ⭐ The item is logged with *ItemID: {itemId}*. *Please drop it off at the ECOLE main block reception as soon as you can.* An alert is going out now.\n\nThanks again for being a great part of the community!",
    "Amazing work, {name}! 🌟 Item registered with *ItemID: {itemId}*. *Please take it to the ECOLE main block reception when you get a chance.* Broadcasting the alert now!\n\nYou're awesome for helping out!",
    "You're incredible, {name}! ✨ Logged with *ItemID: {itemId}*. *Don't forget to drop it at the ECOLE main block reception soon.* Alert going out to find the owner!\n\nThanks for making our campus community better!",
    "Fantastic, {name}! 🎉 Item saved with *ItemID: {itemId}*. *Please bring it to the ECOLE main block reception at your earliest convenience.* Notifying everyone now!\n\nYou're a campus hero!",
  ],

  searchLink: [
    "Hey {name}! 🔎 You can search through all lost and found items using our web interface:\n\n🌐 **Search Portal:** https://v0-lost-and-found-chatbot-jet.vercel.app/search \n\nFeatures available:\n• 📋 View all active lost & found items\n• 🔍 Search by keywords or description\n• 📅 Filter by date range\n• 📂 Filter by category\n• 📱 Mobile-friendly interface\n\nJust say 'hi' if you need anything else!",
    "Hi {name}! 🔍 Check out our comprehensive search tool for all campus items:\n\n🌐 **Item Search:** https://v0-lost-and-found-chatbot-jet.vercel.app/search \n\nWhat you can do:\n• 📋 Browse all reported items\n• 🔍 Search by any keyword\n• 📅 Sort by date\n• 📂 Filter by item type\n• 📱 Works great on mobile\n\nType 'hi' whenever you need help!",
    "Hello {name}! 🔎 Want to browse all lost and found items? Use our search portal:\n\n🌐 **Browse Items:** https://v0-lost-and-found-chatbot-jet.vercel.app/search \n\nCool features:\n• 📋 See all active reports\n• 🔍 Smart search function\n• 📅 Date-based filtering\n• 📂 Category sorting\n• 📱 Mobile optimized\n\nJust say 'hi' for more assistance!",
    "Hey there {name}! 🔍 Our item search tool has everything you need:\n\n🌐 *Search Hub:* https://v0-lost-and-found-chatbot-jet.vercel.app/search \n\nYou can:\n• 📋 View all campus items\n• 🔍 Search descriptions and locations\n• 📅 Filter by time period\n• 📂 Sort by categories\n• 📱 Use on any device\n\nSay 'hi' anytime you need me!",
  ],

  noActivity: [
    "📋 You haven't reported any items yet, {name}. Use the menu to report lost or found items!",
    "📋 No reports from you so far, {name}! Ready to help the community by reporting something?",
    "📋 Your activity log is empty, {name}. Time to make your first report?",
    "📋 Nothing on record yet, {name}! Want to report a lost or found item?",
  ],

  claimInstructions: [
    "To claim the *{description} (ID: {itemId})*, please head to the *ECOLE main block reception*. You'll need to:\n\n1. Show your MU Student ID.\n2. Provide a specific detail about the item that only the owner would know.",
    "For claiming *{description} (ID: {itemId})*, visit the *ECOLE main block reception* with:\n\n1. Your MU Student ID for verification.\n2. A unique detail about the item that proves ownership.",
    "To collect *{description} (ID: {itemId})*, go to *ECOLE main block reception* and bring:\n\n1. Valid MU Student ID.\n2. Specific information about the item only you would know.",
    "Claiming *{description} (ID: {itemId})*? Head to *ECOLE main block reception* with:\n\n1. MU Student ID required.\n2. Personal detail about the item for verification.",
  ],

  potentialMatch: [
    "🎯 **Potential Match Found!**\n\nHey {name}! A {itemType} item matching your {reportType} report:\n\n📋 {category}: {description}\n📍 {location}\n\n{actionText}",
    "🎯 **Possible Match Alert!**\n\nHi {name}! Found something that might match your {reportType} item:\n\n📋 {category}: {description}\n📍 {location}\n\n{actionText}",
    "🎯 **Match Detected!**\n\nHello {name}! There's a {itemType} item similar to what you {reportType}:\n\n📋 {category}: {description}\n📍 {location}\n\n{actionText}",
    "🎯 **Great News!**\n\nHey {name}! Spotted a potential match for your {reportType} item:\n\n📋 {category}: {description}\n📍 {location}\n\n{actionText}",
  ],

  adminClaimSuccess: [
    "✅ Success! Item '{description}' (ID: {itemId}) has been marked as claimed. The original reporter has been notified.",
    "✅ Perfect! '{description}' (ID: {itemId}) is now claimed. I've updated the reporter about the good news.",
    "✅ Done! Item '{description}' (ID: {itemId}) successfully claimed. The person who found it has been informed.",
    "✅ Excellent! '{description}' (ID: {itemId}) marked as claimed. All parties have been notified.",
  ],

  itemClaimed: [
    "🎉 Great news, {name}! The {category} you found ({description}) has been claimed by its owner. Thank you for being a great part of the community!",
    "🎉 Fantastic, {name}! Someone just claimed the {category} you found ({description}). You're awesome for helping out!",
    "🎉 Amazing news, {name}! The {category} ({description}) you reported has been reunited with its owner. Community hero!",
    "🎉 Wonderful, {name}! The {category} you found ({description}) is back with its owner. Thanks for making a difference!",
  ],

  lostItemClaimed: [
    "🎉 Good news, {name}! A {category} matching your lost item report has been claimed. We hope it was yours! If not, your report is still active.",
    "🎉 Great update, {name}! Someone claimed a {category} similar to what you lost. Fingers crossed it was yours! Your report remains active just in case.",
    "🎉 Positive news, {name}! A {category} matching your description was claimed. Hope it found its way back to you! Your report stays active otherwise.",
    "🎉 Exciting news, {name}! A {category} like yours was just claimed. Hopefully it was the right one! Your report is still live if needed.",
  ],
}

export class BotLogic {
  // Helper function to get random template
  private static getRandomTemplate(templates: string[], replacements: Record<string, string> = {}): string {
    const randomIndex = Math.floor(Math.random() * templates.length)
    let template = templates[randomIndex]

    // Replace placeholders
    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{${key}}`, "g"), value)
    })

    return template
  }

  static async processMessage(twilioBody: any): Promise<void> {
    console.log("🤖 BotLogic.processMessage started")

    try {
      // Clean and normalize phone numbers
      const fromNumber = twilioBody.From?.replace("whatsapp:", "") || ""
      const toNumber = twilioBody.To?.replace("whatsapp:", "") || ""

      console.log(`📞 Raw From: ${twilioBody.From}`)
      console.log(`📞 Raw To: ${twilioBody.To}`)
      console.log(`📞 Cleaned From: ${fromNumber}`)
      console.log(`📞 Cleaned To: ${toNumber}`)

      const message: WhatsAppMessage = {
        from: fromNumber,
        text: twilioBody.Body,
        type: twilioBody.MediaUrl0 ? "image" : "text",
        mediaUrl: twilioBody.MediaUrl0,
        mediaContentType: twilioBody.MediaContentType0,
      }

      const userId = message.from
      console.log(`👤 Processing message from user: ${userId}`)
      console.log(`💬 Message text: "${message.text}"`)
      console.log(`📷 Has media: ${message.type === "image" ? "Yes" : "No"}`)

      // Validate phone number format
      if (!userId || userId.length < 10) {
        console.error("❌ Invalid user ID format:", userId)
        return
      }

      // Check if user exists and get their info
      console.log("🔍 Checking if user exists in database...")
      const user = await Database.getUser(userId)

      if (!user) {
        console.log("👤 New user detected, starting registration flow...")
        await this.startRegistrationFlow(userId)
        return
      } else {
        console.log(`✅ Existing user found: ${user.user_name}`)
      }

      // Handle admin commands
      if (user.is_admin && message.text?.startsWith("!claim ")) {
        console.log("🔧 Admin command detected")
        await this.handleAdminClaim(userId, message.text, user.user_name)
        return
      }

      // Handle claim button interactions
      if (message.text?.startsWith("claim_")) {
        const itemId = message.text.replace("claim_", "")
        await this.handleClaimInstructions(userId, itemId, user.user_name)
        return
      }

      // Handle menu triggers
      if (message.text && ["hi", "hello", "menu", "start"].includes(message.text.toLowerCase())) {
        console.log("🏠 Menu trigger detected")
        await this.sendMainMenu(userId, user.user_name)
        return
      }

      // Handle session-based flows
      const session = userSessions.get(userId) || { state: "initial" }
      console.log(`📊 User session state: ${session.state}`)

      await this.handleSessionMessage(userId, message, session, user)
    } catch (error) {
      console.error("❌ Error in BotLogic.processMessage:", error)
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
      throw error
    }
  }

  private static async startRegistrationFlow(userId: string): Promise<void> {
    console.log(`👋 Starting registration flow for ${userId}`)

    try {
      // Create user with placeholder name
      await Database.createUser(userId, "Friend")

      // Set session state to awaiting name
      userSessions.set(userId, { state: "awaiting_name" })

      const welcomeText = this.getRandomTemplate(Templates.welcome)
      await WhatsAppAPI.sendTextMessage(userId, welcomeText)
      console.log("✅ Registration flow started")
    } catch (error) {
      console.error("❌ Error starting registration flow:", error)
      throw error
    }
  }

  private static async sendMainMenu(userId: string, userName: string): Promise<void> {
    console.log(`📋 Sending main menu to ${userId}`)

    try {
      const greeting = this.getRandomTemplate(Templates.returningGreeting, { name: userName })

      const buttons = [
        { type: "reply" as const, reply: { id: "lost_something", title: "🔍 I Lost Something" } },
        { type: "reply" as const, reply: { id: "found_something", title: "🙌 I Found Something" } },
        { type: "reply" as const, reply: { id: "my_activity", title: "📋 My Activity" } },
        { type: "reply" as const, reply: { id: "search_items", title: "🔎 Search All Items" } },
      ]

      await WhatsAppAPI.sendButtonMessage(userId, greeting, buttons)
      console.log("✅ Main menu sent successfully")
    } catch (error) {
      console.error("❌ Error sending main menu:", error)
      throw error
    }
  }

  private static async sendSearchLink(userId: string, userName: string): Promise<void> {
    console.log(`🔎 Sending search link to ${userId}`)

    try {
      const searchUrl = `${process.env.VERCEL_URL || "https://your-app.vercel.app"}/search`
      const searchText = this.getRandomTemplate(Templates.searchLink, {
        name: userName,
        url: searchUrl,
      })

      await WhatsAppAPI.sendTextMessage(userId, searchText)

      // Reset to initial state
      userSessions.set(userId, { state: "initial" })
      console.log("✅ Search link sent successfully")
    } catch (error) {
      console.error("❌ Error sending search link:", error)
      throw error
    }
  }

  private static async handleSessionMessage(
    userId: string,
    message: WhatsAppMessage,
    session: UserSession,
    user: User,
  ): Promise<void> {
    console.log(`🔄 Handling session message for state: ${session.state}`)

    // Handle name registration
    if (session.state === "awaiting_name" && message.text) {
      console.log(`📝 Name received: ${message.text}`)

      // Extract just the name from common patterns
      let cleanName = message.text.trim()

      // Remove common prefixes like "I'm", "My name is", "I am", etc.
      cleanName = cleanName.replace(/^(i'm|i am|my name is|im|name is|this is)\s+/i, "")

      // Capitalize first letter
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()

      console.log(`✅ Cleaned name: ${cleanName}`)

      // Update the user name in database
      await Database.updateUserName(userId, cleanName)
      userSessions.delete(userId) // Clear session

      // Send main menu with the updated name
      const greeting = this.getRandomTemplate(Templates.firstTimeGreeting, { name: cleanName })

      const buttons = [
        { type: "reply" as const, reply: { id: "lost_something", title: "🔍 I Lost Something" } },
        { type: "reply" as const, reply: { id: "found_something", title: "🙌 I Found Something" } },
        { type: "reply" as const, reply: { id: "my_activity", title: "📋 My Activity" } },
        { type: "reply" as const, reply: { id: "search_items", title: "🔎 Search All Items" } },
      ]

      await WhatsAppAPI.sendButtonMessage(userId, greeting, buttons)
      console.log("✅ Registration completed and main menu sent")
      return
    }

    // Handle numbered responses for menu navigation
    if (message.text && !isNaN(Number(message.text.trim()))) {
      const choice = Number(message.text.trim())
      console.log(`🔢 Numbered response detected: ${choice}`)

      // Handle main menu choices
      if (session.state === "initial") {
        switch (choice) {
          case 1:
            console.log("🔍 User chose: I Lost Something")
            await this.startReporting(userId, "LOST", user.user_name)
            break
          case 2:
            console.log("🙌 User chose: I Found Something")
            await this.startReporting(userId, "FOUND", user.user_name)
            break
          case 3:
            console.log("📋 User chose: My Activity")
            await this.showUserActivity(userId, user.user_name)
            break
          case 4:
            console.log("🔎 User chose: Search All Items")
            await this.sendSearchLink(userId, user.user_name)
            break
          default:
            console.log(`❓ Invalid menu choice: ${choice}`)
            await WhatsAppAPI.sendTextMessage(userId, "Please choose 1, 2, 3, or 4 from the menu options.")
        }
        return
      }

      // Handle category selection
      if (session.state === "awaiting_category") {
        const categories = ["ID & Finance", "Electronics", "Keys", "Apparel", "Personal Items", "Sports Gear", "Other"]
        if (choice >= 1 && choice <= categories.length) {
          console.log(`📂 Category selected: ${categories[choice - 1]}`)
          await this.handleCategorySelection(userId, categories[choice - 1], user.user_name)
        } else {
          await WhatsAppAPI.sendTextMessage(userId, `Please choose a number between 1 and ${categories.length}.`)
        }
        return
      }

      // Handle photo choice for lost items
      if (session.state === "awaiting_photo" && session.reportType === "LOST") {
        if (choice === 1) {
          console.log("📸 User chose to upload photo")
          await WhatsAppAPI.sendTextMessage(userId, "Please upload the photo now.")
        } else if (choice === 2) {
          console.log("🚫 User chose no photo")
          session.state = "awaiting_location"
          userSessions.set(userId, session)
          const locationText = this.getRandomTemplate(Templates.locationRequestLost)
          await WhatsAppAPI.sendTextMessage(userId, locationText)
        }
        return
      }
    }

    // Handle other session states
    switch (session.state) {
      case "awaiting_description":
        if (message.text) {
          console.log("📝 Description received")
          session.description = message.text
          session.state = "awaiting_photo"
          userSessions.set(userId, session)

          const text =
            session.reportType === "LOST"
              ? this.getRandomTemplate(Templates.photoRequestLost)
              : this.getRandomTemplate(Templates.photoRequestFound)

          await WhatsAppAPI.sendTextMessage(userId, text)
        }
        break

      case "awaiting_photo":
        if (message.type === "image" && message.mediaUrl) {
          console.log("📸 Image received, processing...")
          try {
            const imageBuffer = await WhatsAppAPI.downloadMedia(message.mediaUrl)
            const blob = await put(`items/${userId}-${Date.now()}.jpg`, imageBuffer, {
              access: "public",
              contentType: message.mediaContentType || "image/jpeg",
            })

            session.photoUrl = blob.url
            session.state = "awaiting_location"
            userSessions.set(userId, session)

            console.log("✅ Image uploaded successfully")
            const text =
              session.reportType === "LOST"
                ? this.getRandomTemplate(Templates.locationRequestLost)
                : this.getRandomTemplate(Templates.locationRequestFound)
            await WhatsAppAPI.sendTextMessage(userId, text)
          } catch (error) {
            console.error("❌ Error processing image:", error)
            await WhatsAppAPI.sendTextMessage(
              userId,
              "Sorry, there was an error processing your image. Please try again.",
            )
          }
        }
        break

      case "awaiting_location":
        if (message.text) {
          console.log("📍 Location received, completing report...")
          await this.completeReport(userId, session, message.text, user.user_name)
        }
        break

      default:
        console.log(`❓ Unhandled session state: ${session.state}`)
        await this.sendMainMenu(userId, user.user_name)
    }
  }

  private static async startReporting(userId: string, reportType: "LOST" | "FOUND", userName: string): Promise<void> {
    console.log(`📝 Starting ${reportType} report for ${userId}`)
    userSessions.set(userId, { state: "awaiting_category", reportType })

    const sections = [
      {
        title: "Select Category",
        rows: [
          { id: "category_ID & Finance", title: "ID & Finance", description: "Student ID, wallet, cards" },
          { id: "category_Electronics", title: "Electronics", description: "Phone, laptop, earbuds" },
          { id: "category_Keys", title: "Keys", description: "Room, bike, car keys" },
          { id: "category_Apparel", title: "Apparel", description: "Clothes, shoes, accessories" },
          { id: "category_Personal Items", title: "Personal Items", description: "Water bottle, books" },
          { id: "category_Sports Gear", title: "Sports Gear", description: "Equipment, gear" },
          { id: "category_Other", title: "Other", description: "Miscellaneous items" },
        ],
      },
    ]

    const text =
      reportType === "LOST"
        ? this.getRandomTemplate(Templates.lostItemStart, { name: userName })
        : this.getRandomTemplate(Templates.foundItemStart, { name: userName })

    await WhatsAppAPI.sendListMessage(userId, text, "Select Category", sections)
  }

  private static async handleCategorySelection(userId: string, category: string, userName: string): Promise<void> {
    const session = userSessions.get(userId)
    if (!session || session.state !== "awaiting_category") return

    session.category = category
    session.state = "awaiting_description"
    userSessions.set(userId, session)

    const text = this.getRandomTemplate(Templates.descriptionRequest)
    await WhatsAppAPI.sendTextMessage(userId, text)
  }

  private static async completeReport(
    userId: string,
    session: UserSession,
    location: string,
    userName: string,
  ): Promise<void> {
    if (!session.reportType || !session.category || !session.description) return

    console.log("💾 Saving item to database...")
    const item = await Database.createItem({
      reporter_id: userId,
      report_type: session.reportType,
      category: session.category,
      description: session.description,
      photo_url: session.photoUrl,
      location,
      status: "ACTIVE",
    })

    // Clear session and reset to initial state
    userSessions.set(userId, { state: "initial" })
    console.log("✅ Report completed successfully")

    // Send confirmation
    const confirmationText =
      session.reportType === "LOST"
        ? this.getRandomTemplate(Templates.lostItemConfirmation, {
            name: userName,
            itemId: item.claim_code || "N/A",
          })
        : this.getRandomTemplate(Templates.foundItemConfirmation, {
            name: userName,
            itemId: item.claim_code || "N/A",
          })

    await WhatsAppAPI.sendTextMessage(userId, confirmationText)

    // Check for matches and broadcast
    console.log("📢 Starting broadcast process...")
    await this.handleNewItemBroadcast(item)
  }

  private static async handleNewItemBroadcast(item: Item): Promise<void> {
    console.log("🔍 Looking for potential matches...")
    const matches = await Database.findMatchingItems(item)
    console.log(`Found ${matches.length} potential matches`)

    // Send direct messages to matched users
    for (const match of matches) {
      console.log(`📧 Sending match notification to ${match.reporter_id}`)
      const user = await Database.getUser(match.reporter_id)
      const userName = user?.user_name || "there"

      const actionText =
        item.report_type === "FOUND"
          ? "This item is at the ECOLE main block reception. Visit with your MU ID if this is yours!"
          : "Someone is looking for a similar item. Contact them through the ECOLE main block reception if you found it."

      const matchText = this.getRandomTemplate(Templates.potentialMatch, {
        name: userName,
        itemType: item.report_type.toLowerCase(),
        reportType: match.report_type.toLowerCase(),
        category: item.category,
        description: item.description,
        location: item.location,
        actionText: actionText,
      })

      await WhatsAppAPI.sendTextMessage(match.reporter_id, matchText)
    }

    // Broadcast to all subscribed users
    console.log("📢 Broadcasting to all subscribed users...")
    const subscribedUsers = await Database.getSubscribedUsers()
    console.log(`Broadcasting to ${subscribedUsers.length} users`)

    const broadcastText = this.createBroadcastMessage(item)
    const userIds = subscribedUsers.map((user) => user.user_id)

    if (item.photo_url) {
      console.log("📸 Broadcasting with image...")
      for (const userId of userIds) {
        try {
          await WhatsAppAPI.sendImageMessage(userId, item.photo_url, broadcastText)
        } catch (error) {
          console.error(`Failed to send broadcast to ${userId}:`, error)
        }
      }
    } else {
      console.log("📝 Broadcasting text only...")
      for (const userId of userIds) {
        try {
          await WhatsAppAPI.sendTextMessage(userId, broadcastText)
        } catch (error) {
          console.error(`Failed to send broadcast to ${userId}:`, error)
        }
      }
    }

    console.log("✅ Broadcast completed")
  }

  private static createBroadcastMessage(item: Item): string {
    const emoji = item.report_type === "LOST" ? "🔍" : "🙌"
    let message = `${emoji} ${item.report_type}: ${item.category} Alert!\n\n`
    message += `Item: ${item.description}\n`
    message += `${item.report_type === "LOST" ? "Last Seen" : "Found"} At: ${item.location}\n`
    message += `ItemID: ${item.claim_code}\n\n`

    if (item.report_type === "FOUND") {
      message += `[ ➡️ Is This Yours? (Claim ${item.claim_code}) ]`
    } else {
      message += `📞 *If Found:* Please take it to the ECOLE main block reception or report it here.`
    }

    return message
  }

  private static async handleClaimInstructions(userId: string, itemId: string, userName: string): Promise<void> {
    console.log(`📋 Handling claim instructions for ${userId}, ItemID: ${itemId}`)

    const item = await Database.getItemById(itemId)
    if (!item) {
      await WhatsAppAPI.sendTextMessage(
        userId,
        "Sorry, I couldn't find that item. Please check the ItemID and try again.",
      )
      return
    }

    const claimText = this.getRandomTemplate(Templates.claimInstructions, {
      description: item.description,
      itemId: itemId,
    })

    await WhatsAppAPI.sendTextMessage(userId, claimText)

    // Reset to initial state
    userSessions.set(userId, { state: "initial" })
  }

  private static async showUserActivity(userId: string, userName: string): Promise<void> {
    console.log(`📊 Showing activity for ${userId}`)
    const items = await Database.getUserItems(userId)

    if (items.length === 0) {
      const noActivityText = this.getRandomTemplate(Templates.noActivity, { name: userName })
      await WhatsAppAPI.sendTextMessage(userId, noActivityText)
      // Reset to initial state
      userSessions.set(userId, { state: "initial" })
      return
    }

    let activityText = `📋 *Your Activity Summary, ${userName}:*\n\n`

    const lostItems = items.filter((item) => item.report_type === "LOST")
    const foundItems = items.filter((item) => item.report_type === "FOUND")

    if (lostItems.length > 0) {
      activityText += "🔍 **You Reported Lost:**\n"
      lostItems.forEach((item) => {
        const status = item.status === "CLAIMED" ? "Found!" : "Still Searching"
        activityText += `• [${item.category}] ${item.description} (ID: ${item.claim_code}) - Status: ${status}\n`
      })
      activityText += "\n"
    }

    if (foundItems.length > 0) {
      activityText += "🙌 *You Reported Found:*\n"
      foundItems.forEach((item) => {
        const status = item.status === "CLAIMED" ? "Returned to Owner" : "At ECOLE Reception"
        activityText += `• [${item.category}] ${item.description} (ID: ${item.claim_code}) - Status: ${status}\n`
      })
    }

    await WhatsAppAPI.sendTextMessage(userId, activityText)

    // Reset to initial state
    userSessions.set(userId, { state: "initial" })
  }

  private static async handleAdminClaim(userId: string, command: string, userName: string): Promise<void> {
    console.log(`🔧 Admin claim command from ${userId}: ${command}`)
    const itemId = command.replace("!claim ", "").trim()

    if (!itemId) {
      await WhatsAppAPI.sendTextMessage(userId, "❌ Please provide an ItemID. Usage: !claim A3K9B1")
      return
    }

    const claimedItem = await Database.claimItem(itemId)

    if (!claimedItem) {
      await WhatsAppAPI.sendTextMessage(userId, `❌ No active item found with ItemID: ${itemId}`)
      return
    }

    console.log(`✅ Item claimed: ${claimedItem.description}`)

    // Notify admin
    const adminText = this.getRandomTemplate(Templates.adminClaimSuccess, {
      description: claimedItem.description,
      itemId: itemId,
    })
    await WhatsAppAPI.sendTextMessage(userId, adminText)

    // Notify the person who found the item
    const reporter = await Database.getUser(claimedItem.reporter_id)
    const reporterName = reporter?.user_name || "there"

    const claimedText = this.getRandomTemplate(Templates.itemClaimed, {
      name: reporterName,
      category: claimedItem.category.toLowerCase(),
      description: claimedItem.description,
    })
    await WhatsAppAPI.sendTextMessage(claimedItem.reporter_id, claimedText)

    // Find and notify potential matches
    const matches = await Database.findMatchingItems(claimedItem)
    for (const match of matches) {
      if (match.report_type === "LOST") {
        const matchUser = await Database.getUser(match.reporter_id)
        const matchUserName = matchUser?.user_name || "there"

        const lostClaimedText = this.getRandomTemplate(Templates.lostItemClaimed, {
          name: matchUserName,
          category: claimedItem.category.toLowerCase(),
        })
        await WhatsAppAPI.sendTextMessage(match.reporter_id, lostClaimedText)
      }
    }
  }
}
