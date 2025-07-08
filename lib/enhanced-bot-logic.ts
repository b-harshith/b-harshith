import { EnhancedDatabase, type Event, type FAQ, type UserProfile } from "./enhanced-database"
import { MessageQueue } from "./message-queue"
import { WhatsAppAPI, type WhatsAppMessage } from "./whatsapp"
import { put } from "@vercel/blob"

interface UserSession {
  state:
    | "initial"
    | "onboarding_interests"
    | "onboarding_profile"
    | "reporting_lost"
    | "reporting_found"
    | "awaiting_category"
    | "awaiting_description"
    | "awaiting_photo"
    | "awaiting_location"
    | "asking_question"
  reportType?: "LOST" | "FOUND"
  category?: string
  description?: string
  photoUrl?: string
  userName?: string
  selectedInterests?: string[]
  yearOfStudy?: number
  department?: string
}

const userSessions = new Map<string, UserSession>()

// Enhanced templates with personality
const Templates = {
  welcome: [
    "👋 Hey there! I'm *Loki*, your campus companion at MU! I'm here to help with lost items, campus events, and any questions you have. First, what should I call you?\n\n(Just your name please)",
    "👋 Welcome to MU! I'm *Loki*, and I'm basically your digital campus buddy. I help with lost & found, keep you updated on cool events, and answer your campus questions. What's your name?\n\n(Submit only your name)",
    "👋 Hi! *Loki* here - think of me as your friendly campus assistant at MU. I'm great at finding lost stuff, sharing awesome events, and being your campus info guru. What should I call you?\n\n(Just your name)",
  ],

  onboardingInterests: [
    "Perfect, {name}! 🎯 To make sure I only share stuff you actually care about, what are you interested in? Pick as many as you like:\n\n1. 💻 Tech & Innovation\n2. 🎨 Arts & Creativity\n3. ⚽ Sports & Fitness\n4. 📚 Academic Events\n5. 🎭 Cultural Programs\n6. 🤝 Social & Networking\n7. 💼 Career & Internships\n8. 🎉 Other Fun Stuff\n\nReply with numbers (e.g., \"1 3 5\" for Tech, Sports, and Cultural)",
    "Great to meet you, {name}! 🌟 I want to be helpful, not annoying, so let me know what you're into. Choose your interests:\n\n1. 💻 Tech & Innovation\n2. 🎨 Arts & Creativity\n3. ⚽ Sports & Fitness\n4. 📚 Academic Events\n5. 🎭 Cultural Programs\n6. 🤝 Social & Networking\n7. 💼 Career & Internships\n8. 🎉 Other Fun Stuff\n\nJust send the numbers that interest you (like \"2 4 6\")",
    "Nice, {name}! 🚀 I'm all about quality over quantity when it comes to updates. What gets you excited? Pick your favorites:\n\n1. 💻 Tech & Innovation\n2. 🎨 Arts & Creativity\n3. ⚽ Sports & Fitness\n4. 📚 Academic Events\n5. 🎭 Cultural Programs\n6. 🤝 Social & Networking\n7. 💼 Career & Internships\n8. 🎉 Other Fun Stuff\n\nSend me the numbers (example: \"1 5 7\")",
  ],

  onboardingComplete: [
    "Awesome, {name}! 🎉 You're all set up. I'll only bug you about {interests} stuff, and I'm smart enough to not message during your classes. Here's what I can help with:",
    "Perfect setup, {name}! ✨ I've got your interests saved ({interests}) and I respect your study time. Here's how I can help:",
    "You're good to go, {name}! 🌟 I'll keep you posted on {interests} events and stay quiet during classes. Here's what I do:",
  ],

  mainMenu: [
    "Hey {name}! 👋 How can I help you today?",
    "Hi there, {name}! 🌟 What can I do for you?",
    "Hello {name}! 🚀 What brings you here today?",
    "Hey {name}! 😊 How can I assist you?",
  ],

  eventBroadcast: [
    "🎉 *{category} Alert!*\n\n📅 **{title}**\n{description}\n\n📍 *Where:* {location}\n⏰ *When:* {date}\n\n{registration}",
    "✨ *New {category} Event!*\n\n🎯 **{title}**\n{description}\n\n📍 *Location:* {location}\n📅 *Date:* {date}\n\n{registration}",
    "🚀 *{category} Opportunity!*\n\n💫 **{title}**\n{description}\n\n📍 *Venue:* {location}\n⏰ *Time:* {date}\n\n{registration}",
  ],

  faqResponse: [
    "💡 Here's what I found:\n\n**{question}**\n{answer}\n\nHope that helps! Need anything else?",
    "🎯 Got it! Here's the info:\n\n**{question}**\n{answer}\n\nAnything else I can help with?",
    "✨ Found this for you:\n\n**{question}**\n{answer}\n\nLet me know if you need more help!",
  ],

  noFaqFound: [
    "🤔 Hmm, I don't have that info in my knowledge base yet. But hey, you can:\n\n• Try rephrasing your question\n• Contact the admin office\n• Ask me about lost & found or events\n\nWhat else can I help with?",
    "🔍 I couldn't find a specific answer to that, but I'm always learning! You could:\n\n• Try asking differently\n• Check the official MU website\n• Ask about campus events or lost items\n\nAnything else I can help with?",
    "💭 That's not in my current knowledge base, but I'm getting smarter every day! Meanwhile:\n\n• Try a different phrasing\n• Contact student services\n• Ask me about events or lost & found\n\nWhat else can I do for you?",
  ],

  interestsUpdated: [
    "✅ Perfect! Your interests have been updated to: {interests}. I'll make sure you only get relevant updates!",
    "🎯 Done! You'll now get notifications about: {interests}. Quality over quantity, always!",
    "✨ Updated! I'll keep you posted on: {interests}. No spam, just the good stuff!",
  ],
}

export class EnhancedBotLogic {
  private static getRandomTemplate(templates: string[], replacements: Record<string, string> = {}): string {
    const randomIndex = Math.floor(Math.random() * templates.length)
    let template = templates[randomIndex]

    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{${key}}`, "g"), value)
    })

    return template
  }

  static async processMessage(twilioBody: any): Promise<void> {
    console.log("🤖 Enhanced BotLogic processing message")

    try {
      const fromNumber = twilioBody.From?.replace("whatsapp:", "") || ""
      const message: WhatsAppMessage = {
        from: fromNumber,
        text: twilioBody.Body,
        type: twilioBody.MediaUrl0 ? "image" : "text",
        mediaUrl: twilioBody.MediaUrl0,
        mediaContentType: twilioBody.MediaContentType0,
      }

      const userId = message.from
      console.log(`👤 Processing message from user: ${userId}`)

      if (!userId || userId.length < 10) {
        console.error("❌ Invalid user ID format:", userId)
        return
      }

      // Get enhanced user profile
      const userProfile = await EnhancedDatabase.getUserProfile(userId)

      if (!userProfile) {
        console.log("👤 New user detected, starting registration flow...")
        await this.startRegistrationFlow(userId)
        return
      }

      console.log(`✅ User found: ${userProfile.user_name}, onboarded: ${userProfile.onboarding_completed}`)

      // Handle admin commands
      if (userProfile.is_admin && message.text?.startsWith("!")) {
        await this.handleAdminCommands(userId, message.text, userProfile)
        return
      }

      // Handle user commands
      if (message.text?.startsWith("!")) {
        await this.handleUserCommands(userId, message.text, userProfile)
        return
      }

      // Handle menu triggers
      if (message.text && ["hi", "hello", "menu", "start"].includes(message.text.toLowerCase())) {
        if (!userProfile.onboarding_completed) {
          await this.continueOnboarding(userId, userProfile)
        } else {
          await this.sendMainMenu(userId, userProfile)
        }
        return
      }

      // Handle session-based flows
      const session = userSessions.get(userId) || { state: "initial" }
      
      if (!userProfile.onboarding_completed) {
        await this.handleOnboardingFlow(userId, message, session, userProfile)
      } else {
        await this.handleMainFlow(userId, message, session, userProfile)
      }

    } catch (error) {
      console.error("❌ Error in Enhanced BotLogic:", error)
      throw error
    }
  }

  private static async startRegistrationFlow(userId: string): Promise<void> {
    console.log(`👋 Starting registration flow for ${userId}`)

    try {
      await EnhancedDatabase.createUser(userId, "Friend")
      userSessions.set(userId, { state: "onboarding_interests" })

      const welcomeText = this.getRandomTemplate(Templates.welcome)
      
      // Use direct reply for immediate response
      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', welcomeText, {
        priority: 1,
        forceImmediate: true
      })

      console.log("✅ Registration flow started")
    } catch (error) {
      console.error("❌ Error starting registration flow:", error)
      throw error
    }
  }

  private static async continueOnboarding(userId: string, userProfile: UserProfile): Promise<void> {
    const session = userSessions.get(userId) || { state: "onboarding_interests" }
    
    if (!session.userName) {
      session.state = "onboarding_interests"
      userSessions.set(userId, session)
      
      const welcomeText = this.getRandomTemplate(Templates.welcome)
      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', welcomeText, {
        priority: 1,
        forceImmediate: true
      })
    } else {
      await this.sendInterestSelection(userId, session.userName)
    }
  }

  private static async handleOnboardingFlow(
    userId: string,
    message: WhatsAppMessage,
    session: UserSession,
    userProfile: UserProfile
  ): Promise<void> {
    console.log(`🔄 Handling onboarding flow, state: ${session.state}`)

    switch (session.state) {
      case "onboarding_interests":
        if (message.text) {
          // Extract name
          let cleanName = message.text.trim()
          cleanName = cleanName.replace(/^(i'm|i am|my name is|im|name is|this is)\s+/i, "")
          cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()

          await EnhancedDatabase.updateUserName(userId, cleanName)
          session.userName = cleanName
          session.state = "onboarding_interests"
          userSessions.set(userId, session)

          await this.sendInterestSelection(userId, cleanName)
        }
        break

      case "onboarding_profile":
        if (message.text) {
          await this.handleInterestSelection(userId, message.text, session)
        }
        break
    }
  }

  private static async sendInterestSelection(userId: string, userName: string): Promise<void> {
    const interestText = this.getRandomTemplate(Templates.onboardingInterests, { name: userName })
    
    userSessions.set(userId, { 
      state: "onboarding_profile", 
      userName 
    })

    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', interestText, {
      priority: 1,
      forceImmediate: true
    })
  }

  private static async handleInterestSelection(userId: string, text: string, session: UserSession): Promise<void> {
    const interestMap = {
      '1': 'Tech',
      '2': 'Arts', 
      '3': 'Sports',
      '4': 'Academic',
      '5': 'Cultural',
      '6': 'Social',
      '7': 'Career',
      '8': 'Other'
    }

    const selectedNumbers = text.match(/\d/g) || []
    const selectedInterests = selectedNumbers
      .map(num => interestMap[num as keyof typeof interestMap])
      .filter(Boolean)

    if (selectedInterests.length === 0) {
      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
        "Please select at least one interest by sending the numbers (e.g., \"1 3 5\")", {
        priority: 1,
        forceImmediate: true
      })
      return
    }

    // Complete onboarding
    await EnhancedDatabase.completeOnboarding(userId, selectedInterests)
    userSessions.delete(userId)

    const interestsList = selectedInterests.join(', ')
    const completeText = this.getRandomTemplate(Templates.onboardingComplete, {
      name: session.userName || "there",
      interests: interestsList
    })

    const menuButtons = [
      { type: "reply" as const, reply: { id: "lost_something", title: "🔍 Lost Something" } },
      { type: "reply" as const, reply: { id: "found_something", title: "🙌 Found Something" } },
      { type: "reply" as const, reply: { id: "campus_events", title: "🎉 Campus Events" } },
      { type: "reply" as const, reply: { id: "ask_question", title: "❓ Ask Question" } },
      { type: "reply" as const, reply: { id: "my_stuff", title: "📱 My Stuff" } },
    ]

    await WhatsAppAPI.sendButtonMessage(userId, completeText, menuButtons)
  }

  private static async sendMainMenu(userId: string, userProfile: UserProfile): Promise<void> {
    const greeting = this.getRandomTemplate(Templates.mainMenu, { name: userProfile.user_name })

    const buttons = [
      { type: "reply" as const, reply: { id: "lost_something", title: "🔍 Lost Something" } },
      { type: "reply" as const, reply: { id: "found_something", title: "🙌 Found Something" } },
      { type: "reply" as const, reply: { id: "campus_events", title: "🎉 Campus Events" } },
      { type: "reply" as const, reply: { id: "ask_question", title: "❓ Ask Question" } },
      { type: "reply" as const, reply: { id: "my_stuff", title: "📱 My Stuff" } },
    ]

    await WhatsAppAPI.sendButtonMessage(userId, greeting, buttons)
  }

  private static async handleMainFlow(
    userId: string,
    message: WhatsAppMessage,
    session: UserSession,
    userProfile: UserProfile
  ): Promise<void> {
    // Handle button responses
    if (message.text) {
      switch (message.text) {
        case "lost_something":
          await this.startLostItemReport(userId, userProfile)
          break
        case "found_something":
          await this.startFoundItemReport(userId, userProfile)
          break
        case "campus_events":
          await this.showCampusEvents(userId, userProfile)
          break
        case "ask_question":
          await this.startQuestionFlow(userId, userProfile)
          break
        case "my_stuff":
          await this.showUserDashboard(userId, userProfile)
          break
        default:
          // Handle as potential question
          if (session.state === "asking_question") {
            await this.handleQuestion(userId, message.text, userProfile)
          } else {
            await this.handleQuestion(userId, message.text, userProfile)
          }
      }
    }
  }

  private static async handleQuestion(userId: string, question: string, userProfile: UserProfile): Promise<void> {
    console.log(`❓ Handling question: ${question}`)

    const faqs = await EnhancedDatabase.searchFAQs(question)

    if (faqs.length > 0) {
      const bestMatch = faqs[0]
      await EnhancedDatabase.incrementFAQViewCount(bestMatch.faq_id)

      const responseText = this.getRandomTemplate(Templates.faqResponse, {
        question: bestMatch.question,
        answer: bestMatch.answer
      })

      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', responseText, {
        priority: 2,
        forceImmediate: true
      })
    } else {
      const noAnswerText = this.getRandomTemplate(Templates.noFaqFound)
      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', noAnswerText, {
        priority: 2,
        forceImmediate: true
      })
    }

    userSessions.set(userId, { state: "initial" })
  }

  private static async startQuestionFlow(userId: string, userProfile: UserProfile): Promise<void> {
    userSessions.set(userId, { state: "asking_question" })
    
    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
      "🤔 What would you like to know? Ask me anything about campus life, facilities, or procedures!", {
      priority: 1,
      forceImmediate: true
    })
  }

  private static async showCampusEvents(userId: string, userProfile: UserProfile): Promise<void> {
    const upcomingEvents = await EnhancedDatabase.getEventsByStatus('APPROVED')
    const userEvents = upcomingEvents.filter(event => 
      event.target_audience.some(audience => userProfile.interests.includes(audience)) ||
      event.target_audience.length === 0
    ).slice(0, 5)

    if (userEvents.length === 0) {
      await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
        "🎭 No upcoming events match your interests right now. Check back soon or update your interests with !myinterests", {
        priority: 2,
        forceImmediate: true
      })
      return
    }

    let eventsText = "🎉 *Upcoming Events for You:*\n\n"
    userEvents.forEach((event, index) => {
      eventsText += `${index + 1}. **${event.title}**\n`
      eventsText += `📅 ${new Date(event.event_date).toLocaleDateString()}\n`
      eventsText += `📍 ${event.location}\n`
      eventsText += `🏷️ ${event.category}\n\n`
    })

    eventsText += "Want more details? Just ask about any specific event!"

    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', eventsText, {
      priority: 2,
      forceImmediate: true
    })
  }

  private static async showUserDashboard(userId: string, userProfile: UserProfile): Promise<void> {
    const userItems = await EnhancedDatabase.getUserItems(userId)
    
    let dashboardText = `📱 *Your Dashboard, ${userProfile.user_name}:*\n\n`
    dashboardText += `🎯 *Interests:* ${userProfile.interests.join(', ')}\n`
    dashboardText += `📊 *Items Reported:* ${userItems.length}\n\n`

    if (userItems.length > 0) {
      dashboardText += "*Recent Reports:*\n"
      userItems.slice(0, 3).forEach(item => {
        const status = item.status === "CLAIMED" ? "✅ Resolved" : "🔄 Active"
        dashboardText += `• ${item.report_type}: ${item.description} - ${status}\n`
      })
    }

    dashboardText += "\n*Commands:*\n"
    dashboardText += "• !myinterests - Update your interests\n"
    dashboardText += "• !mystats - View detailed statistics\n"
    dashboardText += "• !help - Get help"

    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', dashboardText, {
      priority: 2,
      forceImmediate: true
    })
  }

  private static async handleUserCommands(userId: string, command: string, userProfile: UserProfile): Promise<void> {
    const cmd = command.toLowerCase().trim()

    switch (cmd) {
      case "!myinterests":
        await this.sendInterestSelection(userId, userProfile.user_name)
        break
      
      case "!mystats":
        await this.showDetailedStats(userId, userProfile)
        break
        
      case "!help":
        await this.showHelpMenu(userId, userProfile)
        break
        
      default:
        await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
          "🤔 Unknown command. Try !help to see available commands.", {
          priority: 2,
          forceImmediate: true
        })
    }
  }

  private static async handleAdminCommands(userId: string, command: string, userProfile: UserProfile): Promise<void> {
    const parts = command.split(' ')
    const cmd = parts[0].toLowerCase()

    switch (cmd) {
      case "!broadcast":
        await this.handleAdminBroadcast(userId, parts.slice(1).join(' '))
        break
        
      case "!stats":
        await this.showAdminStats(userId)
        break
        
      case "!queue":
        await this.showQueueStats(userId)
        break
        
      default:
        await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
          "🔧 Admin commands: !broadcast, !stats, !queue, !claim", {
          priority: 1,
          forceImmediate: true
        })
    }
  }

  private static async showAdminStats(userId: string): Promise<void> {
    const userStats = await EnhancedDatabase.getUserEngagementStats()
    const eventStats = await EnhancedDatabase.getEventStats()
    const queueStats = await MessageQueue.getQueueStats()

    let statsText = "📊 *Admin Dashboard:*\n\n"
    statsText += "*User Engagement:*\n"
    statsText += `• Total Users: ${userStats.totalUsers}\n`
    statsText += `• Active (7 days): ${userStats.activeUsers}\n`
    statsText += `• Completed Onboarding: ${userStats.completedOnboarding}\n\n`
    
    statsText += "*Events:*\n"
    statsText += `• Total: ${eventStats.totalEvents}\n`
    statsText += `• Pending Approval: ${eventStats.pendingEvents}\n`
    statsText += `• Upcoming: ${eventStats.upcomingEvents}\n\n`
    
    statsText += "*Message Queue:*\n"
    statsText += `• Pending: ${queueStats.pending}\n`
    statsText += `• Sent (24h): ${queueStats.sent}\n`
    statsText += `• Failed: ${queueStats.failed}\n`

    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', statsText, {
      priority: 1,
      forceImmediate: true
    })
  }

  // Implement lost/found item reporting (reuse existing logic)
  private static async startLostItemReport(userId: string, userProfile: UserProfile): Promise<void> {
    // Reuse existing lost item logic from original bot
    userSessions.set(userId, { state: "reporting_lost", reportType: "LOST" })
    
    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
      `Alright ${userProfile.user_name}, let's find your missing item! What category does it belong to?`, {
      priority: 1,
      forceImmediate: true
    })
  }

  private static async startFoundItemReport(userId: string, userProfile: UserProfile): Promise<void> {
    // Reuse existing found item logic from original bot
    userSessions.set(userId, { state: "reporting_found", reportType: "FOUND" })
    
    await MessageQueue.enqueueMessage(userId, 'DIRECT_REPLY', 
      `Thanks for helping out, ${userProfile.user_name}! What type of item did you find?`, {
      priority: 1,
      forceImmediate: true
    })
  }

  // Event broadcasting system
  static async broadcastApprovedEvents(): Promise<void> {
    console.log("📢 Starting event broadcast process")
    
    const eventsTobroadcast = await EnhancedDatabase.getEventsReadyForBroadcast()
    
    for (const event of eventsTobroadcast) {
      await this.broadcastEvent(event)
      await EnhancedDatabase.markEventBroadcastSent(event.event_id)
    }
  }

  private static async broadcastEvent(event: Event): Promise<void> {
    console.log(`📢 Broadcasting event: ${event.title}`)
    
    // Get users interested in this event category
    const targetUsers = await EnhancedDatabase.getUsersByInterests(event.target_audience)
    
    const registrationText = event.registration_required 
      ? `🎫 *Registration:* ${event.registration_link || 'Contact organizer'}`
      : "🎫 *Registration:* Not required"

    const eventText = this.getRandomTemplate(Templates.eventBroadcast, {
      category: event.category,
      title: event.title,
      description: event.description,
      location: event.location,
      date: new Date(event.event_date).toLocaleString(),
      registration: registrationText
    })

    // Queue messages for all target users
    for (const userId of targetUsers) {
      await MessageQueue.enqueueMessage(userId, 'EVENT_BROADCAST', eventText, {
        priority: 6,
        mediaUrl: event.poster_url,
        metadata: { eventId: event.event_id }
      })
    }

    console.log(`✅ Event broadcast queued for ${targetUsers.length} users`)
  }
}