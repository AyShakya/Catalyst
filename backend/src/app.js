const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const uploadRoutes = require("./routes/upload");
const metricsRoutes = require("./routes/metrics");
const audienceRoutes = require("./routes/audience");
const campaignRoutes = require("./routes/campaigns");
const brandRoutes = require("./routes/brands");
const intelligenceRoutes = require("./routes/intelligence");
const webhookRoutes = require("./routes/webhook");

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", limiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api", uploadRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/audience", audienceRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/webhook", webhookRoutes);

module.exports = app;
