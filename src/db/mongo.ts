import { MongoDB } from "fms-models";

const connectDB = async (): Promise<void> => {
  try {
    MongoDB.initMongoDB(process.env.DB_URI as any, {
      dbName: process.env.MONGO_DB_NAME,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    await MongoDB.getInstance().connect();
    console.log("Connected to MongoDB111111111");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
};

export default connectDB;
