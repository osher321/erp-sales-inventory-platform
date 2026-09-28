import cors from "cors";
import express from "express";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "ERP Sales & Inventory Integration Platform API",
      status: "running",
    },
  });
});

app.use("/api", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
