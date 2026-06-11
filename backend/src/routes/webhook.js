const express = require("express");
const { handleWebhookEvent } = require("../controllers/webhook-controller");

const router = express.Router();

router.post("/events", handleWebhookEvent);

module.exports = router;
