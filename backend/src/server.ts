import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./auth/routes/auth.routes";
import courseRoutes from "./courses/routes/course.routes";
import packageRoutes from "./packages/routes/package.routes";
import studentRoutes from "./students/routes/student.routes";
import paymentRoutes from "./payments/routes/payment.routes";

import { db } from "./prisma/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);


// Basic API test
app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SK Computer Education API",
  });
});

// Server health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SKCE Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Database connection test
app.get("/api/db-test", async (_req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.status(200).json({
      success: true,
      message: "SKCE database connection is working",
      userCount: users.length,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("       SK COMPUTER EDUCATION API");
  console.log("==========================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API:    http://localhost:${PORT}/api`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`DB:     http://localhost:${PORT}/api/db-test`);
  console.log("==========================================");
  console.log("");
});