// index.js - Birthday Wisher Express server entry point
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoConnect from './Config/mongodb.js';
import AuthRoutes from './Routes/AuthRoutes.js';
import FriendRoutes from './Routes/FriendRoutes.js';
import TemplateRoutes from './Routes/TemplateRoutes.js';
import ScheduleRoutes from './Routes/ScheduleRoutes.js';
import { startBirthdayCron, runBirthdayCheck } from './Cron/birthdayCron.js';

dotenv.config();

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoConnect();
startBirthdayCron();

// Health check
app.get('/', (req, res) => {
  return res.status(200).json({ success: true, message: '🎂 Birthday Wisher API is running!' });
});

// Manual cron trigger (for testing)
app.get('/cron/trigger', async (req, res) => {
  try {
    await runBirthdayCheck();
    return res.status(200).json({ success: true, message: 'Birthday check triggered manually' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Routes
app.use('/auth', AuthRoutes);
app.use('/friends', FriendRoutes);
app.use('/templates', TemplateRoutes);
app.use('/schedules', ScheduleRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({ success: false, message: err.message });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});
