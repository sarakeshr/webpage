import dbConnect, { Task } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const { parentTaskId } = req.query;
      if (!parentTaskId) {
        return res.status(400).json({ error: 'Parent task ID is required' });
      }
      
      // Check if parentTaskId is a valid MongoDB ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(parentTaskId)) {
        return res.status(400).json({ error: 'Invalid parent task ID format' });
      }
      
      const subtasks = await Task.find({ parentTaskId, deleted: { $ne: true } });
      res.status(200).json(subtasks);
    }

    else if (req.method === 'POST') {
      const { parentTaskId, title, description, assignee, priority, dueDate, tags, createdBy } = req.body;

      // Get parent task info
      const parentTask = await Task.findById(parentTaskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'Parent task not found' });
      }

      const subtask = new Task({
        parentTaskId,
        projectId: parentTask.projectId,
        columnId: parentTask.columnId,
        title,
        description: description || '',
        assignee: assignee || null,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        completed: false,
        createdBy,
        deleted: false
      });

      const result = await subtask.save();
      res.status(201).json(result);
    }

    else if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      // Check if id is a valid MongoDB ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
      }
      
      const result = await Task.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      
      if (!result) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.status(200).json(result);
    }

    else if (req.method === 'DELETE') {
      const { id, soft } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      // Check if id is a valid MongoDB ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
      }

      if (soft) {
        await Task.findByIdAndUpdate(id, {
          deleted: true,
          deletedAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await Task.findByIdAndDelete(id);
      }

      res.status(200).json({ success: true });
    }

    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subtasks API error:', error);
    res.status(500).json({ error: error.message });
  }
}
