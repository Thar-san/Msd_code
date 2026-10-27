const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { connectToMongoDB } = require("./connect");
const { checkAuth } = require("./middlewares/auth");
const URL = require("./models/url");
const { handleShortRedirect } = require("./controllers/url");

const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 8001;

// CORS configuration for React frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve("./public")));

// Serve client dist in production if built
const clientDistPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// REST API routes for MERN frontend
app.use("/api/urls", urlRoute);
app.use("/api/url", urlRoute);
app.use("/api/auth", userRoute);
app.use("/api/user", userRoute);

// Legacy routes for server-rendered views
app.use("/url", urlRoute);
app.use("/user", userRoute);

// Public redirect routes
app.get("/url/:shortId", (req, res, next) => {
  Promise.resolve(handleShortRedirect(req, res)).catch(next);
});

app.get("/r/:shortId", (req, res, next) => {
  Promise.resolve(handleShortRedirect(req, res)).catch(next);
});

// View routes / fallback
app.use("/", checkAuth, staticRoute);

// Error handler
app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) return next(error);
  if (req.originalUrl?.startsWith("/api") || req.xhr || req.headers?.accept?.includes("application/json")) {
    return res.status(500).json({ error: error.message || "The request could not be completed." });
  }
  if (req.accepts("html")) return res.status(500).send("The request could not be completed. Please try again.");
  return res.status(500).json({ error: "The request could not be completed." });
});

connectToMongoDB(process.env.MONGODB || "mongodb://localhost:27017/short-url")
  .then(async () => {
    await URL.collection.updateMany(
      {
        $or: [
          { clickCount: { $exists: false } },
          { clickCount: null },
          { status: { $exists: false } },
          { status: null },
          { analyticsMultiplier: { $exists: false } },
          { analyticsMultiplier: null },
        ],
      },
      [
        {
          $set: {
            clickCount: { $ifNull: ["$clickCount", { $size: { $ifNull: ["$visitHistory", []] } }] },
            status: { $ifNull: ["$status", "active"] },
            analyticsMultiplier: { $ifNull: ["$analyticsMultiplier", 1] },
          },
        },
      ]
    );
    console.log("MongoDB connected; URL analytics fields are ready");
    app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB initialization failed:", error);
    process.exit(1);
  });
