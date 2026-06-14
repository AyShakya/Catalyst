const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "https://catalyst-backend-ldvn.onrender.com/api/webhook/events";

app.use(express.json());

// Database setup
const db = new sqlite3.Database("./channel_service.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS channel_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_message_id TEXT UNIQUE,
      communication_id TEXT,
      campaign_id TEXT,
      customer_id TEXT,
      channel TEXT,
      recipient TEXT,
      message TEXT,
      status TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS channel_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER,
      event_type TEXT,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(message_id) REFERENCES channel_messages(id)
    )
  `);
});

const SIMULATION_PROBABILITIES = {
  DELIVERED: 0.9,
  FAILED: 0.1,
  OPENED: 0.7, // if delivered
  CLICKED: 0.3, // if opened
  PURCHASED: 0.1, // if clicked
};

const EVENT_DELAYS = {
  SENT: 2000,
  DELIVERED: 3000,
  OPENED: 5000,
  CLICKED: 10000,
  PURCHASED: 15000,
};

// Helper to update message status and record event
async function recordEvent(messageId, channelMessageId, communicationId, eventType) {
  console.log(`[Channel Service] Event: ${eventType} for message ${channelMessageId}`);
  
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE channel_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [eventType, messageId],
      (err) => {
        if (err) return reject(err);

        db.run(
          "INSERT INTO channel_events (message_id, event_type) VALUES (?, ?)",
          [messageId, eventType],
          async (err) => {
            if (err) return reject(err);
            
            try {
              // The spec says every event should be sent to CRM
              await sendWebhook(communicationId, channelMessageId, eventType);
              resolve();
            } catch (webhookErr) {
              // Webhook errors are handled inside sendWebhook with retries
              resolve(); 
            }
          }
        );
      }
    );
  });
}

async function sendWebhook(communicationId, channelMessageId, event, retryCount = 0) {
  try {
    await axios.post(CRM_WEBHOOK_URL, {
      communicationId,
      channelMessageId,
      event,
      timestamp: new Date().toISOString()
    });
    console.log(`[Channel Service] Webhook delivered: ${event} for ${channelMessageId}`);
  } catch (error) {
    if (retryCount < 3) {
      console.log(`[Channel Service] Webhook FAILED for ${event}. Retrying (Attempt ${retryCount + 1})...`);
      // Exponential backoff or fixed? Spec says Attempt 1, 2, 3.
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await sendWebhook(communicationId, channelMessageId, event, retryCount + 1);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 5000 * (retryCount + 1));
      });
    } else {
      console.error(`[Channel Service] Max retries reached for webhook ${event}. Marking message as DEAD.`);
      db.run("UPDATE channel_messages SET status = 'DEAD' WHERE channel_message_id = ?", [channelMessageId]);
      throw error;
    }
  }
}

function simulateLifecycle(messageId, channelMessageId, communicationId) {
  // 1. QUEUED -> SENT
  setTimeout(async () => {
    await recordEvent(messageId, channelMessageId, communicationId, "SENT");

    // 2. SENT -> DELIVERED or FAILED
    setTimeout(async () => {
      const isDelivered = Math.random() < SIMULATION_PROBABILITIES.DELIVERED;
      if (!isDelivered) {
        await recordEvent(messageId, channelMessageId, communicationId, "FAILED");
        return;
      }

      await recordEvent(messageId, channelMessageId, communicationId, "DELIVERED");

      // 3. DELIVERED -> OPENED?
      setTimeout(async () => {
        if (Math.random() > SIMULATION_PROBABILITIES.OPENED) return;
        await recordEvent(messageId, channelMessageId, communicationId, "OPENED");

        // 4. OPENED -> CLICKED?
        setTimeout(async () => {
          if (Math.random() > SIMULATION_PROBABILITIES.CLICKED) return;
          await recordEvent(messageId, channelMessageId, communicationId, "CLICKED");

          // 5. CLICKED -> PURCHASED?
          setTimeout(async () => {
            if (Math.random() > SIMULATION_PROBABILITIES.PURCHASED) return;
            await recordEvent(messageId, channelMessageId, communicationId, "PURCHASED");
          }, EVENT_DELAYS.PURCHASED);
        }, EVENT_DELAYS.CLICKED);
      }, EVENT_DELAYS.OPENED);
    }, EVENT_DELAYS.DELIVERED);
  }, EVENT_DELAYS.SENT);
}

app.post("/messages/send", (req, res) => {
  const { communicationId, campaignId, customerId, channel, recipient, message } = req.body;
  
  if (!communicationId || !recipient || !channel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const channelMessageId = `msg_${crypto.randomBytes(4).toString("hex")}`;
  
  db.run(
    `INSERT INTO channel_messages 
    (channel_message_id, communication_id, campaign_id, customer_id, channel, recipient, message, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [channelMessageId, communicationId, campaignId, customerId, channel, recipient, message, "QUEUED"],
    function(err) {
      if (err) {
        console.error("[Channel Service] Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      const messageId = this.lastID;
      
      console.log(`[Channel Service] Accepted message ${channelMessageId} for ${recipient}`);
      
      res.json({
        accepted: true,
        channelMessageId
      });

      // Start simulation
      simulateLifecycle(messageId, channelMessageId, communicationId);
    }
  );
});

// Admin/Debug routes
app.get("/messages", (req, res) => {
  db.all("SELECT * FROM channel_messages ORDER BY created_at DESC", (err, rows) => {
    res.json(rows);
  });
});

app.get("/messages/:id/events", (req, res) => {
  db.all("SELECT * FROM channel_events WHERE message_id = ? ORDER BY created_at ASC", [req.params.id], (err, rows) => {
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Channel Service Mock listening on port ${PORT}`);
});
