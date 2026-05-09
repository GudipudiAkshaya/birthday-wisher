// Config/mongodb.js - MongoDB connection setup
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGOURL);
    console.log('✅ MongoDB connected to BirthdayWisher database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default mongoConnect;
