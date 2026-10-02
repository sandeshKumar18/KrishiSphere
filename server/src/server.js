import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import fieldRoutes from "./routes/fieldRoutes.js";
import soilTestRoutes from "./routes/soilTestRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import cropCycleRoutes from "./routes/cropCycleRoutes.js";
import cropPlanRoutes from "./routes/cropPlanRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import adviceRoutes from "./routes/adviceRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import governmentSchemeRoutes from "./routes/governmentSchemeRoutes.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "KrishiSphere API is running",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/fields", soilTestRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", cropCycleRoutes);
app.use("/api", cropPlanRoutes);
app.use("/api", taskRoutes);
app.use("/api", adviceRoutes);
app.use("/api", marketRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/government-schemes",governmentSchemeRoutes);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();