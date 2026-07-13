import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || '');
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Database connection failed: ${err.message}`);
    process.exit(1);
  }
};