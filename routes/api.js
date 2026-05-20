const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const database = require('../models/database');

// ─── Conversations ─────────────────────────────────────

// List all conversations for the logged-in user
router.get('/conversations', requireAuth, (req, res) => {
  const conversations = database.getConversations(req.user.id);
  conversations.forEach(c => {
    c.messages = JSON.parse(c.messages || '[]');
  });
  res.json(conversations);
});

// Get a single conversation
router.get('/conversations/:id', requireAuth, (req, res) => {
  const conversation = database.getConversation(req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: 'المحادثة غير موجودة' });
  conversation.messages = JSON.parse(conversation.messages || '[]');
  res.json(conversation);
});

// Create a new conversation
router.post('/conversations', requireAuth, (req, res) => {
  const { title, model } = req.body;
  const id = database.createConversation(req.user.id, title, model);
  res.json({ id });
});

// Update a conversation (title, messages, model)
router.put('/conversations/:id', requireAuth, (req, res) => {
  const { title, messages, model } = req.body;
  database.updateConversation(req.params.id, req.user.id, { title, messages, model });
  res.json({ success: true });
});

// Delete a conversation
router.delete('/conversations/:id', requireAuth, (req, res) => {
  database.deleteConversation(req.params.id, req.user.id);
  res.json({ success: true });
});

// ─── Agent Mode ────────────────────────────────────────
router.post('/agent/execute', requireAuth, (req, res) => {
  const { command } = req.body;
  // Agent mode execution — runs shell commands
  const { execSync } = require('child_process');
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: process.cwd()
    });
    res.json({ output, error: null });
  } catch (e) {
    res.json({ output: e.stdout || '', error: e.stderr || e.message });
  }
});

module.exports = router;
