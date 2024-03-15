import mongoose from 'mongoose';
import constants from "./src/utils/constants";

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.DB_URI as any);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
};

export default connectDB;