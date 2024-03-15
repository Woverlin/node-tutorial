import dotenv from "dotenv";
import express from "express";
import connectDB from "./db";
import authRoutes from "./src/routes/authRoutes";
import userRoutes from "./src/routes/userRoutes";


//For env File
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3001;

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
