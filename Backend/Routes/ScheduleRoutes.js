// Routes/ScheduleRoutes.js - CRUD routes for birthday schedules (with sendTime support)
import express from 'express';
import Schedule from '../Models/Schedule.js';
import Friend from '../Models/Friend.js';
import authMiddleware from '../Middleware/auth.js';

const router = express.Router();

// GET /schedules - get all schedules for logged in user (populated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.userId })
      .populate('friendId', 'name email birthday')
      .populate('templateId', 'name subject')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, schedules });
  } catch (error) {
    console.error('Get schedules error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /schedules - create a new schedule
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { friendId, templateId, sendTime } = req.body;

    if (!friendId || !templateId) {
      return res.status(400).json({ success: false, message: 'Friend and template are required' });
    }

    // Validate sendTime format HH:MM (24-hour)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const resolvedSendTime = sendTime && timeRegex.test(sendTime) ? sendTime : '08:00';

    // Validate friend belongs to user
    const friend = await Friend.findOne({ _id: friendId, userId: req.userId });
    if (!friend) return res.status(404).json({ success: false, message: 'Friend not found' });

    // Extract MM-DD from friend's birthday
    const bday = new Date(friend.birthday);
    const mm = String(bday.getMonth() + 1).padStart(2, '0');
    const dd = String(bday.getDate()).padStart(2, '0');
    const birthdayMMDD = `${mm}-${dd}`;

    // Check if schedule already exists for this friend+template combination
    const existing = await Schedule.findOne({ userId: req.userId, friendId, templateId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Schedule already exists for this friend and template' });
    }

    const schedule = new Schedule({ userId: req.userId, friendId, templateId, birthdayMMDD, sendTime: resolvedSendTime });
    await schedule.save();
    await schedule.populate('friendId', 'name email birthday');
    await schedule.populate('templateId', 'name subject');

    return res.status(201).json({ success: true, message: 'Schedule created', schedule });
  } catch (error) {
    console.error('Create schedule error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /schedules/:id - update sendTime of an existing schedule
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { sendTime } = req.body;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!sendTime || !timeRegex.test(sendTime)) {
      return res.status(400).json({ success: false, message: 'Valid sendTime (HH:MM) is required' });
    }

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { sendTime },
      { new: true }
    )
      .populate('friendId', 'name email birthday')
      .populate('templateId', 'name subject');

    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    return res.status(200).json({ success: true, message: 'Schedule updated', schedule });
  } catch (error) {
    console.error('Update schedule error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /schedules/:id/toggle - toggle active/inactive
router.put('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.userId });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    schedule.active = !schedule.active;
    await schedule.save();
    return res.status(200).json({
      success: true,
      message: `Schedule ${schedule.active ? 'activated' : 'deactivated'}`,
      schedule,
    });
  } catch (error) {
    console.error('Toggle schedule error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /schedules/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    return res.status(200).json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error('Delete schedule error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
