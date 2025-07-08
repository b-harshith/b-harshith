@@ .. @@
 import { type NextRequest, NextResponse } from "next/server"
-import { BotLogic } from "@/lib/bot-logic"
+import { EnhancedBotLogic } from "@/lib/enhanced-bot-logic"
 import { Database } from "@/lib/database"
 
@@ .. @@
     // Verify this is a WhatsApp message
     if (twilioBody.From && twilioBody.From.startsWith("whatsapp:")) {
       console.log("✅ Valid WhatsApp message detected, processing...")
-      await BotLogic.processMessage(twilioBody)
+      await EnhancedBotLogic.processMessage(twilioBody)
       console.log("✅ Message processed successfully")
     } else {
       console.log("❌ Not a WhatsApp message, ignoring:", twilioBody.From)