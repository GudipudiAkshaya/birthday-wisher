// Models/Schedule.js - Scheduled birthday wish model with custom send time
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  },
  // auto-filled from friend's birthday, stored as MM-DD for yearly recurrence
  birthdayMMDD: {
    type: String,
    required: true,
  },
  // user-chosen send time in HH:MM (24-hour IST), e.g. "09:00"
  sendTime: {
    type: String,
    required: true,
    default: '08:00',
  },
  active: {
    type: Boolean,
    default: true,
  },
  lastSentYear: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
