// Models/Template.js - Birthday email template model per user
import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  // message can include {{name}} placeholder which will be replaced with friend's name
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Template = mongoose.model('Template', templateSchema);
export default Template;
