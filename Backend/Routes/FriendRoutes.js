// Routes/FriendRoutes.js - CRUD routes for friends
import express from 'express';
import Friend from '../Models/Friend.js';
import Schedule from '../Models/Schedule.js';
import authMiddleware from '../Middleware/auth.js';

const router = express.Router();

// GET /friends - get all friends for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const friends = await Friend.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, friends });
  } catch (error) {
    console.error('Get friends error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /friends - add a new friend
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, birthday } = req.body;
    if (!name || !email || !birthday) {
      return res.status(400).json({ success: false, message: 'Name, email and birthday are required' });
    }
    const friend = new Friend({ userId: req.userId, name, email, birthday });
    await friend.save();
    return res.status(201).json({ success: true, message: 'Friend added', friend });
  } catch (error) {
    console.error('Add friend error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /friends/:id - update a friend
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, birthday } = req.body;
    const friend = await Friend.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, email, birthday },
      { returnDocument: 'after' }
    );
    if (!friend) return res.status(404).json({ success: false, message: 'Friend not found' });
    return res.status(200).json({ success: true, message: 'Friend updated', friend });
  } catch (error) {
    console.error('Update friend error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /friends/:id - delete a friend
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const friend = await Friend.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!friend) return res.status(404).json({ success: false, message: 'Friend not found' });
    // also remove any schedules for this friend
    await Schedule.deleteMany({ friendId: req.params.id });
    return res.status(200).json({ success: true, message: 'Friend deleted' });
  } catch (error) {
    console.error('Delete friend error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
