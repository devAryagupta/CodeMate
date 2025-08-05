import express from "express";
import hintRouter from "./routes/hint.js";

const app = express();

// ← Bulletproof CORS middleware
app.use((req, res, next) => {
  // Allow all origins for development
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,Authorization");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight requests immediately
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use("/hint", hintRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Hint API listening on http://localhost:${PORT}/hint`)
);