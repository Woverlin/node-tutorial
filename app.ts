import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import authRoutes from "./src/routes/authRoutes";
import redisRoutes from "./src/routes/redisRoutes";
import userRoutes from "./src/routes/userRoutes";
import connectDB from "./src/db/mongo";
//For env File
dotenv.config();

const app = express();
app.use(express.json());

app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("combined"));
}

// 4. Cors
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const port = process.env.PORT || 3001;

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/redis", redisRoutes);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
