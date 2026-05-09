// Routes/TemplateRoutes.js - CRUD routes for birthday email templates
import express from 'express';
import Template from '../Models/Template.js';
import authMiddleware from '../Middleware/auth.js';

const router = express.Router();

// GET /templates - get all templates for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    console.error('Get templates error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /templates - create a new template
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, subject, message } = req.body;
    if (!name || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, subject and message are required' });
    }
    const template = new Template({ userId: req.userId, name, subject, message });
    await template.save();
    return res.status(201).json({ success: true, message: 'Template created', template });
  } catch (error) {
    console.error('Create template error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /templates/:id - update a template
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, subject, message } = req.body;
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, subject, message },
      { returnDocument: 'after' }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    return res.status(200).json({ success: true, message: 'Template updated', template });
  } catch (error) {
    console.error('Update template error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /templates/:id - delete a template
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    return res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
