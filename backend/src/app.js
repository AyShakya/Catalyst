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

app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = new Set([
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ].filter(Boolean));

    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

// Webhook route - Excluded from rate limiting
app.use("/api/webhook", webhookRoutes);

// Rate Limiting applied to other API routes
const isDevOrTest = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 100, // Limit each IP to 10000 in dev/test, 100 in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", limiter);

app.use("/api/upload", uploadRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/audience", audienceRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/intelligence", intelligenceRoutes);

module.exports = app;
