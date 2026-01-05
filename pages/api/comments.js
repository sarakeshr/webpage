import dbConnect, { Task } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { taskId } = req.query;
      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      // Check if taskId is a valid MongoDB ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
      }
      
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(200).json(task.comments || []);
    } catch (error) {
      console.error('Comments API GET error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const { taskId, text, authorId, mentions } = req.body;
      
      if (!taskId || !text || !authorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if taskId is a valid MongoDB ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
      }
      
      // Get author info
      const { User } = await import('../../lib/db');
      const author = await User.findById(authorId);
      
      const comment = {
        id: Date.now().toString(),
        text,
        author: {
          id: authorId,
          username: author?.username || 'Unknown'
        },
        mentions: mentions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await Task.findByIdAndUpdate(taskId, {
        $push: { comments: comment }
      });

      res.status(200).json(comment);
    } catch (error) {
      console.error('Comments API POST error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const { id, text, mentions } = req.body;
      await Task.updateOne(
        { 'comments.id': id },
        {
          $set: {
            'comments.$.text': text,
            'comments.$.mentions': mentions || [],
            'comments.$.updatedAt': new Date().toISOString()
          }
        }
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }

  else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await Task.updateOne(
        { 'comments.id': id },
        { $pull: { comments: { id } } }
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}