const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

app.post("/messages/send", (req, res) => {
  const { communicationId, campaignId, customerId, channel, recipient, message } = req.body;
  
  console.log(`[Channel Service] Received message for ${recipient} via ${channel}`);
  console.log(`[Message Content]: ${message}`);

  // Simulate success
  res.json({
    accepted: true,
    channelMessageId: `msg_${Math.random().toString(36).substr(2, 9)}`
  });
});

app.listen(PORT, () => {
  console.log(`Channel Service Mock listening on port ${PORT}`);
});
