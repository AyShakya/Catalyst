const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const channel = "https://catalyst-backend-ldvn.onrender.com/api/webhook/events"
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || channel || "http://localhost:5000/api/webhook/events"; // Replace with your actual CRM webhook URL

app.use(express.json());

const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "channel_service.db"));

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

let eventQueue = [];
let flushTimeout = null;

async function queueWebhookEvent(communicationId, channelMessageId, event) {
  eventQueue.push({
    communicationId,
    channelMessageId,
    event,
    timestamp: new Date().toISOString()
  });

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushEventQueue, 500); // Flush events every 500ms
  }
}

async function flushEventQueue() {
  const batch = [...eventQueue];
  eventQueue = [];
  flushTimeout = null;

  if (batch.length === 0) return;

  console.log(`[Channel Service] Flushing batch of ${batch.length} events to CRM`);

  try {
    await sendWebhookBatch(batch);
  } catch (error) {
    console.error("[Channel Service] Failed to send event batch. Falling back to singular delivery...", error.message);
    // Fallback: Send individually in case the CRM's batch processing fails
    for (const item of batch) {
      sendWebhookSingular(item).catch(err => {
        console.error(`[Channel Service] Fallback singular delivery failed for ${item.channelMessageId}:`, err.message);
      });
    }
  }
}

async function sendWebhookBatch(batch, retryCount = 0) {
  try {
    await axios.post(CRM_WEBHOOK_URL, batch);
    console.log(`[Channel Service] Batch of ${batch.length} events delivered to CRM`);
  } catch (error) {
    console.warn(`[Channel Service] Webhook batch delivery error to ${CRM_WEBHOOK_URL}: ${error.message}${error.response ? ' - ' + JSON.stringify(error.response.data) : ''}`);
    if (retryCount < 3) {
      console.log(`[Channel Service] Webhook batch delivery FAILED. Retrying (Attempt ${retryCount + 1})...`);
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await sendWebhookBatch(batch, retryCount + 1);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 5000 * (retryCount + 1));
      });
    } else {
      console.error(`[Channel Service] Max retries reached for event batch. Dead-lettering items.`);
      const ids = batch.map(b => b.channelMessageId);
      const placeholders = ids.map(() => "?").join(",");
      db.run(`UPDATE channel_messages SET status = 'DEAD' WHERE channel_message_id IN (${placeholders})`, ids);
      throw error;
    }
  }
}

async function sendWebhookSingular(item, retryCount = 0) {
  try {
    await axios.post(CRM_WEBHOOK_URL, item);
    console.log(`[Channel Service] Webhook delivered (singular fallback): ${item.event} for ${item.channelMessageId}`);
  } catch (error) {
    console.warn(`[Channel Service] Webhook singular delivery error to ${CRM_WEBHOOK_URL}: ${error.message}${error.response ? ' - ' + JSON.stringify(error.response.data) : ''}`);
    if (retryCount < 3) {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await sendWebhookSingular(item, retryCount + 1);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 5000 * (retryCount + 1));
      });
    } else {
      db.run("UPDATE channel_messages SET status = 'DEAD' WHERE channel_message_id = ?", [item.channelMessageId]);
      throw error;
    }
  }
}

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
            
            // Queue event for batched webhook delivery
            queueWebhookEvent(communicationId, channelMessageId, eventType);
            resolve();
          }
        );
      }
    );
  });
}

function simulateLifecycle(messageId, channelMessageId, communicationId) {
  // Helper to run async code inside setTimeout safely
  const runStep = (fn) => {
    return async () => {
      try {
        await fn();
      } catch (err) {
        console.error(`[Simulation Error] message ${channelMessageId}:`, err);
      }
    };
  };

  // 1. QUEUED -> SENT
  setTimeout(runStep(async () => {
    await recordEvent(messageId, channelMessageId, communicationId, "SENT");

    // 2. SENT -> DELIVERED or FAILED
    setTimeout(runStep(async () => {
      const isDelivered = Math.random() < SIMULATION_PROBABILITIES.DELIVERED;
      if (!isDelivered) {
        await recordEvent(messageId, channelMessageId, communicationId, "FAILED");
        return;
      }

      await recordEvent(messageId, channelMessageId, communicationId, "DELIVERED");

      // 3. DELIVERED -> OPENED?
      setTimeout(runStep(async () => {
        if (Math.random() > SIMULATION_PROBABILITIES.OPENED) return;
        await recordEvent(messageId, channelMessageId, communicationId, "OPENED");

        // 4. OPENED -> CLICKED?
        setTimeout(runStep(async () => {
          if (Math.random() > SIMULATION_PROBABILITIES.CLICKED) return;
          await recordEvent(messageId, channelMessageId, communicationId, "CLICKED");

          // 5. CLICKED -> PURCHASED?
          setTimeout(runStep(async () => {
            if (Math.random() > SIMULATION_PROBABILITIES.PURCHASED) return;
            await recordEvent(messageId, channelMessageId, communicationId, "PURCHASED");
          }), EVENT_DELAYS.PURCHASED);
        }), EVENT_DELAYS.CLICKED);
      }), EVENT_DELAYS.OPENED);
    }), EVENT_DELAYS.DELIVERED);
  }), EVENT_DELAYS.SENT);
}

app.post("/messages/send-batch", async (req, res) => {
  const { messages } = req.body;
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  console.log(`[Channel Service] Processing batch of ${messages.length} messages`);

  const results = [];
  
  // Create a function that executes the transaction step-by-step using Promises
  const runTransaction = () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) return reject(err);
        });
        
        const stmt = db.prepare(`
          INSERT INTO channel_messages 
          (channel_message_id, communication_id, campaign_id, customer_id, channel, recipient, message, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, (err) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
        });

        let pendingCount = 0;
        let hasError = false;

        const checkFinished = () => {
          if (pendingCount === 0) {
            stmt.finalize((err) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }
              
              if (hasError) {
                db.run("ROLLBACK", () => {
                  resolve(results); // Send results even if rolled back
                });
              } else {
                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    db.run("ROLLBACK");
                    return reject(commitErr);
                  }
                  resolve(results);
                });
              }
            });
          }
        };

        for (const msg of messages) {
          const { communicationId, campaignId, customerId, channel, recipient, message } = msg;
          if (!communicationId || !recipient || !channel) {
            results.push({ communicationId, error: "Missing required fields", accepted: false });
            continue;
          }
          const channelMessageId = `msg_${crypto.randomBytes(4).toString("hex")}`;
          
          pendingCount++;
          stmt.run(
            [channelMessageId, communicationId, campaignId, customerId, channel, recipient, message, "QUEUED"],
            function(err) {
              pendingCount--;
              if (err) {
                console.error("[Channel Service] Batch item database error:", err);
                results.push({ communicationId, error: "Database error", accepted: false });
                hasError = true;
              } else {
                const messageId = this.lastID;
                results.push({ communicationId, accepted: true, channelMessageId });
                
                // Start simulation for this message
                simulateLifecycle(messageId, channelMessageId, communicationId);
              }
              checkFinished();
            }
          );
        }

        // Handle case where all items are skipped
        if (pendingCount === 0) {
          checkFinished();
        }
      });
    });
  };

  try {
    const finalResults = await runTransaction();
    res.json({
      status: "success",
      results: finalResults
    });
  } catch (err) {
    console.error("[Channel Service] Batch processing transaction error:", err);
    res.status(500).json({ error: "Failed to process batch transaction" });
  }
});

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
